import { NextRequest, NextResponse } from "next/server";
import { db, isAdminRole } from "@/lib/db";
import { cleanOccupation } from "@/lib/occupations";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

async function getAuthUser(req: NextRequest) {
  const token =
    req.cookies.get("surveyor_auth_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const sessionData = await db.validateSession(token);
  return sessionData?.user || null;
}

// GET: Retrieve user profile + aggregated stats + recent activities
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const stats = await db.getUserStats(user.id);
    const recentActivities = await db.getUserActivities(user.id, 15);

    return NextResponse.json(
      {
        user: db.sanitizeUser(user),
        stats,
        recentActivities,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}

// PATCH: Update user profile (name, organization, password)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await req.json().catch(() => ({}));
    const { name, organization, occupation, password, currentPassword } = body;

    const updates: { name?: string; organization?: string; role?: string; password?: string } = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim().slice(0, 100);
    if (typeof organization === "string") updates.organization = organization.trim().slice(0, 120);
    // Occupation / designation (stored as the account's role). Never used to
    // grant or change admin rights.
    if (occupation !== undefined && !db.isAdmin(user)) {
      const o = cleanOccupation(occupation);
      if (!o) return NextResponse.json({ error: "Please enter your occupation." }, { status: 400, headers: CORS_HEADERS });
      if (isAdminRole(o)) {
        return NextResponse.json({ error: 'Please describe your occupation without the word "admin".' }, { status: 400, headers: CORS_HEADERS });
      }
      updates.role = o;
    }
    if (password !== undefined) {
      // A new password needs the current one, so a borrowed or stolen
      // session alone can't take over the account
      if (typeof password !== "string" || password.trim().length < 8) {
        return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400, headers: CORS_HEADERS });
      }
      if (typeof currentPassword !== "string" || !currentPassword || !db.verifyPassword(user, currentPassword)) {
        return NextResponse.json({ error: "Your current password isn't right." }, { status: 403, headers: CORS_HEADERS });
      }
      updates.password = password.trim();
    }

    const updated = await db.updateUser(user.id, updates);

    // Record activity for profile update
    await db.recordActivity({
      userId: user.id,
      userEmail: user.email,
      userName: updated.name,
      action: "settings_update",
      title: "Updated account profile",
      details: "User updated personal profile details",
    });

    return NextResponse.json(
      {
        success: true,
        user: db.sanitizeUser(updated),
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
