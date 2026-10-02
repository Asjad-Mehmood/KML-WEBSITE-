import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isGoogleConfigured } from "@/lib/googleAuth";
import { announcementLive, getExtraSettings } from "@/lib/siteSettings";

// The admin settings the public site needs (no secrets): download gate,
// maintenance, announcement and the installer fallback details
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [s, x] = await Promise.all([db.getSettings(), getExtraSettings()]);
    const announcement = s.announcementActive && s.announcementBanner?.trim() && announcementLive(x.announcementEndsAt) ? s.announcementBanner.trim() : "";
    return NextResponse.json(
      {
        requireAuthForDownload: s.requireAuthForDownload ?? true,
        maintenanceMode: Boolean(s.maintenanceMode),
        announcement,
        announcementTone: x.announcementTone,
        announcementLink: announcement ? x.announcementLink : "",
        maintenanceMessage: x.maintenanceMessage,
        signupsOpen: x.allowSignups,
        appVersion: s.appVersion,
        installerFileName: s.installerFileName,
        installerFileSize: s.installerFileSize,
        googleSignIn: isGoogleConfigured() && x.googleSignInEnabled,
      },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ requireAuthForDownload: true, maintenanceMode: false, announcement: "", signupsOpen: true, googleSignIn: isGoogleConfigured() });
  }
}
