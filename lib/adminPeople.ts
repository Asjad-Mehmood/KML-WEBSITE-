import { prisma } from "@/lib/prisma";
import { ensureVerifyTables } from "@/lib/emailVerify";
import { blockedIds } from "@/lib/accountControls";
import { countryOf } from "@/lib/publicStats";
import { STAFF_EMAILS, notStaff } from "@/lib/staffAccounts";
import { programName } from "@/lib/programs";

// Admin → Surveyors and Admin → Downloads, filtered, sorted and paged in the database so both stay
// quick however many accounts and downloads there are.

/** Which program each download is of (as lib/activityFeed.ts) */
export const DOWNLOAD_APPS: { id: string; name: string; assets: string[] }[] = [
  { id: "excel-to-kml", name: programName("excel-to-kml"), assets: ["windows_installer", "sample_csv", "test_kml", "web_app"] },
  { id: "traverse", name: programName("traverse"), assets: ["traverse", "traverse_manual", "traverse_sample"] },
  { id: "slope", name: programName("slope"), assets: ["slope"] },
  { id: "auto-draft", name: programName("auto-draft"), assets: ["auto_draft"] },
  { id: "roadpro", name: programName("roadpro"), assets: ["roadpro"] },
  { id: "folder-manager", name: programName("folder-manager"), assets: ["folder_manager"] },
  { id: "toolkit", name: programName("toolkit"), assets: ["toolkit"] },
];
const APP_OF_ASSET = `CASE
  ${DOWNLOAD_APPS.map((a) => `WHEN d."assetType" IN (${a.assets.map((x) => `'${x}'`).join(",")}) THEN '${a.id}'`).join("\n  ")}
  WHEN d."assetType" LIKE 'traverse%' THEN 'traverse' ELSE d."assetType" END`;

// accounts the site makes itself, never real people
const NOT_PEOPLE: string[] = [...STAFF_EMAILS];

const n = (v: unknown) => Number(v ?? 0);
const like = (q: string) => `%${q.replace(/[%_\\]/g, (c) => "\\" + c)}%`;

// ---------------------------------------------------------------- surveyors

export interface SurveyorFilter {
  q?: string;
  /** confirmed | waiting | older */
  email?: string;
  /** admin | blocked | full */
  kind?: string;
  /** an app they downloaded */
  app?: string;
  /** yes | no: downloaded anything */
  downloaded?: string;
  /** joined within this many days */
  joined?: number;
  /** signed in within this many days; negative: not for that many days */
  active?: number;
  country?: string;
}
export const SURVEYOR_SORTS = ["newest", "oldest", "active", "inactive", "downloads", "name"] as const;

async function surveyorReady() {
  await Promise.all([ensureVerifyTables(), blockedIds()]);
}

