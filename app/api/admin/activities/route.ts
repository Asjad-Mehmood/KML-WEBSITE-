import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "150", 10);
  const actionFilter = searchParams.get("action");
  const userFilter = searchParams.get("userId");

  let activities = db.getAllActivities(limit);

  if (actionFilter && actionFilter !== "all") {
    activities = activities.filter((a) => a.action === actionFilter);
  }

  if (userFilter) {
    const uLower = userFilter.toLowerCase();
    activities = activities.filter(
      (a) =>
        (a.userId && a.userId.toLowerCase() === uLower) ||
        (a.userEmail && a.userEmail.toLowerCase() === uLower)
    );
  }

  return NextResponse.json({
    success: true,
    activities,
    total: activities.length,
  });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;

  db.clearActivities(userId);

  return NextResponse.json({
    success: true,
    message: userId ? "User activities cleared" : "All activities cleared",
  });
}
