import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/adminAuth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function getAuthUser(req: NextRequest) {
  const token =
    req.cookies.get("surveyor_auth_token")?.value ||
    req.cookies.get("surveyor_session")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const sessionData = await db.validateSession(token);
  return sessionData?.user || null;
}

// GET: Download the stored file
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileData = await db.getFileForDownload(id);

    if (!fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404, headers: CORS_HEADERS });
    }

    const { record, buffer } = fileData;
    const user = await getAuthUser(req);
    const admin = await getAdminSession(req);

    // Verify access: allowed if admin, or owner, or if file was uploaded unauthenticated
    const isOwner =
      !record.userId ||
      (user && user.id === record.userId) ||
      (user && record.userEmail && user.email.toLowerCase() === record.userEmail.toLowerCase());

    const isAdmin = Boolean(admin);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to access this file" },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const encodedFileName = encodeURIComponent(record.fileName).replace(/['()]/g, escape);
    const contentType = record.mimeType || "application/octet-stream";

    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": `attachment; filename="${record.fileName}"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error downloading file";
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS });
  }
}

// DELETE: Delete a stored file
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileData = await db.getFileForDownload(id);
    if (!fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404, headers: CORS_HEADERS });
    }

    const user = await getAuthUser(req);
    const admin = await getAdminSession(req);
    const isOwner = user && user.id === fileData.record.userId;
    const isAdmin = Boolean(admin);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to delete this file" },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    await db.deleteUserFile(id);
    return NextResponse.json({ success: true, message: "File removed successfully" }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting file";
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS });
  }
}
