import { prisma } from "@/lib/prisma";
import { adminJobsOf as slopeJobsOf } from "@/lib/slopeJobs";
import { activeSessions, controlOf } from "@/lib/accountControls";
import { DOWNLOAD_APPS } from "@/lib/adminPeople";
import { ADMIN_ACTIONS } from "@/lib/adminLog";

// Admin → a person's window (components/admin/SurveyorDetailModal.tsx): what isn't in the account
// record itself. Every part is read on its own and a part that fails comes back empty, named in
// `failed`, so one missing table never hides the rest of the person.

const n = (v: unknown) => Number(v ?? 0);
const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);

/** Runs a part; on an error it answers `empty` and notes the part's name */
async function part<T>(name: string, failed: string[], run: () => Promise<T>, empty: T): Promise<T> {
  try {
    return await run();
  } catch (e) {
    console.error(`[person] ${name}:`, e instanceof Error ? e.message : e);
    failed.push(name);
    return empty;
  }
}

const appOf = (asset: string) => DOWNLOAD_APPS.find((a) => a.assets.includes(asset))?.id ?? (asset.startsWith("traverse") ? "traverse" : asset);

/** The person's downloads, newest first, read for them alone (not every download on the site) */
export async function downloadsOf(userId: string, email: string) {
  const rows = await prisma.download.findMany({
    where: { OR: [{ userId }, { userEmail: { equals: email, mode: "insensitive" } }] },
    orderBy: { timestamp: "desc" },
    take: 500,
  });
  return rows.map((d) => ({
    id: d.id,
    userId: d.userId,
    userEmail: d.userEmail,
    userName: d.userName,
    assetType: d.assetType,
    app: appOf(d.assetType),
    fileName: d.fileName,
    version: d.version,
    ipAddress: d.ipAddress ?? undefined,
    location: d.location ?? undefined,
    userAgent: d.userAgent ?? undefined,
    timestamp: d.timestamp.toISOString(),
  }));
}

