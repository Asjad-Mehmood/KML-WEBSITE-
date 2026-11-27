"use client";

// Admin → Payments: switch the paid plans on and off, set the free limits and the prices shown,
// see whether everything they need is set up (each Paddle setting tried against Paddle), and give Pro.
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleOff, CreditCard, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Toggle } from "./AppTab";
import AdminPlans from "./AdminPlans";

type Config = { limits: boolean; pricing: boolean; checkout: boolean; freeWork: number; freeJobs: number; priceMonthly: number; priceYearly: number };
type Check = { id: string; label: string; state: "ok" | "warn" | "bad" | "off"; detail: string; fix?: string };
type Data = {
  config: Config;
  live: { limits: boolean; pricing: boolean; checkout: boolean; forcedOff: boolean; dev: boolean };
  paddleEnv: "sandbox" | "production";
  webhookUrl: string;
  checks: Check[];
  proCount: number;
};
type Fetch = (url: string, options?: RequestInit) => Promise<Response>;

const card = "rounded-2xl border border-[var(--adm-line)] bg-[var(--adm-card)] p-4";
const field = "w-28 rounded-xl border border-[var(--adm-line)] bg-slate-900/60 px-3 py-2 text-sm text-white tabular-nums";

const ICON = {
  ok: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-label="Done" />,
  warn: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-label="Check" />,
  bad: <XCircle className="w-4 h-4 text-rose-400 shrink-0" aria-label="Missing" />,
  off: <CircleOff className="w-4 h-4 text-slate-500 shrink-0" aria-label="Off" />,
};

