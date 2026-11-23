// Sign-in on an address of its own (NEXT_PUBLIC_AUTH_HOST, e.g. auth.exceltokml.com).
//
// With it set:
// - the sign-in pages (/login, /register, /forgot-password, /reset-password, /verify-email) and
//   Google sign-in live there; on the main site those pages go there (middleware.ts)
// - signing in there gives that address a session of its own. The main site gets its own
//   session through a one-time handover code: /api/auth/continue (there) makes a code good for
//   60 seconds, /api/auth/handoff (main site) uses it up. The session token never goes into an
//   address, and the cookies of the two addresses stay apart.
// - signed in there once, the next "Sign in" shows "Continue as …" (or another account)
// - the main site's /api/auth/* stay as they are: the Windows programs and the Survey Toolkit
//   sign in through them.
// Without it everything works as before, on one address.
//
// NEXT_PUBLIC_: the browser needs it too (set it in Vercel, then deploy). No database or Node
// imports: middleware.ts and client components use this file.

import { dashboardHost } from "./dashboardHost";

/** The sign-in address in lower case ("auth.exceltokml.com"), or null while sign-in is on the main site */
export function authHost(): string | null {
  const h = (process.env.NEXT_PUBLIC_AUTH_HOST || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return h || null;
}

const bare = (h: string) => h.toLowerCase().replace(/:\d+$/, "");

/** Did this request come to the sign-in address? (false while there is none) */
export function onAuthHost(headers: Headers): boolean {
  const auth = authHost();
  return !!auth && bare(headers.get("host") || "") === bare(auth);
}

/** The sign-in address as an origin ("https://auth.exceltokml.com"); `proto` as the request's */
export function authOrigin(proto = "https:"): string {
  return `${proto}//${authHost()}`;
}

/** In the browser: is this page on the sign-in address? */
export function inAuthHost(): boolean {
  const auth = authHost();
  return !!auth && typeof window !== "undefined" && window.location.hostname === bare(auth);
}

/**
 * In the browser, after signing out here: where to go to sign out of the site's other addresses
 * too (/api/auth/signout), or null when the site has only one address. On the sign-in address
 * itself ("Use another account") only that address signs out.
 */
export function signOutEverywherePath(): string | null {
  if (typeof window === "undefined" || inAuthHost()) return null;
  const dash = dashboardHost();
  const onDash = !!dash && window.location.hostname === bare(dash);
  const rest = [onDash ? "site" : dash ? "dash" : null, authHost() ? "auth" : null].filter(Boolean);
  return rest.length ? `/api/auth/signout?rest=${rest.join(",")}` : null;
}

/** The sign-in pages */
export const AUTH_PAGE = /^\/(login|register|forgot-password|reset-password|verify-email)\/?$/;

/** Where the sign-in address hands a signed-in visitor back to the main site, at the path `next` */
export const continuePath = (next: string) => `/api/auth/continue?next=${encodeURIComponent(next)}`;
