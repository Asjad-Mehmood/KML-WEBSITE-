import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, getIpGeoLocation } from "@/lib/geo";
import { readSettings } from "@/lib/siteSettings";

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("surveyor_auth_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const sessionData = token ? await db.validateSession(token) : null;

    // The admin setting "Require sign-in to download" decides whether a visitor may download signed out
    if (!sessionData) {
      const settings = await readSettings();
      if (settings?.requireAuthForDownload ?? true) {
        return NextResponse.json(
          {
            error: token
              ? "Session expired or invalid. Please log in again."
              : "Authentication required to download. Please sign up or log in.",
            requiresAuth: true,
          },
          { status: 401 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const {
      assetType = "windows_installer",
      fileName = "ExcelToKMLPro-Lite-Setup.exe",
      version = "v3.6.2",
    } = body;

    const clientIp = getClientIp(req);
    const geo = await getIpGeoLocation(clientIp, req);
    const userAgent = req.headers.get("user-agent") || "Browser Client";

    // Record the download in database
    const record = await db.recordDownload({
      userId: sessionData?.user.id ?? null,
      userEmail: sessionData?.user.email ?? null,
      userName: sessionData?.user.name ?? null,
      assetType,
      fileName,
      version,
      ipAddress: geo.ip,
      location: geo.location,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      recordId: record.id,
      fileName,
      downloadCount: sessionData ? sessionData.user.downloadCount + 1 : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
