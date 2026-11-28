import { NextRequest, NextResponse } from "next/server";
import { attachment } from "@/lib/attachment";
import { db } from "@/lib/db";
import { userFromRequest } from "@/lib/serverSession";
import { getAdminSession } from "@/lib/adminAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/**
 * The same owner rule for downloading and deleting: the account the file is kept under; a file
 * kept before files were tied to an account id belongs to the account with its email. Files
 * with neither are for admins only.
 */
function ownsFile(user: { id: string; email: string } | null, record: { userId?: string | null; userEmail?: string | null }): boolean {
  if (!user) return false;
  if (record.userId) return user.id === record.userId;
  return Boolean(record.userEmail && user.email.toLowerCase() === record.userEmail.toLowerCase());
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
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { record, buffer } = fileData;
    const user = await userFromRequest(req);
    const admin = await getAdminSession(req);

    // only the owner or an admin
    const isOwner = ownsFile(user, record);

    const isAdmin = Boolean(admin);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to access this file" },
        { status: 403 }
      );
    }

    const contentType = record.mimeType || "application/octet-stream";

    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": attachment(record.fileName),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error downloading file";
    return NextResponse.json({ error: msg }, { status: 500 });
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
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const user = await userFromRequest(req);
    const admin = await getAdminSession(req);
    const isOwner = ownsFile(user, fileData.record);
    const isAdmin = Boolean(admin);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to delete this file" },
        { status: 403 }
      );
    }

    await db.deleteUserFile(id);
    return NextResponse.json({ success: true, message: "File removed successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting file";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
