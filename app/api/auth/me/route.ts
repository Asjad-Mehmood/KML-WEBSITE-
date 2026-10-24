import { NextRequest, NextResponse } from "next/server";
import { trackAppUse } from "@/lib/appUsage";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Check cookie or Authorization header
    const token =
      req.cookies.get("surveyor_auth_token")?.value ||
      req.cookies.get("surveyor_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const sessionData = await db.validateSession(token);
    if (!sessionData) {
      return NextResponse.json({ user: null });
    }
    // the apps check the sign-in when they open: note which app, device and version (Admin → user profile)
    trackAppUse(req, sessionData.user.id);

    return NextResponse.json({
      user: db.sanitizeUser(sessionData.user),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
