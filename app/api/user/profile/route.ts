import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

function getAuthUser(req: NextRequest) {
  const token =
    req.cookies.get("surveyor_auth_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const sessionData = db.validateSession(token);
  return sessionData?.user || null;
}

// GET: Retrieve user profile + aggregated stats + recent activities
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const stats = db.getUserStats(user.id);
    const recentActivities = db.getUserActivities(user.id, 15);

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
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await req.json().catch(() => ({}));
    const { name, organization, password } = body;

    const updates: { name?: string; organization?: string; password?: string } = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof organization === "string") updates.organization = organization.trim();
    if (typeof password === "string" && password.trim().length >= 6) {
      updates.password = password.trim();
    }

    const updated = db.updateUser(user.id, updates);

    // Record activity for profile update
    db.recordActivity({
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
