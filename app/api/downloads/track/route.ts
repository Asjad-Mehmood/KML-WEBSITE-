import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("surveyor_auth_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        {
          error: "Authentication required to download. Please sign up or log in.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const sessionData = db.validateSession(token);
    if (!sessionData) {
      return NextResponse.json(
        {
          error: "Session expired or invalid. Please log in again.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      assetType = "windows_installer",
      fileName = "ExcelToKMLPro-Lite-Setup.exe",
      version = "v3.5.5",
    } = body;

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser Client";

    // Record the download in database
    const record = db.recordDownload({
      userId: sessionData.user.id,
      userEmail: sessionData.user.email,
      userName: sessionData.user.name,
      assetType,
      fileName,
      version,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      recordId: record.id,
      fileName,
      downloadCount: sessionData.user.downloadCount + 1,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
