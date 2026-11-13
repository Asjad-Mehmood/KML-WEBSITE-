import { NextRequest, NextResponse } from "next/server";
import { logAdmin } from "@/lib/adminLog";
import { getAdminSession } from "@/lib/adminAuth";
import { lastCleanup, retentionDays, runCleanup } from "@/lib/cleanup";

export const maxDuration = 60;

// Admin → Settings: how long files are kept, the last clean-up, and "Clean up now"
export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ retentionDays: retentionDays(), last: await lastCleanup() });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await runCleanup("admin");
    await logAdmin(admin.user, "cleanup.run", "Housekeeping", JSON.stringify(result).slice(0, 500), req);
    return NextResponse.json({ ok: true, result, last: await lastCleanup() });
  } catch (err) {
    console.error("Clean-up failed:", err);
    return NextResponse.json({ error: "Clean-up failed. Please try again." }, { status: 500 });
  }
}
