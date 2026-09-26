import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { cleanSettingsUpdate } from "@/lib/siteSettings";

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
    const clean = cleanSettingsUpdate(await req.json().catch(() => null));
    if (!clean.ok) return NextResponse.json({ error: clean.error }, { status: 400 });
    const updated = await db.updateSettings(clean.value);
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
