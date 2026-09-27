import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { listJobs } from "@/lib/userJobs";

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
    const user = (await db.findUserById(id)) || (await db.findUserByEmail(id));
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sanitized = db.sanitizeUser(user);
    const stats = await db.getUserStats(user.id);
    const activities = await db.getUserActivities(user.id, 150);

    // Filter downloads for this specific user
    const allDownloads = await db.getAllDownloads();
    const downloads = allDownloads.filter(
      (d) =>
        (d.userId && d.userId === user.id) ||
        (d.userEmail && d.userEmail.toLowerCase() === user.email.toLowerCase())
    );

    // Stored files imported or exported by this user
    const userFiles = await db.getUserFiles(user.id, 150);
    const files = userFiles.map((f) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { contentBase64, storedFilePath, ...rest } = f;
      return {
        ...rest,
        downloadUrl: `/api/user/files/${f.id}`,
      };
    });

    // Converted points of the files this user saved
    const points = await db.getUserConversions(user.id, { limit: 2000 });

    // Jobs kept from the app (names and sizes; the contents download separately)
    const jobs = await listJobs(user.id).catch(() => []);

    return NextResponse.json({
      success: true,
      user: sanitized,
      stats,
      activities,
      downloads,
      files,
      points,
      jobs,
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
    const updated = await db.updateUser(id, body);

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
    await db.deleteUser(id);
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
