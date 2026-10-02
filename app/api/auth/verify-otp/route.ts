import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/loginThrottle";
import { signedInResponse } from "@/lib/loginResponse";
import { TRUST_COOKIE, TRUST_DAYS, checkCode, trustBrowser } from "@/lib/adminOtp";

// Second step of an admin sign-in from a browser we don't know: the code from the email
export async function POST(req: NextRequest) {
  try {
    const { challenge, code, trust } = await req.json().catch(() => ({}));
    if (typeof challenge !== "string" || typeof code !== "string" || challenge.length > 100) {
      return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    }

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
            ? "Too many wrong codes. Start again from the sign-in page."
            : "That code has expired. Start again to get a new one.";
      return NextResponse.json({ error: message, restart: result.reason !== "invalid" }, { status: result.reason === "invalid" ? 401 : 410 });
    }

    const user = await db.findUserById(result.userId);
    if (!user || !db.isAdmin(user)) return NextResponse.json({ error: "Sign-in failed." }, { status: 401 });

    const response = await signedInResponse(user);
    if (trust === true) {
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
  } catch (err) {
    console.error("Admin code check failed:", err);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again in a few minutes." }, { status: 500 });
  }
}
