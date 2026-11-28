// Mistyped domains of the big free mailboxes. Shared by the server's email check
// (lib/auth/emailCheck.ts) and the sign-up page, which offers the fix as they type.
// The usual slips on the big free mailboxes
export const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gamil.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com",
  "gnail.com": "gmail.com", "gmaill.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com", "gmail.om": "gmail.com", "gmail.cmo": "gmail.com", "gmail.comm": "gmail.com",
  "gmailcom": "gmail.com", "gmali.com": "gmail.com", "gimal.com": "gmail.com", "gmaik.com": "gmail.com",
  "gmail.c": "gmail.com", "gmail.in": "gmail.com", "gmil.com": "gmail.com", "g.mail.com": "gmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.co": "yahoo.com", "yahoo.con": "yahoo.com", "yhoo.com": "yahoo.com",
  "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmail.con": "hotmail.com", "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com", "outllok.com": "outlook.com", "outlook.co": "outlook.com", "outlook.con": "outlook.com",
  "iclod.com": "icloud.com", "icloud.co": "icloud.com", "icoud.com": "icloud.com",
};

/** The address with its domain corrected, when it is one of the usual slips; else null */
export function typoFix(email: string): string | null {
  const m = /^([^\s@]+)@([^\s@]+)$/.exec(email.trim().toLowerCase());
  if (!m) return null;
  const fixed = TYPOS[m[2]];
  return fixed ? `${m[1]}@${fixed}` : null;
}
