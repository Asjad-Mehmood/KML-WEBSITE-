import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "150", 10);
  const direction = searchParams.get("direction") || undefined;
  const userParam = searchParams.get("userId");

  let files = db.getAllFiles(limit, direction);

  if (userParam) {
    const uLower = userParam.toLowerCase();
    files = files.filter(
      (f) =>
        (f.userId && f.userId.toLowerCase() === uLower) ||
        (f.userEmail && f.userEmail.toLowerCase() === uLower)
    );
  }

  const sanitized = files.map((f) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contentBase64, storedFilePath, ...rest } = f;
    return {
      ...rest,
      downloadUrl: `/api/user/files/${f.id}`,
    };
  });

  return NextResponse.json({
    success: true,
    files: sanitized,
    total: sanitized.length,
  });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id");

  if (!fileId) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  }

  db.deleteUserFile(fileId);
  return NextResponse.json({ success: true, message: "File removed from vault" });
}
