import { prisma } from "@/lib/prisma";
import { ensureActivityColumns } from "@/lib/activityTags";
import { ensureToolkitTables } from "@/lib/toolkit/store";

// Admin → Activity: one list of everything that happens across the apps and tools, newest first:
//   activities      what people do in the apps and on the website (lib/activityTags.ts adds the
//                   app, device and version), sign-ins and account changes
//   downloads       every program download from the website
//   toolkit_events  what the Survey Toolkit installed, updated, opened or failed on each PC
// Filtered and paged in the database, so it stays quick however long the history gets.

export interface FeedRow {
  id: string;
  source: "activity" | "download" | "toolkit";
  app: string;
  platform: string | null;
  version: string | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  action: string;
  title: string;
  details: string | null;
  fileName: string | null;
  fileSize: string | null;
  points: number | null;
  status: string;
  error: string | null;
  durationMs: number | null;
  ip: string | null;
  place: string | null;
  device: string | null;
  at: Date;
}

export interface FeedFilter {
  app?: string;
  action?: string;
  userId?: string;
  q?: string;
  errorsOnly?: boolean;
  from?: Date;
  to?: Date;
  /** "<ISO time>|<id>" of the last row already shown */
  before?: string;
  limit?: number;
}

// which app each download is for
const ASSET_APP = `CASE
  WHEN d."assetType" IN ('windows_installer','sample_csv','test_kml','web_app') THEN 'excel-to-kml'
  WHEN d."assetType" LIKE 'traverse%' THEN 'traverse'
  WHEN d."assetType" = 'folder_manager' THEN 'folder-manager'
  ELSE d."assetType" END`;

function unionSql(): string {
  return `
    SELECT a."id", 'activity' AS "source",
           COALESCE(a."app", CASE WHEN a."action" LIKE 'tl\\_%' THEN 'traverse' WHEN a."action" IN ('conversion','export','file_upload','batch_process','photos_attached','project_save','drag_drop_import','file_import','browser_export') THEN 'excel-to-kml' ELSE 'website' END) AS "app",
           a."platform", a."appVersion" AS "version", a."userId", COALESCE(u."email", a."userEmail") AS "email", COALESCE(u."name", a."userName") AS "name",
           a."action", a."title", a."details", a."fileName", a."fileSize", a."pointsCount" AS "points",
           COALESCE(a."status", 'success') AS "status", a."errorMessage" AS "error", a."durationMs", a."ipAddress" AS "ip",
           NULL::text AS "place", a."userAgent" AS "device", a."timestamp" AS "at"
      FROM "activities" a LEFT JOIN "users" u ON u."id" = a."userId"
    UNION ALL
    SELECT d."id", 'download', ${ASSET_APP}, 'Web', d."version", d."userId", d."userEmail", d."userName",
           'download', CONCAT('Downloaded ', d."fileName"), NULL, d."fileName", NULL, NULL,
           'success', NULL, NULL, d."ipAddress", d."location", d."userAgent", d."timestamp"
      FROM "downloads" d
    UNION ALL
    SELECT 'tk_' || e."id"::text, 'toolkit', 'toolkit', 'Windows', e."toVersion", e."userId", u."email", u."name",
           'toolkit_' || e."action",
           CONCAT(INITCAP(e."action"), ' ', CASE e."tool" WHEN 'excel-to-kml' THEN 'Excel to KML' WHEN 'traverse' THEN 'Traverse & Level' WHEN 'slope' THEN 'Slope Calculator'
                  WHEN 'roadpro' THEN 'RoadPro' WHEN 'folder-manager' THEN 'Project Folder Manager' WHEN 'toolkit' THEN 'Survey Toolkit' ELSE e."tool" END,
                  CASE WHEN e."fromVersion" <> '' AND e."toVersion" <> '' AND e."fromVersion" <> e."toVersion" THEN CONCAT(' ', e."fromVersion", ' → ', e."toVersion")
                       WHEN e."toVersion" <> '' THEN CONCAT(' ', e."toVersion") ELSE '' END,
                  CASE WHEN e."message" LIKE 'automatic%' THEN ' (automatic)' ELSE '' END),
           e."message", NULL, NULL, NULL,
           CASE WHEN e."action" = 'failed' THEN 'error' ELSE 'success' END,
           CASE WHEN e."action" = 'failed' THEN e."message" ELSE NULL END, NULL, NULL, NULL, d."name", e."createdAt"
      FROM "toolkit_events" e LEFT JOIN "users" u ON u."id" = e."userId" LEFT JOIN "toolkit_devices" d ON d."id" = e."deviceId"`;
}

