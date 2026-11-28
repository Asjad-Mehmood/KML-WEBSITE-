import { NextRequest, NextResponse } from "next/server";
import { describeAccountChanges } from "@/lib/accountChanges";
import { revokeTrustedBrowsers } from "@/lib/adminOtp";
import { db, isAdminRole } from "@/lib/db";
import { userFromRequest } from "@/lib/serverSession";
import { cleanOccupation } from "@/lib/occupations";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
  });
}

// GET: Retrieve user profile + aggregated stats + recent activities
export async function GET(req: NextRequest) {
  try {
    const user = await userFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await db.getUserStats(user.id);
    const recentActivities = await db.getUserActivities(user.id, 15);

    return NextResponse.json(
      {
        user: db.sanitizeUser(user),
        stats,
        recentActivities,
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Update user profile (name, organization, password)
export async function PATCH(req: NextRequest) {
  try {
    const user = await userFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, organization, occupation, password, currentPassword } = body;

    const updates: { name?: string; organization?: string; role?: string; password?: string } = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim().slice(0, 100);
    if (typeof organization === "string") updates.organization = organization.trim().slice(0, 120);
    // Occupation / designation (stored as the account's role). Never used to
    // grant or change admin rights.
    if (occupation !== undefined && !db.isAdmin(user)) {
      // optional: left empty, the account keeps the one it has
      const o = cleanOccupation(occupation);
      if (o && isAdminRole(o)) {
        return NextResponse.json({ error: 'Please describe your occupation without the word "admin".' }, { status: 400 });
      }
      if (o) updates.role = o;
    }
    if (password !== undefined) {
      // A new password needs the current one, so a borrowed or stolen
      // session alone can't take over the account
      if (typeof password !== "string" || password.trim().length < 8) {
        return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
      }
      if (typeof currentPassword !== "string" || !currentPassword || !db.verifyPassword(user, currentPassword)) {
        return NextResponse.json({ error: "Your current password isn't right." }, { status: 403 });
      }
      updates.password = password.trim();
    }

    const updated = await db.updateUser(user.id, updates);
    // A new password ends every browser's trust for the admin email code
    if (updates.password) await revokeTrustedBrowsers(user.id);

    // Activity log: exactly what changed (a save with no change isn't logged)
    const change = describeAccountChanges(user, updated, Boolean(updates.password));
    if (change.changed) {
      await db.recordActivity({
        userId: user.id,
        userEmail: user.email,
        userName: updated.name,
        action: "settings_update",
        title: change.title,
        details: change.details,
      });
    }

    return NextResponse.json(
      {
        success: true,
        user: db.sanitizeUser(updated),
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
