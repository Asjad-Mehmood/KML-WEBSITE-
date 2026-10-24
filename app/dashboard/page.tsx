import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sessionForToken } from "@/lib/serverSession";
import { listJobs } from "@/lib/userJobs";
import { cardsOwn, cardsShared } from "@/lib/traverseJobs";
import DashboardClient, { type DashboardData } from "./DashboardClient";
import { programVersionsFor } from "@/lib/appUsage";
import { emailStatus, verificationActive } from "@/lib/emailVerify";

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
  const [activities, files, downloads, points, jobs, tlOwn, tlShared] = await Promise.all([
    db.getOwnActivities(user.id),
    db.getOwnFileList(user.id),
    db.getUserDownloads(user.id),
    db.getUserConversions(user.id, { limit: 5000 }),
    listJobs(user.id).catch(() => []),
    cardsOwn(user.id).catch(() => []),
    cardsShared(user.id, user.email).catch(() => []),
  ]);

  const isAdmin = db.isAdmin(user);
  // which version of each program they have, for the Account tab
  const programs = await programVersionsFor(user.id, downloads).catch(() => []);
  // an account whose email isn't confirmed is asked to confirm it (not admins: they have their own code)
  const emailConfirmed =
    isAdmin || !(await verificationActive().catch(() => false)) || Boolean((await emailStatus(user.id).catch(() => null))?.verifiedAt);

  // Totals over everything recorded for this account
  const formats: Record<string, number> = {};
  const systems: Record<string, number> = {};
  let conversions = 0;
  let exports = 0;
  let pointsConverted = 0;
  let traverses = 0;
  let levelRuns = 0;
  for (const a of activities) {
    // Points are counted once, at conversion; imports and exports of the same
    // job carry the same count and would add it again
    if (a.action === "conversion") {
      conversions++;
      if (a.pointsCount) pointsConverted += a.pointsCount;
    }
    if (a.action === "export" || a.action === "tl_export") {
      exports++;
      if (a.exportFormat) formats[a.exportFormat.toUpperCase()] = (formats[a.exportFormat.toUpperCase()] || 0) + 1;
    }
    if (a.action === "traverse") traverses++;
    if (a.action === "levelling") levelRuns++;
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
    stats: { conversions, exports, pointsConverted, traverses, levelRuns, formats, systems },
    activities: activities.slice(0, 300).map((a) => ({
      id: a.id,
      action: a.action,
      title: a.title,
      // what changed, for "Account updated" (not which admin changed it)
      // what changed, the result of a traverse, an offline note… (never which admin changed it)
      details: a.details ? a.details.replace(/\nChanged by: .*$/, "") : null,
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
      platform: f.platform === "windows_app" || f.platform === "traverse_app" ? f.platform : "web_app",
      hasContent: f.hasContent,
      timestamp: f.timestamp.toISOString(),
    })),
    jobs,
    traverse: { own: tlOwn, shared: tlShared },
    programs,
    emailConfirmed,
    points: {
      total: points.total,
      rows: points.conversions.map((c) => ({
        id: c.id,
        fileId: c.fileId ?? null,
        fileName: c.fileName ?? null,
        station: c.station,
        code: c.featureCode,
        easting: c.easting,
        northing: c.northing,
        elevation: c.elevation,
        lat: c.lat,
        lon: c.lon,
        grid: c.coordSystem,
        timestamp: c.timestamp,
      })),
    },
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
