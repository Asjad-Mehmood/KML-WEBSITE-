// Where to send someone after signing in. Only same-site paths are allowed,
// so a crafted ?next=https://evil.example can't turn login into an open redirect.
export function safeNextPath(raw: string | null | undefined, fallback = "/#download"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export const WEB_APP_LOGIN_URL = "/login?next=%2Fapp";
