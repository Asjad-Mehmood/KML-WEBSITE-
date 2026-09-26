import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { MAX_POINTS_PER_SAVE, MAX_USER_POINTS } from "@/lib/uploadLimits";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

async function signedIn(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  return s?.user || null;
}

const text = (v: unknown, max = 120) => String(v ?? "").slice(0, max);
/** Latitude and longitude to 8 decimals (about a millimetre). */
const degrees = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n.toFixed(8) : "";
};
const float = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

// POST: the converted points of one saved file.
// Body: { fileId, crs, offset?, points: [{ station, code, easting, northing, elevation, lat, lon }] }
export async function POST(req: NextRequest) {
  try {
    const user = await signedIn(req);
    if (!user) return json({ error: "Sign in to keep converted points." }, 401);

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.points)) return json({ error: "points is required" }, 400);
    if (body.points.length === 0) return json({ success: true, saved: 0 });
    if (body.points.length > MAX_POINTS_PER_SAVE) {
      return json({ error: `Send at most ${MAX_POINTS_PER_SAVE} points at a time.` }, 413);
    }

    // The points belong to a file this user saved.
    const fileId = text(body.fileId, 60);
    const file = fileId
      ? await prisma.userFile.findUnique({ where: { id: fileId }, select: { userId: true } })
      : null;
    if (!file || file.userId !== user.id) return json({ error: "Unknown file." }, 404);

    if ((await db.countUserConversions(user.id)) + body.points.length > MAX_USER_POINTS) {
      return json({ error: `Your account already keeps ${MAX_USER_POINTS.toLocaleString("en-US")} points. Delete some files to keep more.` }, 413);
    }

    const offset = Math.max(0, Math.floor(float(body.offset)));
    const points = body.points.map((p: Record<string, unknown>) => ({
      station: text(p.station),
      featureCode: text(p.code ?? p.featureCode, 60),
      easting: float(p.easting),
      northing: float(p.northing),
      elevation: float(p.elevation),
      lat: degrees(p.lat),
      lon: degrees(p.lon),
    }));

    const saved = await db.recordConversions({
      userId: user.id,
      fileId,
      coordSystem: text(body.crs, 160) || "WGS84",
      offset,
      points,
    });
    return json({ success: true, saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return json({ error: msg }, 500);
  }
}

// GET: this user's converted points, newest first. ?fileId= for one file, ?limit= up to 10000.
export async function GET(req: NextRequest) {
  try {
    const user = await signedIn(req);
    if (!user) return json({ total: 0, conversions: [] });
    const { searchParams } = new URL(req.url);
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get("limit") || "2000", 10) || 2000));
    const fileId = searchParams.get("fileId") || undefined;
    const r = await db.getUserConversions(user.id, { fileId, limit });
    return json({ success: true, ...r });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return json({ error: msg }, 500);
  }
}

// DELETE: this user's converted points; ?fileId= for one file's points only.
export async function DELETE(req: NextRequest) {
  try {
    const user = await signedIn(req);
    if (!user) return json({ error: "Sign in first." }, 401);
    const fileId = new URL(req.url).searchParams.get("fileId") || undefined;
    const removed = await db.deleteUserConversions(user.id, fileId);
    return json({ success: true, removed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return json({ error: msg }, 500);
  }
}
