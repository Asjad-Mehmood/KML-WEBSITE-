import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { INSTALLER_NAME, LATEST_VERSION } from "@/lib/content/site";
import { getClientIp, getIpGeoLocation } from "@/lib/geo/geo";
import { prisma } from "@/lib/db/prisma";
import { isMailConfigured, sendMail } from "@/lib/mail/mailer";
import { downloadThanksEmail } from "@/lib/mail/downloadEmail";
import { DOWNLOAD_PROGRAMS, directDownloadsOf, programOfAsset } from "@/lib/products/directDownloads";
import { getExtraSettings } from "@/lib/content/siteSettings";

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

    const sessionData = await db.validateSession(token);
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
      fileName = INSTALLER_NAME,
      version = LATEST_VERSION,
    } = body;

    // a program whose download is switched off in Admin → Settings → Downloads: only through the Survey Toolkit
    const program = programOfAsset(String(assetType));
    if (program && !directDownloadsOf(await getExtraSettings())[program]) {
      const name = DOWNLOAD_PROGRAMS.find((p) => p.id === program)?.name ?? "This program";
      return NextResponse.json({ error: `${name} is installed with the Survey Toolkit.`, toolkitOnly: true }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const geo = await getIpGeoLocation(clientIp, req);
    const userAgent = req.headers.get("user-agent") || "Browser Client";

    // First time this account downloads the app? (checked before recording)
    const firstDownload =
      assetType === "windows_installer" &&
      (await prisma.download.count({ where: { userId: sessionData.user.id, assetType: "windows_installer" } }).catch(() => 1)) === 0;

    // Record the download in database
    const record = await db.recordDownload({
      userId: sessionData.user.id,
      userEmail: sessionData.user.email,
      userName: sessionData.user.name,
      assetType,
      fileName,
      version,
      ipAddress: geo.ip,
      location: geo.location,
      userAgent,
    });

    // One-time thank-you email with the getting-started links
    let emailed = false;
    if (firstDownload && isMailConfigured() && sessionData.user.email) {
      try {
        const mail = downloadThanksEmail(sessionData.user.name, String(version), String(fileName));
        await sendMail({ to: sessionData.user.email, ...mail });
        emailed = true;
      } catch (e) {
        console.warn("Download thank-you email failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      emailed,
      recordId: record.id,
      fileName,
      downloadCount: sessionData.user.downloadCount + 1,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
