import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { countJobs, deleteJob, getJob, jobFileResponse, putJob } from "@/lib/userJobs";
import { surveySummary } from "@/lib/activityKinds";
import { MAX_JOB_BYTES, MAX_USER_JOBS, MAX_USER_STORAGE_BYTES, formatBytes } from "@/lib/uploadLimits";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

type Ctx = { params: Promise<{ id: string }> };

async function who(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  return s?.user || null;
}

const jobIdOk = (id: string) => /^[A-Za-z0-9_-]{1,80}$/.test(id);
const int = (v: unknown) => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 2_000_000_000) : 0;
};
/** A time in milliseconds, as the app's Date.now(). */
const millis = (v: unknown) => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 && n < 8.64e15 ? Math.round(n) : 0;
};

// GET: one job with its contents, to open it on this computer.
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await who(req);
    if (!user) return json({ error: "Sign in to open your jobs." }, 401);
    const { id } = await ctx.params;
    if (!jobIdOk(id)) return json({ error: "Unknown job." }, 404);
    const job = await getJob(user.id, id);
    if (!job) return json({ error: "Unknown job." }, 404);
    // ?download=1: the job as a .bm2job file, the same as Export in the app
    if (new URL(req.url).searchParams.get("download")) return jobFileResponse(job);
    return json({ success: true, job });
  } catch (e) {
    console.error("[jobs] get", e);
    return json({ error: "The job could not be read." }, 500);
  }
}

// PUT: keep this job in the account, or bring the kept copy up to date.
// Body: { name, updated, points, photos, photosLeft, grid, state }  (state is the job's JSON text)
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const user = await who(req);
    if (!user) return json({ error: "Sign in to keep jobs in your account." }, 401);
    const { id } = await ctx.params;
    if (!jobIdOk(id)) return json({ error: "That job name cannot be kept." }, 400);

    const declared = parseInt(req.headers.get("content-length") || "0", 10);
    if (declared > MAX_JOB_BYTES + 64 * 1024) {
      return json({ error: `A job over ${formatBytes(MAX_JOB_BYTES)} stays on this computer.` }, 413);
    }
    const body = await req.json().catch(() => null);
    if (!body || typeof body.state !== "string" || !body.state) return json({ error: "state is required" }, 400);
    const size = Buffer.byteLength(body.state, "utf8");
    if (size > MAX_JOB_BYTES) return json({ error: `A job over ${formatBytes(MAX_JOB_BYTES)} stays on this computer.` }, 413);
    let parsed: unknown;
    try { parsed = JSON.parse(body.state); } catch { return json({ error: "state is not a job." }, 400); }

    const existing = await getJob(user.id, id);
    if (!existing && (await countJobs(user.id)) >= MAX_USER_JOBS) {
      return json({ error: `Your account already keeps ${MAX_USER_JOBS} jobs. Delete some to keep more.` }, 413);
    }
    const used = (await db.getUserStorageBytes(user.id)) - (existing ? existing.size : 0);
    if (used + size > MAX_USER_STORAGE_BYTES) {
      return json({ error: `Your account is full (${formatBytes(MAX_USER_STORAGE_BYTES)}). Delete files or jobs to keep more.` }, 413);
    }

    const r = await putJob(user.id, id, {
      name: String(body.name || "Job").slice(0, 120),
      points: int(body.points), photos: int(body.photos), photosLeft: int(body.photosLeft),
      grid: String(body.grid || "").slice(0, 200),
      survey: surveySummary(parsed),
      state: body.state,
      updated: millis(body.updated) || Date.now(),
    });
    return json({ success: true, job: r.job, stale: r.stale });
  } catch (e) {
    console.error("[jobs] put", e);
    return json({ error: "The job could not be kept." }, 500);
  }
}

// DELETE: remove the job from the account.
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const user = await who(req);
    if (!user) return json({ error: "Sign in to delete your jobs." }, 401);
    const { id } = await ctx.params;
    if (!jobIdOk(id)) return json({ error: "Unknown job." }, 404);
    const gone = await deleteJob(user.id, id);
    return json({ success: true, deleted: gone });
  } catch (e) {
    console.error("[jobs] delete", e);
    return json({ error: "The job could not be deleted." }, 500);
  }
}
