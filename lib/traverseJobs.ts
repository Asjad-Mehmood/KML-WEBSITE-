import { prisma } from "@/lib/prisma";

/**
 * Jobs of the Traverse & Level web app (/traverse/app), kept in the account, and who they are
 * shared with. The tables are created on first use, like user_jobs, so no migration is needed.
 */
export const MAX_TRAVERSE_JOB_BYTES = 2 * 1024 * 1024;
export const MAX_TRAVERSE_JOBS = 500;
export const MAX_TRAVERSE_SHARES = 50;

let ready: Promise<void> | null = null;
export function ensureTraverseTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "traverse_jobs" (
        "id" TEXT NOT NULL,
        "ownerId" TEXT NOT NULL,
        "kind" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "data" TEXT NOT NULL,
        "summary" TEXT NOT NULL DEFAULT '{}',
        "clientUpdated" TEXT NOT NULL DEFAULT '',
        "size" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "traverse_jobs_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "traverse_jobs_ownerId_idx" ON "traverse_jobs"("ownerId")`);
      await prisma.$executeRawUnsafe(`DO $$ BEGIN
        ALTER TABLE "traverse_jobs" ADD CONSTRAINT "traverse_jobs_ownerId_fkey" FOREIGN KEY ("ownerId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "traverse_job_shares" (
        "jobId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "traverse_job_shares_pkey" PRIMARY KEY ("jobId", "email")
      )`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "traverse_job_shares_email_idx" ON "traverse_job_shares"("email")`);
      await prisma.$executeRawUnsafe(`DO $$ BEGIN
        ALTER TABLE "traverse_job_shares" ADD CONSTRAINT "traverse_job_shares_jobId_fkey" FOREIGN KEY ("jobId")
          REFERENCES "traverse_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

type Row = {
  id: string; ownerId: string; kind: string; name: string; data: string; summary: string; clientUpdated: string;
  ownerEmail: string | null; ownerName: string | null;
};

/** The shape the web app reads: the same fields as its own job records. */
function out(r: Row) {
  const parse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
  return {
    id: r.id, kind: r.kind, name: r.name, data: parse(r.data), summary: parse(r.summary) || {},
    updated_at: r.clientUpdated, owner_email: r.ownerEmail || "", owner_name: r.ownerName || "",
  };
}

const SELECT = `SELECT j."id", j."ownerId", j."kind", j."name", j."data", j."summary", j."clientUpdated",
  u."email" AS "ownerEmail", u."name" AS "ownerName"
  FROM "traverse_jobs" j LEFT JOIN "users" u ON u."id" = j."ownerId"`;

export async function listOwn(userId: string) {
  await ensureTraverseTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(`${SELECT} WHERE j."ownerId" = $1 ORDER BY j."clientUpdated" DESC`, userId);
  return rows.map(out);
}

export async function listShared(userId: string, email: string) {
  await ensureTraverseTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `${SELECT} JOIN "traverse_job_shares" s ON s."jobId" = j."id"
     WHERE s."email" = $1 AND j."ownerId" <> $2 ORDER BY j."clientUpdated" DESC`,
    email.toLowerCase(), userId
  );
  return rows.map(out);
}

export async function ownerOf(jobId: string): Promise<string | null> {
  await ensureTraverseTables();
  const r = await prisma.$queryRawUnsafe<{ ownerId: string }[]>(`SELECT "ownerId" FROM "traverse_jobs" WHERE "id" = $1`, jobId);
  return r[0]?.ownerId ?? null;
}

export async function countOwn(userId: string): Promise<number> {
  await ensureTraverseTables();
  const r = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) AS n FROM "traverse_jobs" WHERE "ownerId" = $1`, userId);
  return Number(r[0]?.n ?? 0);
}

export async function upsert(userId: string, jobId: string, j: { kind: string; name: string; data: string; summary: string; updated: string }) {
  await ensureTraverseTables();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "traverse_jobs" ("id","ownerId","kind","name","data","summary","clientUpdated","size","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)
     ON CONFLICT ("id") DO UPDATE SET "kind"=$3,"name"=$4,"data"=$5,"summary"=$6,"clientUpdated"=$7,"size"=$8,"updatedAt"=CURRENT_TIMESTAMP
     WHERE "traverse_jobs"."ownerId" = $2`,
    jobId, userId, j.kind, j.name, j.data, j.summary, j.updated, Buffer.byteLength(j.data)
  );
}

export async function remove(userId: string, jobId: string) {
  await ensureTraverseTables();
  await prisma.$executeRawUnsafe(`DELETE FROM "traverse_jobs" WHERE "id" = $1 AND "ownerId" = $2`, jobId, userId);
}

export async function sharesOf(jobId: string): Promise<string[]> {
  await ensureTraverseTables();
  const r = await prisma.$queryRawUnsafe<{ email: string }[]>(
    `SELECT "email" FROM "traverse_job_shares" WHERE "jobId" = $1 ORDER BY "createdAt"`, jobId
  );
  return r.map((x) => x.email);
}

