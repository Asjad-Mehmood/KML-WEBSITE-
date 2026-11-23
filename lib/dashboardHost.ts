// The users' dashboard on an address of its own (NEXT_PUBLIC_DASHBOARD_HOST, e.g.
// account.exceltokml.com).
//
// With it set, /dashboard and what it uses (its APIs, the file and job downloads) answer only
// there; on the main site /dashboard goes there. The dashboard address gets its own session
// through the same handover as the main site (lib/authHost): a signed-out visitor goes to the
// sign-in address's /api/auth/continue?next=/dashboard, which hands a session over straight
// away when they are signed in there, or shows the sign-in first. Without a sign-in address
// (NEXT_PUBLIC_AUTH_HOST) the dashboard address has its own /login.
//
// No database or Node imports: middleware.ts uses this file.

/** The dashboard address in lower case, or null while the dashboard is on the main site */
export function dashboardHost(): string | null {
  const h = (process.env.NEXT_PUBLIC_DASHBOARD_HOST || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return h || null;
}

const bare = (h: string) => h.toLowerCase().replace(/:\d+$/, "");

/** Did this request come to the dashboard address? (false while there is none) */
export function onDashboardHost(headers: Headers): boolean {
  const d = dashboardHost();
  return !!d && bare(headers.get("host") || "") === bare(d);
}

/** In the browser: is this page on the dashboard address? */
export function inDashboardHost(): boolean {
  const d = dashboardHost();
  return !!d && typeof window !== "undefined" && window.location.hostname === bare(d);
}

/** The dashboard's pages */
export const DASHBOARD_PAGE = /^\/dashboard(\/|$)/;

/** Does a handover to `next` belong on the dashboard address? */
export const isDashboardPath = (next: string) => !!dashboardHost() && DASHBOARD_PAGE.test(next.split("?")[0]);

/** The dashboard address as an origin; `proto` as the request's */
export const dashboardOrigin = (proto = "https:") => `${proto}//${dashboardHost()}`;
