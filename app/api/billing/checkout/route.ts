import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { billingState, getSubscription, isActivePro } from "@/lib/billing";
import { paddleConfig } from "@/lib/paddle";

// POST { interval: "monthly" | "yearly" }: start paying for Pro.
// With Paddle set up: what the page needs to open Paddle's checkout, with this account's id as
// custom data (the webhook gives Pro to that account). Without it: where to ask for Pro instead.
export async function POST(req: NextRequest) {
  const state = await billingState();
  if (!state.pricing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in first.", signIn: true }, { status: 401 });
  // already paying (months earned by invites don't stop anyone from paying)
  if (isActivePro(await getSubscription(s.user.id))) return NextResponse.json({ error: "Your account is already on Pro.", already: true }, { status: 409 });
  const body = await req.json().catch(() => ({}));
  const interval = body?.interval === "yearly" ? "yearly" : "monthly";
  if (!state.checkout) {
    return NextResponse.json({ manual: true, url: `/contact?topic=business&program=website&plan=pro-${interval}` });
  }
  const c = paddleConfig();
  return NextResponse.json({
    paddle: {
      environment: c.env,
      token: c.clientToken,
      priceId: c.prices[interval],
      email: s.user.email,
      customData: { userId: s.user.id },
      successUrl: "/dashboard?upgraded=1",
    },
  });
}
