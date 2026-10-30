import { prisma } from "@/lib/prisma";

/**
 * Calculations saved from the Slope Calculator (Windows program and /slope-calculation/app),
 * kept in the account. The table is created on first use, like traverse_jobs, so no migration
 * is needed.
 */
export const MAX_SLOPE_JOB_BYTES = 512 * 1024;
export const MAX_SLOPE_JOBS = 500;

let ready: Promise<void> | null = null;
export function ensureSlopeTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "slope_jobs" (
        "id" TEXT NOT NULL,
        "ownerId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "data" TEXT NOT NULL,
        "summary" TEXT NOT NULL DEFAULT '{}',
        "clientUpdated" TEXT NOT NULL DEFAULT '',
        "size" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "slope_jobs_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "slope_jobs_ownerId_idx" ON "slope_jobs"("ownerId")`);
      await prisma.$executeRawUnsafe(`DO $$ BEGIN
        ALTER TABLE "slope_jobs" ADD CONSTRAINT "slope_jobs_ownerId_fkey" FOREIGN KEY ("ownerId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

type Row = { id: string; name: string; data: string; summary: string; clientUpdated: string };

function out(r: Row) {
  const parse = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  return { id: r.id, name: r.name, data: parse(r.data), summary: parse(r.summary) || {}, updated_at: r.clientUpdated };
}

export async function listOwn(userId: string) {
  await ensureSlopeTables();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT "id","name","data","summary","clientUpdated" FROM "slope_jobs" WHERE "ownerId" = $1 ORDER BY "clientUpdated" DESC`,
    userId
  );
  return rows.map(out);
}

export async function ownerOf(jobId: string): Promise<string | null> {
  await ensureSlopeTables();
  const r = await prisma.$queryRawUnsafe<{ ownerId: string }[]>(`SELECT "ownerId" FROM "slope_jobs" WHERE "id" = $1`, jobId);
  return r[0]?.ownerId ?? null;
}

export async function countOwn(userId: string): Promise<number> {
  await ensureSlopeTables();
  const r = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) AS n FROM "slope_jobs" WHERE "ownerId" = $1`, userId);
  return Number(r[0]?.n ?? 0);
}

export async function upsert(userId: string, jobId: string, j: { name: string; data: string; summary: string; updated: string }) {
  await ensureSlopeTables();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "slope_jobs" ("id","ownerId","name","data","summary","clientUpdated","size","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)
     ON CONFLICT ("id") DO UPDATE SET "name"=$3,"data"=$4,"summary"=$5,"clientUpdated"=$6,"size"=$7,"updatedAt"=CURRENT_TIMESTAMP
     WHERE "slope_jobs"."ownerId" = $2`,
    jobId, userId, j.name, j.data, j.summary, j.updated, Buffer.byteLength(j.data)
  );
}

export async function remove(userId: string, jobId: string) {
  await ensureSlopeTables();
  await prisma.$executeRawUnsafe(`DELETE FROM "slope_jobs" WHERE "id" = $1 AND "ownerId" = $2`, jobId, userId);
}

/** Admin: one row per surveyor with how many calculations they keep, newest first. */
export async function adminSummary() {
  await ensureSlopeTables();
  const rows = await prisma.$queryRawUnsafe<{ userId: string; email: string | null; name: string | null; organization: string | null; jobs: bigint; lastSaved: Date | null }[]>(
    `SELECT j."ownerId" AS "userId", u."email", u."name", u."organization", COUNT(*) AS jobs, MAX(j."updatedAt") AS "lastSaved"
     FROM "slope_jobs" j LEFT JOIN "users" u ON u."id" = j."ownerId"
     GROUP BY j."ownerId", u."email", u."name", u."organization" ORDER BY MAX(j."updatedAt") DESC LIMIT 500`
  );
  return rows.map((r) => ({ ...r, jobs: Number(r.jobs), lastSaved: r.lastSaved ? r.lastSaved.toISOString() : null }));
}

/** Admin: one surveyor's calculations, with what was saved */
export async function adminJobsOf(userId: string) {
  await ensureSlopeTables();
  const rows = await prisma.$queryRawUnsafe<(Row & { size: number; createdAt: Date; updatedAt: Date })[]>(
    `SELECT "id","name","data","summary","clientUpdated","size","createdAt","updatedAt" FROM "slope_jobs"
     WHERE "ownerId" = $1 ORDER BY "updatedAt" DESC`,
    userId
  );
  return rows.map((r) => ({
    ...out(r),
    size: Number(r.size),
    created_at: r.createdAt.toISOString(),
    saved_at: r.updatedAt.toISOString(),
  }));
}

/** Admin: delete one calculation; false when there was none */
export async function adminRemove(jobId: string): Promise<boolean> {
  await ensureSlopeTables();
  const n = await prisma.$executeRawUnsafe(`DELETE FROM "slope_jobs" WHERE "id" = $1`, jobId);
  return n > 0;
}

/** Admin: the totals for the overview */
export async function adminTotals() {
  await ensureSlopeTables();
  const r = await prisma.$queryRawUnsafe<{ jobs: bigint; surveyors: bigint }[]>(
    `SELECT COUNT(*) AS jobs, COUNT(DISTINCT "ownerId") AS surveyors FROM "slope_jobs"`
  );
  return { jobs: Number(r[0]?.jobs ?? 0), surveyors: Number(r[0]?.surveyors ?? 0) };
}
