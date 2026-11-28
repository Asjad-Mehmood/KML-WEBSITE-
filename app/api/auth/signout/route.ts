import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authHost, onAuthHost } from "@/lib/auth/authHost";
import { dashboardHost, onDashboardHost } from "@/lib/auth/dashboardHost";
import { SITE_URL } from "@/lib/content/site";

// Signing out of every address of the site in this browser. With a sign-in address
// (lib/authHost) and a dashboard address (lib/dashboardHost) each keeps a session of its own,
// and the sign-in address would sign the others straight back in. So a sign-out goes through
// each of them: GET ?rest=dash,auth ends this address's session, then goes on to the next one
// in "rest", and finally to the home page.
//   site: the main site, dash: the dashboard address, auth: the sign-in address
const ORIGINS: Record<string, () => string | null> = {
  site: () => SITE_URL,
  dash: () => (dashboardHost() ? `https://${dashboardHost()}` : null),
  auth: () => (authHost() ? `https://${authHost()}` : null),
};

export async function GET(req: NextRequest) {
  const here = onAuthHost(req.headers) ? "auth" : onDashboardHost(req.headers) ? "dash" : "site";
  const token = req.cookies.get("surveyor_auth_token")?.value;
  if (token) await db.destroySession(token).catch((e) => console.error("[signout]", e));

  // the next address still to visit (only known ones, in order), else home
  const rest = (req.nextUrl.searchParams.get("rest") || "").split(",").filter((k) => k !== here && k in ORIGINS);
  let to = `${SITE_URL}/`;
  while (rest.length) {
    const k = rest.shift() as string;
    const origin = ORIGINS[k]();
    if (!origin) continue;
    // locally (http) keep the request's scheme
    const o = req.nextUrl.protocol === "http:" ? origin.replace(/^https:/, "http:") : origin;
    to = `${o}/api/auth/signout${rest.length ? `?rest=${rest.join(",")}` : ""}`;
    break;
  }
  const res = NextResponse.redirect(to, 303);
  res.headers.set("Cache-Control", "no-store");
  res.cookies.delete("surveyor_auth_token");
  res.cookies.delete("surveyor_session");
  return res;
}
