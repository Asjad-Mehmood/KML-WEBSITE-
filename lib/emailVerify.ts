// Confirming that an account's email address is real and belongs to the person who signed up.
//
// A new email-and-password account can't sign in until its owner proves the address: we email
// a 6-digit code (typed into the website, the web app or Traverse & Level) and a link (for the
// installed programs, whose sign-up screens only show our message). Google accounts, and
// anyone who sets a new password from the reset email, have proved it already.
//
// Accounts made before this existed have no row in user_email_status: they keep signing in as
// before unless Admin → Settings asks older accounts to confirm too. Codes and link tokens are
// stored only as HMAC hashes. A code works for 24 hours, once, and dies after 5 wrong tries.
// The tables are created on first use (production deploys don't run migrations).
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { getExtraSettings } from "@/lib/siteSettings";
import { isAdminUser } from "@/lib/adminRole";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { maskEmail } from "@/lib/adminOtp";

const VALID_HOURS = 24;
const MAX_TRIES = 5;
const MAX_CODES_PER_15_MIN = 4;

export type VerifyMethod = "code" | "link" | "google" | "reset" | "admin";

let ready: Promise<void> | null = null;
export function ensureVerifyTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "user_email_status" (
        "userId" TEXT NOT NULL,
        "required" BOOLEAN NOT NULL DEFAULT false,
        "verifiedAt" TIMESTAMP(3),
        "method" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_email_status_pkey" PRIMARY KEY ("userId")
      )`);
      await prisma.$executeRawUnsafe(`DO $$ BEGIN
        ALTER TABLE "user_email_status" ADD CONSTRAINT "user_email_status_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "email_verify_codes" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "challengeHash" TEXT NOT NULL,
        "codeHash" TEXT NOT NULL,
        "linkHash" TEXT NOT NULL,
        "tries" INTEGER NOT NULL DEFAULT 0,
        "usedAt" TIMESTAMP(3),
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "email_verify_codes_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "email_verify_codes_challenge_key" ON "email_verify_codes"("challengeHash")`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "email_verify_codes_link_key" ON "email_verify_codes"("linkHash")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "email_verify_codes_user_idx" ON "email_verify_codes"("userId", "createdAt")`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const pepper = () => process.env.AUTH_SECRET || process.env.DATABASE_URL || "excel-to-kml";
const hash = (kind: string, value: string) => crypto.createHmac("sha256", pepper()).update(`verify-${kind}:${value}`).digest("hex");
const same = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export interface EmailStatus {
  /** this account must confirm its email before it can sign in */
  required: boolean;
  verifiedAt: string | null;
  method: VerifyMethod | null;
}

/** Each account's confirmation state; accounts with no row are older ones (not required, not confirmed) */
export async function emailStatuses(userIds: string[]): Promise<Map<string, EmailStatus>> {
  const out = new Map<string, EmailStatus>();
  if (!userIds.length) return out;
  await ensureVerifyTables();
  const rows = await prisma.$queryRawUnsafe<{ userId: string; required: boolean; verifiedAt: Date | null; method: VerifyMethod | null }[]>(
    `SELECT "userId","required","verifiedAt","method" FROM "user_email_status" WHERE "userId" = ANY($1::text[])`,
    userIds
  );
  for (const r of rows) out.set(r.userId, { required: r.required, verifiedAt: r.verifiedAt?.toISOString() ?? null, method: r.method });
  return out;
}

export async function emailStatus(userId: string): Promise<EmailStatus | null> {
  return (await emailStatuses([userId])).get(userId) ?? null;
}

/** Confirmation is on: the setting allows it and email can be sent (without email no one could finish signing up) */
export async function verificationActive(): Promise<boolean> {
  if (!isMailConfigured()) return false;
  return (await getExtraSettings()).verifyEmails;
}

/** Whether this account has to confirm its email before it signs in */
export async function mustVerify(user: { id: string; role?: string; email?: string }): Promise<boolean> {
  if (isAdminUser(user)) return false; // admins have their own sign-in code
  if (!(await verificationActive())) return false;
  const s = await emailStatus(user.id);
  if (s?.verifiedAt) return false;
  if (s?.required) return true;
  return (await getExtraSettings()).verifyOldAccounts;
}

/** A new account made with a password: it has to confirm its email */
export async function markRequired(userId: string): Promise<void> {
  await ensureVerifyTables();
  await prisma.$executeRaw`
    INSERT INTO "user_email_status" ("userId","required") VALUES (${userId}, true)
    ON CONFLICT ("userId") DO UPDATE SET "required" = true`;
}

