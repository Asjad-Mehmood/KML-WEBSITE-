// Two-step sign-in for admins. After the password, a browser we haven't seen
// before must enter a 6-digit code emailed to the admin; a browser that
// already passed that check (and was trusted) signs in with the password alone.
//
// Codes and trust tokens are stored only as HMAC hashes. A code lasts 10
// minutes, works once and is dead after 5 wrong tries. A trusted browser is
// remembered for 90 days from its last use, and can be revoked in Admin →
// Settings or by changing the password.
//
// Tables are created here on first use, like the contact messages table.
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/site";

export const TRUST_COOKIE = "kml_admin_trust";
export const TRUST_DAYS = 90;
const CODE_MINUTES = 10;
const MAX_TRIES = 5;
const MAX_CODES_PER_15_MIN = 5;

/** Codes need email. Without SMTP they can't be delivered, so sign-in stays password-only (and Admin → Settings says so). */
export function otpAvailable(): boolean {
  return isMailConfigured() && process.env.ADMIN_OTP !== "off";
}

let ready: Promise<void> | null = null;
function ensureTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "admin_login_codes" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "challengeHash" TEXT NOT NULL,
        "codeHash" TEXT NOT NULL,
        "tries" INTEGER NOT NULL DEFAULT 0,
        "usedAt" TIMESTAMP(3),
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "admin_login_codes_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "admin_login_codes_challenge_key" ON "admin_login_codes"("challengeHash")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "admin_login_codes_user_idx" ON "admin_login_codes"("userId", "createdAt")`);
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "admin_trusted_browsers" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "tokenHash" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "ipAddress" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "admin_trusted_browsers_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "admin_trusted_browsers_token_key" ON "admin_trusted_browsers"("tokenHash")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "admin_trusted_browsers_user_idx" ON "admin_trusted_browsers"("userId")`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const pepper = () => process.env.AUTH_SECRET || process.env.DATABASE_URL || "excel-to-kml";
const hash = (kind: string, value: string) => crypto.createHmac("sha256", pepper()).update(`${kind}:${value}`).digest("hex");
const same = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** "Chrome on Windows" from a User-Agent string */
export function browserLabel(ua: string | null): string {
  const s = ua || "";
  const browser = /Edg\//.test(s) ? "Edge" : /OPR\/|Opera/.test(s) ? "Opera" : /Firefox\//.test(s) ? "Firefox" : /Chrome\//.test(s) ? "Chrome" : /Safari\//.test(s) ? "Safari" : "Browser";
  const os = /Windows/.test(s) ? "Windows" : /Android/.test(s) ? "Android" : /iPhone|iPad|iOS/.test(s) ? "iOS" : /Mac OS X/.test(s) ? "macOS" : /Linux/.test(s) ? "Linux" : "unknown system";
  return `${browser} on ${os}`;
}

export function maskEmail(email: string): string {
  const [name, domain = ""] = email.split("@");
  return `${name.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(name.length - 1, 6)))}@${domain}`;
}

// ─── Trusted browsers ───────────────────────────────────────────────────────

/** True when the request carries a trust cookie issued to this user. Renews it on use. */
export async function isTrustedBrowser(req: NextRequest, userId: string): Promise<boolean> {
  const token = req.cookies.get(TRUST_COOKIE)?.value;
  if (!token || token.length > 200) return false;
  await ensureTables();
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "admin_trusted_browsers"
    WHERE "tokenHash" = ${hash("trust", token)} AND "userId" = ${userId} AND "expiresAt" > NOW()`;
  if (!rows[0]) return false;
  const expires = new Date(Date.now() + TRUST_DAYS * 86400_000);
  await prisma.$executeRaw`UPDATE "admin_trusted_browsers" SET "lastUsedAt" = NOW(), "expiresAt" = ${expires} WHERE "id" = ${rows[0].id}`;
  return true;
}

/** Remember this browser. Returns the cookie value to set. */
export async function trustBrowser(userId: string, req: NextRequest, ip: string): Promise<string> {
  await ensureTables();
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TRUST_DAYS * 86400_000);
  await prisma.$executeRaw`
    INSERT INTO "admin_trusted_browsers" ("id", "userId", "tokenHash", "label", "ipAddress", "expiresAt")
    VALUES (${"tb_" + crypto.randomBytes(8).toString("hex")}, ${userId}, ${hash("trust", token)},
            ${browserLabel(req.headers.get("user-agent"))}, ${ip === "unknown" ? null : ip}, ${expires})`;
  // expired rows are of no use to anyone
  await prisma.$executeRaw`DELETE FROM "admin_trusted_browsers" WHERE "expiresAt" < NOW()`;
  return token;
}

export interface TrustedBrowser {
  id: string;
  label: string;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

export async function listTrustedBrowsers(userId: string, req: NextRequest): Promise<TrustedBrowser[]> {
  await ensureTables();
  const cookie = req.cookies.get(TRUST_COOKIE)?.value;
  const currentHash = cookie ? hash("trust", cookie) : null;
  const rows = await prisma.$queryRaw<
    { id: string; label: string; ipAddress: string | null; createdAt: Date; lastUsedAt: Date; tokenHash: string }[]
  >`SELECT "id", "label", "ipAddress", "createdAt", "lastUsedAt", "tokenHash" FROM "admin_trusted_browsers"
    WHERE "userId" = ${userId} AND "expiresAt" > NOW() ORDER BY "lastUsedAt" DESC`;
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    ipAddress: r.ipAddress,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt.toISOString(),
    current: currentHash === r.tokenHash,
  }));
}

/** Forget one browser, or all of them when no id is given. Returns how many were removed. */
export async function revokeTrustedBrowsers(userId: string, id?: string): Promise<number> {
  await ensureTables();
  return id
    ? prisma.$executeRaw`DELETE FROM "admin_trusted_browsers" WHERE "userId" = ${userId} AND "id" = ${id}`
    : prisma.$executeRaw`DELETE FROM "admin_trusted_browsers" WHERE "userId" = ${userId}`;
}

// ─── Codes ──────────────────────────────────────────────────────────────────

export class TooManyCodes extends Error {}

function codeEmail(code: string, ip: string, ua: string | null) {
  const when = new Date().toUTCString();
  const where = `${browserLabel(ua)}${ip !== "unknown" ? `, IP ${ip}` : ""}`;
  const text = [
    `Your Excel to KML admin sign-in code is ${code}`,
    "",
    `It works for ${CODE_MINUTES} minutes and only once.`,
    `Requested: ${when}`,
    `From: ${where}`,
    "",
    "If this wasn't you, someone knows your admin password. Don't share this code, and change your password now:",
    `${SITE_URL}/forgot-password`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1d1d1f">
  <h2 style="margin:0 0 8px">Admin sign-in code</h2>
  <p style="margin:0 0 16px;color:#555">Enter this code to finish signing in:</p>
  <p style="font-size:34px;letter-spacing:8px;font-weight:800;background:#f5f5f7;border-radius:12px;padding:16px;text-align:center;margin:0 0 16px">${code}</p>
  <p style="margin:0 0 4px;color:#555">It works for ${CODE_MINUTES} minutes and only once.</p>
  <p style="margin:0 0 16px;color:#555;font-size:13px">Requested ${when}<br>From ${where.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>
  <p style="color:#b42318;font-size:13px">If this wasn't you, someone knows your admin password. Don't share this code, and <a href="${SITE_URL}/forgot-password">change your password now</a>.</p>
</div>`;
  return { subject: `${code} is your Excel to KML admin sign-in code`, text, html };
}

