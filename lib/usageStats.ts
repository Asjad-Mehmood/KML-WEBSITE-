// Admin → Usage: how much each account really uses the programs, to see when it's time for a paid
// plan (docs: the plan is to look at Pro once about 1,000 people use the programs every month).
// Read from what the site already records, so there is history from the first day:
//   activities      what people do in Excel to KML, Traverse & Level and Slope Calculator
//   app_usage       each program and device an account was last seen on (lastSeen)
//   toolkit_events  installs and updates through the Survey Toolkit
//   user_jobs, traverse_jobs, slope_jobs   what people keep in their accounts
//   users.lastLoginAt   the last sign-in
// Staff and seeded accounts (lib/releases NEVER_EMAIL) and admins are left out.
import { prisma } from "@/lib/prisma";
import { NEVER_EMAIL } from "@/lib/releases";
import { ADMIN_EMAIL } from "@/lib/adminRole";
import { FREE_LIMITS } from "@/lib/plans";

/** The goal: monthly active people before a paid plan */
export const USAGE_GOAL = 1000;

/** The free plan's limits (lib/plans): how many accounts would pass each one today */
export { FREE_LIMITS };

/** What counts as work (not signing in or changing settings) */
export const WORK_ACTIONS = [
  "conversion", "export", "batch_process", "photos_attached", "project_save", "file_upload", "file_import", "drag_drop_import", "browser_export",
  "traverse", "levelling", "tl_open", "tl_update", "tl_share", "tl_simulation", "tl_import", "tl_export",
  "slope_new", "slope_update",
];

const n = (v: unknown) => Number(v ?? 0);
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

async function tables(): Promise<Set<string>> {
  const names = ["app_usage", "toolkit_events", "traverse_jobs", "slope_jobs"];
  const rows = await prisma.$queryRawUnsafe<{ t: string; ok: boolean }[]>(
    `SELECT t, to_regclass('public."' || t || '"') IS NOT NULL AS ok FROM unnest($1::text[]) AS t`,
    names
  );
  return new Set(rows.filter((r) => r.ok).map((r) => r.t));
}

export type UsagePerson = {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  joined: string;
  lastActive: string | null;
  activeDays30: number;
  work30: number;
  points30: number;
  savedJobs: number;
  apps: string[];
  /** a rough rank: days active weigh most, then work, then what is kept */
  score: number;
};

