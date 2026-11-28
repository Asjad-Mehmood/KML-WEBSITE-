import crypto from "crypto";
import { db } from "@/lib/db";

// Stateless reset links: token = base64url({uid, exp}) + "." + HMAC(payload + current password hash).
// Including the password hash makes a link single-use: once the password changes, old links fail.

const TTL_MS = 60 * 60 * 1000; // 1 hour

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ random characters).");
  return s;
}

function sign(payload: string, passwordHash: string): string {
  return crypto.createHmac("sha256", secret()).update(`${payload}.${passwordHash}`).digest("base64url");
}

export function createResetToken(user: { id: string; passwordHash: string }): string {
  const payload = Buffer.from(JSON.stringify({ uid: user.id, exp: Date.now() + TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload, user.passwordHash)}`;
}

/** The user the token belongs to, or null if it is malformed, expired, tampered with or already used. */
export async function verifyResetToken(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let data: { uid?: unknown; exp?: unknown };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data.uid !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) return null;

  const user = await db.findUserById(data.uid);
  if (!user) return null;

  const expected = Buffer.from(sign(payload, user.passwordHash));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  return user;
}
