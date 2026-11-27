// Admin → Payments: the switches for the paid plans, the free limits and the prices shown, kept
// in the site_settings table under "billing" (and "billing_webhook" for the last Paddle event).
// Server only. Everything starts OFF.
//
// Emergency stop: BILLING_FORCE_OFF=1 in Vercel turns all of it off, whatever the switches say.
// For a computer or a preview: BILLING_ENABLED=1 turns it all on outside the live site.
import { prisma } from "@/lib/prisma";

export type BillingConfig = {
  /** Free accounts are held to the limits in the web apps */
  limits: boolean;
  /** The pricing page and the Upgrade buttons show (on by itself while the limits are on) */
  pricing: boolean;
  /** People can pay online with Paddle (needs Paddle's settings in Vercel) */
  checkout: boolean;
  /** Free plan: conversions, exports and calculations a month */
  freeWork: number;
  /** Free plan: jobs kept in each web app */
  freeJobs: number;
  /** The prices shown on the pricing page (Paddle charges what is set in Paddle) */
  priceMonthly: number;
  priceYearly: number;
};

export const BILLING_DEFAULTS: BillingConfig = {
  limits: false,
  pricing: false,
  checkout: false,
  freeWork: 30,
  freeJobs: 10,
  priceMonthly: 6,
  priceYearly: 60,
};

export const forcedOff = () => process.env.BILLING_FORCE_OFF === "1";
/** BILLING_ENABLED=1 on a computer or a preview (never the live site) turns everything on */
export const devOn = () => process.env.BILLING_ENABLED === "1" && process.env.VERCEL_ENV !== "production";

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ready) {
    ready = prisma
      .$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "site_settings" (
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
      )`)
      .then(() => undefined)
      .catch((e) => {
        ready = null;
        throw e;
      });
  }
  return ready;
}

async function readKey(key: string): Promise<unknown> {
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<{ value: string }[]>(`SELECT "value" FROM "site_settings" WHERE "key" = $1`, key);
  if (!rows[0]) return null;
  try {
    return JSON.parse(rows[0].value);
  } catch {
    return null;
  }
}

async function writeKey(key: string, value: unknown): Promise<void> {
  await ensureTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "site_settings" ("key", "value", "updatedAt") VALUES ($1, $2, NOW())
     ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()`,
    key,
    JSON.stringify(value)
  );
}

const whole = (v: unknown, min: number, max: number, dflt: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 100) / 100)) : dflt;
};

/** Cleans what was saved or sent: unknown keys dropped, numbers kept in range */
export function cleanBillingConfig(raw: unknown, base: BillingConfig = BILLING_DEFAULTS): BillingConfig {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const bool = (k: keyof BillingConfig) => (typeof r[k] === "boolean" ? (r[k] as boolean) : (base[k] as boolean));
  return {
    limits: bool("limits"),
    pricing: bool("pricing"),
    checkout: bool("checkout"),
    freeWork: Math.round(whole(r.freeWork ?? base.freeWork, 1, 100000, base.freeWork)),
    freeJobs: Math.round(whole(r.freeJobs ?? base.freeJobs, 1, 100000, base.freeJobs)),
    priceMonthly: whole(r.priceMonthly ?? base.priceMonthly, 0, 10000, base.priceMonthly),
    priceYearly: whole(r.priceYearly ?? base.priceYearly, 0, 100000, base.priceYearly),
  };
}

/** The saved switches (defaults if none or unreadable: everything off) */
export async function billingConfig(): Promise<BillingConfig> {
  try {
    return cleanBillingConfig(await readKey("billing"));
  } catch (e) {
    console.error("[billing] config unreadable, all off:", e);
    return { ...BILLING_DEFAULTS };
  }
}

export async function saveBillingConfig(updates: Partial<BillingConfig>): Promise<BillingConfig> {
  const next = cleanBillingConfig(updates, await billingConfig());
  await writeKey("billing", next);
  return next;
}

/** The last event Paddle sent (Admin → Payments shows it, to prove the webhook works) */
export async function noteWebhook(type: string, result: string): Promise<void> {
  try {
    await writeKey("billing_webhook", { at: new Date().toISOString(), type: type.slice(0, 80), result: result.slice(0, 200) });
  } catch {
    // only a note
  }
}

export async function lastWebhook(): Promise<{ at: string; type: string; result: string } | null> {
  try {
    const v = (await readKey("billing_webhook")) as { at?: string; type?: string; result?: string } | null;
    return v?.at ? { at: String(v.at), type: String(v.type || ""), result: String(v.result || "") } : null;
  } catch {
    return null;
  }
}