function surveyorWhere(f: SurveyorFilter, params: unknown[]) {
  const w: string[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (f.q) {
    const l = p(like(f.q));
    w.push(
      `(u."name" ILIKE ${l} OR u."email" ILIKE ${l} OR u."organization" ILIKE ${l} OR u."location" ILIKE ${l} OR u."ipAddress" ILIKE ${l} OR u."id" = ${p(f.q)})`
    );
  }
  if (f.email === "confirmed") w.push(`es."verifiedAt" IS NOT NULL`);
  if (f.email === "waiting") w.push(`es."required" AND es."verifiedAt" IS NULL`);
  if (f.email === "older") w.push(`(es."userId" IS NULL OR (NOT es."required" AND es."verifiedAt" IS NULL))`);
  if (f.kind === "admin") w.push(`u."role" = 'ADMIN'`);
  if (f.kind === "blocked") w.push(`ac."blocked"`);
  if (f.kind === "full") w.push(`u."hasFullAccess"`);
  const app = DOWNLOAD_APPS.find((a) => a.id === f.app);
  if (app) w.push(`EXISTS (SELECT 1 FROM "downloads" d WHERE d."userId" = u."id" AND d."assetType" IN (${app.assets.map((x) => `'${x}'`).join(",")}))`);
  if (f.downloaded === "yes") w.push(`EXISTS (SELECT 1 FROM "downloads" d WHERE d."userId" = u."id")`);
  if (f.downloaded === "no") w.push(`NOT EXISTS (SELECT 1 FROM "downloads" d WHERE d."userId" = u."id")`);
  if (f.joined && f.joined > 0) w.push(`u."createdAt" >= ${p(new Date(Date.now() - f.joined * 864e5))}`);
  if (f.active && f.active > 0) w.push(`u."lastLoginAt" >= ${p(new Date(Date.now() - f.active * 864e5))}`);
  if (f.active && f.active < 0) w.push(`u."lastLoginAt" < ${p(new Date(Date.now() + f.active * 864e5))}`);
  if (f.country) w.push(`u."location" ILIKE ${p(`%${f.country.replace(/[%_\\]/g, "")}`)}`);
  return w.length ? `WHERE ${w.join(" AND ")}` : "";
}

const SURVEYOR_ORDER: Record<string, string> = {
  newest: `u."createdAt" DESC`,
  oldest: `u."createdAt" ASC`,
  active: `u."lastLoginAt" DESC`,
  inactive: `u."lastLoginAt" ASC`,
  downloads: `downloads DESC, u."createdAt" DESC`,
  name: `LOWER(u."name") ASC`,
};

const SURVEYOR_FROM = `FROM "users" u
  LEFT JOIN "user_email_status" es ON es."userId" = u."id"
  LEFT JOIN "account_controls" ac ON ac."userId" = u."id"`;

export async function listSurveyors(f: SurveyorFilter, sort = "newest", offset = 0, limit = 50) {
  await surveyorReady();
  const params: unknown[] = [];
  const w = surveyorWhere(f, params);
  const lim = Math.max(1, Math.min(10000, Math.floor(limit)));
  const off = Math.max(0, Math.floor(offset));
  const [rows, total] = await Promise.all([
    prisma.$queryRawUnsafe<
      {
        id: string;
        name: string;
        email: string;
        organization: string | null;
        role: string | null;
        hasFullAccess: boolean | null;
        customMaxPoints: number | null;
        ipAddress: string | null;
        location: string | null;
        createdAt: Date;
        lastLoginAt: Date;
        downloads: bigint;
        lastDownload: Date | null;
        apps: string[] | null;
        required: boolean | null;
        verifiedAt: Date | null;
        blocked: boolean | null;
      }[]
    >(
      `SELECT u."id", u."name", u."email", u."organization", u."role", u."hasFullAccess", u."customMaxPoints", u."ipAddress", u."location",
              u."createdAt", u."lastLoginAt", es."required", es."verifiedAt", ac."blocked",
              (SELECT COUNT(*) FROM "downloads" d WHERE d."userId" = u."id") downloads,
              (SELECT MAX(d."timestamp") FROM "downloads" d WHERE d."userId" = u."id") "lastDownload",
              (SELECT array_agg(DISTINCT ${APP_OF_ASSET}) FROM "downloads" d WHERE d."userId" = u."id") apps
         ${SURVEYOR_FROM} ${w}
        ORDER BY ${SURVEYOR_ORDER[sort] ?? SURVEYOR_ORDER.newest}, u."id" LIMIT ${lim} OFFSET ${off}`,
      ...params
    ),
    prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT COUNT(*) c ${SURVEYOR_FROM} ${w}`, ...params),
  ]);
  return {
    total: n(total[0]?.c),
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      organization: r.organization,
      role: r.role,
      hasFullAccess: Boolean(r.hasFullAccess),
      customMaxPoints: r.customMaxPoints,
      ipAddress: r.ipAddress,
      location: r.location,
      createdAt: r.createdAt,
      lastLoginAt: r.lastLoginAt,
      downloads: n(r.downloads),
      lastDownload: r.lastDownload,
      apps: (r.apps ?? []).filter((a) => DOWNLOAD_APPS.some((x) => x.id === a)),
      emailState: r.verifiedAt ? "confirmed" : r.required ? "waiting" : "older",
      blocked: Boolean(r.blocked),
    })),
  };
}

/** The numbers above the list (for every account, whatever the filters) and its countries */
export async function surveyorSummary() {
  await surveyorReady();
  const d7 = new Date(Date.now() - 7 * 864e5);
  const d30 = new Date(Date.now() - 30 * 864e5);
  const notPeople = notStaff('u."email"');
  const [t, places] = await Promise.all([
    prisma.$queryRawUnsafe<
      {
        total: bigint;
        new7: bigint;
        new30: bigint;
        active30: bigint;
        confirmed: bigint;
        waiting: bigint;
        blocked: bigint;
        admins: bigint;
        downloaders: bigint;
      }[]
    >(
      `SELECT COUNT(*) total, COUNT(*) FILTER (WHERE u."createdAt" >= $1) new7, COUNT(*) FILTER (WHERE u."createdAt" >= $2) new30,
              COUNT(*) FILTER (WHERE u."lastLoginAt" >= $2) active30,
              COUNT(*) FILTER (WHERE es."verifiedAt" IS NOT NULL) confirmed, COUNT(*) FILTER (WHERE es."required" AND es."verifiedAt" IS NULL) waiting,
              COUNT(*) FILTER (WHERE ac."blocked") blocked, COUNT(*) FILTER (WHERE u."role" = 'ADMIN') admins,
              COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM "downloads" d WHERE d."userId" = u."id")) downloaders
         ${SURVEYOR_FROM} WHERE ${notPeople}`,
      d7,
      d30
    ),
    prisma.user.findMany({ where: { email: { notIn: NOT_PEOPLE } }, select: { location: true } }),
  ]);
  const countries = new Map<string, number>();
  for (const u of places) {
    const c = countryOf(u.location);
    if (c) countries.set(c, (countries.get(c) ?? 0) + 1);
  }
  const r = t[0];
  return {
    total: n(r?.total),
    new7: n(r?.new7),
    new30: n(r?.new30),
    active30: n(r?.active30),
    confirmed: n(r?.confirmed),
    waiting: n(r?.waiting),
    blocked: n(r?.blocked),
    admins: n(r?.admins),
    downloaders: n(r?.downloaders),
    countries: [...countries].sort((a, b) => b[1] - a[1]).slice(0, 30),
  };
}

// ---------------------------------------------------------------- downloads

export interface DownloadFilter {
  app?: string;
  q?: string;
  /** in | out: signed in or not */
  who?: string;
  version?: string;
  country?: string;
  from?: Date;
  to?: Date;
  userId?: string;
}

function downloadWhere(f: DownloadFilter, params: unknown[]) {
  const w: string[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (f.app) w.push(`(${APP_OF_ASSET}) = ${p(f.app)}`);
  if (f.q) {
    const l = p(like(f.q));
    w.push(
      `(d."userEmail" ILIKE ${l} OR d."userName" ILIKE ${l} OR d."fileName" ILIKE ${l} OR d."ipAddress" ILIKE ${l} OR d."location" ILIKE ${l} OR d."version" ILIKE ${l})`
    );
  }
  if (f.who === "in") w.push(`d."userId" IS NOT NULL`);
  if (f.who === "out") w.push(`d."userId" IS NULL`);
  if (f.version) w.push(`LTRIM(d."version", 'vV') = ${p(f.version.replace(/^v/i, ""))}`);
  if (f.country) w.push(`d."location" ILIKE ${p(`%${f.country.replace(/[%_\\]/g, "")}`)}`);
  if (f.from) w.push(`d."timestamp" >= ${p(f.from)}`);
  if (f.to) w.push(`d."timestamp" < ${p(f.to)}`);
  if (f.userId) w.push(`d."userId" = ${p(f.userId)}`);
  return w.length ? `WHERE ${w.join(" AND ")}` : "";
}

export async function listDownloads(f: DownloadFilter, sort = "newest", offset = 0, limit = 50) {
  const params: unknown[] = [];
  const w = downloadWhere(f, params);
  const lim = Math.max(1, Math.min(20000, Math.floor(limit)));
  const off = Math.max(0, Math.floor(offset));
  const [rows, total] = await Promise.all([
    prisma.$queryRawUnsafe<
      {
        id: string;
        userId: string | null;
        userEmail: string | null;
        userName: string | null;
        assetType: string;
        app: string;
        fileName: string;
        version: string;
        ipAddress: string | null;
        location: string | null;
        userAgent: string | null;
        timestamp: Date;
      }[]
    >(
      `SELECT d."id", d."userId", COALESCE(u."email", d."userEmail") "userEmail", COALESCE(u."name", d."userName") "userName", d."assetType", ${APP_OF_ASSET} app,
              d."fileName", d."version", d."ipAddress", d."location", d."userAgent", d."timestamp"
         FROM "downloads" d LEFT JOIN "users" u ON u."id" = d."userId" ${w}
        ORDER BY d."timestamp" ${sort === "oldest" ? "ASC" : "DESC"}, d."id" LIMIT ${lim} OFFSET ${off}`,
      ...params
    ),
    prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT COUNT(*) c FROM "downloads" d ${w}`, ...params),
  ]);
  return { total: n(total[0]?.c), rows };
}

