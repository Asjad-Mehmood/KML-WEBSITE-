import { NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/authRedirect";
import { authOrigin, onAuthHost } from "@/lib/authHost";
import { sessionForToken } from "@/lib/serverSession";
import { SITE_URL } from "@/lib/site";
import { createHandoff } from "@/lib/toolkit/store";
import { dashboardOrigin, isDashboardPath } from "@/lib/dashboardHost";

// The sign-in address (lib/authHost) hands a signed-in visitor back to the main site:
//   GET ?next=/path → the main site's /api/auth/handoff?code=… (one use, 60 seconds), which
//   signs the main site in and goes on to /path. Signed out here: the sign-in.
//   /dashboard… goes to the dashboard address instead, when it has one (lib/dashboardHost).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  if (!onAuthHost(req.headers)) return NextResponse.redirect(new URL(next, SITE_URL), 303);
  const here = authOrigin(req.nextUrl.protocol);
  const s = await sessionForToken(req.cookies.get("surveyor_auth_token")?.value);
  if (!s) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, here), 303);
  try {
    const dash = isDashboardPath(next);
    const code = await createHandoff(s.user.id, `${dash ? "dash" : "site"}:${next}`);
    const target = dash ? dashboardOrigin(req.nextUrl.protocol) : SITE_URL;
    const res = NextResponse.redirect(`${target}/api/auth/handoff?code=${code}`, 303);
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Referrer-Policy", "no-referrer");
    return res;
  } catch (e) {
    console.error("[auth continue]", e);
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}&error=handoff-failed`, here), 303);
  }
}
