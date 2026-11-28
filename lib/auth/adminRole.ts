// Who counts as an admin. Shared by the server (db.isAdmin, which guards /admin
// and the admin APIs) and the browser (where to go after signing in), so the two
// never disagree: a role that only mentions "admin" is not an admin.
export const ADMIN_EMAIL = "admin@exceltokml.com";

export function isAdminUser(user: { role?: string | null; email?: string | null } | null | undefined): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || user.role === "Super Admin" || user.email?.toLowerCase() === ADMIN_EMAIL;
}