/** The numbers for the filters: per program, per day, countries, versions, people */
export async function downloadSummary(f: DownloadFilter) {
  const days = 30;
  const since = new Date(Date.now() - (days - 1) * 864e5);
  since.setUTCHours(0, 0, 0, 0);
  const p1: unknown[] = [];
  const w = downloadWhere(f, p1);
  const pApps: unknown[] = [];
  const wApps = downloadWhere({ ...f, app: undefined }, pApps);
  const [tot, apps, daily, versions, places] = await Promise.all([
    prisma.$queryRawUnsafe<{ c: bigint; people: bigint; anon: bigint; files: bigint }[]>(
      `SELECT COUNT(*) c, COUNT(DISTINCT d."userId") people, COUNT(*) FILTER (WHERE d."userId" IS NULL) anon, COUNT(DISTINCT d."fileName") files FROM "downloads" d ${w}`,
      ...p1
    ),
    prisma.$queryRawUnsafe<{ app: string; c: bigint }[]>(`SELECT ${APP_OF_ASSET} app, COUNT(*) c FROM "downloads" d ${wApps} GROUP BY 1`, ...pApps),
    prisma.$queryRawUnsafe<{ day: Date; c: bigint }[]>(
      `SELECT date_trunc('day', d."timestamp") AS day, COUNT(*) c FROM "downloads" d ${w ? `${w} AND` : "WHERE"} d."timestamp" >= $${p1.length + 1} GROUP BY 1`,
      ...p1,
      since
    ),
    prisma.$queryRawUnsafe<{ v: string; c: bigint }[]>(
      `SELECT LTRIM(d."version", 'vV') v, COUNT(*) c FROM "downloads" d ${w} GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      ...p1
    ),
    prisma.$queryRawUnsafe<{ location: string | null; c: bigint }[]>(`SELECT d."location", COUNT(*) c FROM "downloads" d ${w} GROUP BY 1`, ...p1),
  ]);
  const byDay = new Map(daily.map((r) => [new Date(r.day).toISOString().slice(0, 10), n(r.c)]));
  const series = Array.from({ length: days }, (_, i) => {
    const t = new Date(since.getTime() + i * 864e5).toISOString().slice(0, 10);
    return { t, c: byDay.get(t) ?? 0 };
  });
  const countries = new Map<string, number>();
  for (const r of places) {
    const c = countryOf(r.location);
    if (c) countries.set(c, (countries.get(c) ?? 0) + n(r.c));
  }
  return {
    total: n(tot[0]?.c),
    people: n(tot[0]?.people),
    anonymous: n(tot[0]?.anon),
    apps: Object.fromEntries(apps.map((a) => [a.app, n(a.c)])),
    series,
    versions: versions.filter((v) => v.v).map((v) => ({ version: v.v, count: n(v.c) })),
    countries: [...countries].sort((a, b) => b[1] - a[1]).slice(0, 12),
  };
}

export async function deleteDownloads(ids: string[]) {
  return prisma.download.deleteMany({ where: { id: { in: ids } } }).then((r) => r.count);
}

export const csvCell = (v: unknown) => {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
