import { NextRequest, NextResponse } from "next/server";
import { REF_COOKIE, cleanCode, referrerOfCode } from "@/lib/account/referrals";

// /r/<code>: someone's invite link. The code is kept for 30 days in a cookie (on the whole
// surveyxdigital.com, so the sign-in address sees it too), then it's on to sign up.
// An unknown code still goes on to sign-up, just without the invite.
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const c = cleanCode(code);
  const known = c ? await referrerOfCode(c).catch(() => null) : null;
  const res = NextResponse.redirect(new URL(known ? "/signup/details?invited=1" : "/signup/details", req.nextUrl.origin), 302);
  if (known) {
    const host = req.nextUrl.hostname;
    const parent = /(^|\.)surveyxdigital\.com$/.test(host) ? ".surveyxdigital.com" : undefined;
    res.cookies.set(REF_COOKIE, c, {
      maxAge: 30 * 864e2,
      path: "/",
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      httpOnly: true,
      ...(parent ? { domain: parent } : {}),
    });
  }
  return res;
}
