import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/auth/serverSession";
import { getSubscription } from "@/lib/billing/billing";
import { paddleReady, portalUrl } from "@/lib/billing/paddle";

// POST: a link to Paddle's billing page for this account (change card, invoices, cancel)
export async function POST(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const sub = await getSubscription(s.user.id).catch(() => null);
  if (!paddleReady() || sub?.provider !== "paddle" || !sub.customerRef) {
    return NextResponse.json({ error: "There is no online payment on this account. Write to us from the contact page about your plan." }, { status: 404 });
  }
  try {
    const url = await portalUrl(sub.customerRef, sub.providerRef || undefined);
    if (!url) throw new Error("no url");
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[billing] portal", e);
    return NextResponse.json({ error: "The billing page couldn't be opened. Try again in a moment." }, { status: 502 });
  }
}
