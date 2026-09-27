import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GOOGLE_COOKIE, isGoogleConfigured, profileFromCode } from "@/lib/googleAuth";
import { safeNextPath } from "@/lib/authRedirect";
import { getClientIp, getIpGeoLocation } from "@/lib/geo";

// Back from Google: check the state, get the verified email, then sign in to
// the matching account or create one, and continue to ?next
export async function GET(req: NextRequest) {
  const fail = (code: string, next = "/") => {
    const res = NextResponse.redirect(new URL(`/login?error=${code}&next=${encodeURIComponent(next)}`, req.url));
    res.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
    return res;
  };

  let saved: { state?: string; verifier?: string; next?: string } = {};
  try {
    saved = JSON.parse(req.cookies.get(GOOGLE_COOKIE)?.value || "{}");
  } catch {
    // treated as missing below
  }
  const next = safeNextPath(saved.next);
  const q = req.nextUrl.searchParams;
  if (q.get("error")) return fail("google-cancelled", next); // closed or denied on Google's page
  if (!isGoogleConfigured()) return fail("google-unavailable", next);
  const code = q.get("code");
  if (!code || !saved.state || !saved.verifier || q.get("state") !== saved.state) return fail("google-expired", next);

  try {
    const profile = await profileFromCode(code, saved.verifier, req.nextUrl.origin);
    let user = await db.findUserByEmail(profile.email);

    // Admin accounts sign in with their password only
    if (user && db.isAdmin(user)) return fail("google-admin", next);

    // A new account (or one that never finished) is asked for its organisation
    // and occupation before going on
    let needsProfile = false;
    if (!user) {
      needsProfile = true;
      const geo = await getIpGeoLocation(getClientIp(req), req);
      // No password is set (a random one is stored); "Forgot password" can add one later
      user = await db.createUser({ name: profile.name, email: profile.email, ipAddress: geo.ip, location: geo.location });
    }

    else if (user.role === "Surveyor" && (user.organization || "Independent Surveyor") === "Independent Surveyor") needsProfile = true;

    await db.touchUserLogin(user.id);
    const session = await db.createSession(user.id);
    const dest = needsProfile ? `/welcome?next=${encodeURIComponent(next)}` : next;
    const res = NextResponse.redirect(new URL(dest, req.url));
    res.cookies.set("surveyor_auth_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    res.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
    return res;
  } catch (err) {
    console.error("Google sign-in failed:", err);
    return fail("google-failed", next);
  }
}
