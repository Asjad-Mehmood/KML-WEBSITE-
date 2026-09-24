import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("surveyor_auth_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    let user = null;
    if (token) {
      const sessionData = db.validateSession(token);
      if (sessionData) {
        user = db.sanitizeUser(sessionData.user);
      }
    }

    const settings = db.getSettings();

    const isAdmin = db.isAdmin(user);
    const hasFullAccess =
      !settings.webAppRestricted ||
      isAdmin ||
      Boolean(user?.hasFullAccess);

    const isRestricted = !hasFullAccess;
    const maxPoints = hasFullAccess
      ? 999999
      : user?.customMaxPoints || settings.webMaxPoints || 50;

    return NextResponse.json({
      success: true,
      isRestricted,
      hasFullAccess,
      isAdmin,
      maxPoints,
      watermark: isRestricted && (settings.webWatermarkKml ?? true),
      disableReports: isRestricted && (settings.webDisableReports ?? true),
      user,
      settings: {
        webAppRestricted: settings.webAppRestricted ?? true,
        webMaxPoints: settings.webMaxPoints || 50,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load app config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
