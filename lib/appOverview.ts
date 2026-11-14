import { prisma } from "@/lib/prisma";
import { feedReady, feedSql } from "@/lib/activityFeed";
import { RELEASE_APPS, compareVersions, ensureReleaseTables, normVersion } from "@/lib/releases";
import { countryOf } from "@/lib/publicStats";
import { DATA_APPS, dataSummary } from "@/lib/adminData";
import { ensureToolkitTables } from "@/lib/toolkit/store";

// Admin → each app's own tab (components/admin/AppTab.tsx): everything about one app on one page,
// for the chosen period against the period before it. The same for every app, from:
//   the activity feed (lib/activityFeed.ts)  what people did in it, errors, who did most
//   downloads                                 its installer downloads, by version and country
//   app_usage (lib/appUsage.ts)              which devices and versions open it
//   toolkit_devices / toolkit_events         the versions on Toolkit PCs, installs, updates, failures
//   lib/adminData.ts                         what people keep from it in their accounts
//   product_releases                         its releases
// Each part is read on its own and left empty if its table can't be read, so one missing table
// never blanks the page.

export interface AppDef {
  id: string;
  name: string;
  /** downloads.assetType of its installer */
  assets: string[];
  /** other downloads that belong to it (samples …) */
  extras?: string[];
}
export const APP_DEFS: AppDef[] = [
  { id: "excel-to-kml", name: "Excel to KML", assets: ["windows_installer"], extras: ["sample_csv", "test_kml", "web_app"] },
  { id: "traverse", name: "Traverse & Level", assets: ["traverse"], extras: ["traverse_manual", "traverse_sample"] },
  { id: "slope", name: "Slope Calculator", assets: ["slope"] },
  { id: "roadpro", name: "RoadPro", assets: ["roadpro"] },
  { id: "folder-manager", name: "Project Folder Manager", assets: ["folder_manager"] },
  { id: "toolkit", name: "Survey Toolkit", assets: ["toolkit"] },
];
export const appDef = (id: string) => APP_DEFS.find((a) => a.id === id);

/**
 * The newest version of an app: the newer of the one the site offers and the one its releases on
 * GitHub give the Survey Toolkit (lib/toolkit/feed.ts). For the Toolkit itself, the newest
 * installer on GitHub, which its download always is (lib/toolkit/downloads.ts).
 */
async function latestOf(id: string, offered: string): Promise<string> {
  let found = "";
  if (id === "toolkit") {
    const { toolkitDownloads } = await import("@/lib/toolkit/downloads");
    found = (await safe(toolkitDownloads(), null, "toolkit latest"))?.latest?.version ?? "";
  } else {
    const { toolkitFeed } = await import("@/lib/toolkit/feed");
    found = (await safe(toolkitFeed(), null, "toolkit feed"))?.tools.find((t) => t.id === id)?.version ?? "";
  }
  const v = found ? normVersion(found) : "";
  return v && /^\d/.test(v) && (!offered || compareVersions(v, offered) > 0) ? v : offered;
}

export interface Pair {
  cur: number;
  prev: number;
}

const n = (v: unknown) => Number(v ?? 0);
const safe = async <T>(p: Promise<T>, fallback: T, what: string): Promise<T> => {
  try {
    return await p;
  } catch (err) {
    console.error(`[app overview] ${what}:`, err);
    return fallback;
  }
};
const pair = (r: { cur: unknown; prev: unknown } | undefined): Pair => ({ cur: n(r?.cur), prev: n(r?.prev) });
const inList = (xs: string[]) => xs.map((x) => `'${x.replace(/'/g, "''")}'`).join(",");

