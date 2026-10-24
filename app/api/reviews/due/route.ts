import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { reviewsDue } from "@/lib/reviews";

// GET: the programs the signed-in account downloaded and hasn't reviewed yet (for the review prompt).
export async function GET(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ due: [] });
  try {
    return NextResponse.json({ due: await reviewsDue(s.user.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ due: [] });
  }
}
