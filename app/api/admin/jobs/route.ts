import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { getJob, jobFileResponse, listJobs } from "@/lib/userJobs";

// GET ?userId=  → that surveyor's kept jobs (no contents)
// GET ?userId=&jobId=  → one job as a .bm2job file, to open in the app
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "";
  const jobId = searchParams.get("jobId") || "";
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  try {
    if (jobId) {
      const job = await getJob(userId, jobId);
      if (!job) return NextResponse.json({ error: "Unknown job." }, { status: 404 });
      return jobFileResponse(job);
    }
    return NextResponse.json({ success: true, jobs: await listJobs(userId) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "The jobs could not be read";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
