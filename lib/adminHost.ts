// Admin on an address of its own (ADMIN_HOST, e.g. admin.exceltokml.com).
//
// With ADMIN_HOST set:
// - the admin pages and APIs answer only there; on the public site /admin goes there and the
//   admin APIs are "not found" (middleware.ts)
// - only admins can sign in there, and only a session made there has admin rights
//   (sessionHasAdminPower). An admin account signed in on the public site, the web apps or the
//   Survey Toolkit is an ordinary account, so a bug on a public page can't reach the admin side.
// Without it, everything works as before: one address, admin rights for every admin session.
//
// Kept free of database and Node imports: middleware.ts uses it too.

/** Sessions made on the admin address start with this */
export const ADMIN_SESSION_PREFIX = "sess_adm_";

/** The admin address in lower case ("admin.exceltokml.com"), or null while admin is on the main site */
export function adminHost(): string | null {
  const h = (process.env.ADMIN_HOST || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return h || null;
}

/** The host a request came to, without its port */
export function requestHostname(headers: Headers): string {
  return (headers.get("host") || "").toLowerCase().replace(/:\d+$/, "");
}

/** Did this request come to the admin address? (false while there is none) */
export function onAdminHost(headers: Headers): boolean {
  const admin = adminHost();
  return !!admin && requestHostname(headers) === admin.replace(/:\d+$/, "");
}

/**
 * Does this session carry admin rights: an admin account, and (once admin has its own address)
 * a session made on that address.
 */
export function sessionHasAdminPower(session: { id: string }, isAdminAccount: boolean): boolean {
  if (!isAdminAccount) return false;
  return !adminHost() || session.id.startsWith(ADMIN_SESSION_PREFIX);
}
