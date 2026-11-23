import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeNextPath } from "@/lib/authRedirect";
import { takeHandoff } from "@/lib/toolkit/store";
import { SITE_URL } from "@/lib/site";

// The main site's half of signing in on the sign-in address (lib/authHost):
//   GET ?code=… (from /api/auth/continue there) → this browser signed in here, then on to the
//   page it was going to. An unknown, used or expired code goes back to the sign-in.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  let taken: { userId: string; next: string } | null = null;
  try {
    taken = await takeHandoff(code);
  } catch (e) {
    console.error("[auth handoff]", e);
  }
  if (!taken || !taken.next.startsWith("site:")) {
    return NextResponse.redirect(new URL("/login?error=handoff-failed", SITE_URL), 303);
  }
  const next = safeNextPath(taken.next.slice("site:".length));
  const res = NextResponse.redirect(new URL(next, SITE_URL), 303);
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
    return NextResponse.redirect(new URL("/login?error=blocked", SITE_URL), 303);
  }
  return res;
}
