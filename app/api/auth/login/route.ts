import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/loginThrottle";
import { signedInResponse } from "@/lib/loginResponse";
import { TooManyCodes, isTrustedBrowser, maskEmail, otpEnabled, startChallenge } from "@/lib/adminOtp";
import { adminCodeNeeded } from "@/lib/adminCodeStep";
import { TooManyVerifyCodes, confirmMessage, mustVerify, sendVerification } from "@/lib/emailVerify";

// An account made with Google has no password of its own until "Forgot password" sets one
const WRONG_PASSWORD =
  "Wrong email or password. Made your account with Google? Use “Sign in with browser”, or “Forgot password” to set a password.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const ip = clientIp(req);
    if (await tooManyFailures(String(email), ip)) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait 15 minutes and try again." },
        { status: 429 }
      );
    }

    // Same answer for an unknown email and a wrong password
    const user = await db.findUserByEmail(email);
    if (!user || !db.verifyPassword(user, password)) {
      await recordFailure(String(email), ip, req.headers.get("user-agent"));
      return NextResponse.json(
        { error: WRONG_PASSWORD },
        { status: 401 }
      );
    }

    // Admins: a browser that hasn't been through the email code before must
    // pass it now, unless two-factor sign-in is switched off in Admin → Settings → Security.
    // (Without email set up the code can't be sent; see lib/adminOtp.) The apps can't keep the
    // trusted-browser cookie, so they always get the code; they type it where an email code goes.
    if (db.isAdmin(user) && (await otpEnabled()) && !(await isTrustedBrowser(req, user.id))) {
      try {
        const challenge = await startChallenge(user.id, user.email, ip, req.headers.get("user-agent"));
        return adminCodeNeeded(challenge, user.email);
      } catch (err) {
        if (err instanceof TooManyCodes) {
          return NextResponse.json(
            { error: "Too many codes requested. Please wait 15 minutes and try again." },
            { status: 429 }
          );
        }
        console.error("Couldn't send the admin sign-in code:", err);
        return NextResponse.json(
          { error: "We couldn't email your sign-in code. Please try again in a few minutes." },
          { status: 503 }
        );
      }
    }

    // An account whose email isn't confirmed yet gets a new code (and link) instead of a session.
    // "error" carries the message for app versions that don't know the code step.
    if (await mustVerify(user)) {
      try {
        const sent = await sendVerification(user);
        return NextResponse.json(
          { success: false, verifyRequired: true, challenge: sent.challenge, sentTo: sent.sentTo, error: confirmMessage(sent.sentTo) },
          { status: 403 }
        );
      } catch (err) {
        if (err instanceof TooManyVerifyCodes) {
          return NextResponse.json(
            { error: `Confirm your email first: open the link or use the code we sent to ${maskEmail(user.email)} (look in Spam too). For a new code, wait 15 minutes.` },
            { status: 429 }
          );
        }
        console.error("Couldn't send the confirmation email:", err);
        return NextResponse.json({ error: "We couldn't send the email to confirm your address. Please try again in a few minutes." }, { status: 503 });
      }
    }

    return await signedInResponse(user, req, "password");
  } catch (err: unknown) {
    // Details go to the server log only: database errors can name hosts and settings
    console.error("Sign-in failed:", err);
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again in a few minutes." },
      { status: 500 }
    );
  }
}
