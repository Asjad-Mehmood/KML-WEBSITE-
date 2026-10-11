import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { adminGroups, adminJobsOf, adminRemove } from "@/lib/traverseJobs";

// Admin → Traverse & Level: the jobs saved in the Traverse & Level app (/traverse/app).
// GET            → one row per surveyor, with the totals
// GET ?userId=   → that surveyor's jobs, with what was saved, the result and who they are shared with
// DELETE ?id=    → delete one job
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const userId = new URL(req.url).searchParams.get("userId");
  try {
    if (userId) return NextResponse.json({ success: true, jobs: await adminJobsOf(userId) });
    return NextResponse.json({ success: true, ...(await adminGroups()) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "The Traverse & Level jobs could not be read";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return NextResponse.json({ error: "Unknown job." }, { status: 400 });
  const gone = await adminRemove(id);
  if (!gone) return NextResponse.json({ error: "Unknown job." }, { status: 404 });
  return NextResponse.json({ success: true });
}
