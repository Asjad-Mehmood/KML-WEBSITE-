import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { ensureJobsTable, deleteJob } from "@/lib/userJobs";
import { ensureTraverseTables, adminRemove as removeTraverseJob } from "@/lib/traverseJobs";
import { ensureSlopeTables, adminRemove as removeSlopeJob } from "@/lib/slopeJobs";

// Admin → Files: everything people keep in their accounts, app by app, in one list:
//   user_files     files opened in and saved from Excel to KML (Windows and web) and Traverse & Level
//   user_jobs      jobs kept from Excel to KML, to open on any computer
//   traverse_jobs  traverse and level jobs kept from Traverse & Level
//   slope_jobs     calculations kept from Slope Calculator
// RoadPro, Project Folder Manager and the Survey Toolkit keep nothing in accounts.
// Filtered, sorted and paged in the database, so it stays quick however much is kept.

/** The apps that keep anything in accounts, in menu order */
export const DATA_APPS = [
  { id: "excel-to-kml", name: "Excel to KML", keeps: "Files opened and saved in the Windows program and the web app, and jobs kept in the account" },
  { id: "traverse", name: "Traverse & Level", keeps: "Files opened and saved, and traverse and level jobs kept in the account" },
  { id: "slope", name: "Slope Calculator", keeps: "Calculations kept in the account" },
] as const;
export const DATA_KINDS = ["opened", "saved", "job", "calculation"] as const;
export type DataKind = (typeof DATA_KINDS)[number];
export const DATA_SORTS = ["newest", "oldest", "largest", "smallest", "name"] as const;
export type DataSort = (typeof DATA_SORTS)[number];

export interface DataRow {
  /** "<source>:<id>": f file, ej Excel to KML job, tj Traverse & Level job, sj Slope calculation */
  key: string;
  app: string;
  kind: DataKind;
  /** windows_app | web_app for Excel to KML files; null otherwise */
  platform: string | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  title: string;
  /** the file's type (kml, xlsx …), or job / calculation */
  ext: string | null;
  size: number;
  points: number | null;
  grid: string | null;
  /** a few words more: what's in a job, a traverse's result */
  detail: string | null;
  /** a copy is kept and can be downloaded */
  hasContent: boolean;
  at: Date;
}

export interface DataFilter {
  app?: string;
  kind?: string;
  platform?: string;
  ext?: string;
  userId?: string;
  q?: string;
  from?: Date;
  to?: Date;
}

function unionSql(): string {
  return `
    SELECT 'f:' || f."id" AS "key",
           CASE WHEN f."platform" = 'traverse_app' THEN 'traverse' ELSE 'excel-to-kml' END AS "app",
           CASE WHEN f."direction" = 'export' THEN 'saved' ELSE 'opened' END AS "kind",
           CASE WHEN f."platform" = 'traverse_app' THEN NULL ELSE COALESCE(f."platform", 'windows_app') END AS "platform",
           f."userId", COALESCE(u."email", f."userEmail") AS "email", COALESCE(u."name", f."userName") AS "name",
           f."fileName" AS "title", LOWER(SUBSTRING(f."fileName" FROM '\\.([A-Za-z0-9]{1,8})$')) AS "ext",
           f."fileSize" AS "size", f."pointsCount" AS "points", f."crs" AS "grid", NULL::text AS "detail",
           (f."contentBase64" IS NOT NULL) AS "hasContent", f."timestamp" AS "at"
      FROM "user_files" f LEFT JOIN "users" u ON u."id" = f."userId"
    UNION ALL
    SELECT 'ej:' || j."id", 'excel-to-kml', 'job', NULL, j."userId", u."email", u."name",
           j."name", 'job', j."size", j."points", NULLIF(j."grid", ''),
           NULLIF(CONCAT_WS(' · ', CASE WHEN j."photos" > 0 THEN j."photos" || ' photos' END, NULLIF(j."survey", '')), ''),
           TRUE, j."updatedAt"
      FROM "user_jobs" j LEFT JOIN "users" u ON u."id" = j."userId"
    UNION ALL
    SELECT 'tj:' || t."id", 'traverse', 'job', NULL, t."ownerId", u."email", u."name",
           t."name", 'job', t."size", NULL, NULL,
           CONCAT(CASE WHEN t."kind" = 'level' THEN 'Level run' ELSE 'Traverse' END,
                  CASE WHEN t."summary" LIKE '{%' THEN COALESCE(' · ' || (t."summary"::jsonb->>'status'), '') ELSE '' END),
           TRUE, t."updatedAt"
      FROM "traverse_jobs" t LEFT JOIN "users" u ON u."id" = t."ownerId"
    UNION ALL
    SELECT 'sj:' || s."id", 'slope', 'calculation', NULL, s."ownerId", u."email", u."name",
           s."name", 'calculation', s."size", NULL, NULL, NULL, TRUE, s."updatedAt"
      FROM "slope_jobs" s LEFT JOIN "users" u ON u."id" = s."ownerId"`;
}

