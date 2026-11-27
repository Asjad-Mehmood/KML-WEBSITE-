// Paddle (paddle.com): takes the payments for Pro. Paddle is the merchant of record: it charges
// the card or PayPal, adds and pays the sales tax / VAT of the buyer's country, and pays out
// monthly to a bank account by wire or to Payoneer, which works for a seller in Pakistan.
// Server only. Everything comes from Vercel environment variables (see .env.example):
//
//   PADDLE_ENV                     "sandbox" (test cards, no real money) or "production"
//   PADDLE_API_KEY                 Paddle → Developer tools → Authentication → API keys (secret)
//   PADDLE_WEBHOOK_SECRET          Paddle → Developer tools → Notifications → the endpoint's secret key
//   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN  Paddle → Developer tools → Authentication → Client-side tokens
//   PADDLE_PRICE_MONTHLY           the Pro product's monthly price id (pri_…)
//   PADDLE_PRICE_YEARLY            the Pro product's yearly price id (pri_…)
import { createHmac, timingSafeEqual } from "crypto";

export const paddleEnv = (): "sandbox" | "production" => (process.env.PADDLE_ENV === "production" ? "production" : "sandbox");
const apiBase = () => (paddleEnv() === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com");
const v = (k: string) => (process.env[k] || "").trim();

export function paddleConfig() {
  return {
    env: paddleEnv(),
    clientToken: v("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"),
    prices: { monthly: v("PADDLE_PRICE_MONTHLY"), yearly: v("PADDLE_PRICE_YEARLY") },
  };
}

/** Everything needed to take a payment is set */
export function paddleReady(): boolean {
  const c = paddleConfig();
  return Boolean(v("PADDLE_API_KEY") && v("PADDLE_WEBHOOK_SECRET") && c.clientToken && c.prices.monthly && c.prices.yearly);
}

/** Which settings are still missing (Admin → Usage → Paid plans) */
export function paddleMissing(): string[] {
  return ["PADDLE_API_KEY", "PADDLE_WEBHOOK_SECRET", "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", "PADDLE_PRICE_MONTHLY", "PADDLE_PRICE_YEARLY"].filter((k) => !v(k));
}

/**
 * A webhook really is from Paddle: the Paddle-Signature header is "ts=<seconds>;h1=<hex>", where
 * h1 is HMAC-SHA256 of "<ts>:<raw body>" with the endpoint's secret key. Older than 5 minutes: refused.
 */
export function verifyPaddleSignature(rawBody: string, header: string | null, now = Date.now()): boolean {
  const secret = v("PADDLE_WEBHOOK_SECRET");
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    header.split(";").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    })
  );
  const ts = parts.ts;
  const h1s = header
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p.startsWith("h1="))
    .map((p) => p.slice(3));
  if (!ts || !/^\d+$/.test(ts) || h1s.length === 0) return false;
  if (Math.abs(now / 1000 - Number(ts)) > 300) return false;
  const want = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest();
  return h1s.some((h) => {
    if (!/^[0-9a-f]{64}$/i.test(h)) return false;
    const got = Buffer.from(h, "hex");
    return got.length === want.length && timingSafeEqual(got, want);
  });
}

async function paddleApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${v("PADDLE_API_KEY")}`, "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(10000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Paddle ${res.status}: ${body?.error?.detail || body?.error?.code || "request failed"}`);
  return body as T;
}

/** A link to Paddle's page where the customer changes card, sees invoices or cancels */
export async function portalUrl(customerId: string, subscriptionId?: string): Promise<string | null> {
  const r = await paddleApi<{ data?: { urls?: { general?: { overview?: string } } } }>(
    `/customers/${encodeURIComponent(customerId)}/portal-sessions`,
    { method: "POST", body: JSON.stringify(subscriptionId ? { subscription_ids: [subscriptionId] } : {}) }
  );
  return r.data?.urls?.general?.overview ?? null;
}

/** The parts of a Paddle subscription event the site uses */
export type PaddleSubscription = {
  id: string;
  status: string;
  customer_id: string;
  custom_data?: { userId?: string } | null;
  current_billing_period?: { starts_at: string; ends_at: string } | null;
  scheduled_change?: { action: string; effective_at: string } | null;
  items?: { price?: { id?: string; billing_cycle?: { interval?: string } } }[];
};
