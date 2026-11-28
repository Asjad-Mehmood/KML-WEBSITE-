import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeNextPath } from "@/lib/auth/authRedirect";
import { takeHandoff } from "@/lib/toolkit/store";
import { SITE_URL } from "@/lib/content/site";
import { dashboardOrigin, onDashboardHost } from "@/lib/auth/dashboardHost";

// The main site's half of signing in on the sign-in address (lib/authHost):
//   GET ?code=… (from /api/auth/continue there) → this browser signed in here, then on to the
//   page it was going to. An unknown, used or expired code goes back to the sign-in.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // the main site, or the dashboard address (lib/dashboardHost): a code only works where it was made for
  const dash = onDashboardHost(req.headers);
  const home = dash ? dashboardOrigin(req.nextUrl.protocol) : SITE_URL;
  const kind = dash ? "dash:" : "site:";
  const code = req.nextUrl.searchParams.get("code") || "";
  let taken: { userId: string; next: string } | null = null;
  try {
    taken = await takeHandoff(code);
  } catch (e) {
    console.error("[auth handoff]", e);
  }
  if (!taken || !taken.next.startsWith(kind)) {
    return NextResponse.redirect(new URL("/login?error=handoff-failed", home), 303);
  }
  const next = safeNextPath(taken.next.slice(kind.length));
  const res = NextResponse.redirect(new URL(next, home), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  try {
    // a blocked account gets no session (db.createSession throws)
    const session = await db.createSession(taken.userId);
    res.cookies.set("surveyor_auth_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
  } catch (e) {
    console.error("[auth handoff] session", e);
    return NextResponse.redirect(new URL("/login?error=blocked", home), 303);
  }
  return res;
}
