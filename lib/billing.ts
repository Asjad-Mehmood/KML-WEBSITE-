// Paid plans for the web apps: who is on which plan, how much they have used, and whether a
// limit stops them. Server only.
//
// SWITCHED OFF unless BILLING_ENABLED=1. On the live site (Vercel production) it stays off
// even then, unless BILLING_IN_PRODUCTION=1 is set too. While it is off, every check answers
// "allowed" and nothing about plans shows anywhere: the site behaves exactly as before.
//
// Payments: no provider is wired in yet. Until one is, Pro is given by an admin
// (Admin → Usage → Plans), and the pricing page asks people to write to us. A provider (for
// example Paddle, Lemon Squeezy or Stripe) only has to call setPlan() from
// its webhook, with provider and providerRef set.
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/adminRole";
import { PLANS, limitText, UPGRADE_PATH, type Meter, type PlanId } from "@/lib/plans";
import { WORK_ACTIONS } from "@/lib/usageStats";

export function billingEnabled(): boolean {
  if (process.env.BILLING_ENABLED !== "1") return false;
  if (process.env.VERCEL_ENV === "production" && process.env.BILLING_IN_PRODUCTION !== "1") return false;
  return true;
}

/** A payment provider is set up (none is yet: Pro is given by an admin) */
export function checkoutReady(): boolean {
  return false;
}

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "subscriptions" (
        "userId" TEXT NOT NULL,
        "plan" TEXT NOT NULL DEFAULT 'free',
        "status" TEXT NOT NULL DEFAULT 'active',
        "periodEnd" TIMESTAMP(3),
        "provider" TEXT NOT NULL DEFAULT 'manual',
        "providerRef" TEXT NOT NULL DEFAULT '',
        "note" TEXT NOT NULL DEFAULT '',
        "updatedBy" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("userId")
      )`);
      await prisma.$executeRawUnsafe(`DO $$ BEGIN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export type Subscription = {
  userId: string;
  plan: PlanId;
  status: string;
  periodEnd: string | null;
  provider: string;
  providerRef: string;
  note: string;
  updatedBy: string;
  updatedAt: string;
};

type Row = Omit<Subscription, "periodEnd" | "updatedAt" | "plan"> & { plan: string; periodEnd: Date | null; updatedAt: Date };
const toSub = (r: Row): Subscription => ({
  ...r,
  plan: r.plan === "pro" ? "pro" : "free",
  periodEnd: r.periodEnd ? new Date(r.periodEnd).toISOString() : null,
  updatedAt: new Date(r.updatedAt).toISOString(),
});

export async function getSubscription(userId: string): Promise<Subscription | null> {
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<Row[]>(`SELECT * FROM "subscriptions" WHERE "userId" = $1`, userId);
  return rows[0] ? toSub(rows[0]) : null;
}

/** Pro while the subscription is active and not past its end (no end: until taken away) */
export function isActivePro(s: Subscription | null, now = Date.now()): boolean {
  if (!s || s.plan !== "pro" || s.status !== "active") return false;
  return !s.periodEnd || Date.parse(s.periodEnd) > now;
}

type Who = { id: string; role?: string | null; email?: string | null };

export async function planOf(user: Who): Promise<PlanId> {
  if (isAdminUser(user)) return "pro";
  return isActivePro(await getSubscription(user.id)) ? "pro" : "free";
}

/** Give or take away a plan (an admin, or a payment provider's webhook) */
export async function setPlan(
  userId: string,
  plan: PlanId,
  opts: { periodEnd?: Date | null; status?: string; provider?: string; providerRef?: string; note?: string; by?: string } = {}
): Promise<Subscription> {
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `INSERT INTO "subscriptions" ("userId", "plan", "status", "periodEnd", "provider", "providerRef", "note", "updatedBy", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT ("userId") DO UPDATE SET "plan" = EXCLUDED."plan", "status" = EXCLUDED."status", "periodEnd" = EXCLUDED."periodEnd",
       "provider" = EXCLUDED."provider", "providerRef" = EXCLUDED."providerRef", "note" = EXCLUDED."note",
       "updatedBy" = EXCLUDED."updatedBy", "updatedAt" = now()
     RETURNING *`,
    userId,
    plan,
    opts.status ?? "active",
    opts.periodEnd ?? null,
    opts.provider ?? "manual",
    (opts.providerRef ?? "").slice(0, 200),
    (opts.note ?? "").slice(0, 500),
    (opts.by ?? "").slice(0, 200)
  );
  return toSub(rows[0]);
}

