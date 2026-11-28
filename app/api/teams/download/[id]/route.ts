import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { TeamError, downloadShare } from "@/lib/teams";

// GET: a job shared with one of my teams, as a file (Excel to KML: .bm2job; the others: .json)
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await ctx.params;
  try {
    return await downloadShare(s.user.id, id);
  } catch (e) {
    if (e instanceof TeamError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[teams] download", e);
    return NextResponse.json({ error: "The job couldn't be read." }, { status: 500 });
  }
}
