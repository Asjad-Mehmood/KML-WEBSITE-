"use client";

// Admin → Usage (lib/admin/usageStats.ts): how many people use the programs each month against the goal
// before a paid plan, who uses them most, and how many would pass example free limits.
import { useCallback, useEffect, useRef, useState } from "react";
import { Gauge, Loader2, RefreshCw, Target, TrendingUp, Users } from "lucide-react";
import AdminInvites from "./AdminInvites";

type Person = {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  joined: string;
  lastActive: string | null;
  activeDays30: number;
  work30: number;
  points30: number;
  savedJobs: number;
  apps: string[];
  score: number;
};
type Usage = {
  goal: number;
  summary: { accounts: number; active30: number; active7: number; new30: number; regulars: number; work30: number };
  limits: { savedJobs: number; monthlyWork: number; activeDays: number; overJobs: number; overWork: number; overDays: number };
  months: { month: string; joined: number }[];
  heaviest: Person[];
};

const APP_SHORT: Record<string, string> = {
  "excel-to-kml": "Excel to KML",
  traverse: "Traverse",
  slope: "Slope",
  "auto-draft": "Auto Draft",
  roadpro: "RoadPro",
  "folder-manager": "Folders",
  toolkit: "Toolkit",
  website: "Website",
};
const card = "rounded-2xl border border-[var(--adm-line)] bg-[var(--adm-card)] p-4";
const ago = (iso: string | null) => {
  if (!iso) return "never";
  const d = Math.floor((Date.now() - Date.parse(iso)) / 864e5);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};
const monthName = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

export default function AdminUsage({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [data, setData] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetcher.current("/api/admin/usage");
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't load the usage.");
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  if (busy && !data)
    return (
      <p className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Working out the usage…
      </p>
    );
  if (error && !data) return <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>;
  if (!data) return null;

  const s = data.summary;
  const pct = Math.min(100, Math.round((s.active30 / data.goal) * 100));
  const maxJoined = Math.max(1, ...data.months.map((m) => m.joined));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Usage</h2>
          <p className="text-sm text-slate-400">Who really uses the programs, to see when a paid plan makes sense. Admin and test accounts are left out.</p>
        </div>
        <button type="button" onClick={() => void load()} aria-label="Refresh" className="p-2 rounded-xl border border-[var(--adm-line)] bg-[var(--adm-card)] text-slate-400 hover:text-white cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} aria-hidden />
        </button>
      </div>

      {/* the goal */}
      <section className={card}>
        <div className="flex items-center gap-2 text-slate-300">
          <Target className="w-4 h-4 text-amber-300" aria-hidden />
          <p className="text-sm font-bold">Goal before a paid plan: {data.goal.toLocaleString()} people a month</p>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-white tabular-nums">
          {s.active30.toLocaleString()} <span className="text-base font-semibold text-slate-400">active in the last 30 days</span>
        </p>
        <div className="mt-3 h-3 rounded-full bg-slate-800 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to the goal">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-amber-400" style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {pct}% of the goal · {Math.max(0, data.goal - s.active30).toLocaleString()} to go · {s.accounts.toLocaleString()} accounts in all
        </p>
      </section>

      {/* the numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active this week", value: s.active7, Icon: Users },
          { label: "Come back often", hint: "4+ days in 30", value: s.regulars, Icon: TrendingUp },
          { label: "New accounts", hint: "last 30 days", value: s.new30, Icon: Users },
          { label: "Work done", hint: "conversions, saves, exports in 30 days", value: s.work30, Icon: Gauge },
        ].map((x) => (
          <div key={x.label} className={card}>
            <x.Icon className="w-4 h-4 text-blue-400" aria-hidden />
            <p className="mt-2 text-2xl font-extrabold text-white tabular-nums">{x.value.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-300">{x.label}</p>
            {x.hint && <p className="text-[11px] text-slate-500">{x.hint}</p>}
          </div>
        ))}
      </div>

      {/* new accounts per month */}
      <section className={card}>
        <p className="text-sm font-bold text-white">New accounts per month</p>
        <div className="mt-3 flex items-end gap-2 h-28">
          {data.months.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <span className="text-[11px] font-semibold text-slate-300 tabular-nums">{m.joined}</span>
              <div className="w-full rounded-t-md bg-blue-500/70" style={{ height: `${Math.max(4, (m.joined / maxJoined) * 80)}%` }} />
              <span className="text-[11px] text-slate-500">{monthName(m.month)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* example free limits */}
      <section className={card}>
        <p className="text-sm font-bold text-white">If there were free limits today</p>
        <p className="text-xs text-slate-400">How many accounts would pass each example limit: the people a Pro plan would be for.</p>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: `More than ${data.limits.savedJobs} saved jobs`, value: data.limits.overJobs },
            { label: `More than ${data.limits.monthlyWork} pieces of work a month`, value: data.limits.overWork },
            { label: `Active on more than ${data.limits.activeDays} days a month`, value: data.limits.overDays },
          ].map((x) => (
            <li key={x.label} className="rounded-xl border border-[var(--adm-line)] bg-slate-950/40 px-3 py-2.5">
              <p className="text-xl font-extrabold text-amber-300 tabular-nums">{x.value}</p>
              <p className="text-xs text-slate-300">{x.label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* the heaviest users */}
      <section className={card}>
        <p className="text-sm font-bold text-white">Who uses them most (last 30 days)</p>
        <p className="text-xs text-slate-400">Ranked by days active, then work done, then what they keep. Your first Pro customers are likely here.</p>
        {data.heaviest.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No use recorded yet.</p>
        ) : (
          <ol className="mt-3 divide-y divide-[var(--adm-line)]">
            {data.heaviest.map((p, i) => (
              <li key={p.id} className="py-2.5 flex items-start gap-3">
                <span className="w-6 shrink-0 text-right text-xs font-bold text-slate-500 tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {p.name || p.email} {p.organization && <span className="font-normal text-slate-400">· {p.organization}</span>}
                  </p>
                  <p className="truncate text-xs text-slate-400">{p.email}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-slate-300 tabular-nums">
                    <span>{p.activeDays30} days</span>
                    <span>{p.work30} work</span>
                    {p.points30 > 0 && <span>{p.points30.toLocaleString()} points</span>}
                    <span>{p.savedJobs} saved</span>
                    <span className="text-slate-500">last {ago(p.lastActive)}</span>
                  </p>
                  {p.apps.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {p.apps.map((a) => (
                        <span key={a} className="rounded-md border border-[var(--adm-line)] px-1.5 py-0.5 text-[10.5px] text-slate-300">
                          {APP_SHORT[a] || a}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <AdminInvites adminFetch={adminFetch} />
    </div>
  );
}
