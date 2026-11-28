import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/auth/serverSession";
import { inviteSummary } from "@/lib/account/referrals";
import { SITE_URL } from "@/lib/content/site";

// GET: this account's invite link, and how many colleagues joined from it
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to invite colleagues." }, { status: 401 });
  try {
    const sum = await inviteSummary(s.user.id);
    return NextResponse.json({ ...sum, link: `${SITE_URL}/r/${sum.code}` }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[invites]", e);
    return NextResponse.json({ error: "Your invite link couldn't be loaded." }, { status: 500 });
  }
}
