import { NextRequest, NextResponse } from "next/server";
import { trackAppUse } from "@/lib/appUsage";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { traverseControls } from "@/lib/traverseControls";

// GET: what the admin allows in the Traverse & Level app, for the signed-in account
// (open or closed and why, sharing, keeping file copies, the job limit).
export async function GET(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req)).catch(() => null);
  // which device and version of the app is calling (Admin → user profile)
  trackAppUse(req, s?.user?.id);
  try {
    const c = await traverseControls(s?.user?.id ?? null);
    return NextResponse.json({ success: true, ...c }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // settings unreadable: the app stays usable
    return NextResponse.json({ success: true, enabled: true, message: "", sharing: true, keepFiles: true, maxJobs: 500, blocked: false });
  }
}
