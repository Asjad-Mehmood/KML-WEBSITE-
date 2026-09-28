import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { lastCleanup, retentionDays, runCleanup } from "@/lib/cleanup";

export const maxDuration = 60;

// Admin → Settings: how long files are kept, the last clean-up, and "Clean up now"
export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ retentionDays: retentionDays(), last: await lastCleanup() });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, result: await runCleanup("admin"), last: await lastCleanup() });
  } catch (err) {
    console.error("Clean-up failed:", err);
    return NextResponse.json({ error: "Clean-up failed. Please try again." }, { status: 500 });
  }
}
