import { NextRequest, NextResponse } from "next/server";
import { db, isAdminRole } from "@/lib/db";
import { getClientIp, getIpGeoLocation } from "@/lib/geo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, organization, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Admin accounts are never created through public sign-up
    if (email.trim().toLowerCase() === "admin@exceltokml.com") {
      return NextResponse.json({ error: "This email address is reserved." }, { status: 400 });
    }
    const safeRole = typeof role === "string" && !isAdminRole(role) ? role : undefined;

    // Check if user already exists
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Capture Client IP and Geographic Location
    const clientIp = getClientIp(req);
    const geo = await getIpGeoLocation(clientIp, req);

    // Create user with IP and Location
    const user = await db.createUser({
      name,
      email,
      password,
      organization,
      role: safeRole,
      ipAddress: geo.ip,
      location: geo.location,
    });

    // Create session
    const session = await db.createSession(user.id);
    const sanitized = db.sanitizeUser(user);

    const response = NextResponse.json({
      success: true,
      user: sanitized,
      token: session.token,
    });

    // Set HTTP-only cookie
    response.cookies.set("surveyor_auth_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    // Details go to the server log only: database errors can name hosts and settings
    console.error("Sign-up failed:", err);
    return NextResponse.json(
      { error: "Sign-up is temporarily unavailable. Please try again in a few minutes." },
      { status: 500 }
    );
  }
}
