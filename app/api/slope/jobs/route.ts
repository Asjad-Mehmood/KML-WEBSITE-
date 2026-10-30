import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { listOwn } from "@/lib/slopeJobs";

// GET: the calculations this account keeps from the Slope Calculator, newest first.
// Signed in by the website's cookie (web app) or "Authorization: Bearer <token>" (Windows program).
export async function GET(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to see your saved calculations." }, { status: 401 });
  try {
    return NextResponse.json({ success: true, jobs: await listOwn(s.user.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[slope jobs] list", e);
    return NextResponse.json({ error: "Saved calculations could not be read. Try again in a moment." }, { status: 500 });
  }
}
