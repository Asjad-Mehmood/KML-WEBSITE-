import { NextRequest, NextResponse } from "next/server";
import { applyPaddleSubscription } from "@/lib/billing";
import { verifyPaddleSignature, type PaddleSubscription } from "@/lib/paddle";

// POST: Paddle's webhook (Paddle → Developer tools → Notifications → New destination, this URL:
// https://www.surveyxdigital.com/api/billing/paddle, with the subscription.* events).
// Every event is checked against PADDLE_WEBHOOK_SECRET first; anything else is refused.
// Payments are recorded even while the paid plans are switched off, so nobody who paid is lost.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyPaddleSignature(raw, req.headers.get("paddle-signature"))) {
    return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  }
  let event: { event_id?: string; event_type?: string; occurred_at?: string; data?: unknown };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Not JSON." }, { status: 400 });
  }
  const type = event.event_type || "";
  if (!type.startsWith("subscription.")) return NextResponse.json({ ok: true, ignored: type });
  try {
    const done = await applyPaddleSubscription(event.data as PaddleSubscription, event.occurred_at || new Date().toISOString());
    console.log(`[paddle] ${type} ${event.event_id || ""}: ${done}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // a 500 makes Paddle send the event again later
    console.error("[paddle] webhook", type, e);
    return NextResponse.json({ error: "Not recorded." }, { status: 500 });
  }
}
