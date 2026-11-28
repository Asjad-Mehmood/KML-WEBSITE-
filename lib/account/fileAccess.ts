// Who may download or delete a file kept in an account (app/api/user/files/[id]).

/**
 * The same owner rule for downloading and deleting: the account the file is kept under; a file
 * kept before files were tied to an account id belongs to the account with its email. Files
 * with neither are for admins only.
 */
export function ownsFile(user: { id: string; email: string } | null, record: { userId?: string | null; userEmail?: string | null }): boolean {
  if (!user) return false;
  if (record.userId) return user.id === record.userId;
  return Boolean(record.userEmail && user.email.toLowerCase() === record.userEmail.toLowerCase());
}
