import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const downloads = db.getAllDownloads();

  if (format === "csv") {
    // Generate CSV string
    const headers = ["ID", "Timestamp", "User Email", "User Name", "Asset Type", "File Name", "Version", "IP Address", "Location"];
    const rows = downloads.map((d) => [
      `"${d.id}"`,
      `"${d.timestamp}"`,
      `"${d.userEmail || "Anonymous"}"`,
      `"${d.userName || "Anonymous"}"`,
      `"${d.assetType}"`,
      `"${d.fileName}"`,
      `"${d.version}"`,
      `"${d.ipAddress || ""}"`,
      `"${d.location || "Unknown"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="surveyor_downloads_${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ success: true, downloads });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const deleted = db.deleteDownload(id);
    if (!deleted) {
      return NextResponse.json({ error: "Download record not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Download record deleted" });
  }

  // Clear all
  db.clearDownloads();
  return NextResponse.json({ success: true, message: "All download records cleared" });
}
