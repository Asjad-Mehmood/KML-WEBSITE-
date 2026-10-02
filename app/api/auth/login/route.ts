import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/loginThrottle";
import { signedInResponse } from "@/lib/loginResponse";
import { TooManyCodes, isTrustedBrowser, maskEmail, otpAvailable, startChallenge } from "@/lib/adminOtp";

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
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Admins: a browser that hasn't been through the email code before must
    // pass it now. (Without email set up the code can't be sent; see lib/adminOtp.)
    if (db.isAdmin(user) && otpAvailable() && !(await isTrustedBrowser(req, user.id))) {
      try {
        const challenge = await startChallenge(user.id, user.email, ip, req.headers.get("user-agent"));
        return NextResponse.json({ otpRequired: true, challenge, sentTo: maskEmail(user.email) });
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

    return await signedInResponse(user);
  } catch (err: unknown) {
    // Details go to the server log only: database errors can name hosts and settings
    console.error("Sign-in failed:", err);
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again in a few minutes." },
      { status: 500 }
    );
  }
}