async function issue(userId: string, email: string, ip: string, ua: string | null): Promise<string> {
  await ensureTables();
  const recent = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*) AS n FROM "admin_login_codes" WHERE "userId" = ${userId} AND "createdAt" > NOW() - INTERVAL '15 minutes'`;
  if (Number(recent[0]?.n ?? 0) >= MAX_CODES_PER_15_MIN) throw new TooManyCodes();

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const challenge = crypto.randomBytes(24).toString("base64url");
  // only the newest code works
  await prisma.$executeRaw`UPDATE "admin_login_codes" SET "usedAt" = NOW() WHERE "userId" = ${userId} AND "usedAt" IS NULL`;
  await prisma.$executeRaw`
    INSERT INTO "admin_login_codes" ("id", "userId", "challengeHash", "codeHash", "expiresAt")
    VALUES (${"otp_" + crypto.randomBytes(8).toString("hex")}, ${userId}, ${hash("challenge", challenge)},
            ${hash("code:" + challenge, code)}, ${new Date(Date.now() + CODE_MINUTES * 60_000)})`;
  await sendMail({ to: email, ...codeEmail(code, ip, ua) });
  return challenge;
}

/** Email a new code for a password that was just checked. Returns the challenge the browser must send back. */
export const startChallenge = issue;

/** A fresh code for an earlier challenge (same person), e.g. "Resend code". */
export async function resendChallenge(challenge: string, email: (userId: string) => Promise<string | null>, ip: string, ua: string | null) {
  await ensureTables();
  const rows = await prisma.$queryRaw<{ userId: string }[]>`
    SELECT "userId" FROM "admin_login_codes"
    WHERE "challengeHash" = ${hash("challenge", challenge)} AND "createdAt" > NOW() - INTERVAL '30 minutes'`;
  if (!rows[0]) return null;
  const to = await email(rows[0].userId);
  if (!to) return null;
  return { userId: rows[0].userId, email: to, challenge: await issue(rows[0].userId, to, ip, ua) };
}

export type CodeCheck = { ok: true; userId: string } | { ok: false; reason: "invalid" | "expired" | "locked"; userId?: string };

/** Check a code. Right code: the challenge is spent. Wrong code: counts as a try, and the 5th wrong one kills the challenge. */
export async function checkCode(challenge: string, code: string): Promise<CodeCheck> {
  await ensureTables();
  const rows = await prisma.$queryRaw<
    { id: string; userId: string; codeHash: string; tries: number; usedAt: Date | null; expiresAt: Date }[]
  >`SELECT "id", "userId", "codeHash", "tries", "usedAt", "expiresAt" FROM "admin_login_codes" WHERE "challengeHash" = ${hash("challenge", challenge)}`;
  const row = rows[0];
  if (!row || row.usedAt) return { ok: false, reason: "expired" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.tries >= MAX_TRIES) return { ok: false, reason: "locked" };

  if (!/^\d{6}$/.test(code) || !same(hash("code:" + challenge, code), row.codeHash)) {
    const tries = row.tries + 1;
    await prisma.$executeRaw`UPDATE "admin_login_codes" SET "tries" = ${tries}, "usedAt" = ${tries >= MAX_TRIES ? new Date() : null} WHERE "id" = ${row.id}`;
    return { ok: false, reason: tries >= MAX_TRIES ? "locked" : "invalid", userId: row.userId };
  }
  // one use only: the update only succeeds for the first request that gets here
  const spent = await prisma.$executeRaw`UPDATE "admin_login_codes" SET "usedAt" = NOW() WHERE "id" = ${row.id} AND "usedAt" IS NULL`;
  return spent === 1 ? { ok: true, userId: row.userId } : { ok: false, reason: "expired" };
}
