// The admin sign-in code, checked or resent. Used by the website's own admin step
// (/api/auth/verify-otp, /api/auth/resend-otp) and by the apps, which know one code step
// only: they send every code to /api/auth/verify-email and /api/auth/resend-verify, so
// those pass an admin's code on to here.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/loginThrottle";
import { signedInResponse } from "@/lib/loginResponse";
import { TRUST_COOKIE, TRUST_DAYS, TooManyCodes, checkCode, maskEmail, resendChallenge, trustBrowser } from "@/lib/adminOtp";

/** The reply to a right password on an admin account that still needs the emailed code.
 *  The apps read verifyRequired + challenge (and show error where they can't ask for a code);
 *  the website reads otpRequired. 403, so the apps don't take it for a signed-in reply. */
export function adminCodeNeeded(challenge: string, email: string) {
  const sentTo = maskEmail(email);
  return NextResponse.json(
    {
      success: false,
      otpRequired: true,
      verifyRequired: true,
      admin: true,
      challenge,
      sentTo,
      error: `This is an admin account: enter the 6-digit sign-in code we emailed to ${sentTo} (look in Spam too).`,
    },
    { status: 403 }
  );
}

/** Check an admin's code; a right one signs in (and with trust, remembers this browser) */
export async function checkAdminCode(req: NextRequest, challenge: string, code: string, trust: boolean) {
  const ip = clientIp(req);
  if (await tooManyFailures("", ip)) {
    return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });
  }
  const result = await checkCode(challenge, code.replace(/\s+/g, ""));
  if (!result.ok) {
    // a wrong code is logged against the admin it was for (and counts toward the sign-in lockout)
    if (result.userId) {
      const owner = await db.findUserById(result.userId);
      await recordFailure(owner?.email || "unknown", ip, req.headers.get("user-agent"));
    }
    const message =
      result.reason === "invalid"
        ? "That code isn't right. Check the latest email and try again."
        : result.reason === "locked"
          ? "Too many wrong codes. Start again: sign in with your email and password."
          : "That code has expired. Start again: sign in with your email and password.";
    const over = result.reason !== "invalid";
    return NextResponse.json({ error: message, restart: over, expired: over }, { status: over ? 410 : 401 });
  }

  const user = await db.findUserById(result.userId);
  if (!user || !db.isAdmin(user)) return NextResponse.json({ error: "Sign-in failed." }, { status: 401 });

  const response = await signedInResponse(user, req, "password and email code");
  if (trust) {
    const token = await trustBrowser(user.id, req, ip);
    response.cookies.set(TRUST_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TRUST_DAYS * 86400,
      path: "/",
    });
  }
  return response;
}

/** A new admin code for an earlier challenge; null when it isn't (or is no longer) an admin sign-in */
export async function resendAdminCode(req: NextRequest, challenge: string) {
  try {
    const sent = await resendChallenge(
      challenge,
      async (id) => (await db.findUserById(id))?.email ?? null,
      clientIp(req),
      req.headers.get("user-agent")
    );
    if (!sent) return null;
    return NextResponse.json({ challenge: sent.challenge, sentTo: maskEmail(sent.email) });
  } catch (err) {
    if (err instanceof TooManyCodes) {
      return NextResponse.json({ error: "Too many codes requested. Please wait 15 minutes." }, { status: 429 });
    }
    throw err;
  }
}
