import { prisma } from "@/lib/prisma";

/**
 * Jobs kept in the account.
 *
 * The table matches the UserJob model in prisma/schema.prisma. It is created here on
 * first use, with the same statements `prisma db push` would run, so the jobs API works
 * on a database that has not been pushed since the model was added.
 */
let ready: Promise<void> | null = null;

export function ensureJobsTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "user_jobs" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "jobId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "points" INTEGER NOT NULL DEFAULT 0,
        "photos" INTEGER NOT NULL DEFAULT 0,
        "photosLeft" INTEGER NOT NULL DEFAULT 0,
        "grid" TEXT NOT NULL DEFAULT '',
        "size" INTEGER NOT NULL DEFAULT 0,
        "state" TEXT NOT NULL,
        "clientUpdated" BIGINT NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "user_jobs_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "user_jobs_userId_idx" ON "user_jobs"("userId")`);
      // added with Traverse adjust: tables made before it gain the column here
      await prisma.$executeRawUnsafe(`ALTER TABLE "user_jobs" ADD COLUMN IF NOT EXISTS "survey" TEXT NOT NULL DEFAULT ''`);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "user_jobs_userId_jobId_key" ON "user_jobs"("userId", "jobId")`
      );
      await prisma.$executeRawUnsafe(`DO $$ BEGIN
        ALTER TABLE "user_jobs" ADD CONSTRAINT "user_jobs_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export interface JobSummary {
  jobId: string;
  name: string;
  points: number;
  photos: number;
  photosLeft: number;
  grid: string;
  size: number;
  /** Traverses and level runs in the job, e.g. "2 traverses · 1 level run"; empty when none */
  survey: string;
  updated: number;
  keptAt: string;
}

const summary = {
  jobId: true, name: true, points: true, photos: true, photosLeft: true, grid: true, size: true, survey: true,
  clientUpdated: true, updatedAt: true,
} as const;

type SummaryRow = {
  jobId: string; name: string; points: number; photos: number; photosLeft: number; grid: string; size: number;
  survey: string; clientUpdated: bigint; updatedAt: Date;
};

function toSummary(r: SummaryRow): JobSummary {
  return {
    jobId: r.jobId, name: r.name, points: r.points, photos: r.photos, photosLeft: r.photosLeft, grid: r.grid,
    size: r.size, survey: r.survey || "", updated: Number(r.clientUpdated), keptAt: r.updatedAt.toISOString(),
  };
}

export async function listJobs(userId: string): Promise<JobSummary[]> {
  await ensureJobsTable();
  const rows = await prisma.userJob.findMany({ where: { userId }, select: summary, orderBy: { clientUpdated: "desc" } });
  return rows.map(toSummary);
}

export async function getJob(userId: string, jobId: string) {
  await ensureJobsTable();
  const r = await prisma.userJob.findUnique({ where: { userId_jobId: { userId, jobId } } });
  return r ? { ...toSummary(r), state: r.state } : null;
}

export async function countJobs(userId: string): Promise<number> {
  await ensureJobsTable();
  return prisma.userJob.count({ where: { userId } });
}

export async function jobBytes(userId: string, exceptJobId?: string): Promise<number> {
  await ensureJobsTable();
  const r = await prisma.userJob.aggregate({
    where: { userId, ...(exceptJobId ? { NOT: { jobId: exceptJobId } } : {}) },
    _sum: { size: true },
  });
  return r._sum.size ?? 0;
}

export async function putJob(
  userId: string,
  jobId: string,
  j: { name: string; points: number; photos: number; photosLeft: number; grid: string; survey: string; state: string; updated: number }
): Promise<{ job: JobSummary; stale: boolean }> {
  await ensureJobsTable();
  const now = await prisma.userJob.findUnique({ where: { userId_jobId: { userId, jobId } }, select: summary });
  // An older copy never replaces a newer one: two computers can both be working.
  if (now && Number(now.clientUpdated) > j.updated) return { job: toSummary(now), stale: true };
  const data = {
    name: j.name, points: j.points, photos: j.photos, photosLeft: j.photosLeft, grid: j.grid, survey: j.survey.slice(0, 120),
    state: j.state, size: Buffer.byteLength(j.state, "utf8"), clientUpdated: BigInt(Math.round(j.updated)),
  };
  const r = await prisma.userJob.upsert({
    where: { userId_jobId: { userId, jobId } },
    create: { userId, jobId, ...data },
    update: data,
    select: summary,
  });
  return { job: toSummary(r), stale: false };
}

export async function deleteJob(userId: string, jobId: string): Promise<boolean> {
  await ensureJobsTable();
  const r = await prisma.userJob.deleteMany({ where: { userId, jobId } });
  return r.count > 0;
}

/** A kept job as a .bm2job file, the same as Export in the app. */
export function jobFileResponse(job: JobSummary & { state: string }): Response {
  const head = JSON.stringify({ kind: "Excel to KML Pro job", v: 1, name: job.name, updated: job.updated, points: job.points, grid: job.grid });
  const name = (job.name.replace(/[\\/:*?"<>|\r\n]/g, "-") || "job") + ".bm2job";
  return new Response(head.slice(0, -1) + ',"state":' + job.state + "}", {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
