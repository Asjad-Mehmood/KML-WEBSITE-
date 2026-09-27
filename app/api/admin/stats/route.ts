import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
    }

    const users = await db.getAllUsers();
    const downloads = await db.getAllDownloads();
    const conversions = await db.getAllConversions(5);
    const activities = await db.getAllActivities(200);
    const activityCount = await db.countActivities();
    const settings = await db.getSettings();
    const fileTotals = await db.getFileTotals();

    // Breakdown by role
    const roleCounts: Record<string, number> = {};
    users.forEach((u) => {
      const r = u.role || "Surveyor";
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    });

    // Breakdown by asset type
    const assetCounts: Record<string, number> = {};
    downloads.forEach((d) => {
      assetCounts[d.assetType] = (assetCounts[d.assetType] || 0) + 1;
    });

    // Breakdown by location
    const locationCounts: Record<string, number> = {};
    downloads.forEach((d) => {
      const loc = d.location || "Unknown Origin";
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    // Calculate total points processed across activities
    let totalPointsProcessed = 0;
    activities.forEach((a) => {
      if (typeof a.pointsCount === "number") {
        totalPointsProcessed += a.pointsCount;
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: users.length,
        totalDownloads: downloads.length,
        totalConversions: conversions.total,
        totalActivities: activityCount,
        totalFilesStored: fileTotals.files,
        totalFilesWithCopy: fileTotals.stored,
        totalStorageBytes: fileTotals.bytes,
        totalPointsKept: conversions.total,
        totalPointsProcessed,
        roleCounts,
        assetCounts,
        locationCounts,
        settings,
        recentUsers: users.slice(0, 5),
        recentDownloads: downloads.slice(0, 5),
        recentConversions: conversions.conversions,
        recentActivities: activities.slice(0, 6),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load admin stats";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
