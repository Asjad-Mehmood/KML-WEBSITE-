import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { createIntroduction } from "@/lib/releases";

// Admin → Releases → "Create the introduction email": a new program's first release, ready to
// preview, test and send to everyone (lib/releases.ts createIntroduction)
export async function POST(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { app?: unknown };
  try {
    return NextResponse.json({ release: await createIntroduction(String(body.app ?? "")) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Couldn't create the introduction." }, { status: 400 });
  }
}
