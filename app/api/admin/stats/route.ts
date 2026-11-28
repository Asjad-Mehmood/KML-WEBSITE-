import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/adminAuth";
import { db } from "@/lib/db";
import { adminGroups } from "@/lib/products/traverseJobs";
import { adminTotals as slopeTotals } from "@/lib/products/slopeJobs";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
    }

    // counted in the database: nothing loads every account or every download
    const [users, downloads, recentUsers, recentDownloads, conversions, activities, activityCount, totalPointsProcessed, settings, fileTotals] = await Promise.all([
      db.userCounts(),
      db.downloadCounts(),
      db.getAllUsers(undefined, 5),
      db.getAllDownloads(5),
      db.getAllConversions(5),
      db.getAllActivities(6),
      db.countActivities(),
      db.totalPointsProcessed(),
      db.getSettings(),
      db.getFileTotals(),
    ]);
    // Traverse & Level jobs (their own tables, created on first use)
    const traverse = await adminGroups().then((g) => g.totals).catch(() => null);
    // Slope Calculator: calculations kept in accounts
    const slope = await slopeTotals().catch(() => null);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: users.total,
        totalDownloads: downloads.total,
        totalConversions: conversions.total,
        totalActivities: activityCount,
        totalFilesStored: fileTotals.files,
        totalFilesWithCopy: fileTotals.stored,
        totalStorageBytes: fileTotals.bytes,
        totalPointsKept: conversions.total,
        traverse,
        slope,
        totalPointsProcessed,
        roleCounts: users.byRole,
        assetCounts: downloads.byAsset,
        locationCounts: downloads.byLocation,
        settings,
        recentUsers,
        recentDownloads,
        recentConversions: conversions.conversions,
        recentActivities: activities,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load admin stats";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
