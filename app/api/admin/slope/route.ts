import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { adminSummary } from "@/lib/slopeJobs";

// GET: Slope Calculator use: who keeps calculations in their account, how many, and when last saved.
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  try {
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