export async function listSubscriptions(): Promise<(Subscription & { name: string; email: string; active: boolean })[]> {
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<(Row & { name: string; email: string })[]>(
    `SELECT s.*, u."name", u."email" FROM "subscriptions" s JOIN "users" u ON u."id" = s."userId"
     WHERE s."plan" <> 'free' ORDER BY s."updatedAt" DESC LIMIT 500`
  );
  return rows.map((r) => {
    const sub = toSub(r);
    return { ...sub, name: r.name, email: r.email, active: isActivePro(sub) };
  });
}

const startOfMonth = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
};

async function hasTable(t: string): Promise<boolean> {
  const r = await prisma.$queryRawUnsafe<{ ok: boolean }[]>(`SELECT to_regclass($1) IS NOT NULL AS ok`, `public."${t}"`);
  return Boolean(r[0]?.ok);
}

/** What this account has used, for each limit */
export async function usageOf(userId: string): Promise<Record<Meter, number>> {
  const count = async (sql: string, ...args: unknown[]) =>
    Number((await prisma.$queryRawUnsafe<{ n: bigint }[]>(sql, ...args))[0]?.n ?? 0);
  const [work, kml, trav, slope] = await Promise.all([
    count(
      `SELECT count(*) AS n FROM "activities" WHERE "userId" = $1 AND "timestamp" >= $2 AND "action" = ANY($3::text[])`,
      userId,
      startOfMonth(),
      WORK_ACTIONS
    ),
    count(`SELECT count(*) AS n FROM "user_jobs" WHERE "userId" = $1`, userId),
    (await hasTable("traverse_jobs")) ? count(`SELECT count(*) AS n FROM "traverse_jobs" WHERE "ownerId" = $1`, userId) : 0,
    (await hasTable("slope_jobs")) ? count(`SELECT count(*) AS n FROM "slope_jobs" WHERE "ownerId" = $1`, userId) : 0,
  ]);
  return { monthlyWork: work, "jobs:kml": kml, "jobs:traverse": trav, "jobs:slope": slope };
}

export type LimitCheck =
  | { ok: true }
  | { ok: false; meter: Meter; limit: number; used: number; error: string; upgradeUrl: string };

/**
 * May this account do one more of this? Always yes while the paid plans are off, for admins and
 * for Pro. `adding` is false when an existing job is only being saved again (never stopped).
 */
export async function checkLimit(user: Who, meter: Meter, adding = true): Promise<LimitCheck> {
  if (!billingEnabled() || !adding) return { ok: true };
  try {
    if ((await planOf(user)) === "pro") return { ok: true };
    const limit = PLANS.free.limits[meter];
    if (limit == null) return { ok: true };
    const used = (await usageOf(user.id))[meter];
    if (used < limit) return { ok: true };
    return { ok: false, meter, limit, used, error: limitText(meter, limit), upgradeUrl: UPGRADE_PATH };
  } catch (e) {
    // the plan can't be read: never stop someone's work for that
    console.error("[billing] check", e);
    return { ok: true };
  }
}

/** The account's plan and usage, for the dashboard and the apps */
export async function planSummary(user: Who) {
  if (!billingEnabled()) return { enabled: false as const };
  const [plan, sub, used] = await Promise.all([planOf(user), getSubscription(user.id), usageOf(user.id)]);
  return {
    enabled: true as const,
    plan,
    periodEnd: plan === "pro" && sub ? sub.periodEnd : null,
    limits: PLANS[plan].limits,
    used,
    checkout: checkoutReady(),
    upgradeUrl: UPGRADE_PATH,
  };
}
