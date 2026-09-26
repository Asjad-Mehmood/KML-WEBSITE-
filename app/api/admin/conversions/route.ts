import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

// GET: the newest converted points across all users (?limit= up to 5000), with the total.
// ?userId= for one user's points.
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(5000, Math.max(1, parseInt(searchParams.get("limit") || "1000", 10) || 1000));
  const userId = searchParams.get("userId");
  const r = userId ? await db.getUserConversions(userId, { limit }) : await db.getAllConversions(limit);
  return NextResponse.json({ success: true, total: r.total, conversions: r.conversions });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  await db.clearConversions();
  return NextResponse.json({ success: true, message: "Conversion log cleared" });
}
