import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { versionsInUse } from "@/lib/versionsInUse";

// Admin → Releases → an app → "Who has updated": each account's version of the app, up to date
// or behind (lib/versionsInUse.ts). GET ?app=traverse
export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const app = req.nextUrl.searchParams.get("app") || "";
  try {
    const v = await versionsInUse(app);
    if (!v) return NextResponse.json({ error: "Unknown app" }, { status: 404 });
    return NextResponse.json(v);
  } catch (err) {
    console.error("[versions in use]", err);
    return NextResponse.json({ error: "Couldn't read who has which version." }, { status: 500 });
  }
}