export async function personExtras(user: { id: string; email: string }) {
  const failed: string[] = [];
  const email = user.email.toLowerCase();
  const [counts, slope, reviews, toolkitPcs, toolkitEvents, control, sessions, releaseEmails, optedOut, messages, adminLog] = await Promise.all([
    // the real totals (the lists below show the newest only)
    part(
      "counts",
      failed,
      async () => {
        const [a, f, d] = await Promise.all([
          prisma.activity.count({ where: { userId: user.id } }),
          prisma.userFile.count({ where: { userId: user.id } }),
          prisma.download.count({ where: { OR: [{ userId: user.id }, { userEmail: { equals: user.email, mode: "insensitive" } }] } }),
        ]);
        return { activities: a, files: f, downloads: d };
      },
      null as { activities: number; files: number; downloads: number } | null
    ),
    part(
      "slope",
      failed,
      async () =>
        (await slopeJobsOf(user.id)).map((j) => {
          const r = j as unknown as Record<string, unknown>;
          // what the app saved as its summary: { sections: 3, length: "1.2 km", ... }
          const sum = r.summary && typeof r.summary === "object" ? (r.summary as Record<string, unknown>) : {};
          const summary = Object.entries(sum)
            .filter(([, v]) => v !== null && v !== "" && typeof v !== "object")
            .slice(0, 5)
            .map(([k, v]) => `${k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase()}: ${v}`)
            .join(" · ");
          return { id: String(r.id ?? ""), name: String(r.name ?? "") || "Untitled", summary, size: n(r.size), savedAt: String(r.saved_at ?? "") };
        }),
      [] as { id: string; name: string; summary: string; size: number; savedAt: string }[]
    ),
    part(
      "reviews",
      failed,
      async () =>
        (
          await prisma.$queryRawUnsafe<{ id: string; product: string; rating: number; comment: string; version: string; status: string; updatedAt: Date }[]>(
            `SELECT "id","product","rating","comment","version","status","updatedAt" FROM "reviews" WHERE "userId" = $1 ORDER BY "updatedAt" DESC`,
            user.id
          )
        ).map((r) => ({ ...r, rating: n(r.rating), updatedAt: iso(r.updatedAt) })),
      [] as { id: string; product: string; rating: number; comment: string; version: string; status: string; updatedAt: string | null }[]
    ),
    part(
      "toolkit",
      failed,
      async () =>
        (
          await prisma.$queryRawUnsafe<{ id: string; name: string; windows: string; toolkitVersion: string; tools: string; firstSeen: Date; lastSeen: Date }[]>(
            `SELECT "id","name","windows","toolkitVersion","tools","firstSeen","lastSeen" FROM "toolkit_devices" WHERE "userId" = $1 ORDER BY "lastSeen" DESC`,
            user.id
          )
        ).map((d) => {
          let tools: Record<string, string> = {};
          try {
            const t = JSON.parse(d.tools || "{}") as Record<string, unknown>;
            tools = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, typeof v === "string" ? v : String((v as { version?: string })?.version ?? "")]));
          } catch {
            // an old report: no tools
          }
          return { id: d.id, name: d.name, windows: d.windows, toolkitVersion: d.toolkitVersion, tools, firstSeen: iso(d.firstSeen), lastSeen: iso(d.lastSeen) };
        }),
      [] as { id: string; name: string; windows: string; toolkitVersion: string; tools: Record<string, string>; firstSeen: string | null; lastSeen: string | null }[]
    ),
    part(
      "toolkit events",
      failed,
      async () =>
        (
          await prisma.$queryRawUnsafe<{ tool: string; action: string; fromVersion: string; toVersion: string; message: string; createdAt: Date }[]>(
            `SELECT "tool","action","fromVersion","toVersion","message","createdAt" FROM "toolkit_events" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 30`,
            user.id
          )
        ).map((e) => ({ ...e, createdAt: iso(e.createdAt) })),
      [] as { tool: string; action: string; fromVersion: string; toVersion: string; message: string; createdAt: string | null }[]
    ),
    part(
      "controls",
      failed,
      async () => {
        const c = await controlOf(user.id);
        return { blocked: c.blocked, reason: c.reason, blockedBy: c.blockedBy, blockedAt: iso(c.blockedAt) };
      },
      null as { blocked: boolean; reason: string; blockedBy: string; blockedAt: string | null } | null
    ),
    part("sessions", failed, () => activeSessions(user.id), null as number | null),
    part(
      "release emails",
      failed,
      async () =>
        (
          await prisma.$queryRawUnsafe<{ subject: string; status: string; sentAt: Date | null; error: string | null }[]>(
            `SELECT b."subject", r."status", r."sentAt", r."error" FROM "release_recipients" r JOIN "release_broadcasts" b ON b."id" = r."broadcastId"
              WHERE LOWER(r."email") = $1 ORDER BY COALESCE(r."sentAt", b."createdAt") DESC LIMIT 20`,
            email
          )
        ).map((r) => ({ ...r, sentAt: iso(r.sentAt) })),
      [] as { subject: string; status: string; sentAt: string | null; error: string | null }[]
    ),
    part(
      "opt-out",
      failed,
      async () => {
        const r = await prisma.$queryRawUnsafe<{ createdAt: Date }[]>(`SELECT "createdAt" FROM "email_optouts" WHERE LOWER("email") = $1`, email);
        return r[0] ? iso(r[0].createdAt) : null;
      },
      null as string | null
    ),
    part(
      "messages",
      failed,
      async () =>
        (
          await prisma.contactMessage.findMany({
            where: { OR: [{ userId: user.id }, { email: { equals: user.email, mode: "insensitive" } }] },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: { id: true, ref: true, topic: true, message: true, status: true, createdAt: true },
          })
        ).map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      [] as { id: string; ref: string; topic: string; message: string; status: string; createdAt: string }[]
    ),
    part(
      "admin log",
      failed,
      async () =>
        (
          await prisma.$queryRawUnsafe<{ id: bigint; at: Date; adminEmail: string; action: string; details: string }[]>(
            `SELECT "id","at","adminEmail","action","details" FROM "admin_log" WHERE "target" ILIKE $1 ORDER BY "at" DESC LIMIT 30`,
            `%<${email.replace(/[%_\\]/g, (c) => "\\" + c)}>%`
          )
        ).map((r) => ({ id: String(r.id), at: iso(r.at), adminEmail: r.adminEmail, action: ADMIN_ACTIONS[r.action] ?? r.action, details: r.details })),
      [] as { id: string; at: string | null; adminEmail: string; action: string; details: string }[]
    ),
  ]);
  return { counts, slope, reviews, toolkit: { pcs: toolkitPcs, events: toolkitEvents }, control, sessions, releaseEmails, optedOut, messages, adminLog, failed };
}

export type PersonExtras = Awaited<ReturnType<typeof personExtras>>;
