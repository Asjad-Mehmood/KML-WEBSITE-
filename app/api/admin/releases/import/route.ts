import { NextRequest, NextResponse } from "next/server";
import { logAdmin } from "@/lib/adminLog";
import { getAdminSession } from "@/lib/adminAuth";
import { importFromGitHub } from "@/lib/releases";

// Add an app's published GitHub releases (with their notes) that aren't in the list yet
export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { app } = await req.json().catch(() => ({}));
  try {
    const result = await importFromGitHub(String(app || ""));
    await logAdmin(admin.user, "release.save", String(app || ""), `Imported from GitHub: ${result.added} added, ${result.filled} filled`, req);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Import failed." }, { status: 400 });
  }
}
