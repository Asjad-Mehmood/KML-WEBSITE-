"use client";

// Admin → Dashboard, at the top: what needs attention now, and the chosen period (7 days to a year)
// against the period before it: sign-ups, downloads, active accounts, sign-ins and conversions,
// day by day (week by week for a year), per program and per country (app/api/admin/trends).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Ban, Inbox, Loader2, MailWarning, Megaphone, Minus, Monitor, Star } from "lucide-react";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
interface Pair {
  cur: number;
  prev: number;
}
interface Trends {
  days: number;
  bucket: "day" | "week";
  totals: { signups: Pair; downloads: Pair; active: Pair; signins: Pair; conversions: Pair };
  series: { t: string; signups: number; downloads: number; active: number }[];
  programs: { id: string; cur: number; prev: number }[];
  countries: [string, number][];
  attention: { messages: number; reviews: number; toolkitFailures: number; unconfirmed: number; blocked: number; sending: number };
}

const PERIODS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
];
const PROGRAM: Record<string, string> = {
  windows_installer: "Excel to KML",
  roadpro: "RoadPro",
  traverse: "Traverse & Level",
  folder_manager: "Project Folder Manager",
  slope: "Slope Calculator",
  toolkit: "Survey Toolkit",
};
const SERIES = [
  { key: "signups", label: "Sign-ups", color: "bg-blue-400" },
  { key: "downloads", label: "Downloads", color: "bg-emerald-400" },
  { key: "active", label: "Active accounts", color: "bg-violet-400" },
] as const;

const card = "rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)]";