export async function appOverview(id: string, days: number) {
  const def = appDef(id);
  if (!def) return null;
  const now = Date.now();
  const from = new Date(now - days * 864e5);
  const prevFrom = new Date(now - 2 * days * 864e5);
  const bucket = days > 90 ? "week" : "day";
  const assets = inList(def.assets);
  const release = RELEASE_APPS.find((a) => a.id === id);
  await safe(feedReady(), undefined, "feed tables");

  const feed = `(${feedSql()}) x`;
  const [downloads, dlSeries, dlVersions, dlFiles, dlPlaces, act, actSeries, actions, people, errors, platforms, versions, toolkit, kept, releases] =
    await Promise.all([
      // installer downloads, this period and the one before
      safe(
        prisma.$queryRawUnsafe<{ cur: bigint; prev: bigint; people: bigint }[]>(
          `SELECT COUNT(*) FILTER (WHERE "timestamp" >= $1) cur, COUNT(*) FILTER (WHERE "timestamp" < $1) prev,
                  COUNT(DISTINCT COALESCE("userId", "ipAddress")) FILTER (WHERE "timestamp" >= $1) people
             FROM "downloads" WHERE "timestamp" >= $2 AND "assetType" IN (${assets})`,
          from,
          prevFrom
        ),
        [],
        "downloads"
      ),
      safe(
        prisma.$queryRawUnsafe<{ t: Date; c: bigint }[]>(
          `SELECT date_trunc('${bucket}', "timestamp") t, COUNT(*) c FROM "downloads" WHERE "timestamp" >= $1 AND "assetType" IN (${assets}) GROUP BY 1`,
          from
        ),
        [],
        "download series"
      ),
      safe(
        prisma.$queryRawUnsafe<{ version: string; c: bigint }[]>(
          `SELECT "version", COUNT(*) c FROM "downloads" WHERE "timestamp" >= $1 AND "assetType" IN (${assets}) GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
          from
        ),
        [],
        "download versions"
      ),
      // every file of the app downloaded in the period, the installer and the extras
      safe(
        prisma.$queryRawUnsafe<{ assetType: string; fileName: string; c: bigint }[]>(
          `SELECT "assetType", "fileName", COUNT(*) c FROM "downloads"
            WHERE "timestamp" >= $1 AND "assetType" IN (${inList([...def.assets, ...(def.extras ?? [])])}) GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 12`,
          from
        ),
        [],
        "download files"
      ),
      safe(
        prisma.download.findMany({ where: { timestamp: { gte: from }, assetType: { in: def.assets } }, select: { location: true } }),
        [],
        "download places"
      ),
      // everything done in it (the feed: activities, downloads, Toolkit events)
      safe(
        prisma.$queryRawUnsafe<{ cur: bigint; prev: bigint; pcur: bigint; pprev: bigint; ecur: bigint; eprev: bigint }[]>(
          `SELECT COUNT(*) FILTER (WHERE "at" >= $2) cur, COUNT(*) FILTER (WHERE "at" < $2) prev,
                  COUNT(DISTINCT "userId") FILTER (WHERE "at" >= $2) pcur, COUNT(DISTINCT "userId") FILTER (WHERE "at" < $2) pprev,
                  COUNT(*) FILTER (WHERE "at" >= $2 AND "status" IN ('error','failed','warning')) ecur,
                  COUNT(*) FILTER (WHERE "at" < $2 AND "status" IN ('error','failed','warning')) eprev
             FROM ${feed} WHERE ("app" = $1 OR "tool" = $1) AND "at" >= $3`,
          id,
          from,
          prevFrom
        ),
        [],
        "activity"
      ),
      safe(
        prisma.$queryRawUnsafe<{ t: Date; c: bigint; p: bigint }[]>(
          `SELECT date_trunc('${bucket}', "at") t, COUNT(*) c, COUNT(DISTINCT "userId") p FROM ${feed} WHERE ("app" = $1 OR "tool" = $1) AND "at" >= $2 GROUP BY 1`,
          id,
          from
        ),
        [],
        "activity series"
      ),
      safe(
        prisma.$queryRawUnsafe<{ action: string; c: bigint; e: bigint; last: Date }[]>(
          `SELECT "action", COUNT(*) c, COUNT(*) FILTER (WHERE "status" IN ('error','failed','warning')) e, MAX("at") "last"
             FROM ${feed} WHERE ("app" = $1 OR "tool" = $1) AND "at" >= $2 GROUP BY 1 ORDER BY 2 DESC LIMIT 20`,
          id,
          from
        ),
        [],
        "actions"
      ),
      safe(
        prisma.$queryRawUnsafe<{ userId: string; email: string | null; name: string | null; c: bigint; last: Date }[]>(
          `SELECT "userId", MAX("email") email, MAX("name") "name", COUNT(*) c, MAX("at") "last"
             FROM ${feed} WHERE ("app" = $1 OR "tool" = $1) AND "at" >= $2 AND "userId" IS NOT NULL GROUP BY 1 ORDER BY 4 DESC, 5 DESC LIMIT 10`,
          id,
          from
        ),
        [],
        "people"
      ),
      safe(
        prisma.$queryRawUnsafe<{ id: string; title: string; error: string | null; email: string | null; userId: string | null; version: string | null; platform: string | null; at: Date }[]>(
          `SELECT "id", "title", "error", "email", "userId", "version", "platform", "at" FROM ${feed}
            WHERE ("app" = $1 OR "tool" = $1) AND "at" >= $2 AND "status" IN ('error','failed','warning') ORDER BY "at" DESC LIMIT 8`,
          id,
          from
        ),
        [],
        "errors"
      ),
      // the devices it's opened on (apps that contact the site)
      safe(
        prisma.$queryRawUnsafe<{ platform: string; people: bigint; active: bigint; fresh: bigint; last: Date }[]>(
          `SELECT "platform", COUNT(DISTINCT "userId") people, COUNT(DISTINCT "userId") FILTER (WHERE "lastSeen" >= $2) active,
                  COUNT(DISTINCT "userId") FILTER (WHERE "firstSeen" >= $2) fresh, MAX("lastSeen") "last"
             FROM "app_usage" WHERE "app" = $1 GROUP BY 1 ORDER BY 2 DESC`,
          id,
          from
        ),
        [],
        "platforms"
      ),
      safe(
        prisma.$queryRawUnsafe<{ version: string | null; platform: string; people: bigint; last: Date }[]>(
          `SELECT "version", "platform", COUNT(DISTINCT "userId") people, MAX("lastSeen") "last"
             FROM "app_usage" WHERE "app" = $1 GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 30`,
          id
        ),
        [],
        "versions"
      ),
      // the Survey Toolkit: which version is on each PC, and what it installed, updated or failed
      safe(
        (async () => {
          await ensureToolkitTables();
          const [pcs, events] = await Promise.all([
            prisma.$queryRawUnsafe<{ v: string | null; c: bigint }[]>(
              `SELECT ("tools"::jsonb ->> $1) v, COUNT(*) c FROM "toolkit_devices" WHERE "tools" LIKE '{%' AND ("tools"::jsonb ? $1) GROUP BY 1 ORDER BY 2 DESC`,
              id
            ),
            prisma.$queryRawUnsafe<{ action: string; c: bigint }[]>(
              `SELECT "action", COUNT(*) c FROM "toolkit_events" WHERE "tool" = $1 AND "createdAt" >= $2 GROUP BY 1`,
              id,
              from
            ),
          ]);
          return { pcs: pcs.map((r) => ({ version: r.v || "", count: n(r.c) })), events: Object.fromEntries(events.map((e) => [e.action, n(e.c)])) };
        })(),
        { pcs: [] as { version: string; count: number }[], events: {} as Record<string, number> },
        "toolkit"
      ),
      // what people keep from it in their accounts
      DATA_APPS.some((a) => a.id === id) ? safe(dataSummary({ app: id }), null, "kept") : Promise.resolve(null),
      safe(
        (async () => {
          await ensureReleaseTables();
          return prisma.productRelease.findMany({ where: { app: id }, orderBy: { releasedAt: "desc" }, take: 5, select: { version: true, title: true, releasedAt: true } });
        })(),
        [],
        "releases"
      ),
    ]);

  // every day (or week) of the period, with nothing where nothing happened
  const step = bucket === "week" ? 7 : 1;
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  if (bucket === "week") end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7)); // Monday, as date_trunc('week')
  const key = (d: Date) => new Date(d).toISOString().slice(0, 10);
  const dl = new Map(dlSeries.map((r) => [key(r.t), n(r.c)]));
  const ac = new Map(actSeries.map((r) => [key(r.t), r]));
  const series = Array.from({ length: Math.ceil(days / step) }, (_, i) => {
    const t = new Date(end.getTime() - (Math.ceil(days / step) - 1 - i) * step * 864e5).toISOString().slice(0, 10);
    return { t, downloads: dl.get(t) ?? 0, events: n(ac.get(t)?.c), people: n(ac.get(t)?.p) };
  });

  const countries = new Map<string, number>();
  for (const d of dlPlaces) {
    const c = countryOf(d.location);
    if (c) countries.set(c, (countries.get(c) ?? 0) + 1);
  }

  const latest = await latestOf(id, release?.current ?? "");
  const rank = (v: string | null) => (!v ? "unknown" : !latest ? "unknown" : compareVersions(normVersion(v), latest) >= 0 ? "current" : "behind");

  return {
    app: { id: def.id, name: def.name, latest, github: release?.github ?? null, href: release?.href ?? null },
    days,
    bucket,
    totals: {
      downloads: pair(downloads[0]),
      downloaders: n(downloads[0]?.people),
      events: pair(act[0]),
      people: { cur: n(act[0]?.pcur), prev: n(act[0]?.pprev) },
      errors: { cur: n(act[0]?.ecur), prev: n(act[0]?.eprev) },
    },
    series,
    downloadVersions: dlVersions.map((r) => ({ version: normVersion(r.version), count: n(r.c), status: rank(r.version) })),
    downloadFiles: dlFiles.map((r) => ({ assetType: r.assetType, fileName: r.fileName, count: n(r.c), installer: def.assets.includes(r.assetType) })),
    countries: [...countries].sort((a, b) => b[1] - a[1]).slice(0, 10),
    actions: actions.map((r) => ({ action: r.action, count: n(r.c), errors: n(r.e), last: r.last })),
    people: people.map((r) => ({ userId: r.userId, email: r.email, name: r.name, count: n(r.c), last: r.last })),
    errors,
    platforms: platforms.map((r) => ({ platform: r.platform, people: n(r.people), active: n(r.active), fresh: n(r.fresh), last: r.last })),
    versions: versions.map((r) => ({ version: r.version ? normVersion(r.version) : null, platform: r.platform, people: n(r.people), last: r.last, status: rank(r.version) })),
    toolkit: { pcs: toolkit.pcs.map((p) => ({ ...p, status: rank(p.version) })), events: toolkit.events },
    kept,
    releases,
  };
}
export type AppOverview = NonNullable<Awaited<ReturnType<typeof appOverview>>>;

/** Excel to KML's own part: the points converted and the grids they were in */
export async function excelToKmlExtras(days: number) {
  const now = Date.now();
  const from = new Date(now - days * 864e5);
  const prevFrom = new Date(now - 2 * days * 864e5);
  const [points, grids] = await Promise.all([
    safe(
      prisma.$queryRawUnsafe<{ cur: bigint; prev: bigint; total: bigint; people: bigint }[]>(
        `SELECT COUNT(*) FILTER (WHERE "timestamp" >= $1) cur, COUNT(*) FILTER (WHERE "timestamp" >= $2 AND "timestamp" < $1) prev,
                COUNT(*) total, COUNT(DISTINCT "userId") FILTER (WHERE "timestamp" >= $1) people
           FROM "conversions"`,
        from,
        prevFrom
      ),
      [],
      "points"
    ),
    safe(
      prisma.$queryRawUnsafe<{ grid: string; c: bigint; people: bigint }[]>(
        `SELECT "coordSystem" grid, COUNT(*) c, COUNT(DISTINCT "userId") people FROM "conversions"
          WHERE "timestamp" >= $1 AND "coordSystem" <> '' GROUP BY 1 ORDER BY 2 DESC LIMIT 10`,
        from
      ),
      [],
      "grids"
    ),
  ]);
  return {
    points: { cur: n(points[0]?.cur), prev: n(points[0]?.prev) },
    pointsTotal: n(points[0]?.total),
    pointsPeople: n(points[0]?.people),
    grids: grids.map((g) => ({ grid: g.grid, count: n(g.c), people: n(g.people) })),
  };
}

/** Traverse & Level's own part: its jobs and their results, sharing, exports, where it's opened, who is blocked */
export async function traverseExtras(days: number) {
  const { ensureTraverseTables } = await import("@/lib/traverseJobs");
  const { blockedList } = await import("@/lib/traverseControls");
  const from = new Date(Date.now() - days * 864e5);
  await safe(ensureTraverseTables(), undefined, "traverse tables");
  const [jobs, shares, formats, opened, blocked] = await Promise.all([
    safe(
      prisma.$queryRawUnsafe<{ kind: string; status: string | null; total: bigint; fresh: bigint; saved: bigint; owners: bigint }[]>(
        `SELECT "kind", CASE WHEN "summary" LIKE '{%' THEN "summary"::jsonb->>'status' END status, COUNT(*) total,
                COUNT(*) FILTER (WHERE "createdAt" >= $1) fresh, COUNT(*) FILTER (WHERE "updatedAt" >= $1) saved, COUNT(DISTINCT "ownerId") owners
           FROM "traverse_jobs" GROUP BY 1, 2`,
        from
      ),
      [],
      "traverse jobs"
    ),
    safe(
      prisma.$queryRawUnsafe<{ total: bigint; fresh: bigint; jobs: bigint; people: bigint; owners: bigint }[]>(
        `SELECT COUNT(*) total, COUNT(*) FILTER (WHERE s."createdAt" >= $1) fresh, COUNT(DISTINCT s."jobId") jobs,
                COUNT(DISTINCT s."email") people, COUNT(DISTINCT j."ownerId") owners
           FROM "traverse_job_shares" s JOIN "traverse_jobs" j ON j."id" = s."jobId"`,
        from
      ),
      [],
      "traverse shares"
    ),
    safe(
      prisma.$queryRawUnsafe<{ f: string | null; c: bigint }[]>(
        `SELECT UPPER(COALESCE(NULLIF("exportFormat", ''), 'Other')) f, COUNT(*) c FROM "activities"
          WHERE "action" = 'tl_export' AND "timestamp" >= $1 GROUP BY 1 ORDER BY 2 DESC`,
        from
      ),
      [],
      "traverse formats"
    ),
    safe(
      prisma.$queryRawUnsafe<{ w: string | null; c: bigint }[]>(
        `SELECT COALESCE(SUBSTRING("title" FROM '\\(([^)]+)\\)\\s*$'), 'Other') w, COUNT(*) c FROM "activities"
          WHERE "action" = 'tl_open' AND "timestamp" >= $1 GROUP BY 1 ORDER BY 2 DESC`,
        from
      ),
      [],
      "traverse opened"
    ),
    safe(
      (async () => {
        const ids = await blockedList();
        if (!ids.length) return [];
        const us = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, name: true } });
        return ids.map((id) => ({ userId: id, email: us.find((u) => u.id === id)?.email ?? null, name: us.find((u) => u.id === id)?.name ?? null }));
      })(),
      [] as { userId: string; email: string | null; name: string | null }[],
      "traverse blocked"
    ),
  ]);
  const sum = (f: (r: (typeof jobs)[number]) => boolean, k: "total" | "fresh" | "saved") => jobs.filter(f).reduce((s, r) => s + n(r[k]), 0);
  const all = () => true;
  return {
    jobs: {
      total: sum(all, "total"),
      fresh: sum(all, "fresh"),
      saved: sum(all, "saved"),
      traverses: sum((r) => r.kind !== "level", "total"),
      levels: sum((r) => r.kind === "level", "total"),
      accepted: sum((r) => r.status === "accepted", "total"),
      rejected: sum((r) => r.status === "rejected", "total"),
      open: sum((r) => r.status === "open", "total"),
      incomplete: sum((r) => !["accepted", "rejected", "open"].includes(r.status ?? ""), "total"),
    },
    shares: { total: n(shares[0]?.total), fresh: n(shares[0]?.fresh), jobs: n(shares[0]?.jobs), people: n(shares[0]?.people), owners: n(shares[0]?.owners) },
    formats: formats.map((r) => ({ format: r.f || "Other", count: n(r.c) })),
    openedFrom: opened.map((r) => ({ where: r.w || "Other", count: n(r.c) })),
    blocked,
  };
}

/** Slope Calculator's own part: the calculations kept, how steep and how long, and the projects they're for */
export async function slopeExtras(days: number) {
  const { ensureSlopeTables } = await import("@/lib/slopeJobs");
  const from = new Date(Date.now() - days * 864e5);
  await safe(ensureSlopeTables(), undefined, "slope tables");
  // summary is the app's own: { percent, rise, length, start, end, stations }; data.plate.project names the project
  const num = (k: string) => `CASE WHEN "summary" LIKE '{%' AND ("summary"::jsonb->>'${k}') ~ '^-?[0-9.]+(e-?[0-9]+)?$' THEN ("summary"::jsonb->>'${k}')::float END`;
  const [tot, grades, projects] = await Promise.all([
    safe(
      prisma.$queryRawUnsafe<
        { total: bigint; fresh: bigint; saved: bigint; people: bigint; freshPeople: bigint; rising: bigint; falling: bigint; flat: bigint; length: number | null; avgLength: number | null; avgStations: number | null; bytes: bigint | null }[]
      >(
        `SELECT COUNT(*) total, COUNT(*) FILTER (WHERE "createdAt" >= $1) fresh, COUNT(*) FILTER (WHERE "updatedAt" >= $1) saved,
                COUNT(DISTINCT "ownerId") people, COUNT(DISTINCT "ownerId") FILTER (WHERE "updatedAt" >= $1) "freshPeople",
                COUNT(*) FILTER (WHERE p > 0) rising, COUNT(*) FILTER (WHERE p < 0) falling, COUNT(*) FILTER (WHERE p = 0) flat,
                SUM(l) length, AVG(l) "avgLength", AVG(st) "avgStations", SUM("size") bytes
           FROM (SELECT *, ${num("percent")} p, ${num("length")} l, ${num("stations")} st FROM "slope_jobs") s`,
        from
      ),
      [],
      "slope totals"
    ),
    safe(
      prisma.$queryRawUnsafe<{ band: number; c: bigint }[]>(
        `SELECT CASE WHEN a < 0.5 THEN 0 WHEN a < 1 THEN 1 WHEN a < 2 THEN 2 WHEN a < 4 THEN 3 WHEN a < 8 THEN 4 ELSE 5 END band, COUNT(*) c
           FROM (SELECT ABS(${num("percent")}) a FROM "slope_jobs") s WHERE a IS NOT NULL GROUP BY 1 ORDER BY 1`
      ),
      [],
      "slope grades"
    ),
    safe(
      prisma.$queryRawUnsafe<{ project: string; c: bigint; people: bigint; last: Date }[]>(
        `SELECT TRIM(("data"::jsonb #>> '{plate,project}')) project, COUNT(*) c, COUNT(DISTINCT "ownerId") people, MAX("updatedAt") "last"
           FROM "slope_jobs" WHERE "data" LIKE '{%' AND COALESCE(TRIM(("data"::jsonb #>> '{plate,project}')), '') <> ''
          GROUP BY 1 ORDER BY 2 DESC, 4 DESC LIMIT 10`
      ),
      [],
      "slope projects"
    ),
  ]);
  const t = tot[0];
  const BANDS = ["under 0.5%", "0.5–1%", "1–2%", "2–4%", "4–8%", "8% or more"];
  return {
    calcs: {
      total: n(t?.total),
      fresh: n(t?.fresh),
      saved: n(t?.saved),
      people: n(t?.people),
      activePeople: n(t?.freshPeople),
      rising: n(t?.rising),
      falling: n(t?.falling),
      flat: n(t?.flat),
      length: t?.length ?? 0,
      avgLength: t?.avgLength ?? 0,
      avgStations: t?.avgStations ?? 0,
      bytes: n(t?.bytes),
    },
    grades: BANDS.map((label, i) => ({ label, count: n(grades.find((g) => Number(g.band) === i)?.c) })),
    projects: projects.map((p) => ({ project: p.project, count: n(p.c), people: n(p.people), last: p.last })),
  };
}

/**
 * A Windows program that doesn't report to the site by itself (RoadPro, Project Folder Manager):
 * what the Survey Toolkit sees of it on each PC, who downloads it, where the download comes from,
 * and its newest release on GitHub against the site's.
 */
export async function programExtras(id: string, days: number) {
  const from = new Date(Date.now() - days * 864e5);
  const release = RELEASE_APPS.find((a) => a.id === id);
  const latest = await latestOf(id, release?.current ?? "");
  await safe(ensureToolkitTables(), undefined, "toolkit tables");
  const [pcs, allPcs, events, failures, downloaders, newest, github] = await Promise.all([
    safe(
      prisma.$queryRawUnsafe<{ id: string; name: string; v: string | null; userId: string; email: string | null; userName: string | null; lastSeen: Date; toolkitVersion: string }[]>(
        // the Toolkit itself: every PC, at its own version; another program: the PCs it's on
        id === "toolkit"
          ? `SELECT d."id", d."name", NULLIF(d."toolkitVersion", '') v, d."userId", u."email", u."name" "userName", d."lastSeen", d."toolkitVersion"
               FROM "toolkit_devices" d LEFT JOIN "users" u ON u."id" = d."userId" WHERE $1 = 'toolkit' ORDER BY d."lastSeen" DESC LIMIT 200`
          : `SELECT d."id", d."name", (d."tools"::jsonb ->> $1) v, d."userId", u."email", u."name" "userName", d."lastSeen", d."toolkitVersion"
               FROM "toolkit_devices" d LEFT JOIN "users" u ON u."id" = d."userId"
              WHERE d."tools" LIKE '{%' AND (d."tools"::jsonb ? $1) ORDER BY d."lastSeen" DESC LIMIT 200`,
        id
      ),
      [],
      "program PCs"
    ),
    safe(prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT COUNT(*) c FROM "toolkit_devices"`), [], "toolkit PCs"),
    safe(
      prisma.$queryRawUnsafe<{ action: string; cur: bigint; prev: bigint }[]>(
        `SELECT "action", COUNT(*) FILTER (WHERE "createdAt" >= $2) cur, COUNT(*) FILTER (WHERE "createdAt" < $2) prev
           FROM "toolkit_events" WHERE "tool" = $1 AND "createdAt" >= $3 GROUP BY 1`,
        id,
        from,
        new Date(Date.now() - 2 * days * 864e5)
      ),
      [],
      "program events"
    ),
    safe(
      prisma.$queryRawUnsafe<{ id: bigint; message: string; fromVersion: string; toVersion: string; at: Date; pc: string | null; userId: string; email: string | null }[]>(
        `SELECT e."id", e."message", e."fromVersion", e."toVersion", e."createdAt" "at", d."name" pc, e."userId", u."email"
           FROM "toolkit_events" e LEFT JOIN "toolkit_devices" d ON d."id" = e."deviceId" LEFT JOIN "users" u ON u."id" = e."userId"
          WHERE e."tool" = $1 AND e."action" = 'failed' AND e."createdAt" >= $2 ORDER BY e."createdAt" DESC LIMIT 8`,
        id,
        from
      ),
      [],
      "program failures"
    ),
    // who downloaded it in the period: signed in or not, and for the first time or again
    safe(
      prisma.$queryRawUnsafe<{ signedIn: bigint; anonymous: bigint; first: bigint; again: bigint }[]>(
        `WITH d AS (SELECT * FROM "downloads" WHERE "assetType" IN (${inList(appDef(id)?.assets ?? [id])}))
         SELECT COUNT(*) FILTER (WHERE "userId" IS NOT NULL AND "timestamp" >= $1) "signedIn",
                COUNT(*) FILTER (WHERE "userId" IS NULL AND "timestamp" >= $1) anonymous,
                COUNT(DISTINCT "userId") FILTER (WHERE "timestamp" >= $1 AND "userId" IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM d o WHERE o."userId" = d."userId" AND o."timestamp" < $1)) first,
                COUNT(DISTINCT "userId") FILTER (WHERE "timestamp" >= $1 AND "userId" IS NOT NULL
                  AND EXISTS (SELECT 1 FROM d o WHERE o."userId" = d."userId" AND o."timestamp" < $1)) again
           FROM d`,
        from
      ),
      [],
      "program downloaders"
    ),
    safe(
      (async () => {
        await ensureReleaseTables();
        return prisma.productRelease.findFirst({ where: { app: id }, orderBy: { releasedAt: "desc" }, select: { version: true, releasedAt: true } });
      })(),
      null,
      "program newest release"
    ),
    // GitHub's newest published release (kept for 15 minutes, so the page never waits on GitHub for long)
    release?.github
      ? safe(
          (async () => {
            const r = await fetch(`https://api.github.com/repos/${release.github}/releases?per_page=10`, {
              headers: { Accept: "application/vnd.github+json", "User-Agent": "exceltokml.com" },
              next: { revalidate: 900 },
              signal: AbortSignal.timeout(4000),
            });
            if (!r.ok) return null;
            const list = (await r.json()) as { tag_name: string; published_at: string; html_url: string; draft: boolean; prerelease: boolean; assets?: unknown[] }[];
            const g = list.find((x) => !x.draft && x.assets?.length);
            return g ? { version: normVersion(g.tag_name), at: g.published_at, url: g.html_url, prerelease: g.prerelease } : null;
          })(),
          null,
          "github"
        )
      : Promise.resolve(null),
  ]);
  const ev = (a: string) => events.find((e) => e.action === a);
  const status = (v: string | null) => (!v || !latest ? "unknown" : compareVersions(normVersion(v), latest) >= 0 ? "current" : "behind");
  const list = pcs.map((p) => ({ id: p.id, name: p.name, version: p.v ? normVersion(p.v) : "", status: status(p.v), userId: p.userId, email: p.email, userName: p.userName, lastSeen: p.lastSeen, toolkitVersion: p.toolkitVersion }));
  const d = downloaders[0];
  return {
    latest,
    toolkit: {
      pcs: list,
      withIt: list.length,
      allPcs: n(allPcs[0]?.c),
      current: list.filter((p) => p.status === "current").length,
      behind: list.filter((p) => p.status === "behind").length,
      events: Object.fromEntries(["installed", "updated", "uninstalled", "failed", "opened"].map((a) => [a, { cur: n(ev(a)?.cur), prev: n(ev(a)?.prev) }])) as Record<string, Pair>,
      failures: failures.map((f) => ({ id: String(f.id), message: f.message, fromVersion: f.fromVersion, toVersion: f.toVersion, at: f.at, pc: f.pc, userId: f.userId, email: f.email })),
    },
    downloads: { signedIn: n(d?.signedIn), anonymous: n(d?.anonymous), first: n(d?.first), again: n(d?.again) },
    newestRelease: newest ? { version: newest.version, at: newest.releasedAt } : null,
    github,
  };
}
