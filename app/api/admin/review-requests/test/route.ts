import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { isMailConfigured } from "@/lib/mailer";
import { sendReviewTest } from "@/lib/releases";

// POST { app }: send the review request to the signed-in admin only, to check it in a real inbox
export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMailConfigured()) return NextResponse.json({ error: "Email isn't set up (SMTP_HOST, SMTP_USER, SMTP_PASS)." }, { status: 503 });
  const { app } = await req.json().catch(() => ({}));
  try {
    await sendReviewTest(String(app || ""), { name: session.user.name, email: session.user.email });
    return NextResponse.json({ ok: true, to: session.user.email });
  } catch (err) {
    console.error("Review request: test email failed", err);
    return NextResponse.json({ error: `Couldn't send the test: ${(err as Error).message || "unknown error"}` }, { status: 502 });
  }
}
