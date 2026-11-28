import { NextRequest, NextResponse } from "next/server";
import { adminHost, onAdminHost } from "@/lib/auth/adminHost";
import { AUTH_PAGE, authHost, onAuthHost } from "@/lib/auth/authHost";
import { DASHBOARD_PAGE, dashboardHost, isDashboardPath, onDashboardHost } from "@/lib/auth/dashboardHost";
import { safeNextPath } from "@/lib/auth/authRedirect";
import { SITE_URL } from "@/lib/content/site";
import { corsHeaders } from "@/lib/http/cors";

// Admin's pages and APIs (lib/adminHost: they live on ADMIN_HOST once it is set)
const ADMIN_PAGE = /^\/(admin|toolkit-beta\/admin)(\/|$)/;
const ADMIN_API = /^\/api\/(admin|toolkit\/admin|toolkit\/testers)(\/|$)/;
// what else the admin address serves: the sign-in, and what the admin pages use
const ADMIN_SIDE_ALSO = /^\/login\/?$|^\/api\/(auth\/(login|verify-otp|resend-otp|logout|me)|settings\/public|user\/files|broadcasts|mail)(\/|$)/;
// Next's own files, and files from public/ (images, fonts, scripts)
const FILE = /^\/_next\/|^\/[^?]*\.[a-z0-9]{2,8}$/i;

// clean address → the endpoint behind it (the reverse of lib/mail/letterEmail.ts PRETTY_LINKS)
const PRETTY: Record<string, string> = {
  "/confirm-email": "/api/auth/verify-email",
  "/get/toolkit": "/api/toolkit/download",
};

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // the clean addresses emails link to (lib/mail/letterEmail.ts prettyLink): the endpoint answers,
  // the address stays as it is
  const behind = PRETTY[path];
  if (behind && !onAdminHost(req.headers)) {
    const to = req.nextUrl.clone();
    to.pathname = behind;
    return NextResponse.rewrite(to);
  }

  // The raw web app file must not be reachable directly: /app checks sign-in first
  if (path === "/app.html") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  const admin = adminHost();
  if (admin) {
    if (onAdminHost(req.headers)) return adminSide(req, path);
    // the public site: admin is elsewhere
    if (ADMIN_PAGE.test(path)) return NextResponse.redirect(`${req.nextUrl.protocol}//${admin}${path}${req.nextUrl.search}`, 307);
    if (ADMIN_API.test(path)) return notFound();
  }

  const dash = dashboardHost();
  if (dash) {
    if (onDashboardHost(req.headers)) return dashboardSide(req, path);
    // the main site: the dashboard is elsewhere
    if (DASHBOARD_PAGE.test(path)) return NextResponse.redirect(`${req.nextUrl.protocol}//${dash}${path}${req.nextUrl.search}`, 307);
  }

  const auth = authHost();
  if (auth) {
    if (onAuthHost(req.headers)) return authSide(req, path);
    // the main site: its sign-in pages are on the sign-in address
    if (AUTH_PAGE.test(path)) return NextResponse.redirect(`${req.nextUrl.protocol}//${auth}${path}${req.nextUrl.search}`, 307);
  }

  if (STEPPED[path]) return toTwoStep(req, STEPPED[path]);
  if (!path.startsWith("/api/")) return NextResponse.next();
  return withCors(req);
}

// what the dashboard uses: its account, files, jobs and Traverse jobs (with their shares)
const DASHBOARD_API = /^\/api\/(user\/|traverse\/jobs|auth\/(me|logout|handoff|signout)$|settings\/public$)/;

/** The dashboard address: the dashboard, its APIs and files; its own sign-in without a sign-in address */
function dashboardSide(req: NextRequest, path: string) {
  if (path === "/") return NextResponse.redirect(`${req.nextUrl.protocol}//${dashboardHost()}/dashboard`, 307);
  if (path === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain" } });
  }
  const auth = authHost();
  // signing in: on the sign-in address when there is one, else here
  if (AUTH_PAGE.test(path) && auth) return NextResponse.redirect(`${req.nextUrl.protocol}//${auth}${path}${req.nextUrl.search}`, 307);
  if (!auth && STEPPED[path]) return toTwoStep(req, STEPPED[path]);
  const ownSignIn = !auth && (AUTH_PAGE.test(path) || path.startsWith("/api/auth/"));
  if (DASHBOARD_PAGE.test(path) || DASHBOARD_API.test(path) || ownSignIn || FILE.test(path)) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  if (path.startsWith("/api/")) return notFound();
  return NextResponse.redirect(`${SITE_URL}${path}${req.nextUrl.search}`, 307);
}

/** The sign-in address: the sign-in pages, their APIs and files; nothing else of the site */
function authSide(req: NextRequest, path: string) {
  if (STEPPED[path]) return toTwoStep(req, STEPPED[path]);
  if (path === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain" } });
  }
  if (AUTH_PAGE.test(path) || path.startsWith("/api/auth/") || path === "/api/settings/public" || FILE.test(path)) {
    // same-origin only: no CORS headers here (the programs sign in on the main site)
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  if (path.startsWith("/api/")) return notFound();
  // anything else, "/" too: the main site
  return NextResponse.redirect(`${SITE_URL}${path}${req.nextUrl.search}`, 307);
}

/** The admin address: admin pages, their sign-in and files; nothing of the public site */
function adminSide(req: NextRequest, path: string) {
  if (path === "/") return NextResponse.redirect(`${req.nextUrl.protocol}//${adminHost()}/admin`, 307);
  if (path === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain" } });
  }
  if (ADMIN_PAGE.test(path) || ADMIN_API.test(path) || ADMIN_SIDE_ALSO.test(path) || FILE.test(path)) {
    // same-origin only: no CORS headers here, and never in search engines
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  if (path.startsWith("/api/")) return notFound();
  // a page of the public site: there
  return NextResponse.redirect(`${SITE_URL}${path}${req.nextUrl.search}`, 307);
}

// the old sign-in and sign-up pages, and the first step of the new ones (app/signin, app/signup)
const STEPPED: Record<string, string> = {
  "/login": "/signin/identifier",
  "/login/": "/signin/identifier",
  "/register": "/signup/details",
  "/register/": "/signup/details",
};

/**
 * /login?next=… → the two-step sign-in, /signin/identifier?continue=<full address>&flow=web
 * (app/signin; its page adds the signed state). Google's errors come along. The admin address
 * keeps its own /login.
 */
function toTwoStep(req: NextRequest, to: string) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  const base = isDashboardPath(next) ? `${req.nextUrl.protocol}//${dashboardHost()}` : SITE_URL;
  const q = new URLSearchParams({ continue: `${base}${next}`, flow: "web" });
  const error = req.nextUrl.searchParams.get("error");
  if (error) q.set("error", error);
  return NextResponse.redirect(`${req.nextUrl.protocol}//${req.headers.get("host")}${to}?${q}`, 307);
}

function withCors(req: NextRequest) {
  // lib/http/cors.ts: the site's own addresses may send the visitor's cookies; any other origin gets
  // an answer without credentials
  const headers = corsHeaders(req.headers.get("origin"));
  const res = req.method === "OPTIONS" ? new NextResponse(null, { status: 204 }) : NextResponse.next();
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  if (req.method === "OPTIONS") res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

export const config = {
  // every request but Next's built files and images (the admin address serves only admin)
  matcher: ["/((?!_next/static|_next/image).*)"],
};
