import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_COOKIE, isGoogleConfigured, newAuthRequest } from "@/lib/googleAuth";
import { safeNextPath } from "@/lib/authRedirect";

// "Continue with Google": off to Google's account picker, remembering where to
// come back to (?next=) in a short-lived cookie with the state and PKCE verifier
export function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL(`/login?error=google-unavailable&next=${encodeURIComponent(next)}`, req.url));
  }
  const { url, state, verifier } = newAuthRequest(req.nextUrl.origin);
  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/auth/google",
  });
  return res;
}
