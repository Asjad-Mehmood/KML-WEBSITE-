import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("surveyor_auth_token")?.value ||
      req.cookies.get("surveyor_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    let user = null;
    if (token) {
      const sessionData = await db.validateSession(token);
      if (sessionData) {
        user = db.sanitizeUser(sessionData.user);
      }
    }

    // The web app has no usage limits; signing in is the only requirement.
    // The limit fields stay in the reply, all off, for older app copies that read them.
    return NextResponse.json({
      success: true,
      isRestricted: false,
      hasFullAccess: true,
      isAdmin: db.isAdmin(user),
      maxPoints: 999999,
      watermark: false,
      disableReports: false,
      user,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load app config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
