// "Continue with Google": the OAuth 2.0 authorization-code flow with PKCE,
// using the site's own sessions (no extra auth library).
//
// Settings (Vercel → Environment Variables):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET — from a Google Cloud "OAuth client ID"
//   (Web application), with this Authorized redirect URI:
//   https://www.exceltokml.com/api/auth/google/callback
import crypto from "crypto";

export const GOOGLE_COOKIE = "g_oauth";

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export const callbackUrl = (origin: string) => `${origin}/api/auth/google/callback`;

const b64url = (b: Buffer) => b.toString("base64url");

export function newAuthRequest(origin: string) {
  const state = b64url(crypto.randomBytes(24));
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: callbackUrl(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), state, verifier };
}

export interface GoogleProfile {
  email: string;
  name: string;
}

/** Swap the code for tokens, then read the verified email and name */
export async function profileFromCode(code: string, verifier: string, origin: string): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: callbackUrl(origin),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed (${tokenRes.status})`);
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("Google sent no access token");

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!infoRes.ok) throw new Error(`Google profile request failed (${infoRes.status})`);
  const info = (await infoRes.json()) as { email?: string; email_verified?: boolean; name?: string; given_name?: string };
  if (!info.email || info.email_verified !== true) throw new Error("Google account email is not verified");
  return { email: info.email.toLowerCase(), name: (info.name || info.given_name || info.email.split("@")[0]).slice(0, 100) };
}
