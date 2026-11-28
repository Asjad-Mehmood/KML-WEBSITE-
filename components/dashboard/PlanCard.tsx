"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gauge } from "lucide-react";
import { METER_LABEL, type Meter, type PlanId } from "@/lib/billing/plans";

type Summary =
  | { enabled: false }
  | {
      enabled: true;
      plan: PlanId;
      periodEnd: string | null;
      limits: Record<Meter, number | null>;
      used: Record<Meter, number>;
      manage?: boolean;
      enforced?: boolean;
      upgradeUrl: string;
    };

const METERS: Meter[] = ["monthlyWork", "jobs:kml", "jobs:traverse", "jobs:slope"];

// Dashboard: the account's plan and how much of each free limit is used.
// Shows nothing while the paid plans are switched off (lib/billing).
export default function PlanCard() {
  const [s, setS] = useState<Summary | null>(null);
  const [opening, setOpening] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // back from Paddle's checkout (?upgraded=1): Paddle tells the site within a few seconds
  const [justPaid] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("upgraded"));

  useEffect(() => {
    let live = true;
    let tries = 0;
    const load = () =>
      fetch("/api/billing/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { enabled: false }))
        .then((d: Summary) => {
          if (!live) return;
          setS(d);
          // still Free just after paying: look again a few times
          if (justPaid && d.enabled && d.plan === "free" && tries++ < 6) setTimeout(load, 5000);
        })
        .catch(() => live && setS({ enabled: false }));
    void load();
    return () => {
      live = false;
    };
  }, [justPaid]);

  const manage = async () => {
    setOpening(true);
    setErr(null);
    try {
      const r = await fetch("/api/billing/portal", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (d.url) window.location.href = d.url;
      else setErr(d.error || "The billing page couldn't be opened.");
    } catch {
      setErr("No connection. Try again in a moment.");
    } finally {
      setOpening(false);
    }
  };

  if (!s || !s.enabled) return null;
  const pro = s.plan === "pro";

  return (
    <section className="mt-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6" aria-labelledby="plan-title">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h2 id="plan-title" className="text-[15px] font-bold flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-500" aria-hidden />
          Your plan: {pro ? "Pro" : "Free"}
        </h2>
        {pro ? (
          <span className="flex items-center gap-3 text-[13px] text-slate-500">
            {s.periodEnd ? `Renews or ends by ${new Date(s.periodEnd).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : "No limits"}
            {s.manage && (
              <button type="button" onClick={() => void manage()} disabled={opening} className="rounded-full border border-slate-300 px-3.5 py-1.5 font-semibold text-slate-900 hover:bg-slate-50 cursor-pointer disabled:opacity-60">
                {opening ? "Opening…" : "Manage billing"}
              </button>
            )}
          </span>
        ) : (
          <Link href={s.upgradeUrl} className="rounded-full bg-[#0071e3] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0062c4]">
            Upgrade to Pro
          </Link>
        )}
      </div>
      {justPaid && (
        <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {pro ? "Thank you! Pro is on: no limits in the web apps." : "Thank you! Your payment is going through; Pro turns on in a moment."}
        </p>
      )}
      {err && <p role="alert" className="mt-3 text-[13px] text-red-600">{err}</p>}
      {!pro && (
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {METERS.map((m) => {
            const limit = s.limits[m];
            if (limit == null) return null;
            const used = s.used[m];
            const pct = Math.min(100, Math.round((used / limit) * 100));
            const full = used >= limit;
            return (
              <li key={m}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-600">{METER_LABEL[m]}</span>
                  <span className={`font-semibold tabular-nums ${full ? "text-red-600" : "text-slate-900"}`}>
                    {used} of {limit}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden"
                  role="progressbar"
                  aria-label={METER_LABEL[m]}
                  aria-valuemin={0}
                  aria-valuemax={limit}
                  aria-valuenow={Math.min(used, limit)}
                >
                  <div className={`h-full rounded-full ${full ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-[#0071e3]"}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!pro && (
        <p className="mt-4 text-[12.5px] text-slate-500">
          {s.enforced === false
            ? "These limits aren't applied yet: everything still works as before."
            : "Work this month starts again on the 1st. Reaching a limit never deletes your jobs or files."}
        </p>
      )}
    </section>
  );
}
