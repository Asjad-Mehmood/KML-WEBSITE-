import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const user = db.findUserById(id) || db.findUserByEmail(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sanitized = db.sanitizeUser(user);
    const stats = db.getUserStats(user.id);
    const activities = db.getUserActivities(user.id, 150);

    // Filter downloads for this specific user
    const allDownloads = db.getAllDownloads();
    const downloads = allDownloads.filter(
      (d) =>
        (d.userId && d.userId === user.id) ||
        (d.userEmail && d.userEmail.toLowerCase() === user.email.toLowerCase())
    );

    // Stored files imported or exported by this user
    const files = db.getUserFiles(user.id, 150).map((f) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { contentBase64, storedFilePath, ...rest } = f;
      return {
        ...rest,
        downloadUrl: `/api/user/files/${f.id}`,
      };
    });

    return NextResponse.json({
      success: true,
      user: sanitized,
      stats,
      activities,
      downloads,
      files,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve user details";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = db.updateUser(id, body);

    return NextResponse.json({
      success: true,
      user: db.sanitizeUser(updated),
      message: "User updated successfully",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    db.deleteUser(id);
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
