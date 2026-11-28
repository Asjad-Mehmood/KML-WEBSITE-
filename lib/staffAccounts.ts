// Accounts the site makes itself (lib/db.ts seeds them, scripts/set-password.mjs), never real
// people: left out of user counts and statistics, and never sent emails.
export const STAFF_EMAILS = ["admin@exceltokml.com", "surveyor@geotech.com", "demo@surveyor.io", "surveyor.demo@geotech.com"] as const;

/** SQL that keeps these accounts out, e.g. notStaff('u."email"') → u."email" NOT IN ('admin@…', …) */
export function notStaff(column = '"email"'): string {
  return `${column} NOT IN (${STAFF_EMAILS.map((e) => `'${e}'`).join(",")})`;
}
