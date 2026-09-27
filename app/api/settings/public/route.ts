import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isGoogleConfigured } from "@/lib/googleAuth";

// The admin settings the public site needs (no secrets): download gate,
// maintenance, announcement and the installer fallback details
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = await db.getSettings();
    return NextResponse.json(
      {
        requireAuthForDownload: s.requireAuthForDownload ?? true,
        maintenanceMode: Boolean(s.maintenanceMode),
        announcement: s.announcementActive && s.announcementBanner?.trim() ? s.announcementBanner.trim() : "",
        appVersion: s.appVersion,
        installerFileName: s.installerFileName,
        installerFileSize: s.installerFileSize,
        googleSignIn: isGoogleConfigured(),
      },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ requireAuthForDownload: true, maintenanceMode: false, announcement: "", googleSignIn: isGoogleConfigured() });
  }
}