function Delta({ p }: { p: Pair }) {
  if (!p.prev && !p.cur) return <span className="text-[11.5px] text-slate-500 whitespace-nowrap">no change</span>;
  if (!p.prev) return <span className="text-[11.5px] font-bold text-emerald-300">new</span>;
  const pct = Math.round(((p.cur - p.prev) / p.prev) * 100);
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const c = pct > 0 ? "text-emerald-300" : pct < 0 ? "text-red-300" : "text-slate-400";
  return (
    <span className={`inline-flex items-center gap-0.5 whitespace-nowrap text-[11.5px] font-bold ${c}`} title={`Before: ${p.prev.toLocaleString()}`}>
      <Icon className="w-3.5 h-3.5" /> {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

export default function AdminTrends({ adminFetch, onShow }: { adminFetch: Fetcher; onShow: (tab: string) => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Trends | null>(null);
  const [busy, setBusy] = useState(true);
  const [series, setSeries] = useState<(typeof SERIES)[number]["key"]>("downloads");
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });

  const load = useCallback(
    (d: number) =>
      fetcher.current(`/api/admin/trends?days=${d}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => j.success && setData(j as Trends))
        .catch(() => {})
        .finally(() => setBusy(false)),
    []
  );
  useEffect(() => {
    void load(days);
  }, [load, days]);

  const a = data?.attention;
  const needs = a
    ? [
        { n: a.messages, label: "new messages", tab: "messages", icon: Inbox, tone: "text-blue-300" },
        { n: a.reviews, label: "reviews to publish", tab: "reviews", icon: Star, tone: "text-amber-300" },
        { n: a.toolkitFailures, label: "Toolkit failures this week", tab: "toolkit", icon: Monitor, tone: "text-red-300" },
        { n: a.sending, label: "emails being sent", tab: "releases", icon: Megaphone, tone: "text-violet-300" },
        { n: a.unconfirmed, label: "new accounts not confirmed", tab: "users", icon: MailWarning, tone: "text-amber-300" },
        { n: a.blocked, label: "blocked accounts", tab: "users", icon: Ban, tone: "text-slate-300" },
      ].filter((x) => x.n > 0)
    : [];

  // every day (or week) of the period, with nothing where nothing happened
  const filled = useMemo(() => {
    if (!data) return [];
    const by = new Map(data.series.map((s) => [s.t, s]));
    const step = data.bucket === "week" ? 7 : 1;
    const out: Trends["series"] = [];
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    if (data.bucket === "week") end.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7)); // Monday, as date_trunc('week')
    const count = Math.ceil(data.days / step);
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - i * step * 864e5).toISOString().slice(0, 10);
      out.push(by.get(d) ?? { t: d, signups: 0, downloads: 0, active: 0 });
    }
    return out;
  }, [data]);
  const top = Math.max(1, ...filled.map((s) => s[series]));
  const label = data?.bucket === "week" ? "week" : "day";
  const periodWord = PERIODS.find((p) => p.days === days)?.label ?? `${days} days`;

  return (
    <div className="space-y-4">
      {/* needs attention */}
      {a && (
        <div className={`${card} p-4 sm:p-5`}>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Needs your attention
          </h3>
          {needs.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {needs.map((x) => (
                <button
                  key={x.label}
                  onClick={() => onShow(x.tab)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--adm-hover)] hover:bg-[var(--adm-hover-strong)] border border-[var(--adm-line)] text-[13px] text-slate-200 cursor-pointer"
                >
                  <x.icon className={`w-4 h-4 ${x.tone}`} />
                  <span className="font-bold tabular-nums">{x.n.toLocaleString()}</span> {x.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-400">Nothing waiting. All clear.</p>
          )}
        </div>
      )}

      {/* the period */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-300 mr-1">Compare the last</span>
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => {
              setBusy(true);
              setDays(p.days);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              days === p.days ? "bg-blue-600 text-white" : "bg-[var(--adm-hover)] border border-[var(--adm-line)] text-slate-400 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-xs text-slate-500">with the {periodWord} before</span>
        {busy && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {(
              [
                ["signups", "New accounts"],
                ["downloads", "Program downloads"],
                ["active", "Active accounts"],
                ["signins", "Accounts signed in"],
                ["conversions", "Conversions"],
              ] as const
            ).map(([k, l]) => (
              <div key={k} className={`${card} p-4`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{l}</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">{data.totals[k].cur.toLocaleString()}</p>
                <Delta p={data.totals[k]} />
              </div>
            ))}
          </div>

          <div className={`${card} p-4 sm:p-5`}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white mr-2">Each {label}</h3>
              {SERIES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSeries(s.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    series === s.key ? "bg-[var(--adm-hover-strong)] text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-sm ${s.color}`} /> {s.label}
                </button>
              ))}
            </div>
            {filled.some((s) => s[series] > 0) ? (
              <>
                <div className="mt-4 flex items-end gap-[3px] h-36">
                  {filled.map((s) => (
                    <div key={s.t} className="flex-1 h-full flex flex-col justify-end" title={`${s.t}: ${s[series]} ${SERIES.find((x) => x.key === series)!.label.toLowerCase()}`}>
                      <div className={`${SERIES.find((x) => x.key === series)!.color} rounded-t-sm min-h-[2px]`} style={{ height: `${(s[series] / top) * 100}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[10.5px] text-slate-500">
                  <span>{filled[0]?.t}</span>
                  <span>{filled[filled.length - 1]?.t}</span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Nothing in this period.</p>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className={card}>
              <h3 className="px-5 pt-4 pb-3 text-base font-bold text-white">Downloads per program</h3>
              <table className="w-full">
                <tbody>
                  {data.programs.map((p) => {
                    const max = Math.max(1, ...data.programs.map((x) => x.cur));
                    return (
                      <tr key={p.id} className="border-t border-[var(--adm-line)]">
                        <td className="px-5 py-2.5 text-[13px] text-slate-200 w-[45%]">{PROGRAM[p.id] ?? p.id}</td>
                        <td className="py-2.5 w-[35%]">
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-400" style={{ width: `${(p.cur / max) * 100}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[13px] tabular-nums text-white text-right">{p.cur}</td>
                        <td className="pr-5 py-2.5 text-right">
                          <Delta p={p} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className={card}>
              <h3 className="px-5 pt-4 pb-3 text-base font-bold text-white">Downloads by country</h3>
              {data.countries.length ? (
                <ul className="px-5 pb-4 space-y-2">
                  {data.countries.map(([c, k]) => (
                    <li key={c}>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-200">{c}</span>
                        <span className="text-slate-400 tabular-nums">{k}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-400" style={{ width: `${(k / data.countries[0][1]) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 pb-5 text-sm text-slate-400">No downloads in this period.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