/** The owner proved the address (code, link, Google, password reset or an admin) */
export async function markVerified(userId: string, method: VerifyMethod): Promise<void> {
  await ensureVerifyTables();
  await prisma.$executeRaw`
    INSERT INTO "user_email_status" ("userId","required","verifiedAt","method") VALUES (${userId}, false, NOW(), ${method})
    ON CONFLICT ("userId") DO UPDATE SET "verifiedAt" = COALESCE("user_email_status"."verifiedAt", NOW()),
      "method" = COALESCE("user_email_status"."method", EXCLUDED."method")`;
  await prisma.$executeRaw`UPDATE "email_verify_codes" SET "usedAt" = NOW() WHERE "userId" = ${userId} AND "usedAt" IS NULL`;
}

/** An admin takes back a confirmation (the address turned out wrong): the account must confirm again */
export async function markUnverified(userId: string): Promise<void> {
  await ensureVerifyTables();
  await prisma.$executeRaw`
    INSERT INTO "user_email_status" ("userId","required") VALUES (${userId}, true)
    ON CONFLICT ("userId") DO UPDATE SET "required" = true, "verifiedAt" = NULL, "method" = NULL`;
}

/** An account that signed up but never confirmed: its email was never proved, so someone else may claim it */
export async function isUnconfirmedNewAccount(userId: string): Promise<boolean> {
  const s = await emailStatus(userId);
  return Boolean(s?.required && !s.verifiedAt);
}

