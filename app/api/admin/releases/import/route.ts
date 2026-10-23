import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { importFromGitHub } from "@/lib/releases";

// Add an app's published GitHub releases (with their notes) that aren't in the list yet
export async function POST(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { app } = await req.json().catch(() => ({}));
  try {
    return NextResponse.json(await importFromGitHub(String(app || "")));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Import failed." }, { status: 400 });
  }
}