function where(f: FeedFilter, params: unknown[]): string {
  const w: string[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (f.app) w.push(`"app" = ${p(f.app)}`);
  if (f.action) w.push(`"action" = ${p(f.action)}`);
  if (f.userId) w.push(`"userId" = ${p(f.userId)}`);
  if (f.errorsOnly) w.push(`"status" IN ('error','failed','warning')`);
  if (f.from) w.push(`"at" >= ${p(f.from)}`);
  if (f.to) w.push(`"at" < ${p(f.to)}`);
  if (f.q) {
    const like = p(`%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    w.push(`("title" ILIKE ${like} OR "details" ILIKE ${like} OR "email" ILIKE ${like} OR "name" ILIKE ${like} OR "fileName" ILIKE ${like} OR "ip" ILIKE ${like} OR "error" ILIKE ${like})`);
  }
  if (f.before) {
    const [t, id] = f.before.split("|");
    const at = new Date(t);
    if (!Number.isNaN(at.getTime()) && id) w.push(`("at", "id") < (${p(at)}, ${p(id)})`);
  }
  return w.length ? `WHERE ${w.join(" AND ")}` : "";
}

async function ready() {
  await ensureActivityColumns();
  await ensureToolkitTables();
}

export async function activityFeed(f: FeedFilter): Promise<{ rows: FeedRow[]; next: string | null }> {
  await ready();
  const params: unknown[] = [];
  const limit = Math.max(1, Math.min(5000, Math.floor(f.limit ?? 100)));
  const rows = await prisma.$queryRawUnsafe<FeedRow[]>(
    `SELECT * FROM (${unionSql()}) x ${where(f, params)} ORDER BY "at" DESC, "id" DESC LIMIT ${limit + 1}`,
    ...params
  );
  const more = rows.length > limit;
  const page = more ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return { rows: page, next: more && last ? `${new Date(last.at).toISOString()}|${last.id}` : null };
}

/** How many of each app and of each action (with the filters but the app's and action's own), for the filter chips */
export async function activityFacets(f: FeedFilter): Promise<{ apps: Record<string, number>; actions: Record<string, number>; errors: number; total: number }> {
  await ready();
  const p1: unknown[] = [];
  const apps = await prisma.$queryRawUnsafe<{ app: string; n: bigint }[]>(
    `SELECT "app", COUNT(*) n FROM (${unionSql()}) x ${where({ ...f, app: undefined, action: undefined, before: undefined }, p1)} GROUP BY 1`,
    ...p1
  );
  const p2: unknown[] = [];
  const actions = await prisma.$queryRawUnsafe<{ action: string; n: bigint; errors: bigint }[]>(
    `SELECT "action", COUNT(*) n, COUNT(*) FILTER (WHERE "status" IN ('error','failed','warning')) errors
       FROM (${unionSql()}) x ${where({ ...f, action: undefined, errorsOnly: false, before: undefined }, p2)} GROUP BY 1`,
    ...p2
  );
  return {
    apps: Object.fromEntries(apps.map((r) => [r.app, Number(r.n)])),
    actions: Object.fromEntries(actions.map((r) => [r.action, Number(r.n)])),
    errors: actions.reduce((s, r) => s + Number(r.errors), 0),
    total: actions.reduce((s, r) => s + Number(r.n), 0),
  };
}
