import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken } from "@/lib/serverSession";
import { appSigninPath, parseAppLink } from "@/lib/appLink";

// "Continue to the app" on /app-signin: a new session for the Windows app,
// sent only to the app's loopback address on this computer
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const link = parseAppLink(form?.get("port"), form?.get("state"));
  if (!link) return NextResponse.redirect(new URL("/app-signin", req.url), 303);

  const session = await sessionForToken(req.cookies.get("surveyor_auth_token")?.value);
  if (!session) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(appSigninPath(link.port, link.state))}`, req.url), 303);
  }

  const appSession = await db.createSession(session.user.id);
  const target = new URL(`http://127.0.0.1:${link.port}/auth-callback`);
  target.searchParams.set("state", link.state);
  target.searchParams.set("token", appSession.token);
  const res = NextResponse.redirect(target, 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
