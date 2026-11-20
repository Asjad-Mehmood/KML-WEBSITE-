import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TooManyVerifyCodes, challengeOwner, emailStatus, sendVerification } from "@/lib/emailVerify";
import { isAdminChallenge } from "@/lib/adminOtp";
import { resendAdminCode } from "@/lib/adminCodeStep";

// "Send a new code" on the confirm-your-email step (in the apps, also on an admin's sign-in code)
export async function POST(req: NextRequest) {
  try {
    const { challenge } = await req.json().catch(() => ({}));
    if (typeof challenge !== "string" || challenge.length > 100) {
      return NextResponse.json({ error: "Start again: sign in with your email and password.", restart: true }, { status: 400 });
    }
    if (await isAdminChallenge(challenge)) {
      const sent = await resendAdminCode(req, challenge);
      return sent ?? NextResponse.json({ error: "That sign-in has expired. Sign in again to get a new code.", restart: true }, { status: 410 });
    }
    const userId = await challengeOwner(challenge);
    const user = userId ? await db.findUserById(userId) : null;
    if (!user) return NextResponse.json({ error: "That has expired. Sign in again to get a new code.", restart: true }, { status: 410 });
    if ((await emailStatus(user.id))?.verifiedAt) {
      return NextResponse.json({ error: "Your email is already confirmed. Sign in with your email and password.", restart: true }, { status: 409 });
    }
    const sent = await sendVerification(user);
    return NextResponse.json({ challenge: sent.challenge, sentTo: sent.sentTo });
  } catch (err) {
    if (err instanceof TooManyVerifyCodes) {
      return NextResponse.json({ error: "Too many codes asked for. Please wait 15 minutes, and look in Spam meanwhile." }, { status: 429 });
    }
    console.error("Couldn't send a new confirmation code:", err);
    return NextResponse.json({ error: "We couldn't send the email. Please try again in a few minutes." }, { status: 503 });
  }
}
