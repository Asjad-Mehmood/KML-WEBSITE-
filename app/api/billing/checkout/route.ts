import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { billingEnabled, checkoutReady, planOf } from "@/lib/billing";

// POST { interval: "monthly" | "yearly" }: start paying for Pro.
// No payment provider is wired in yet, so the answer is where to ask for Pro instead
// (an admin gives it from Admin → Usage → Plans). A provider's checkout link goes here.
export async function POST(req: NextRequest) {
  if (!billingEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in first.", signIn: true }, { status: 401 });
  if ((await planOf(s.user)) === "pro") return NextResponse.json({ error: "Your account is already on Pro.", already: true }, { status: 409 });
  const body = await req.json().catch(() => ({}));
  const interval = body?.interval === "yearly" ? "yearly" : "monthly";
  if (!checkoutReady()) {
    return NextResponse.json({ manual: true, url: `/contact?topic=business&program=website&plan=pro-${interval}` });
  }
  return NextResponse.json({ error: "Checkout isn't available yet." }, { status: 503 });
}
