import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { listOwn, listShared } from "@/lib/traverseJobs";

// GET ?scope=own|shared: the Traverse & Level jobs this account keeps, or that others shared with it.
export async function GET(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Log in to see your jobs." }, { status: 401 });
  try {
    const scope = req.nextUrl.searchParams.get("scope") === "shared" ? "shared" : "own";
    const jobs = scope === "shared" ? await listShared(s.user.id, s.user.email) : await listOwn(s.user.id);
    return NextResponse.json({ success: true, jobs }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[traverse jobs] list", e);
    return NextResponse.json({ error: "Jobs could not be read. Try again in a moment." }, { status: 500 });
  }
}
