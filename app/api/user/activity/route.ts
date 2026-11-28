import { NextRequest, NextResponse } from "next/server";
import { ACTIVITY_APPS, appOfRequest, tagActivity } from "@/lib/admin/activityTags";
import { trackAppUse } from "@/lib/products/appUsage";
import { db } from "@/lib/db";
import { userFromRequest } from "@/lib/auth/serverSession";
import { getAdminSession } from "@/lib/auth/adminAuth";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
  });
}

async function getAuthUser(req: NextRequest) {
  const user = await userFromRequest(req);
  // which app is calling, and its version (Admin → user profile)
  trackAppUse(req, user?.id);
  return user;
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
    if (user && userParam && (await getAdminSession(req))) {
      activities = await db.getUserActivities(userParam, limit);
    } else if (user) {
      activities = await db.getUserActivities(user.id, limit);
    } else {
      // Signed out: nobody else's history, whatever userId is asked for
      return NextResponse.json({ activities: [] });
    }

    return NextResponse.json({ activities });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
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
      app,
      platform,
      appVersion,
      errorMessage,
    } = body;

    if (!action || !title) {
      return NextResponse.json(
        { error: "action and title are required fields" },
        { status: 400 }
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

    // which app and device it came from: the request says, or the app's own fields if it sends them
    const seen = await appOfRequest(req);
    const known = (v: unknown) => typeof v === "string" && (ACTIVITY_APPS as readonly string[]).includes(v);
    await tagActivity(record.id, {
      app: known(app) ? app : seen.app === "website" ? "excel-to-kml" : seen.app,
      platform: typeof platform === "string" ? platform : seen.platform,
      appVersion: typeof appVersion === "string" ? appVersion : seen.appVersion,
      errorMessage: typeof errorMessage === "string" ? errorMessage : status === "error" && typeof details === "string" ? details.slice(0, 500) : null,
    });

    return NextResponse.json({ success: true, activity: record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Clear activities
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.clearActivities(user.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
