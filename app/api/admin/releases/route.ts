import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { checkRelease, createRelease, listReleases } from "@/lib/releases";

// Admin → Releases: every release, grouped by app, with its broadcasts and the audience
export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await listReleases());
  } catch (err) {
    console.error("Releases: list failed", err);
    return NextResponse.json({ error: "Couldn't load the releases." }, { status: 500 });
  }
}

// Add a release
export async function POST(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = checkRelease(await req.json().catch(() => ({})));
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 400 });
  try {
    return NextResponse.json({ release: await createRelease(c.data) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Couldn't add the release." }, { status: 400 });
  }
}
