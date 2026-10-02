import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/loginThrottle";
import { TooManyCodes, maskEmail, resendChallenge } from "@/lib/adminOtp";

// "Resend code" on the admin code step: a new code for the same sign-in
export async function POST(req: NextRequest) {
  try {
    const { challenge } = await req.json().catch(() => ({}));
    if (typeof challenge !== "string" || challenge.length > 100) {
      return NextResponse.json({ error: "Start again from the sign-in page." }, { status: 400 });
    }
    const sent = await resendChallenge(
      challenge,
      async (id) => (await db.findUserById(id))?.email ?? null,
      clientIp(req),
      req.headers.get("user-agent")
    );
    if (!sent) return NextResponse.json({ error: "That sign-in has expired. Start again.", restart: true }, { status: 410 });
    return NextResponse.json({ challenge: sent.challenge, sentTo: maskEmail(sent.email) });
  } catch (err) {
    if (err instanceof TooManyCodes) {
      return NextResponse.json({ error: "Too many codes requested. Please wait 15 minutes." }, { status: 429 });
    }
    console.error("Couldn't resend the admin code:", err);
    return NextResponse.json({ error: "We couldn't email a new code. Please try again in a few minutes." }, { status: 503 });
  }
}
