import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { isMailConfigured } from "@/lib/mailer";
import { startReviewRequest } from "@/lib/releases";

// POST { app, onlyNew, confirm }: start emailing the app's users who haven't reviewed it
// (onlyNew: leave out anyone asked before). The admin page then asks /api/admin/broadcasts/[id]
// for one batch after another, as for a release.
export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMailConfigured()) return NextResponse.json({ error: "Email isn't set up (SMTP_HOST, SMTP_USER, SMTP_PASS)." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== true) return NextResponse.json({ error: "Confirm the request first." }, { status: 400 });
  try {
    const broadcastId = await startReviewRequest(String(body.app || ""), body.onlyNew === true, session.user.email);
    return NextResponse.json({ broadcastId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Couldn't start sending." }, { status: 400 });
  }
}
