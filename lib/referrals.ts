// Invite a friend: every account has a link (/r/<code>). Someone who signs up from it is noted as
// invited by that account, and once they have really used an app (one conversion, export, saved
// job or calculation), the person who invited them earns a month of Pro.
//
// A month earned while the paid plans' limits are off is saved ("banked") and starts when they go
// on, so nobody loses it. At most MAX_REWARDS months per account. Sign-ups from the same network
// address as the inviter are noted but not rewarded (Admin → Usage → Invites shows them).
// Server only.
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { WORK_ACTIONS } from "@/lib/usageStats";

export const REF_COOKIE = "sxd_ref";
export const REWARD_DAYS = 30;
export const MAX_REWARDS = 12;

let ready: Promise<void> | null = null;
function ensureTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "referral_codes" (
        "userId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("userId")
      )`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "referral_codes_code_key" ON "referral_codes"("code")`);
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "referrals" (
        "referredId" TEXT NOT NULL,
        "referrerId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "note" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "rewardedAt" TIMESTAMP(3),
        CONSTRAINT "referrals_pkey" PRIMARY KEY ("referredId")
      )`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "referrals_referrerId_idx" ON "referrals"("referrerId")`);
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "referral_credit" (
        "userId" TEXT NOT NULL,
        "bankedDays" INTEGER NOT NULL DEFAULT 0,
        "proUntil" TIMESTAMP(3),
        CONSTRAINT "referral_credit_pkey" PRIMARY KEY ("userId")
      )`);
      for (const [t, col] of [["referral_codes", "userId"], ["referrals", "referredId"], ["referrals", "referrerId"], ["referral_credit", "userId"]]) {
        await prisma.$executeRawUnsafe(`DO $$ BEGIN
          ALTER TABLE "${t}" ADD CONSTRAINT "${t}_${col}_fkey" FOREIGN KEY ("${col}") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      }
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

// no 0/O, 1/I/L: easy to read out and type
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 7 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
export const cleanCode = (v: unknown) => (typeof v === "string" ? v.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) : "");

/** This account's invite code, made the first time it is asked for */
export async function codeFor(userId: string): Promise<string> {
  await ensureTables();
  const have = await prisma.$queryRawUnsafe<{ code: string }[]>(`SELECT "code" FROM "referral_codes" WHERE "userId" = $1`, userId);
  if (have[0]) return have[0].code;
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const r = await prisma.$queryRawUnsafe<{ code: string }[]>(
      `INSERT INTO "referral_codes" ("userId", "code") VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING "code"`,
      userId,
      code
    );
    if (r[0]) return r[0].code;
    const again = await prisma.$queryRawUnsafe<{ code: string }[]>(`SELECT "code" FROM "referral_codes" WHERE "userId" = $1`, userId);
    if (again[0]) return again[0].code;
  }
  throw new Error("No invite code could be made");
}

export async function referrerOfCode(code: string): Promise<string | null> {
  const c = cleanCode(code);
  if (!c) return null;
  await ensureTables();
  const r = await prisma.$queryRawUnsafe<{ userId: string }[]>(`SELECT "userId" FROM "referral_codes" WHERE "code" = $1`, c);
  return r[0]?.userId ?? null;
}

/**
 * A new account came from an invite link. Never throws: an invite must never stop a sign-up.
 * Only brand-new accounts are noted, once.
 */
export async function recordReferral(newUserId: string, code: string | null | undefined, ip?: string | null): Promise<void> {
  try {
    const referrerId = code ? await referrerOfCode(code) : null;
    if (!referrerId || referrerId === newUserId) return;
    const inviter = await prisma.$queryRawUnsafe<{ ipAddress: string | null }[]>(`SELECT "ipAddress" FROM "users" WHERE "id" = $1`, referrerId);
    const sameNet = Boolean(ip && inviter[0]?.ipAddress && inviter[0].ipAddress === ip);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "referrals" ("referredId", "referrerId", "status", "note") VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      newUserId,
      referrerId,
      sameNet ? "held" : "pending",
      sameNet ? "Signed up from the inviter's network address" : ""
    );
  } catch (e) {
    console.error("[referrals] not recorded:", e);
  }
}

