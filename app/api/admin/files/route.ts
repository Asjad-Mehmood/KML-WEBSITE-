import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

// GET: every account's files, newest first.
// ?q= (file, surveyor or grid) &direction=import|export &platform=web_app|windows_app &userId= ("none": no account) &page= &size=
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = {
    q: (searchParams.get("q") || "").slice(0, 200),
    direction: searchParams.get("direction") || undefined,
    platform: searchParams.get("platform") || undefined,
  };

  // ?group=user: one row per person (files, size, opened/saved, last file) for the Files tab
  if (searchParams.get("group") === "user") {
    return NextResponse.json({ success: true, ...(await db.groupFilesByUser(filter)) });
  }

  const size = Math.min(200, Math.max(1, parseInt(searchParams.get("size") || "50", 10) || 50));
  const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10) || 0);
  const r = await db.searchAllFiles({
    ...filter,
    userId: searchParams.get("userId")?.slice(0, 100) || undefined,
    skip: page * size,
    take: size,
  });

  return NextResponse.json({
    success: true,
    files: r.files.map((f) => ({ ...f, downloadUrl: `/api/user/files/${f.id}` })),
    total: r.total,
    bytes: r.bytes,
    page,
    size,
  });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id");

  if (!fileId) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  }

  await db.deleteUserFile(fileId);
  return NextResponse.json({ success: true, message: "File removed from vault" });
}
