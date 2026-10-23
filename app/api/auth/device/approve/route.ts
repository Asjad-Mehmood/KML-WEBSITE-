import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/loginThrottle";
import { approve, findOpen, showCode } from "@/lib/deviceLink";

// POST { code, confirm }: the signed-in person at /link enters the code their app window shows.
// confirm false: just check it (and say which app asked); confirm true: let the app sign in.
export async function POST(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in first.", requiresAuth: true }, { status: 401 });
  const ip = clientIp(req);
  if (await tooManyFailures(s.user.email, ip)) {
    return NextResponse.json({ error: "Too many wrong codes. Please wait 15 minutes and try again." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const link = await findOpen(String(body.code || ""));
  if (!link) {
    await recordFailure(s.user.email, ip, req.headers.get("user-agent"));
    return NextResponse.json({ error: "That code isn't right or has expired. Check the code in the app, or ask it for a new one." }, { status: 404 });
  }
  if (body.confirm !== true) {
    return NextResponse.json({ success: true, code: showCode(link.code), app: link.app || "an app", requested: link.createdAt });
  }
  if (!(await approve(link.code, s.user.id))) {
    return NextResponse.json({ error: "That code has just expired. Ask the app for a new one." }, { status: 409 });
  }
  db.recordActivity({
    userId: s.user.id,
    userEmail: s.user.email,
    userName: s.user.name,
    action: "app_signin" as Parameters<typeof db.recordActivity>[0]["action"],
    title: `Signed in ${link.app || "an app"} with a code`,
    details: `Code ${showCode(link.code)} confirmed in the browser`,
    ipAddress: ip || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  }).catch(() => {});
  return NextResponse.json({ success: true, app: link.app });
}
