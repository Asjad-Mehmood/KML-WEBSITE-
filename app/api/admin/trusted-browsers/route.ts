import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { listTrustedBrowsers, otpAvailable, revokeTrustedBrowsers } from "@/lib/adminOtp";

// Admin → Settings → Sign-in security: browsers that skip the email code, and whether the code step is active
export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    otpActive: otpAvailable(),
    email: session.user.email,
    browsers: await listTrustedBrowsers(session.user.id, req),
  });
}

// ?id=<browser> forgets one browser; without it, all of them
export async function DELETE(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") || undefined;
  const removed = await revokeTrustedBrowsers(session.user.id, id);
  return NextResponse.json({ ok: true, removed, browsers: await listTrustedBrowsers(session.user.id, req) });
}
