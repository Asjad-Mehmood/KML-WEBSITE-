import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  // ?limit= (up to 1000) and ?skip= page through the log, newest first; ?action= and
  // ?userId= (an id or an email) filter it in the database, so older entries are reachable
  // and `total` is the true number of matching entries
  const { searchParams } = new URL(req.url);
  const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") || "150", 10) || 150));
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10) || 0);
  const opts = {
    action: searchParams.get("action") || undefined,
    user: searchParams.get("userId") || undefined,
  };

  const [activities, total] = await Promise.all([
    db.getAllActivities(limit, { ...opts, skip }),
    db.countActivities(opts),
  ]);

  return NextResponse.json({
    success: true,
    activities,
    total,
  });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || undefined;

  await db.clearActivities(userId);

  return NextResponse.json({
    success: true,
    message: userId ? "User activities cleared" : "All activities cleared",
  });
}
