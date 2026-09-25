import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ authenticated: false, isAdmin: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    isAdmin: true,
    user: db.sanitizeUser(admin.user),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    const isValid = db.verifyPassword(user, password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    if (!db.isAdmin(user)) {
      return NextResponse.json(
        { error: "Access denied: Account does not have Administrator privileges" },
        { status: 403 }
      );
    }

    // Create session
    const session = db.createSession(user.id);
    db.touchUserLogin(user.id);

    const response = NextResponse.json({
      success: true,
      token: session.token,
      user: db.sanitizeUser(user),
      message: "Admin authentication successful",
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    };

    // Set both cookies so that both the admin panel and public site recognize the session
    response.cookies.set("surveyor_session", session.token, cookieOptions);
    response.cookies.set("surveyor_auth_token", session.token, cookieOptions);

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token =
      req.cookies.get("surveyor_session")?.value ||
      req.cookies.get("surveyor_auth_token")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (token) {
      db.destroySession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin session cleared",
    });

    response.cookies.delete("surveyor_session");
    response.cookies.delete("surveyor_auth_token");

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Logout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
