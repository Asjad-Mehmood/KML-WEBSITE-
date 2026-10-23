import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { isMailConfigured } from "@/lib/mailer";
import { sendTest } from "@/lib/releases";

type Ctx = { params: Promise<{ id: string }> };

// Send the announcement to the signed-in admin only, to check it in a real inbox
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMailConfigured()) return NextResponse.json({ error: "Email isn't set up (SMTP_HOST, SMTP_USER, SMTP_PASS)." }, { status: 503 });
  const { id } = await params;
  try {
    await sendTest(id, { name: session.user.name, email: session.user.email });
    return NextResponse.json({ ok: true, to: session.user.email });
  } catch (err) {
    console.error("Releases: test email failed", err);
    return NextResponse.json({ error: `Couldn't send the test: ${(err as Error).message || "unknown error"}` }, { status: 502 });
  }
}
