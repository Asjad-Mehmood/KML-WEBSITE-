import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sessionForToken } from "@/lib/serverSession";
import DashboardClient, { type DashboardData } from "./DashboardClient";

// Checked on every request: each visitor only ever sees their own account
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const token = (await cookies()).get("surveyor_auth_token")?.value;
  const session = await sessionForToken(token);
  if (!session) redirect("/login?next=%2Fdashboard");

  const { user } = session;
  const [activities, files, downloads, settings] = await Promise.all([
    db.getOwnActivities(user.id),
    db.getOwnFileList(user.id),
    db.getUserDownloads(user.id),
    db.getSettings(),
  ]);

  const isAdmin = db.isAdmin(user);
  const fullAccess = isAdmin || Boolean(user.hasFullAccess) || !settings.webAppRestricted;

  // Totals over everything recorded for this account
  const formats: Record<string, number> = {};
  const systems: Record<string, number> = {};
  let conversions = 0;
  let exports = 0;
  let pointsConverted = 0;
  for (const a of activities) {
    // Points are counted once, at conversion; imports and exports of the same
    // job carry the same count and would add it again
    if (a.action === "conversion") {
      conversions++;
      if (a.pointsCount) pointsConverted += a.pointsCount;
    }
    if (a.action === "export") {
      exports++;
      if (a.exportFormat) formats[a.exportFormat.toUpperCase()] = (formats[a.exportFormat.toUpperCase()] || 0) + 1;
    }
    if (a.action === "conversion" && a.crs?.trim()) systems[a.crs.trim()] = (systems[a.crs.trim()] || 0) + 1;
  }
  // No conversions recorded (older accounts): fall back to the saved files
  if (!Object.keys(systems).length) {
    for (const f of files) {
      if (f.crs?.trim()) systems[f.crs.trim()] = (systems[f.crs.trim()] || 0) + 1;
    }
  }

  const data: DashboardData = {
    user: {
      name: user.name,
      email: user.email,
      organization: user.organization || null,
      role: user.role || null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || null,
      downloadCount: user.downloadCount || 0,
      isAdmin,
    },
    plan: {
      fullAccess,
      maxPoints: fullAccess ? null : user.customMaxPoints || settings.webMaxPoints || 50,
    },
    stats: { conversions, exports, pointsConverted, formats, systems },
    activities: activities.slice(0, 300).map((a) => ({
      id: a.id,
      action: a.action,
      title: a.title,
      fileName: a.fileName,
      pointsCount: a.pointsCount,
      crs: a.crs,
      exportFormat: a.exportFormat,
      status: a.status || "success",
      timestamp: a.timestamp.toISOString(),
    })),
    files: files.map((f) => ({
      id: f.id,
      direction: f.direction === "export" ? "export" : "import",
      fileName: f.fileName,
      size: f.fileSizeFormatted,
      pointsCount: f.pointsCount,
      crs: f.crs,
      platform: f.platform === "windows_app" ? "windows_app" : "web_app",
      hasContent: f.hasContent,
      timestamp: f.timestamp.toISOString(),
    })),
    downloads: downloads.map((d) => ({
      id: d.id,
      assetType: d.assetType,
      fileName: d.fileName,
      version: d.version,
      timestamp: d.timestamp,
    })),
  };

  return <DashboardClient data={data} />;
}