export default function AdminPayments({ adminFetch }: { adminFetch: Fetch }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<Pick<Config, "freeWork" | "freeJobs" | "priceMonthly" | "priceYearly"> | null>(null);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetcher.current("/api/admin/payments");
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't read the payment settings.");
      setData(d);
      setDraft({ freeWork: d.config.freeWork, freeJobs: d.config.freeJobs, priceMonthly: d.config.priceMonthly, priceYearly: d.config.priceYearly });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const save = async (what: string, patch: Partial<Config>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setSaving(what);
    setMsg(null);
    try {
      const r = await fetcher.current("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't save.");
      setMsg("Saved.");
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  if (loading && !data)
    return (
      <p className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Checking the payment settings…
      </p>
    );
  if (error && !data) return <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>;
  if (!data || !draft) return null;

  const c = data.config;
  const counts = { ok: 0, warn: 0, bad: 0, off: 0 };
  data.checks.forEach((x) => counts[x.state]++);
  const paddleChecks = data.checks.filter((x) => ["key", "token", "PADDLE_PRICE_MONTHLY", "PADDLE_PRICE_YEARLY", "secret"].includes(x.id));
  const paddleOk = paddleChecks.every((x) => x.state === "ok");

  const switches: { key: "limits" | "pricing" | "checkout"; title: string; text: string; live: boolean; note?: string; confirm?: string }[] = [
    {
      key: "pricing",
      title: "Pricing page",
      text: "Shows /pricing and the plan on each account page, with Upgrade buttons. Nobody is limited. Switch this on for Paddle's review.",
      live: data.live.pricing,
      note: c.limits && !c.pricing ? "Showing anyway: the limits are on" : undefined,
    },
    {
      key: "checkout",
      title: "Online payments (Paddle)",
      text: "Upgrade opens Paddle's checkout. Off: Upgrade sends people to the contact page and you give Pro below.",
      live: data.live.checkout,
      note: c.checkout && !paddleOk ? "Switched on, but not working until the Paddle settings below are all done" : undefined,
      confirm: data.paddleEnv === "production" ? "Take real payments with Paddle (live)?" : undefined,
    },
    {
      key: "limits",
      title: "Limits for free accounts",
      text: `Free accounts get ${c.freeWork} conversions, exports and calculations a month and ${c.freeJobs} kept jobs in each web app; past that, they're asked to upgrade. Pro and admins have no limits.`,
      live: data.live.limits,
      confirm: `Apply the free limits to everyone now? People past ${c.freeWork} uses this month will be asked to upgrade.`,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-300" aria-hidden /> Payments
          </h2>
          <p className="text-sm text-slate-400">
            Paid plans for the web apps. Everything starts off; each switch works on its own and goes in the Admin log.
          </p>
        </div>
        <button type="button" onClick={() => void load()} aria-label="Check again" className="p-2 rounded-xl border border-[var(--adm-line)] bg-[var(--adm-card)] text-slate-400 hover:text-white cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
        </button>
      </div>

      {data.live.forcedOff && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          BILLING_FORCE_OFF=1 is set in Vercel: everything below is off, whatever the switches say.
        </p>
      )}
      {data.live.dev && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          BILLING_ENABLED=1 is set here (a computer or a preview): everything is on, whatever the switches say.
        </p>
      )}

      {/* the switches */}
      <section className={card} aria-label="Switches">
        <ul className="divide-y divide-[var(--adm-line)]">
          {switches.map((s) => (
            <li key={s.key} className="py-3 first:pt-0 last:pb-0 flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                  {s.title}
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${s.live ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/60 text-slate-300"}`}>
                    {s.live ? "ON" : "OFF"}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{s.text}</p>
                {s.note && <p className="mt-1 text-xs text-amber-300">{s.note}</p>}
              </div>
              <Toggle
                on={c[s.key]}
                busy={saving === s.key}
                label={s.title}
                onClick={() => void save(s.key, { [s.key]: !c[s.key] }, !c[s.key] ? s.confirm : undefined)}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* limits and prices */}
      <section className={card} aria-labelledby="pay-numbers">
        <h3 id="pay-numbers" className="text-sm font-bold text-white">Free limits and prices shown</h3>
        <form
          className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save("numbers", draft);
          }}
        >
          {(
            [
              ["freeWork", "Work a month", 1],
              ["freeJobs", "Jobs kept per app", 1],
              ["priceMonthly", "Monthly price ($)", 0.01],
              ["priceYearly", "Yearly price ($)", 0.01],
            ] as const
          ).map(([k, label, step]) => (
            <label key={k} className="text-xs text-slate-400">
              {label}
              <input
                type="number"
                min={step === 1 ? 1 : 0}
                step={step}
                className={`${field} mt-1 block`}
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })}
              />
            </label>
          ))}
          <div className="col-span-2 sm:col-span-4 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving === "numbers"} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 cursor-pointer">
              {saving === "numbers" ? "Saving…" : "Save"}
            </button>
            <p className="text-[11.5px] text-slate-500">Paddle charges the price set in Paddle: keep these the same (the checklist compares them).</p>
          </div>
        </form>
        {msg && <p role="status" className="mt-2 text-xs text-slate-300">{msg}</p>}
      </section>

      {/* the checklist */}
      <section className={card} aria-labelledby="pay-checks">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="pay-checks" className="text-sm font-bold text-white">
            Set-up checklist <span className="font-normal text-slate-400">· Paddle {data.paddleEnv === "production" ? "live" : "sandbox"}</span>
          </h3>
          <p className="text-xs text-slate-400 tabular-nums">
            {counts.ok} done{counts.warn ? ` · ${counts.warn} to check` : ""}
            {counts.bad ? ` · ${counts.bad} missing` : ""}
          </p>
        </div>
        <ul className="mt-3 space-y-2.5">
          {data.checks.map((x) => (
            <li key={x.id} className="flex gap-2.5">
              {ICON[x.state]}
              <div className="min-w-0">
                <p className="text-sm text-white">
                  {x.label} <span className="text-slate-400">— {x.detail}</span>
                </p>
                {x.fix && x.state !== "ok" && <p className="text-[11.5px] text-slate-500 break-words">{x.fix}</p>}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11.5px] text-slate-500 break-all">Webhook address for Paddle: {data.webhookUrl}</p>
      </section>

      <AdminPlans adminFetch={adminFetch} />
    </div>
  );
}
