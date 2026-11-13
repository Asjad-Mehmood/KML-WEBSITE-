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
             FROM ${feed} WHERE "app" = $1 AND "at" >= $3`,
          id,
          from,
          prevFrom
        ),
        [],
        "activity"
      ),
      safe(
        prisma.$queryRawUnsafe<{ t: Date; c: bigint; p: bigint }[]>(
          `SELECT date_trunc('${bucket}', "at") t, COUNT(*) c, COUNT(DISTINCT "userId") p FROM ${feed} WHERE "app" = $1 AND "at" >= $2 GROUP BY 1`,
          id,
          from
        ),
        [],
        "activity series"
      ),
      safe(
        prisma.$queryRawUnsafe<{ action: string; c: bigint; e: bigint; last: Date }[]>(
          `SELECT "action", COUNT(*) c, COUNT(*) FILTER (WHERE "status" IN ('error','failed','warning')) e, MAX("at") "last"
             FROM ${feed} WHERE "app" = $1 AND "at" >= $2 GROUP BY 1 ORDER BY 2 DESC LIMIT 20`,
          id,
          from
        ),
        [],
        "actions"
      ),
      safe(
        prisma.$queryRawUnsafe<{ userId: string; email: string | null; name: string | null; c: bigint; last: Date }[]>(
          `SELECT "userId", MAX("email") email, MAX("name") "name", COUNT(*) c, MAX("at") "last"
             FROM ${feed} WHERE "app" = $1 AND "at" >= $2 AND "userId" IS NOT NULL GROUP BY 1 ORDER BY 4 DESC, 5 DESC LIMIT 10`,
          id,
          from
        ),
        [],
        "people"
      ),
      safe(
        prisma.$queryRawUnsafe<{ id: string; title: string; error: string | null; email: string | null; userId: string | null; version: string | null; platform: string | null; at: Date }[]>(
          `SELECT "id", "title", "error", "email", "userId", "version", "platform", "at" FROM ${feed}
            WHERE "app" = $1 AND "at" >= $2 AND "status" IN ('error','failed','warning') ORDER BY "at" DESC LIMIT 8`,
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

  const latest = release?.current ?? "";
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
