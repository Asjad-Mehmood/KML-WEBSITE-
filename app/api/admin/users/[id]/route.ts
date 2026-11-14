import { NextRequest, NextResponse } from "next/server";
import { logAdmin } from "@/lib/adminLog";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { listJobs } from "@/lib/userJobs";
import { countOwn } from "@/lib/traverseJobs";
import { describeAccountChanges } from "@/lib/accountChanges";
import { programVersionsFor } from "@/lib/appUsage";
import { emailStatus } from "@/lib/emailVerify";
import { downloadsOf, personExtras } from "@/lib/personProfile";

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
    // Every part at once; one that fails comes back empty and is named in `failed`
    const failed: string[] = [];
    const safe = <T,>(name: string, run: () => Promise<T>, empty: T) =>
      run().catch((e) => {
        console.error(`[person] ${name}:`, e instanceof Error ? e.message : e);
        failed.push(name);
        return empty;
      });
    const downloads = await safe("downloads", () => downloadsOf(user.id, user.email), []);
    const [stats, activities, userFiles, points, jobs, traverseJobs, programs, email, extras] = await Promise.all([
      safe("stats", () => db.getUserStats(user.id), null),
      safe("activity", () => db.getUserActivities(user.id, 300), []),
      safe("files", () => db.getUserFiles(user.id, 300), []),
      safe("points", () => db.getUserConversions(user.id, { limit: 2000 }), { total: 0, conversions: [] }),
      safe("jobs", () => listJobs(user.id), []),
      safe("traverse", () => countOwn(user.id), 0),
      // which version of each program they have, and where they last opened it
      safe("programs", () => programVersionsFor(user.id, downloads as never), []),
      safe("email", () => emailStatus(user.id), null),
      personExtras(user),
    ]);
    // stored files without their contents; they download on their own
    const files = userFiles.map((f) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { contentBase64, storedFilePath, ...rest } = f;
      return { ...rest, downloadUrl: `/api/user/files/${f.id}` };
    });

    return NextResponse.json({
      success: true,
      user: sanitized,
      stats,
      activities,
      downloads,
      files,
      points,
      jobs,
      traverseJobs,
      programs,
      emailStatus: email,
      ...extras,
      failed: [...failed, ...extras.failed],
      loadedAt: new Date().toISOString(),
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
    const before = await db.findUserById(id);
    const updated = await db.updateUser(id, body);

    // Activity log on the surveyor's account: what the admin changed
    if (before) {
      const change = describeAccountChanges(before, updated, typeof body.password === "string" && body.password.trim() !== "");
      if (change.changed) {
        await db
          .recordActivity({
            userId: updated.id,
            userEmail: updated.email,
            userName: updated.name,
            action: "settings_update",
            title: `${change.title} (by admin)`,
            details: `${change.details}\nChanged by: ${admin.user.email}`,
          })
          .catch((e) => console.error("Couldn't log the account change:", e));
      }
    }

    await logAdmin(admin.user, "account.update", `${updated.name} <${updated.email}>`, before ? describeAccountChanges(before, updated, typeof body.password === "string" && body.password.trim() !== "").details : "", req);
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
    const gone = await db.findUserById(id);
    await db.deleteUser(id);
    await logAdmin(admin.user, "account.delete", gone ? `${gone.name} <${gone.email}>` : id, "", req);
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
