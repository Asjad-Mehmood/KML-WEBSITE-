import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/loginThrottle";

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

    // Touch login date
    await db.touchUserLogin(user.id);

    // Create session
    const session = await db.createSession(user.id);
    const sanitized = db.sanitizeUser(user);

    const response = NextResponse.json({
      success: true,
      user: sanitized,
      token: session.token,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    };

    // Set cookie
    response.cookies.set("surveyor_auth_token", session.token, cookieOptions);

    if (db.isAdmin(user)) {
      response.cookies.set("surveyor_session", session.token, cookieOptions);
    }

    return response;
  } catch (err: unknown) {
    // Details go to the server log only: database errors can name hosts and settings
    console.error("Sign-in failed:", err);
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again in a few minutes." },
      { status: 500 }
    );
  }
}
