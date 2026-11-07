import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { HANDOFF_PAGES, createHandoff, takeHandoff } from "@/lib/toolkit/store";
import { mayUseToolkit } from "@/lib/toolkit/access";

// Survey Toolkit (beta test): signing in the web apps the Toolkit shows inside its own window
// (lib/toolkit/store.ts, "sign-in handover").
//   POST { "next": "/slope-calculation/app" }  with "Authorization: Bearer <token>", testers only
//        → { "url": "https://…/api/toolkit/handoff?code=…" }, good once for 60 seconds
//   GET  ?code=…  → signs this browser in (a session of its own) and goes on to the app; an
//        unknown, used or expired code goes on to the app's own sign-in instead

export async function POST(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to use the Survey Toolkit." }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { next?: unknown } | null;
  const next = typeof b?.next === "string" ? b.next : "";
  if (!(HANDOFF_PAGES as readonly string[]).includes(next)) {
    return NextResponse.json({ error: "Unknown page." }, { status: 400 });
  }
  try {
    if (!(await mayUseToolkit(s.user))) {
      return NextResponse.json({ error: "The Survey Toolkit isn't open to this account." }, { status: 403 });
    }
    const code = await createHandoff(s.user.id, next);
    const url = new URL("/api/toolkit/handoff", req.nextUrl.origin);
    url.searchParams.set("code", code);
    return NextResponse.json({ success: true, url: url.toString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[toolkit handoff]", e);
    return NextResponse.json({ error: "Couldn't start the sign-in. Try again in a moment." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  let taken: { userId: string; next: string } | null = null;
  try {
    taken = await takeHandoff(code);
  } catch (e) {
    console.error("[toolkit handoff]", e);
  }
  const next = taken && (HANDOFF_PAGES as readonly string[]).includes(taken.next) ? taken.next : "/app";
  const res = NextResponse.redirect(new URL(next, req.nextUrl.origin), 303);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  if (!taken) return res;
  try {
    const session = await db.createSession(taken.userId);
    res.cookies.set("surveyor_auth_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
  } catch (e) {
    console.error("[toolkit handoff] session", e);
  }
  return res;
}
