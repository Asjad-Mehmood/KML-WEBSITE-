import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { isMailConfigured } from "@/lib/mailer";
import { startBroadcast } from "@/lib/releases";

type Ctx = { params: Promise<{ id: string }> };

// Start emailing a release to the people who use its app (audience "all": everyone with an
// account; onlyNew: skip people who already got it).
// The admin page then asks /api/admin/broadcasts/[id] for one batch after another.
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMailConfigured()) return NextResponse.json({ error: "Email isn't set up (SMTP_HOST, SMTP_USER, SMTP_PASS)." }, { status: 503 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== true) return NextResponse.json({ error: "Confirm the broadcast first." }, { status: 400 });
  try {
    const broadcastId = await startBroadcast(id, body.onlyNew === true, body.audience === "all" ? "all" : "app", session.user.email);
    return NextResponse.json({ broadcastId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Couldn't start the broadcast." }, { status: 400 });
  }
}
