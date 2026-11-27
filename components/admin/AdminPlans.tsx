"use client";

// Admin → Usage → Plans: whether the paid plans are switched on, the free limits and the
// prices, who is on Pro, and giving or taking away Pro by email (lib/billing).
import { useCallback, useEffect, useRef, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { METER_LABEL, type Meter, type Plan } from "@/lib/plans";

type Sub = { userId: string; name: string; email: string; plan: string; periodEnd: string | null; provider: string; note: string; updatedBy: string; updatedAt: string; active: boolean };
type Data = {
  enabled: boolean;
  production: boolean;
  checkout: boolean;
  plans: { free: Plan; pro: Plan };
  prices: { monthly: number; yearly: number; currency: string };
  pro: Sub[];
};

const card = "rounded-2xl border border-[var(--adm-line)] bg-[var(--adm-card)] p-4";
const field = "rounded-xl border border-[var(--adm-line)] bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500";
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function AdminPlans({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState("12");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });

  const load = useCallback(async () => {
    try {
      const r = await fetcher.current("/api/admin/plans");
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't read the plans.");
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const set = async (plan: "pro" | "free", who = email) => {
    if (!who.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetcher.current("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: who.trim(), plan, months: Number(months) || 0, note }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "The plan couldn't be changed.");
      setMsg(plan === "pro" ? `${who.trim()} is on Pro.` : `${who.trim()} is back on Free.`);
      if (who === email) {
        setEmail("");
        setNote("");
      }
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>;
  if (!data) return null;
  const meters = Object.keys(data.plans.free.limits) as Meter[];

  return (
    <section className={card} aria-labelledby="plans-title">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h3 id="plans-title" className="text-sm font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-300" aria-hidden /> Paid plans
        </h3>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${data.enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/60 text-slate-300"}`}
        >
          {data.enabled ? "On: limits are applied" : data.production ? "Off on the live site" : "Off"}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
        {data.enabled
          ? "Free accounts are held to the limits below in the web apps; Pro and admins are not. "
          : "Nobody is limited and the pricing page doesn't exist. To try it, set BILLING_ENABLED=1 in a preview or on your computer; the live site also needs BILLING_IN_PRODUCTION=1. "}
        {data.checkout ? "Payments are taken online." : "No payment provider yet: people ask for Pro from the contact page and you give it here."}
      </p>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-[var(--adm-line)] p-3">
          <p className="font-bold text-slate-200">Free limits</p>
          <ul className="mt-1.5 space-y-1 text-slate-300">
            {meters.map((m) => (
              <li key={m} className="flex justify-between gap-2">
                <span>{METER_LABEL[m]}</span>
                <span className="tabular-nums">{data.plans.free.limits[m] ?? "no limit"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--adm-line)] p-3">
          <p className="font-bold text-slate-200">Pro price</p>
          <p className="mt-1.5 text-slate-300">
            ${data.prices.monthly} a month · ${data.prices.yearly} a year ({data.prices.currency})
          </p>
          <p className="mt-1 text-slate-500">Set in lib/plans.ts. Placeholders until you choose.</p>
        </div>
      </div>

      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void set("pro");
        }}
      >
        <input className={`${field} flex-1 min-w-[200px]`} type="email" required placeholder="Account email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Account email" />
        <select className={field} value={months} onChange={(e) => setMonths(e.target.value)} aria-label="For how long">
          <option value="1">1 month</option>
          <option value="12">12 months</option>
          <option value="0">No end</option>
        </select>
        <input className={`${field} flex-1 min-w-[140px]`} placeholder="Note (paid by bank, trial…)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
        <button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 cursor-pointer">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Saving" /> : "Give Pro"}
        </button>
      </form>
      {msg && <p role="status" className="mt-2 text-xs text-slate-300">{msg}</p>}

      <p className="mt-4 text-xs font-bold text-slate-300">On Pro ({data.pro.length})</p>
      {data.pro.length === 0 ? (
        <p className="mt-1 text-xs text-slate-500">No one yet.</p>
      ) : (
        <ul className="mt-1.5 divide-y divide-[var(--adm-line)]">
          {data.pro.map((s) => {
            const over = !s.active;
            return (
              <li key={s.userId} className="py-2 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{s.name || s.email}</p>
                  <p className="truncate text-[11.5px] text-slate-400">
                    {s.email} · {s.periodEnd ? `${over ? "ended" : "until"} ${day(s.periodEnd)}` : "no end"} · {s.provider}
                    {s.note && ` · ${s.note}`}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void set("free", s.email)}
                  className="shrink-0 rounded-lg border border-[var(--adm-line)] px-2.5 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Back to Free
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
