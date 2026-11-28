import { NextRequest, NextResponse } from "next/server";
import { logAdmin } from "@/lib/admin/adminLog";
import { getAdminSession } from "@/lib/auth/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  // the spreadsheet comes from Admin → Downloads' own export (escaped cells, every filter)
  if (searchParams.get("format") === "csv") {
    return NextResponse.redirect(new URL("/api/admin/download-log?format=csv", req.url), 307);
  }
  // the newest downloads for the dashboard; the full list is /api/admin/download-log
  const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "50", 10) || 50));
  const downloads = await db.getAllDownloads(limit);
  return NextResponse.json({ success: true, downloads });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const deleted = await db.deleteDownload(id);
    if (!deleted) {
      return NextResponse.json({ error: "Download record not found" }, { status: 404 });
    }
    await logAdmin(admin.user, "data.delete", `Download record ${id}`, "", req);
    return NextResponse.json({ success: true, message: "Download record deleted" });
  }

  // Clear all
  await db.clearDownloads();
  await logAdmin(admin.user, "data.clear", "All download records", "", req);
  return NextResponse.json({ success: true, message: "All download records cleared" });
}
