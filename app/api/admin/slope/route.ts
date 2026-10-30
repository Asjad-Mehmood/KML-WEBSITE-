import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { adminJobsOf, adminRemove, adminSummary } from "@/lib/slopeJobs";

// Admin → Slope Calculator
// GET            → one row per surveyor: how many calculations they keep and when last saved
// GET ?userId=   → that surveyor's calculations, with what was saved
// DELETE ?id=    → delete one calculation
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const userId = req.nextUrl.searchParams.get("userId");
  try {
    if (userId) {
      return NextResponse.json({ success: true, jobs: await adminJobsOf(userId.slice(0, 100)) }, { headers: { "Cache-Control": "no-store" } });
    }
    const users = await adminSummary();
    return NextResponse.json(
      { success: true, users, total: users.reduce((n, u) => n + u.jobs, 0) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[admin slope]", e);
    return NextResponse.json({ error: "Couldn't read the Slope Calculator figures." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return NextResponse.json({ error: "Unknown calculation." }, { status: 400 });
  try {
    if (!(await adminRemove(id))) return NextResponse.json({ error: "Unknown calculation." }, { status: 404 });
    console.info("[admin slope] deleted", id, "by", admin.user.email);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin slope]", e);
    return NextResponse.json({ error: "Couldn't delete the calculation." }, { status: 500 });
  }
}