export async function share(jobId: string, email: string) {
  await ensureTraverseTables();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "traverse_job_shares" ("jobId","email") VALUES ($1,$2) ON CONFLICT DO NOTHING`, jobId, email.toLowerCase()
  );
}

export async function unshare(jobId: string, email: string) {
  await ensureTraverseTables();
  await prisma.$executeRawUnsafe(`DELETE FROM "traverse_job_shares" WHERE "jobId" = $1 AND "email" = $2`, jobId, email.toLowerCase());
}

// ---------------------------------------------------------------- admin

export type AdminTraverseGroup = {
  userId: string; email: string | null; name: string | null; organization: string | null;
  jobs: number; traverses: number; levels: number; accepted: number; rejected: number; lastSaved: string | null;
};

/** Admin → Traverse & Level: one row per surveyor, newest first, with the totals. */
export async function adminGroups() {
  await ensureTraverseTables();
  const rows = await prisma.$queryRawUnsafe<
    { userId: string; email: string | null; name: string | null; organization: string | null; jobs: bigint; traverses: bigint; levels: bigint; accepted: bigint; rejected: bigint; lastSaved: Date | null }[]
  >(
    `SELECT j."ownerId" AS "userId", u."email", u."name", u."organization",
       COUNT(*) AS "jobs",
       COUNT(*) FILTER (WHERE j."kind" = 'traverse') AS "traverses",
       COUNT(*) FILTER (WHERE j."kind" = 'level') AS "levels",
       COUNT(*) FILTER (WHERE j."summary"::jsonb->>'status' = 'accepted') AS "accepted",
       COUNT(*) FILTER (WHERE j."summary"::jsonb->>'status' = 'rejected') AS "rejected",
       MAX(j."updatedAt") AS "lastSaved"
     FROM "traverse_jobs" j LEFT JOIN "users" u ON u."id" = j."ownerId"
     GROUP BY j."ownerId", u."email", u."name", u."organization"
     ORDER BY MAX(j."updatedAt") DESC`
  );
  const groups: AdminTraverseGroup[] = rows.map((r) => ({
    userId: r.userId, email: r.email, name: r.name, organization: r.organization,
    jobs: Number(r.jobs), traverses: Number(r.traverses), levels: Number(r.levels),
    accepted: Number(r.accepted), rejected: Number(r.rejected), lastSaved: r.lastSaved ? new Date(r.lastSaved).toISOString() : null,
  }));
  const totals = groups.reduce(
    (t, g) => ({ jobs: t.jobs + g.jobs, traverses: t.traverses + g.traverses, levels: t.levels + g.levels, accepted: t.accepted + g.accepted, rejected: t.rejected + g.rejected }),
    { jobs: 0, traverses: 0, levels: 0, accepted: 0, rejected: 0 }
  );
  return { groups, totals: { ...totals, surveyors: groups.length } };
}

/** One surveyor's jobs for the admin, with what was saved, the result and who they are shared with. */
export async function adminJobsOf(userId: string) {
  await ensureTraverseTables();
  const rows = await prisma.$queryRawUnsafe<(Row & { size: number; createdAt: Date; updatedAt: Date })[]>(
    `SELECT j."id", j."ownerId", j."kind", j."name", j."data", j."summary", j."clientUpdated", j."size", j."createdAt", j."updatedAt",
       u."email" AS "ownerEmail", u."name" AS "ownerName"
     FROM "traverse_jobs" j LEFT JOIN "users" u ON u."id" = j."ownerId"
     WHERE j."ownerId" = $1 ORDER BY j."updatedAt" DESC`,
    userId
  );
  const shares = rows.length
    ? await prisma.$queryRawUnsafe<{ jobId: string; email: string }[]>(
        `SELECT "jobId", "email" FROM "traverse_job_shares" WHERE "jobId" = ANY($1::text[]) ORDER BY "createdAt"`,
        rows.map((r) => r.id)
      )
    : [];
  const sharedWith = new Map<string, string[]>();
  for (const s of shares) sharedWith.set(s.jobId, [...(sharedWith.get(s.jobId) ?? []), s.email]);
  return rows.map((r) => ({
    ...out(r),
    size: Number(r.size),
    created_at: new Date(r.createdAt).toISOString(),
    saved_at: new Date(r.updatedAt).toISOString(),
    shared_with: sharedWith.get(r.id) ?? [],
  }));
}

/** Delete any job (admin). */
export async function adminRemove(jobId: string) {
  await ensureTraverseTables();
  const r = await prisma.$queryRawUnsafe<{ ownerId: string; name: string; kind: string }[]>(
    `DELETE FROM "traverse_jobs" WHERE "id" = $1 RETURNING "ownerId", "name", "kind"`, jobId
  );
  return r[0] ?? null;
}
