import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signedInResponse } from "@/lib/loginResponse";
import { checkVerifyCode, confirmByLink } from "@/lib/emailVerify";

// The 6-digit code from the confirmation email, typed in after signing up or signing in:
// confirms the address and signs the account in
export async function POST(req: NextRequest) {
  try {
    const { challenge, code } = await req.json().catch(() => ({}));
    if (typeof challenge !== "string" || typeof code !== "string" || challenge.length > 100) {
      return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    }
    const result = await checkVerifyCode(challenge, code.replace(/\s+/g, ""));
    if (!result.ok) {
      const message =
        result.reason === "invalid"
          ? "That code isn't right. Check the newest email from us and try again."
          : result.reason === "locked"
            ? "Too many wrong codes. Press “Send a new code”."
            : "That code has expired. Press “Send a new code”.";
      return NextResponse.json({ error: message, expired: result.reason !== "invalid" }, { status: result.reason === "invalid" ? 401 : 410 });
    }
    const user = await db.findUserById(result.userId);
    if (!user) return NextResponse.json({ error: "That account no longer exists." }, { status: 404 });
    return await signedInResponse(user);
  } catch (err) {
    console.error("Email confirmation failed:", err);
    return NextResponse.json({ error: "Confirming is temporarily unavailable. Please try again in a few minutes." }, { status: 500 });
  }
}

// The button in the email (for the installed apps): confirms the address, then a page says
// to sign in. It doesn't sign this browser in, because mail scanners open links too.
export async function GET(req: NextRequest) {
  let status = "expired";
  try {
    if (await confirmByLink(req.nextUrl.searchParams.get("t") || "")) status = "ok";
  } catch (err) {
    console.error("Email confirmation link failed:", err);
    status = "error";
  }
  const res = NextResponse.redirect(new URL(`/verify-email?status=${status}`, req.url), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
