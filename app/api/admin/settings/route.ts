import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const settings = await db.getSettings();
  return NextResponse.json({ success: true, settings });
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const updates = cleanSettings(body);
    if ("error" in updates) return NextResponse.json({ error: updates.error }, { status: 400 });
    const updated = await db.updateSettings(updates);
    return NextResponse.json({
      success: true,
      settings: updated,
      message: "Application settings updated successfully",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// Only known settings, with the right types and sane ranges
function cleanSettings(body: Record<string, unknown>): Record<string, string | number | boolean> | { error: string } {
  const out: Record<string, string | number | boolean> = {};
  const bools = ["requireAuthForDownload", "maintenanceMode", "announcementActive", "webAppRestricted", "webWatermarkKml", "webDisableReports"];
  for (const k of bools) if (typeof body[k] === "boolean") out[k] = body[k] as boolean;
  const texts: [string, number][] = [["appVersion", 30], ["installerFileName", 120], ["installerFileSize", 20], ["announcementBanner", 300]];
  for (const [k, max] of texts) if (typeof body[k] === "string") out[k] = (body[k] as string).trim().slice(0, max);
  if (typeof out.installerFileName === "string" && out.installerFileName && !/^[\w.-]+\.exe$/i.test(out.installerFileName)) {
    return { error: "Installer file must be a file name ending in .exe (letters, numbers, dots, dashes)." };
  }
  if (body.webMaxPoints !== undefined) {
    const n = Number(body.webMaxPoints);
    if (!Number.isInteger(n) || n < 1 || n > 100000) return { error: "Point limit must be a whole number from 1 to 100,000." };
    out.webMaxPoints = n;
  }
  return out;
}