function where(f: DataFilter, params: unknown[]): string {
  const w: string[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (f.app) w.push(`"app" = ${p(f.app)}`);
  if (f.kind) w.push(`"kind" = ${p(f.kind)}`);
  if (f.platform) w.push(`"platform" = ${p(f.platform)}`);
  if (f.ext) w.push(`"ext" = ${p(f.ext.toLowerCase())}`);
  if (f.userId) w.push(f.userId === "none" ? `"userId" IS NULL` : `"userId" = ${p(f.userId)}`);
  if (f.from) w.push(`"at" >= ${p(f.from)}`);
  if (f.to) w.push(`"at" < ${p(f.to)}`);
  if (f.q) {
    const like = p(`%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    w.push(`("title" ILIKE ${like} OR "email" ILIKE ${like} OR "name" ILIKE ${like} OR "grid" ILIKE ${like} OR "detail" ILIKE ${like})`);
  }
  return w.length ? `WHERE ${w.join(" AND ")}` : "";
}

const ORDER: Record<DataSort, string> = {
  newest: `"at" DESC, "key" DESC`,
  oldest: `"at" ASC, "key" ASC`,
  largest: `"size" DESC, "at" DESC, "key" DESC`,
  smallest: `"size" ASC, "at" DESC, "key" DESC`,
  name: `LOWER("title") ASC, "at" DESC, "key" DESC`,
};

let ready: Promise<unknown> | null = null;
function tables() {
  if (!ready) {
    ready = Promise.all([ensureJobsTable(), ensureTraverseTables(), ensureSlopeTables()]).catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const num = (v: unknown) => Number(v ?? 0);

/** One page of the list */
export async function listData(f: DataFilter, sort: DataSort = "newest", offset = 0, limit = 50): Promise<{ rows: DataRow[]; total: number }> {
  await tables();
  const params: unknown[] = [];
  const w = where(f, params);
  const lim = Math.max(1, Math.min(20000, Math.floor(limit)));
  const off = Math.max(0, Math.floor(offset));
  const [rows, count] = await Promise.all([
    prisma.$queryRawUnsafe<(DataRow & { size: unknown; points: unknown })[]>(
      `SELECT * FROM (${unionSql()}) x ${w} ORDER BY ${ORDER[sort] ?? ORDER.newest} LIMIT ${lim} OFFSET ${off}`,
      ...params
    ),
    prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) n FROM (${unionSql()}) x ${w}`, ...params),
  ]);
  return {
    rows: rows.map((r) => ({ ...r, size: num(r.size), points: r.points == null ? null : num(r.points) })),
    total: num(count[0]?.n),
  };
}

/** The numbers at the top: how many, how big, how many people, how many new this week; by app, by kind and by type */
export async function dataSummary(f: DataFilter) {
  await tables();
  const p1: unknown[] = [];
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [tot] = await prisma.$queryRawUnsafe<{ n: bigint; bytes: bigint | null; people: bigint; week: bigint; kept: bigint; last: Date | null }[]>(
    `SELECT COUNT(*) n, SUM("size") bytes, COUNT(DISTINCT "userId") people, COUNT(*) FILTER (WHERE "at" >= $${p1.push(weekAgo)}) week,
            COUNT(*) FILTER (WHERE "hasContent") kept, MAX("at") last
       FROM (${unionSql()}) x ${where(f, p1)}`,
    ...p1
  );
  // each breakdown with the other filters, but not its own, so its choices show what they'd give
  const by = async (col: string, drop: Partial<DataFilter>) => {
    const ps: unknown[] = [];
    const rows = await prisma.$queryRawUnsafe<{ k: string | null; n: bigint }[]>(
      `SELECT "${col}" k, COUNT(*) n FROM (${unionSql()}) x ${where({ ...f, ...drop }, ps)} GROUP BY 1 ORDER BY 2 DESC LIMIT 30`,
      ...ps
    );
    return Object.fromEntries(rows.filter((r) => r.k).map((r) => [r.k as string, num(r.n)]));
  };
  const [apps, kinds, exts, platforms] = await Promise.all([
    by("app", { app: undefined, kind: undefined, ext: undefined, platform: undefined }),
    by("kind", { kind: undefined, ext: undefined }),
    by("ext", { ext: undefined }),
    by("platform", { platform: undefined }),
  ]);
  return {
    total: num(tot?.n),
    bytes: num(tot?.bytes),
    people: num(tot?.people),
    week: num(tot?.week),
    kept: num(tot?.kept),
    last: tot?.last ?? null,
    apps,
    kinds,
    exts,
    platforms,
  };
}