/** Pending invites whose friend has done some work: reward their inviters. Returns how many. */
export async function processRewards(referrerId?: string, limitsOn = false): Promise<number> {
  await ensureTables();
  const due = await prisma.$queryRawUnsafe<{ referredId: string; referrerId: string }[]>(
    `SELECT r."referredId", r."referrerId" FROM "referrals" r
     WHERE r."status" = 'pending' ${referrerId ? `AND r."referrerId" = $2` : ""}
       AND EXISTS (SELECT 1 FROM "activities" a WHERE a."userId" = r."referredId" AND a."action" = ANY($1::text[]))
     LIMIT 500`,
    ...(referrerId ? [WORK_ACTIONS, referrerId] : [WORK_ACTIONS])
  );
  let n = 0;
  for (const d of due) {
    const earned = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT count(*) AS n FROM "referrals" WHERE "referrerId" = $1 AND "status" = 'rewarded'`,
      d.referrerId
    );
    if (Number(earned[0]?.n ?? 0) >= MAX_REWARDS) {
      await prisma.$executeRawUnsafe(`UPDATE "referrals" SET "status" = 'capped', "note" = 'The inviter already has the most months' WHERE "referredId" = $1`, d.referredId);
      continue;
    }
    // claim it first, so two runs at once never reward the same friend twice
    const claimed = await prisma.$executeRawUnsafe(
      `UPDATE "referrals" SET "status" = 'rewarded', "rewardedAt" = now() WHERE "referredId" = $1 AND "status" = 'pending'`,
      d.referredId
    );
    if (!claimed) continue;
    await addCredit(d.referrerId, REWARD_DAYS, limitsOn);
    n++;
  }
  return n;
}

async function addCredit(userId: string, days: number, limitsOn: boolean) {
  if (limitsOn) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "referral_credit" ("userId", "bankedDays", "proUntil") VALUES ($1, 0, now() + ($2 || ' days')::interval)
       ON CONFLICT ("userId") DO UPDATE SET "proUntil" = GREATEST(coalesce("referral_credit"."proUntil", now()), now()) + ($2 || ' days')::interval`,
      userId,
      String(days)
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "referral_credit" ("userId", "bankedDays") VALUES ($1, $2)
       ON CONFLICT ("userId") DO UPDATE SET "bankedDays" = "referral_credit"."bankedDays" + $2`,
      userId,
      days
    );
  }
}

/**
 * Pro earned by inviting friends, for lib/billing. While the limits are on, banked days start
 * now (once). Never throws: no credit is read as none.
 */
export async function referralProUntil(userId: string, limitsOn: boolean): Promise<Date | null> {
  try {
    await ensureTables();
    if (limitsOn) {
      await prisma.$executeRawUnsafe(
        `UPDATE "referral_credit" SET "proUntil" = GREATEST(coalesce("proUntil", now()), now()) + ("bankedDays" || ' days')::interval, "bankedDays" = 0
         WHERE "userId" = $1 AND "bankedDays" > 0`,
        userId
      );
    }
    const r = await prisma.$queryRawUnsafe<{ proUntil: Date | null }[]>(`SELECT "proUntil" FROM "referral_credit" WHERE "userId" = $1`, userId);
    const until = r[0]?.proUntil ? new Date(r[0].proUntil) : null;
    return until && until.getTime() > Date.now() ? until : null;
  } catch (e) {
    console.error("[referrals] credit unreadable:", e);
    return null;
  }
}

/** For the dashboard card */
export async function inviteSummary(userId: string) {
  await ensureTables();
  const code = await codeFor(userId);
  const rows = await prisma.$queryRawUnsafe<{ status: string; n: bigint }[]>(
    `SELECT "status", count(*) AS n FROM "referrals" WHERE "referrerId" = $1 GROUP BY 1`,
    userId
  );
  const by = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
  const credit = await prisma.$queryRawUnsafe<{ bankedDays: number; proUntil: Date | null }[]>(
    `SELECT "bankedDays", "proUntil" FROM "referral_credit" WHERE "userId" = $1`,
    userId
  );
  const until = credit[0]?.proUntil ? new Date(credit[0].proUntil) : null;
  return {
    code,
    joined: (by.pending ?? 0) + (by.rewarded ?? 0) + (by.held ?? 0) + (by.capped ?? 0),
    waiting: by.pending ?? 0,
    rewarded: by.rewarded ?? 0,
    bankedDays: credit[0]?.bankedDays ?? 0,
    proUntil: until && until.getTime() > Date.now() ? until.toISOString() : null,
    maxRewards: MAX_REWARDS,
  };
}

/** Admin → Usage → Invites */
export async function referralOverview() {
  await ensureTables();
  const [totals, top, recent] = await Promise.all([
    prisma.$queryRawUnsafe<{ status: string; n: bigint }[]>(`SELECT "status", count(*) AS n FROM "referrals" GROUP BY 1`),
    prisma.$queryRawUnsafe<{ id: string; name: string; email: string; joined: bigint; rewarded: bigint }[]>(
      `SELECT u."id", u."name", u."email", count(*) AS joined, count(*) FILTER (WHERE r."status" = 'rewarded') AS rewarded
       FROM "referrals" r JOIN "users" u ON u."id" = r."referrerId" GROUP BY 1, 2, 3 ORDER BY joined DESC LIMIT 20`
    ),
    prisma.$queryRawUnsafe<{ friend: string; friendEmail: string; inviter: string; status: string; note: string; createdAt: Date }[]>(
      `SELECT f."name" AS friend, f."email" AS "friendEmail", i."name" AS inviter, r."status", r."note", r."createdAt"
       FROM "referrals" r JOIN "users" f ON f."id" = r."referredId" JOIN "users" i ON i."id" = r."referrerId"
       ORDER BY r."createdAt" DESC LIMIT 30`
    ),
  ]);
  return {
    totals: Object.fromEntries(totals.map((t) => [t.status, Number(t.n)])),
    top: top.map((t) => ({ id: t.id, name: t.name, email: t.email, joined: Number(t.joined), rewarded: Number(t.rewarded) })),
    recent: recent.map((r) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() })),
  };
}
