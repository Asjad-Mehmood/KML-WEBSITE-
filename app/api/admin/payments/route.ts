import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { logAdmin } from "@/lib/adminLog";
import { billingState, listSubscriptions } from "@/lib/billing";
import { billingConfig, lastWebhook, saveBillingConfig, type BillingConfig } from "@/lib/billingConfig";
import { getPrice, paddleConfig, paddleEnv, type PaddlePrice } from "@/lib/paddle";
import { SITE_URL } from "@/lib/site";

// Admin → Payments: the switches for the paid plans, and a checklist of everything they need
// (each Paddle setting is tried against Paddle itself, not only checked for being there)
export const dynamic = "force-dynamic";

/** The refund policy page, once there is one (Paddle asks for it before going live) */
const REFUND_POLICY_PATH: string | null = "/refund-policy";

type Check = { id: string; label: string; state: "ok" | "warn" | "bad" | "off"; detail: string; fix?: string };

const has = (k: string) => Boolean((process.env[k] || "").trim());
const money = (p: PaddlePrice) => {
  const a = Number(p.unit_price?.amount ?? 0) / 100;
  return `${p.unit_price?.currency_code === "USD" ? "$" : (p.unit_price?.currency_code ?? "") + " "}${a.toFixed(2)}`;
};

async function priceCheck(id: string, which: "monthly" | "yearly", shown: number, keyOk: boolean): Promise<Check> {
  const key = which === "monthly" ? "PADDLE_PRICE_MONTHLY" : "PADDLE_PRICE_YEARLY";
  const label = which === "monthly" ? "Monthly price in Paddle" : "Yearly price in Paddle";
  const fix = `Paddle → Catalog → Products → Pro → Prices: copy the ${which} price id (pri_…) into ${key} in Vercel`;
  if (!id) return { id: key, label, state: "bad", detail: `${key} isn't set`, fix };
  if (!/^pri_[a-z0-9]+$/i.test(id)) return { id: key, label, state: "bad", detail: `${key} doesn't look like a price id (pri_…)`, fix };
  if (!keyOk) return { id: key, label, state: "warn", detail: `Set (${id}), not checked: the API key is missing or refused` };
  try {
    const p = await getPrice(id);
    const want = which === "monthly" ? "month" : "year";
    const cycle = p.billing_cycle ? `${p.billing_cycle.frequency > 1 ? p.billing_cycle.frequency + " " : ""}${p.billing_cycle.interval}` : "one-off";
    const amount = Number(p.unit_price?.amount ?? 0) / 100;
    if (p.status !== "active") return { id: key, label, state: "bad", detail: `${money(p)} / ${cycle}, but archived in Paddle`, fix: "Unarchive it in Paddle, or use an active price" };
    if (p.billing_cycle?.interval !== want || p.billing_cycle?.frequency !== 1)
      return { id: key, label, state: "bad", detail: `${money(p)} every ${cycle}: this should be a ${want}ly price`, fix };
    if (Math.abs(amount - shown) > 0.005)
      return { id: key, label, state: "warn", detail: `Paddle charges ${money(p)} / ${want}, the pricing page shows $${shown.toFixed(2)}`, fix: "Set the same price below, or change it in Paddle" };
    return { id: key, label, state: "ok", detail: `${money(p)} / ${want}` };
  } catch (e) {
    const msg = (e as Error).message;
    return { id: key, label, state: "bad", detail: /404/.test(msg) ? `${id} wasn't found in Paddle (${paddleEnv()})` : msg, fix };
  }
}

