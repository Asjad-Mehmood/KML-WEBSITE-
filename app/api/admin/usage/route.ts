import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/adminAuth";
import { usageOverview } from "@/lib/admin/usageStats";

// Admin → Usage (lib/admin/usageStats.ts): monthly active people against the goal, the heaviest users,
// and how many would pass example free limits
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  try {
    return NextResponse.json(await usageOverview(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[admin usage]", e);
    return NextResponse.json({ error: "Couldn't work out the usage." }, { status: 500 });
  }
}