export class TooManyVerifyCodes extends Error {}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function verifyEmail(name: string, code: string, link: string) {
  const first = (name || "").trim().split(/\s+/)[0] || "there";
  const subject = `${code} is your ${SITE_NAME} confirmation code`;
  const text = [
    `Hi ${first},`,
    "",
    `Your ${SITE_NAME} confirmation code is ${code}`,
    "",
    "Type it where you created your account. It works for 24 hours.",
    "",
    "Signed up in the Windows or Android app? Open this link instead, then sign in again in the app:",
    link,
    "",
    `If you didn't create an account on ${SITE_URL.replace(/^https?:\/\//, "")}, ignore this email: nothing happens without the code.`,
    "",
    `The ${SITE_NAME} team`,
  ].join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px">
<tr><td style="padding:28px 28px 8px">
<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0071e3">${esc(SITE_NAME)}</p>
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3">Confirm your email</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">Hi ${esc(first)}, type this code where you created your account:</p>
<p style="margin:0 0 16px;padding:16px;border-radius:12px;background:#f1f5f9;text-align:center;font-size:34px;letter-spacing:8px;font-weight:800;font-family:Menlo,Consolas,monospace">${code}</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#64748b">It works for 24 hours.</p>
<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#334155">Signed up in the Windows or Android app? Press the button, then sign in again in the app.</p>
<p style="margin:0 0 22px"><a href="${esc(link)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#0071e3;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Confirm my email</a></p>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #e2e8f0;font-size:12.5px;line-height:1.6;color:#64748b">
If you didn't create an account, ignore this email: nothing happens without the code. Questions? Write to ${esc(SUPPORT_EMAIL)}.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}

/**
 * Email a fresh code and link to the account. Returns the challenge the client sends back with
 * the code. Only the newest code works. Throws TooManyVerifyCodes after a few in 15 minutes.
 */
export async function sendVerification(user: { id: string; name: string; email: string }): Promise<{ challenge: string; sentTo: string }> {
  await ensureVerifyTables();
  const recent = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*) AS n FROM "email_verify_codes" WHERE "userId" = ${user.id} AND "createdAt" > NOW() - INTERVAL '15 minutes'`;
  if (Number(recent[0]?.n ?? 0) >= MAX_CODES_PER_15_MIN) throw new TooManyVerifyCodes();

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const challenge = crypto.randomBytes(24).toString("base64url");
  const linkToken = crypto.randomBytes(24).toString("base64url");
  const id = "evc_" + crypto.randomBytes(8).toString("hex");
  await prisma.$executeRaw`UPDATE "email_verify_codes" SET "usedAt" = NOW() WHERE "userId" = ${user.id} AND "usedAt" IS NULL`;
  await prisma.$executeRaw`
    INSERT INTO "email_verify_codes" ("id","userId","challengeHash","codeHash","linkHash","expiresAt")
    VALUES (${id}, ${user.id}, ${hash("challenge", challenge)}, ${hash("code:" + challenge, code)}, ${hash("link", linkToken)},
            ${new Date(Date.now() + VALID_HOURS * 3600_000)})`;
  try {
    await sendMail({ to: user.email, ...verifyEmail(user.name, code, `${SITE_URL}/api/auth/verify-email?t=${linkToken}`) });
  } catch (err) {
    // not sent: it mustn't count against the few codes allowed
    await prisma.$executeRaw`DELETE FROM "email_verify_codes" WHERE "id" = ${id}`;
    throw err;
  }
  // expired codes are of no use to anyone
  await prisma.$executeRaw`DELETE FROM "email_verify_codes" WHERE "expiresAt" < NOW() - INTERVAL '7 days'`;
  return { challenge, sentTo: maskEmail(user.email) };
}

/** The account an earlier challenge was for (for "Send a new code"), if it is recent */
export async function challengeOwner(challenge: string): Promise<string | null> {
  await ensureVerifyTables();
  const rows = await prisma.$queryRaw<{ userId: string }[]>`
    SELECT "userId" FROM "email_verify_codes"
    WHERE "challengeHash" = ${hash("challenge", challenge)} AND "createdAt" > NOW() - INTERVAL '2 days'`;
  return rows[0]?.userId ?? null;
}

export type VerifyCheck = { ok: true; userId: string } | { ok: false; reason: "invalid" | "expired" | "locked" };

/** Check a typed code. Right: the account is confirmed. Wrong: a try is used; the 5th kills the code. */
export async function checkVerifyCode(challenge: string, code: string): Promise<VerifyCheck> {
  await ensureVerifyTables();
  const rows = await prisma.$queryRaw<{ id: string; userId: string; codeHash: string; tries: number; usedAt: Date | null; expiresAt: Date }[]>`
    SELECT "id","userId","codeHash","tries","usedAt","expiresAt" FROM "email_verify_codes" WHERE "challengeHash" = ${hash("challenge", challenge)}`;
  const row = rows[0];
  if (!row) return { ok: false, reason: "expired" };
  const right = /^\d{6}$/.test(code) && same(hash("code:" + challenge, code), row.codeHash);
  // confirmed meanwhile with the link in the same email: the right code still signs in
  if (row.usedAt) return right && (await emailStatus(row.userId))?.verifiedAt ? { ok: true, userId: row.userId } : { ok: false, reason: "expired" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.tries >= MAX_TRIES) return { ok: false, reason: "locked" };
  if (!right) {
    const tries = row.tries + 1;
    await prisma.$executeRaw`UPDATE "email_verify_codes" SET "tries" = ${tries}, "usedAt" = ${tries >= MAX_TRIES ? new Date() : null} WHERE "id" = ${row.id}`;
    return { ok: false, reason: tries >= MAX_TRIES ? "locked" : "invalid" };
  }
  await markVerified(row.userId, "code");
  return { ok: true, userId: row.userId };
}

/** The link from the email: confirms the account it was sent to. Returns that account, or null. */
export async function confirmByLink(token: string): Promise<string | null> {
  if (!token || token.length > 100) return null;
  await ensureVerifyTables();
  const rows = await prisma.$queryRaw<{ userId: string; usedAt: Date | null; expiresAt: Date }[]>`
    SELECT "userId","usedAt","expiresAt" FROM "email_verify_codes" WHERE "linkHash" = ${hash("link", token)}`;
  const row = rows[0];
  if (!row) return null;
  // opened twice (or a mail scanner opened it first): still fine once confirmed
  if ((await emailStatus(row.userId))?.verifiedAt) return row.userId;
  if (row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  await markVerified(row.userId, "link");
  return row.userId;
}

/** Counts for Admin → Users */
export async function verifyCounts(): Promise<{ confirmed: number; waiting: number }> {
  await ensureVerifyTables();
  const rows = await prisma.$queryRaw<{ confirmed: bigint; waiting: bigint }[]>`
    SELECT COUNT(*) FILTER (WHERE "verifiedAt" IS NOT NULL) AS confirmed,
           COUNT(*) FILTER (WHERE "verifiedAt" IS NULL AND "required") AS waiting
    FROM "user_email_status"`;
  return { confirmed: Number(rows[0]?.confirmed ?? 0), waiting: Number(rows[0]?.waiting ?? 0) };
}

/** The message every client shows when an account still has to confirm (old app versions show only this) */
export function confirmMessage(sentTo: string): string {
  return `Confirm your email to finish. We sent a 6-digit code and a link to ${sentTo}. Enter the code, or open the link in the email and then sign in. Not there? Look in Spam.`;
}