async function checklist(cfg: BillingConfig): Promise<Check[]> {
  const env = paddleEnv();
  const pc = paddleConfig();
  const out: Check[] = [];

  out.push({
    id: "mode",
    label: "Paddle mode",
    state: has("PADDLE_ENV") ? (env === "production" ? "ok" : "warn") : "warn",
    detail: env === "production" ? "Live: real payments" : `Sandbox: test cards, no real money${has("PADDLE_ENV") ? "" : " (PADDLE_ENV isn't set)"}`,
    fix: env === "production" ? undefined : "For real payments: live keys from vendors.paddle.com and PADDLE_ENV=production",
  });

  // the API key, tried on the monthly price (any answer but 401/403 means the key works)
  let keyOk = false;
  if (!has("PADDLE_API_KEY")) {
    out.push({ id: "key", label: "API key", state: "bad", detail: "PADDLE_API_KEY isn't set", fix: "Paddle → Developer tools → Authentication → API keys → New API key" });
  } else {
    try {
      if (pc.prices.monthly) await getPrice(pc.prices.monthly);
      keyOk = true;
      out.push({ id: "key", label: "API key", state: pc.prices.monthly ? "ok" : "warn", detail: pc.prices.monthly ? `Accepted by Paddle (${env})` : "Set, not tried yet (no price id to try it on)" });
    } catch (e) {
      const msg = (e as Error).message;
      if (/40[13]/.test(msg)) {
        out.push({ id: "key", label: "API key", state: "bad", detail: `Refused by Paddle ${env}: ${msg}`, fix: `Make a new key in Paddle ${env === "sandbox" ? "sandbox" : "live"} (a sandbox key doesn't work live, nor the other way)` });
      } else {
        keyOk = true;
        out.push({ id: "key", label: "API key", state: "ok", detail: `Accepted by Paddle (${env})` });
      }
    }
  }

  const tok = pc.clientToken;
  const wantPrefix = env === "production" ? "live_" : "test_";
  out.push(
    !tok
      ? { id: "token", label: "Client-side token", state: "bad", detail: "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN isn't set", fix: "Paddle → Developer tools → Authentication → Client-side tokens" }
      : tok.startsWith(wantPrefix)
        ? { id: "token", label: "Client-side token", state: "ok", detail: `Set (${wantPrefix}…)` }
        : { id: "token", label: "Client-side token", state: "bad", detail: `It starts "${tok.slice(0, 5)}", Paddle ${env} needs "${wantPrefix}"`, fix: "Use the token from the same Paddle (sandbox or live) as the API key" }
  );

  out.push(await priceCheck(pc.prices.monthly, "monthly", cfg.priceMonthly, keyOk));
  out.push(await priceCheck(pc.prices.yearly, "yearly", cfg.priceYearly, keyOk));

  out.push(
    has("PADDLE_WEBHOOK_SECRET")
      ? { id: "secret", label: "Webhook secret", state: "ok", detail: "Set" }
      : { id: "secret", label: "Webhook secret", state: "bad", detail: "PADDLE_WEBHOOK_SECRET isn't set", fix: "Paddle → Developer tools → Notifications → your destination → Secret key" }
  );

  const hook = await lastWebhook();
  const url = `${SITE_URL}/api/billing/paddle`;
  out.push(
    !hook
      ? { id: "webhook", label: "Webhook from Paddle", state: "warn", detail: "Nothing received yet", fix: `Paddle → Notifications → New destination: ${url} with the subscription events, then "Send test event"` }
      : hook.type === "refused"
        ? { id: "webhook", label: "Webhook from Paddle", state: "bad", detail: `Last one refused (${new Date(hook.at).toUTCString()}): ${hook.result}`, fix: "Copy the destination's secret key again into PADDLE_WEBHOOK_SECRET, and redeploy" }
        : { id: "webhook", label: "Webhook from Paddle", state: "ok", detail: `Last: ${hook.type}, ${new Date(hook.at).toUTCString()} — ${hook.result}` }
  );

  // pages Paddle looks for before it approves a live account (/terms and /privacy are on the site)
  out.push({ id: "terms", label: "Terms and privacy pages", state: "ok", detail: "/terms and /privacy" });
  out.push({
    id: "refund",
    label: "Refund policy",
    state: REFUND_POLICY_PATH ? "ok" : "warn",
    detail: REFUND_POLICY_PATH ? REFUND_POLICY_PATH : "Not on the site yet: Paddle asks for one before going live",
    fix: REFUND_POLICY_PATH ? undefined : "Ask Claude to add a refund policy page",
  });
  out.push({
    id: "pricing",
    label: "Pricing page",
    state: cfg.pricing || cfg.limits ? "ok" : "off",
    detail: cfg.pricing || cfg.limits ? `${SITE_URL}/pricing is showing` : "Hidden: Paddle's review needs to see it (switch on \"Pricing page\" below)",
  });
  return out;
}

export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  try {
    const cfg = await billingConfig();
    const [state, checks, pro] = await Promise.all([billingState(cfg), checklist(cfg), listSubscriptions()]);
    return NextResponse.json(
      {
        config: cfg,
        live: { limits: state.limits, pricing: state.pricing, checkout: state.checkout, forcedOff: state.forcedOff, dev: state.dev },
        paddleEnv: paddleEnv(),
        webhookUrl: `${SITE_URL}/api/billing/paddle`,
        checks,
        proCount: pro.filter((p) => p.active).length,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[admin payments]", e);
    return NextResponse.json({ error: "Couldn't read the payment settings." }, { status: 500 });
  }
}

const NAMES: Record<keyof BillingConfig, string> = {
  limits: "Limits for free accounts",
  pricing: "Pricing page",
  checkout: "Online payments",
  freeWork: "Free work a month",
  freeJobs: "Free jobs kept",
  priceMonthly: "Monthly price shown",
  priceYearly: "Yearly price shown",
};

// PATCH { limits?, pricing?, checkout?, freeWork?, freeJobs?, priceMonthly?, priceYearly? }
export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Partial<BillingConfig> | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  try {
    const before = await billingConfig();
    const after = await saveBillingConfig(body);
    const changed = (Object.keys(NAMES) as (keyof BillingConfig)[]).filter((k) => before[k] !== after[k]);
    if (changed.length) {
      const show = (v: unknown) => (typeof v === "boolean" ? (v ? "on" : "off") : String(v));
      await logAdmin(admin.user, "payments.settings", "Payments", changed.map((k) => `${NAMES[k]}: ${show(before[k])} → ${show(after[k])}`).join("; "), req);
    }
    return NextResponse.json({ success: true, config: after });
  } catch (e) {
    console.error("[admin payments] save", e);
    return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  }
}