/** One row per person: how many of each kind, how big, the last one */
export async function dataByPerson(f: DataFilter, sort: "recent" | "most" | "largest" = "recent", limit = 500) {
  await tables();
  const params: unknown[] = [];
  const order = sort === "most" ? `"items" DESC` : sort === "largest" ? `"bytes" DESC` : `"last" DESC`;
  const rows = await prisma.$queryRawUnsafe<
    { userId: string | null; email: string | null; name: string | null; items: bigint; bytes: bigint | null; opened: bigint; saved: bigint; jobs: bigint; calculations: bigint; last: Date }[]
  >(
    `SELECT "userId", MAX("email") email, MAX("name") "name", COUNT(*) items, SUM("size") bytes,
            COUNT(*) FILTER (WHERE "kind" = 'opened') opened, COUNT(*) FILTER (WHERE "kind" = 'saved') saved,
            COUNT(*) FILTER (WHERE "kind" = 'job') jobs, COUNT(*) FILTER (WHERE "kind" = 'calculation') calculations, MAX("at") "last"
       FROM (${unionSql()}) x ${where(f, params)} GROUP BY "userId" ORDER BY ${order}, "userId" LIMIT ${Math.max(1, Math.min(2000, limit))}`,
    ...params
  );
  return rows.map((r) => ({
    userId: r.userId,
    email: r.email,
    name: r.name,
    items: num(r.items),
    bytes: num(r.bytes),
    opened: num(r.opened),
    saved: num(r.saved),
    jobs: num(r.jobs),
    calculations: num(r.calculations),
    last: r.last,
  }));
}

/** Where an item can be downloaded from, by an admin */
export function downloadUrl(r: Pick<DataRow, "key" | "hasContent">): string | null {
  if (!r.hasContent) return null;
  const [src, id] = splitKey(r.key);
  if (src === "f") return `/api/user/files/${encodeURIComponent(id)}`;
  return `/api/admin/data?download=${encodeURIComponent(r.key)}`;
}

export function splitKey(key: string): [string, string] {
  const i = key.indexOf(":");
  return i > 0 ? [key.slice(0, i), key.slice(i + 1)] : ["", key];
}

/** A kept job or calculation as a file, for an admin to download */
export async function jobFile(key: string): Promise<{ name: string; type: string; body: string } | null> {
  await tables();
  const [src, id] = splitKey(key);
  const safe = (s: string) => s.replace(/[^\w .()-]+/g, "_").slice(0, 80) || "job";
  if (src === "ej") {
    const r = await prisma.$queryRawUnsafe<{ name: string; state: string }[]>(`SELECT "name", "state" FROM "user_jobs" WHERE "id" = $1`, id);
    return r[0] ? { name: `${safe(r[0].name)}.bm2job`, type: "application/json", body: r[0].state } : null;
  }
  if (src === "tj") {
    const r = await prisma.$queryRawUnsafe<{ name: string; kind: string; data: string; summary: string }[]>(
      `SELECT "name", "kind", "data", "summary" FROM "traverse_jobs" WHERE "id" = $1`,
      id
    );
    if (!r[0]) return null;
    return { name: `${safe(r[0].name)}.json`, type: "application/json", body: JSON.stringify({ id, kind: r[0].kind, name: r[0].name, summary: tryJson(r[0].summary), data: tryJson(r[0].data) }, null, 2) };
  }
  if (src === "sj") {
    const r = await prisma.$queryRawUnsafe<{ name: string; data: string; summary: string }[]>(`SELECT "name", "data", "summary" FROM "slope_jobs" WHERE "id" = $1`, id);
    if (!r[0]) return null;
    return { name: `${safe(r[0].name)}.json`, type: "application/json", body: JSON.stringify({ id, name: r[0].name, summary: tryJson(r[0].summary), data: tryJson(r[0].data) }, null, 2) };
  }
  return null;
}

function tryJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

/** Delete items by key. Returns the keys deleted and their names, for the admin log. */
export async function deleteData(keys: string[]): Promise<{ deleted: string[]; names: string[] }> {
  await tables();
  const deleted: string[] = [];
  const names: string[] = [];
  for (const key of keys) {
    const [src, id] = splitKey(key);
    try {
      if (src === "f") {
        const f = await prisma.userFile.findUnique({ where: { id }, select: { fileName: true } });
        if (f && (await db.deleteUserFile(id))) names.push(f.fileName);
        else continue;
      } else if (src === "ej") {
        const j = await prisma.$queryRawUnsafe<{ userId: string; jobId: string; name: string }[]>(`SELECT "userId", "jobId", "name" FROM "user_jobs" WHERE "id" = $1`, id);
        if (!j[0] || !(await deleteJob(j[0].userId, j[0].jobId))) continue;
        names.push(j[0].name);
      } else if (src === "tj") {
        const j = await removeTraverseJob(id);
        if (!j) continue;
        names.push(j.name);
      } else if (src === "sj") {
        const n = await prisma.$queryRawUnsafe<{ name: string }[]>(`SELECT "name" FROM "slope_jobs" WHERE "id" = $1`, id);
        if (!n[0] || !(await removeSlopeJob(id))) continue;
        names.push(n[0].name);
      } else continue;
      deleted.push(key);
    } catch (err) {
      console.error("[admin data] not deleted:", key, err);
    }
  }
  return { deleted, names };
}
