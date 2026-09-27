// Signing in the Windows app through the browser (Google blocks sign-in inside
// embedded app windows). The app listens on 127.0.0.1:<port> and opens
// /app-signin?port=…&state=…; after the visitor confirms, the site sends a new
// session to http://127.0.0.1:<port>/auth-callback, and the app checks the
// state it generated. Only the loopback address is ever used.

export function parseAppLink(port: unknown, state: unknown): { port: number; state: string } | null {
  const p = Number(port);
  const s = String(state ?? "");
  if (!Number.isInteger(p) || p < 1024 || p > 65535) return null;
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(s)) return null;
  return { port: p, state: s };
}

export const appSigninPath = (port: number, state: string) =>
  `/app-signin?port=${port}&state=${encodeURIComponent(state)}`;
