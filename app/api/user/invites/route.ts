import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { billingState } from "@/lib/billing";
import { inviteSummary, processRewards, REWARD_DAYS } from "@/lib/referrals";
import { SITE_URL } from "@/lib/site";

// GET: this account's invite link and what its invites have earned (rewards that are due are
// given first, so the numbers are up to date)
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to invite friends." }, { status: 401 });
  try {
    const state = await billingState();
    await processRewards(s.user.id, state.limits);
    const sum = await inviteSummary(s.user.id);
    return NextResponse.json(
      { ...sum, link: `${SITE_URL}/r/${sum.code}`, rewardDays: REWARD_DAYS, proLive: state.limits },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[invites]", e);
    return NextResponse.json({ error: "Your invite link couldn't be loaded." }, { status: 500 });
  }
}
