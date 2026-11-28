// Invite a colleague: every account has a link (/r/<code>). Someone who signs up from it is noted
// as invited by that account, so the inviter can see who joined, and Admin → Usage → Invites shows
// how many people come from invites and who brings the most. There is no reward for it.
// Server only.
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { WORK_ACTIONS } from "@/lib/usageStats";

export const REF_COOKIE = "sxd_ref";

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
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "referrals_pkey" PRIMARY KEY ("referredId")
      )`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "referrals_referrerId_idx" ON "referrals"("referrerId")`);
      for (const [t, col] of [["referral_codes", "userId"], ["referrals", "referredId"], ["referrals", "referrerId"]]) {
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
    const r = await prisma.$queryRawUnsafe<{ code: string }[]>(
      `INSERT INTO "referral_codes" ("userId", "code") VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING "code"`,
      userId,
      newCode()
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

/** A new account came from an invite link. Never throws: an invite must never stop a sign-up. */
export async function recordReferral(newUserId: string, code: string | null | undefined): Promise<void> {
  try {
    const referrerId = code ? await referrerOfCode(code) : null;
    if (!referrerId || referrerId === newUserId) return;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "referrals" ("referredId", "referrerId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      newUserId,
      referrerId
    );
  } catch (e) {
    console.error("[referrals] not recorded:", e);
  }
}

/** For the dashboard card: the code, how many joined from it, and how many of them used an app */
export async function inviteSummary(userId: string) {
  await ensureTables();
  const code = await codeFor(userId);
  const [r] = await prisma.$queryRawUnsafe<{ joined: bigint; active: bigint }[]>(
    `SELECT count(*) AS joined,
            count(*) FILTER (WHERE EXISTS (SELECT 1 FROM "activities" a WHERE a."userId" = r."referredId" AND a."action" = ANY($2::text[]))) AS active
     FROM "referrals" r WHERE r."referrerId" = $1`,
    userId,
    WORK_ACTIONS
  );
  return { code, joined: Number(r?.joined ?? 0), active: Number(r?.active ?? 0) };
}

/** Admin → Usage → Invites */
export async function referralOverview() {
  await ensureTables();
  const [totals, top, recent] = await Promise.all([
    prisma.$queryRawUnsafe<{ joined: bigint; active: bigint }[]>(
      `SELECT count(*) AS joined,
              count(*) FILTER (WHERE EXISTS (SELECT 1 FROM "activities" a WHERE a."userId" = r."referredId" AND a."action" = ANY($1::text[]))) AS active
       FROM "referrals" r`,
      WORK_ACTIONS
    ),
    prisma.$queryRawUnsafe<{ id: string; name: string; email: string; joined: bigint }[]>(
      `SELECT u."id", u."name", u."email", count(*) AS joined
       FROM "referrals" r JOIN "users" u ON u."id" = r."referrerId" GROUP BY 1, 2, 3 ORDER BY joined DESC LIMIT 20`
    ),
    prisma.$queryRawUnsafe<{ friend: string; friendEmail: string; inviter: string; createdAt: Date }[]>(
      `SELECT f."name" AS friend, f."email" AS "friendEmail", i."name" AS inviter, r."createdAt"
       FROM "referrals" r JOIN "users" f ON f."id" = r."referredId" JOIN "users" i ON i."id" = r."referrerId"
       ORDER BY r."createdAt" DESC LIMIT 30`
    ),
  ]);
  return {
    joined: Number(totals[0]?.joined ?? 0),
    active: Number(totals[0]?.active ?? 0),
    top: top.map((t) => ({ id: t.id, name: t.name, email: t.email, joined: Number(t.joined) })),
    recent: recent.map((r) => ({ ...r, createdAt: new Date(r.createdAt).toISOString() })),
  };
}
