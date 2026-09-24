import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const users = db.getAllUsers();
  const downloads = db.getAllDownloads();
  const conversions = db.getAllConversions();
  const settings = db.getSettings();

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

  return NextResponse.json({
    success: true,
    stats: {
      totalUsers: users.length,
      totalDownloads: downloads.length,
      totalConversions: conversions.length,
      roleCounts,
      assetCounts,
      settings,
      recentUsers: users.slice(0, 5),
      recentDownloads: downloads.slice(0, 5),
      recentConversions: conversions.slice(0, 5),
    },
  });
}
