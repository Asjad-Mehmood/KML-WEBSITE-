import { prisma } from "@/lib/prisma";
import { NEVER_EMAIL, appById, compareVersions, normVersion } from "@/lib/releases";
import { appDef, latestOf } from "@/lib/appOverview";

// Admin → Releases → an app → "Who has updated": each account's version of the app, sorted into
// up to date and behind, so the ones behind can be emailed about the new version.
//
// What says which version someone has, best first:
//   1. the app itself, when it tells the site its version (app_usage, not the web apps: those are
//      always the latest)
//   2. the Survey Toolkit on their PC, which reports every tool's version (toolkit_devices)
//   3. the last version they downloaded
// For 1 and 2 the most recently seen copy counts (a person with two PCs counts once). A person
// nothing tells us about isn't listed.

export interface VersionPerson {
  userId: string;
  email: string;
  name: string;
  version: string;
  source: "app" | "toolkit" | "download";
  /** when that version was last seen (or downloaded) */
  at: string;
  behind: boolean;
}

export interface VersionsInUse {
  app: string;
  latest: string;
  people: VersionPerson[];
  current: number;
  behind: number;
  /** newest version first */
  versions: { version: string; people: number; behind: boolean }[];
}

const safe = async <T>(p: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await p;
  } catch (err) {
    console.error("[versions in use]", err);
    return fallback;
  }
};

const exists = async (table: string) =>
  (await safe(prisma.$queryRawUnsafe<{ t: string | null }[]>(`SELECT to_regclass('public.' || quote_ident($1))::text AS t`, table), [{ t: null }]))[0]?.t != null;

type Seen = { userId: string; version: string | null; at: Date };

export async function versionsInUse(appId: string): Promise<VersionsInUse | null> {
  const app = appById(appId);
  if (!app) return null;
  const latest = await safe(latestOf(appId, app.current), app.current);
  const assets = appDef(appId)?.assets ?? [];

  const [hasUsage, hasDevices] = await Promise.all([exists("app_usage"), exists("toolkit_devices")]);
  const [reported, onToolkit, downloads] = await Promise.all([
    hasUsage && appId !== "toolkit"
      ? safe(
          prisma.$queryRawUnsafe<Seen[]>(
            `SELECT "userId", "version", "lastSeen" AS at FROM "app_usage" WHERE "app" = $1 AND "platform" <> 'Web' AND "version" IS NOT NULL AND "version" <> ''`,
            appId
          ),
          []
        )
      : Promise.resolve([] as Seen[]),
    hasDevices
      ? safe(
          appId === "toolkit"
            ? prisma.$queryRawUnsafe<Seen[]>(`SELECT "userId", NULLIF("toolkitVersion", '') AS version, "lastSeen" AS at FROM "toolkit_devices"`)
            : prisma.$queryRawUnsafe<Seen[]>(
                `SELECT "userId", NULLIF("tools"::jsonb ->> $1, '') AS version, "lastSeen" AS at
                   FROM "toolkit_devices" WHERE "tools" LIKE '{%' AND ("tools"::jsonb ? $1)`,
                appId
              ),
          []
        )
      : Promise.resolve([] as Seen[]),
    assets.length
      ? safe(
          prisma.$queryRawUnsafe<Seen[]>(
            `SELECT DISTINCT ON (u."id") u."id" AS "userId", d."version", d."timestamp" AS at
               FROM "downloads" d JOIN "users" u ON u."id" = d."userId" OR lower(trim(u."email")) = lower(trim(d."userEmail"))
              WHERE d."assetType" = ANY($1::text[]) AND d."version" IS NOT NULL AND d."version" <> ''
              ORDER BY u."id", d."timestamp" DESC`,
            assets
          ),
          []
        )
      : Promise.resolve([] as Seen[]),
  ]);

  // each account's best evidence
  const best = new Map<string, { version: string; source: VersionPerson["source"]; at: Date }>();
  const take = (rows: Seen[], source: VersionPerson["source"], rank: number) => {
    for (const r of rows) {
      const v = r.version ? normVersion(r.version) : "";
      if (!/^\d/.test(v)) continue;
      const had = best.get(r.userId);
      const hadRank = had ? (had.source === "download" ? 0 : 1) : -1;
      // a copy on a PC beats a download; among copies on PCs, the one seen last
      if (!had || rank > hadRank || (rank === hadRank && rank === 1 && new Date(r.at) > had.at)) {
        best.set(r.userId, { version: v, source, at: new Date(r.at) });
      }
    }
  };
  take(reported, "app", 1);
  take(onToolkit, "toolkit", 1);
  take(downloads, "download", 0);
  if (!best.size) return { app: appId, latest, people: [], current: 0, behind: 0, versions: [] };

  const users = await prisma.user.findMany({ where: { id: { in: [...best.keys()] } }, select: { id: true, email: true, name: true } });
  const never = new Set(NEVER_EMAIL);
  const people: VersionPerson[] = users
    .filter((u) => u.email && !never.has(u.email.trim().toLowerCase()))
    .map((u) => {
      const b = best.get(u.id)!;
      return { userId: u.id, email: u.email, name: u.name || "", version: b.version, source: b.source, at: b.at.toISOString(), behind: compareVersions(b.version, latest) < 0 };
    })
    // the ones behind first, oldest version first; then by when they were seen
    .sort((a, b) => Number(b.behind) - Number(a.behind) || compareVersions(a.version, b.version) || b.at.localeCompare(a.at));

  const byVersion = new Map<string, number>();
  for (const p of people) byVersion.set(p.version, (byVersion.get(p.version) ?? 0) + 1);
  const versions = [...byVersion.entries()]
    .map(([version, n]) => ({ version, people: n, behind: compareVersions(version, latest) < 0 }))
    .sort((a, b) => compareVersions(b.version, a.version));
  const behind = people.filter((p) => p.behind).length;
  return { app: appId, latest, people, current: people.length - behind, behind, versions };
}

/** The accounts behind on this app, for an email to them */
export async function behindUserIds(appId: string): Promise<string[]> {
  return ((await versionsInUse(appId))?.people ?? []).filter((p) => p.behind).map((p) => p.userId);
}
