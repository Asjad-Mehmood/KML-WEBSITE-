import { NextRequest, NextResponse } from "next/server";
import { trackAppUse } from "@/lib/appUsage";
import { db } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-App-Platform, X-App-Name, X-App-Version",
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
  // which app is calling, and its version (Admin → user profile)
  trackAppUse(req, sessionData?.user?.id);
  return sessionData?.user || null;
}

// GET: Retrieve activity list for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const userParam = searchParams.get("userId");

    // If admin is requesting a specific user, or admin querying all
    let activities: unknown[] = [];
    if (user && db.isAdmin(user) && userParam) {
      activities = await db.getUserActivities(userParam, limit);
    } else if (user) {
      activities = await db.getUserActivities(user.id, limit);
    } else {
      // Signed out: nobody else's history, whatever userId is asked for
      return NextResponse.json({ activities: [] }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ activities }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}

// POST: Record a user activity
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const body = await req.json().catch(() => ({}));

    const {
      action,
      title,
      details,
      fileName,
      fileSize,
      pointsCount,
      linesCount,
      polygonsCount,
      crs,
      exportFormat,
      photosCount,
      durationMs,
      status,
    } = body;

    if (!action || !title) {
      return NextResponse.json(
        { error: "action and title are required fields" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // Only a valid session decides whose account this goes into. A userId or
    // email in the body is ignored, or anyone could write into another
    // user's dashboard; signed-out activity is kept without an owner.
    const record = await db.recordActivity({
      userId: user ? user.id : null,
      userEmail: user ? user.email : null,
      userName: user ? user.name : null,
      action,
      title,
      details,
      fileName,
      fileSize,
      pointsCount: typeof pointsCount === "number" ? pointsCount : undefined,
      linesCount: typeof linesCount === "number" ? linesCount : undefined,
      polygonsCount: typeof polygonsCount === "number" ? polygonsCount : undefined,
      crs,
      exportFormat,
      photosCount: typeof photosCount === "number" ? photosCount : undefined,
      durationMs: typeof durationMs === "number" ? durationMs : undefined,
      status: status || "success",
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, activity: record }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}

// DELETE: Clear activities
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    await db.clearActivities(user.id);
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