export async function usageOverview() {
  const has = await tables();
  const never = [...NEVER_EMAIL, ADMIN_EMAIL].map((e) => q(e.toLowerCase())).join(",");
  const work = WORK_ACTIONS.map(q).join(",");
  const since30 = `now() - interval '30 days'`;

  // every day someone did something, from each source
  const days = [
    `SELECT "userId" AS uid, date_trunc('day', "timestamp") AS d FROM "activities" WHERE "userId" IS NOT NULL AND "timestamp" >= ${since30} AND "action" IN (${work})`,
    has.has("toolkit_events") ? `SELECT "userId", date_trunc('day', "createdAt") FROM "toolkit_events" WHERE "createdAt" >= ${since30}` : "",
    has.has("app_usage") ? `SELECT "userId", date_trunc('day', "lastSeen") FROM "app_usage" WHERE "lastSeen" >= ${since30}` : "",
  ].filter(Boolean).join(" UNION ");
  const jobs = [
    `SELECT "userId" AS uid, count(*) AS c FROM "user_jobs" GROUP BY 1`,
    has.has("traverse_jobs") ? `SELECT "ownerId", count(*) FROM "traverse_jobs" GROUP BY 1` : "",
    has.has("slope_jobs") ? `SELECT "ownerId", count(*) FROM "slope_jobs" GROUP BY 1` : "",
  ].filter(Boolean).join(" UNION ALL ");

  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
    WITH people AS (
      SELECT u."id", u."name", u."email", u."organization", u."createdAt", u."lastLoginAt" FROM "users" u
      WHERE lower(u."email") NOT IN (${never}) AND coalesce(u."role", '') NOT IN ('ADMIN', 'Super Admin')
    ),
    days AS (SELECT uid, count(DISTINCT d) AS n FROM (${days}) x GROUP BY uid),
    work AS (
      SELECT "userId" AS uid, count(*) AS n, coalesce(sum("pointsCount"), 0) AS pts, max("timestamp") AS last
      FROM "activities" WHERE "userId" IS NOT NULL AND "timestamp" >= ${since30} AND "action" IN (${work}) GROUP BY 1
    ),
    lastwork AS (SELECT "userId" AS uid, max("timestamp") AS last FROM "activities" WHERE "userId" IS NOT NULL GROUP BY 1),
    jobs AS (SELECT uid, sum(c) AS n FROM (${jobs}) j GROUP BY uid)
    ${has.has("app_usage") ? `, apps AS (SELECT "userId" AS uid, array_agg(DISTINCT "app") AS list, max("lastSeen") AS last FROM "app_usage" GROUP BY 1)` : ""}
    SELECT p.*, coalesce(days.n, 0) AS "activeDays30", coalesce(work.n, 0) AS "work30", coalesce(work.pts, 0) AS "points30",
           coalesce(jobs.n, 0) AS "savedJobs",
           ${has.has("app_usage") ? `coalesce(apps.list, '{}')` : `'{}'::text[]`} AS apps,
           GREATEST(lastwork.last, ${has.has("app_usage") ? "apps.last" : "NULL"}, p."lastLoginAt") AS "lastActive"
    FROM people p
    LEFT JOIN days ON days.uid = p."id"
    LEFT JOIN work ON work.uid = p."id"
    LEFT JOIN lastwork ON lastwork.uid = p."id"
    LEFT JOIN jobs ON jobs.uid = p."id"
    ${has.has("app_usage") ? `LEFT JOIN apps ON apps.uid = p."id"` : ""}
  `);

  const now = Date.now();
  const people: UsagePerson[] = rows.map((r) => {
    const activeDays30 = n(r.activeDays30), work30 = n(r.work30), savedJobs = n(r.savedJobs);
    return {
      id: String(r.id),
      name: String(r.name || ""),
      email: String(r.email || ""),
      organization: (r.organization as string | null) ?? null,
      joined: new Date(r.createdAt as Date).toISOString(),
      lastActive: r.lastActive ? new Date(r.lastActive as Date).toISOString() : null,
      activeDays30,
      work30,
      points30: n(r.points30),
      savedJobs,
      apps: Array.isArray(r.apps) ? (r.apps as string[]).filter(Boolean) : [],
      score: activeDays30 * 5 + Math.min(work30, 200) + Math.min(savedJobs, 100) * 2,
    };
  });

  const within = (iso: string | null, days: number) => !!iso && now - Date.parse(iso) <= days * 864e5;
  const active30 = people.filter((p) => within(p.lastActive, 30));
  const months: { month: string; joined: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months.push({ month: key, joined: people.filter((p) => p.joined.startsWith(key)).length });
  }

  return {
    goal: USAGE_GOAL,
    summary: {
      accounts: people.length,
      active30: active30.length,
      active7: people.filter((p) => within(p.lastActive, 7)).length,
      new30: people.filter((p) => within(p.joined, 30)).length,
      /** came back on 4 or more days in the last 30 */
      regulars: people.filter((p) => p.activeDays30 >= 4).length,
      work30: people.reduce((s, p) => s + p.work30, 0),
    },
    limits: {
      ...FREE_LIMITS,
      overJobs: people.filter((p) => p.savedJobs > FREE_LIMITS.savedJobs).length,
      overWork: people.filter((p) => p.work30 > FREE_LIMITS.monthlyWork).length,
      overDays: people.filter((p) => p.activeDays30 > FREE_LIMITS.activeDays).length,
    },
    months,
    heaviest: [...people].sort((a, b) => b.score - a.score).filter((p) => p.score > 0).slice(0, 50),
  };
}
