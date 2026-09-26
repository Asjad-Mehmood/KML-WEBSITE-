import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { listJobs, jobBytes } from "@/lib/userJobs";
import { MAX_JOB_BYTES, MAX_USER_JOBS } from "@/lib/uploadLimits";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

// GET: the jobs this account keeps, without their contents.
export async function GET(req: NextRequest) {
  try {
    const s = await sessionForToken(tokenFromRequest(req));
    if (!s?.user) return json({ error: "Sign in to see your jobs." }, 401);
    const [jobs, bytes] = await Promise.all([listJobs(s.user.id), jobBytes(s.user.id)]);
    return json({ success: true, jobs, bytes, limits: { jobBytes: MAX_JOB_BYTES, jobs: MAX_USER_JOBS } });
  } catch (e) {
    console.error("[jobs] list", e);
    return json({ error: "Jobs could not be read." }, 500);
  }
}
