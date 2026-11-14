"use client";

// Admin → Downloads: every program download, filtered and paged in the database (app/api/admin/download-log).
// The program comes from the menu (Downloads → Excel to KML …). The numbers at the top, the last 30 days,
// the versions and countries (each one filters), search, signed in or not, a period; tick many to delete;
// export what the filters show.
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckSquare, Download, FileSpreadsheet, Loader2, RefreshCw, Search, Square, Trash2, UserRound, X } from "lucide-react";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
interface Row {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  assetType: string;
  app: string;
  fileName: string;
  version: string;
  ipAddress: string | null;
  location: string | null;
  userAgent: string | null;
  timestamp: string;
}
interface Summary {
  total: number;
  people: number;
  anonymous: number;
  apps: Record<string, number>;
  series: { t: string; c: number }[];
  versions: { version: string; count: number }[];
  countries: [string, number][];
}

export const DOWNLOAD_TABS = [
  { id: "excel-to-kml", name: "Excel to KML" },
  { id: "traverse", name: "Traverse & Level" },
  { id: "slope", name: "Slope Calculator" },
  { id: "roadpro", name: "RoadPro" },
  { id: "folder-manager", name: "Project Folder Manager" },
  { id: "toolkit", name: "Survey Toolkit" },
];
const ASSET: Record<string, string> = {
  windows_installer: "Installer",
  sample_csv: "Sample CSV",
  test_kml: "Test KML",
  web_app: "Web app",
  traverse: "Installer",
  traverse_manual: "Manual",
  traverse_sample: "Sample",
  slope: "Installer",
  roadpro: "Plugin",
  folder_manager: "Installer",
  toolkit: "Installer",
};
const PERIODS = [
  { id: "", label: "Any time", days: 0 },
  { id: "1", label: "Today", days: 1 },
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
  { id: "365", label: "This year", days: 365 },
];
type F = { q: string; who: string; version: string; country: string; period: string; sort: string };
const EMPTY: F = { q: "", who: "", version: "", country: "", period: "", sort: "newest" };
const PAGE = 50;

const card = "rounded-2xl border border-slate-800 bg-slate-900/60";
const control = "px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const browser = (ua: string | null) => {
  if (!ua) return "";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Mac OS/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  const b = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "";
  return [b, os].filter(Boolean).join(" on ") || ua.slice(0, 40);
};

export default function AdminDownloads({
  adminFetch,
  onToast,
  app,
  onOpenAccount,
  onCounts,
  place,
}: {
  adminFetch: Fetcher;
  onToast: (m: string, t?: "success" | "error") => void;
  /** the program from the menu; "" for all of them */
  app: string;
  onOpenAccount: (id: string) => void;
  /** downloads per program, for the menu */
  onCounts?: (c: Record<string, number>) => void;
  place: (loc?: string | null) => { text: string; flag: string };
}) {
  const [f, setF] = useState<F>(EMPTY);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const fetcher = useRef(adminFetch);
  const toast = useRef(onToast);
  const counts = useRef(onCounts);
  useEffect(() => {
    fetcher.current = adminFetch;
    toast.current = onToast;
    counts.current = onCounts;
  });

  useEffect(() => {
    const t = setTimeout(() => setQ(f.q.trim()), 300);
    return () => clearTimeout(t);
  }, [f.q]);

  const params = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams();
      if (app) p.set("app", app);
      if (q) p.set("q", q);
      if (f.who) p.set("who", f.who);
      if (f.version) p.set("version", f.version);
      if (f.country) p.set("country", f.country);
      const days = PERIODS.find((x) => x.id === f.period)?.days ?? 0;
      if (days) {
        const from = new Date();
        from.setHours(0, 0, 0, 0);
        from.setDate(from.getDate() - (days - 1));
        p.set("from", from.toISOString());
      }
      if (f.sort !== "newest") p.set("sort", f.sort);
      for (const [k, v] of Object.entries(extra)) p.set(k, v);
      return p.toString();
    },
    [app, q, f]
  );

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      setLoading(true);
      Promise.all([
        fetcher.current(`/api/admin/download-log?${params({ limit: String(PAGE), offset: "0" })}`, { cache: "no-store" }).then((r) => r.json()),
        fetcher.current(`/api/admin/download-log?${params({ view: "summary" })}`, { cache: "no-store" }).then((r) => r.json()),
      ])
        .then(([l, s]) => {
          if (!live) return;
          if (!l.success) throw new Error(l.error);
          setRows(l.rows);
          setTotal(l.total);
          if (s.success) {
            setSummary(s);
            counts.current?.(s.apps);
          }
          setSelected(new Set());
        })
        .catch(() => live && toast.current("Couldn't load the downloads", "error"))
        .finally(() => live && setLoading(false));
    }, 0);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [params, reload]);

  const loadMore = useCallback(() => {
    setMore(true);
    fetcher
      .current(`/api/admin/download-log?${params({ limit: String(PAGE), offset: String(rows.length) })}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        setRows((have) => {
          const seen = new Set(have.map((r) => r.id));
          return [...have, ...(j.rows as Row[]).filter((r) => !seen.has(r.id))];
        });
        setTotal(j.total);
      })
      .finally(() => setMore(false));
  }, [params, rows.length]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || loading || more || rows.length >= total) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && loadMore(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, more, rows.length, total, loadMore]);

  const set = (k: keyof F, v: string) => setF((x) => ({ ...x, [k]: v }));
  const filtered = Object.entries(f).some(([k, v]) => k !== "sort" && v);
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allShown = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const remove = async (ids: string[]) => {
    if (!ids.length) return;
    if (
      !window.confirm(
        `Delete ${ids.length === 1 ? "this download record" : `${ids.length} download records`}? The numbers everywhere drop with them. This can't be undone.`
      )
    )
      return;
    setBusy("delete");
    try {
      let n = 0;
      for (let i = 0; i < ids.length; i += 500) {
        const r = await adminFetch("/api/admin/download-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", ids: ids.slice(i, i + 500) }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        n += j.deleted;
      }
      onToast(`Deleted ${n} ${n === 1 ? "record" : "records"}`);
      setReload((x) => x + 1);
    } catch {
      onToast("Couldn't delete", "error");
    } finally {
      setBusy(null);
    }
  };
  // the old "clear every record": typed confirmation, as it can't be undone
  const clearAll = async () => {
    const word = window.prompt(
      "This deletes EVERY download record of every program, and every download number on the site starts again from 0. Type DELETE to go on."
    );
    if (word !== "DELETE") return;
    setBusy("clear");
    try {
      const r = await adminFetch("/api/admin/downloads", { method: "DELETE" });
      if (!r.ok) throw new Error();
      onToast("Every download record is deleted");
      setReload((x) => x + 1);
    } catch {
      onToast("Couldn't clear", "error");
    } finally {
      setBusy(null);
    }
  };
  const exportCsv = async () => {
    setBusy("csv");
    try {
      const r = await adminFetch(`/api/admin/download-log?${params({ format: "csv" })}`);
      if (!r.ok) throw new Error();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(await r.blob());
      a.download = `downloads${app ? `-${app}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      onToast("Couldn't export", "error");
    } finally {
      setBusy(null);
    }
  };

  const s = summary;
  const peak = Math.max(1, ...(s?.series.map((d) => d.c) ?? [1]));
  const last30 = s?.series.reduce((a, d) => a + d.c, 0) ?? 0;
  const last7 = s?.series.slice(-7).reduce((a, d) => a + d.c, 0) ?? 0;
  const appName = DOWNLOAD_TABS.find((a) => a.id === app)?.name;

  return (
    <div className="space-y-4">
      {/* the numbers and the last 30 days */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid grid-cols-2 gap-3">
          {[
            [
              "Downloads",
              (s?.total ?? 0).toLocaleString(),
              filtered ? "matching the filters" : (appName ?? "every program"),
              () => setF({ ...EMPTY, sort: f.sort }),
            ],
            ["Last 7 days", last7.toLocaleString(), `${last30.toLocaleString()} in 30 days`, () => setF({ ...f, period: "7" })],
            ["People", (s?.people ?? 0).toLocaleString(), "signed in when downloading", () => setF({ ...f, who: "in" })],
            [
              "Not signed in",
              (s?.anonymous ?? 0).toLocaleString(),
              s?.total ? `${Math.round(((s?.anonymous ?? 0) / s.total) * 100)}% of downloads` : "—",
              () => setF({ ...f, who: "out" }),
            ],
          ].map(([label, value, sub, go]) => (
            <button key={label as string} onClick={go as () => void} className={`${card} p-4 text-left hover:border-slate-600 cursor-pointer`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label as string}</p>
              <p className="mt-1 text-2xl font-extrabold text-white tabular-nums">{value as string}</p>
              <p className="text-[11.5px] text-slate-400">{sub as string}</p>
            </button>
          ))}
        </div>
        <div className={`${card} p-4 flex flex-col`}>
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Each day, last 30 days</p>
            <p className="text-[11px] text-slate-500">most in a day: {peak === 1 && !last30 ? 0 : peak}</p>
          </div>
          <div className="mt-3 flex-1 min-h-[110px] flex items-end gap-[3px]" role="img" aria-label={`${last30} downloads in the last 30 days`}>
            {(s?.series ?? []).map((d) => (
              <div key={d.t} className="group relative flex-1 h-full flex items-end">
                <div
                  className={`w-full rounded-t ${d.c ? "bg-blue-500/80 group-hover:bg-blue-400" : "bg-slate-800"}`}
                  style={{ height: `${d.c ? Math.max(6, (d.c / peak) * 100) : 3}%` }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap rounded bg-slate-950 border border-slate-700 px-1.5 py-0.5 text-[10.5px] text-white z-10">
                  {new Date(d.t + "T00:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" })}: {d.c}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10.5px] text-slate-500">
            <span>
              {s?.series[0] ? new Date(s.series[0].t + "T00:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }) : ""}
            </span>
            <span>today</span>
          </div>
        </div>
      </div>

      {/* versions and countries: a click filters */}
      {s && (s.versions.length > 0 || s.countries.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["Versions", s.versions.map((v) => [v.version, v.count] as [string, number]), "version", (v: string) => `v${v}`],
            ["Countries", s.countries, "country", (v: string) => `${place(v).flag} ${v}`],
          ].map(([title, list, key, label]) => {
            const items = list as [string, number][];
            const top = Math.max(1, ...items.map((x) => x[1]));
            return (
              <div key={title as string} className={`${card} p-4`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{title as string}</p>
                <div className="space-y-1">
                  {items.slice(0, 6).map(([v, n]) => {
                    const on = f[key as keyof F] === v;
                    return (
                      <button
                        key={v}
                        onClick={() => set(key as keyof F, on ? "" : v)}
                        aria-pressed={on}
                        className={`w-full grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 px-1.5 py-1 rounded-lg text-xs cursor-pointer ${on ? "bg-blue-600/20 ring-1 ring-blue-500/50" : "hover:bg-slate-800/60"}`}
                      >
                        <span className="text-left text-slate-200 truncate">{(label as (v: string) => string)(v)}</span>
                        <span className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <span className="block h-full bg-blue-500/80 rounded-full" style={{ width: `${(n / top) * 100}%` }} />
                        </span>
                        <span className="text-slate-400 tabular-nums">{n.toLocaleString()}</span>
                      </button>
                    );
                  })}
                  {!items.length && <p className="text-xs text-slate-500">None yet.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* find */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] sm:flex-none">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <input
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            type="search"
            placeholder="Email, name, file, IP or place"
            aria-label="Search downloads"
            className={`${control} w-full sm:w-72 pl-9`}
          />
        </div>
        <select
          value={f.who}
          onChange={(e) => set("who", e.target.value)}
          aria-label="Signed in"
          className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
        >
          <option value="">Everyone</option>
          <option value="in">Signed in</option>
          <option value="out">Not signed in</option>
        </select>
        <select
          value={f.period}
          onChange={(e) => set("period", e.target.value)}
          aria-label="When"
          className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
        >
          {PERIODS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        {s && s.versions.length > 0 && (
          <select
            value={f.version}
            onChange={(e) => set("version", e.target.value)}
            aria-label="Version"
            className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
          >
            <option value="">Every version</option>
            {s.versions.map((v) => (
              <option key={v.version} value={v.version}>
                v{v.version} ({v.count})
              </option>
            ))}
          </select>
        )}
        <select
          value={f.sort}
          onChange={(e) => set("sort", e.target.value)}
          aria-label="Sort"
          className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        {filtered && (
          <button
            onClick={() => setF({ ...EMPTY, sort: f.sort })}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
        <span className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={busy !== null}
            className={`${btn} py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white`}
            title="Every download the filters show, as a spreadsheet"
          >
            {busy === "csv" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />} Export CSV
          </button>
          <button
            onClick={() => setReload((x) => x + 1)}
            aria-label="Refresh"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </span>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 backdrop-blur text-sm text-white">
          <span className="font-bold">{selected.size} ticked</span>
          <button onClick={() => remove([...selected])} disabled={busy !== null} className={`${btn} bg-rose-600 hover:bg-rose-500 text-white`}>
            {busy === "delete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-blue-100 hover:text-white cursor-pointer">
            Clear
          </button>
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="pl-4 pr-1 py-3 w-8">
                  <button
                    onClick={() => setSelected(allShown ? new Set() : new Set(rows.map((r) => r.id)))}
                    aria-label="Tick everything shown"
                    className="p-0.5 hover:text-white cursor-pointer"
                  >
                    {allShown ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-3 py-3">When</th>
                <th className="px-3 py-3">Who</th>
                <th className="px-3 py-3">What</th>
                <th className="px-3 py-3 hidden lg:table-cell">From</th>
                <th className="px-3 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {filtered ? "No download matches." : `No downloads${appName ? ` of ${appName}` : ""} yet.`}
                  </td>
                </tr>
              )}
              {rows.map((d) => {
                const loc = d.location ? place(d.location) : { text: "Not known", flag: "" };
                const when = new Date(d.timestamp);
                return (
                  <tr key={d.id} className={selected.has(d.id) ? "bg-blue-500/10" : "hover:bg-slate-800/30"}>
                    <td className="pl-4 pr-1 py-3">
                      <button
                        onClick={() => toggle(d.id)}
                        aria-pressed={selected.has(d.id)}
                        aria-label="Tick"
                        className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {selected.has(d.id) ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      <div className="text-slate-200">{when.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</div>
                      <div className="text-slate-500">{when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-3 py-3">
                      {d.userId ? (
                        <button onClick={() => onOpenAccount(d.userId!)} className="text-left cursor-pointer group">
                          <div className="font-semibold text-white group-hover:text-blue-400 max-w-[200px] truncate">{d.userName || d.userEmail}</div>
                          <div className="text-xs text-slate-400 max-w-[200px] truncate">{d.userEmail}</div>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <UserRound className="w-3.5 h-3.5" /> Not signed in
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {!app && <span className="text-xs font-semibold text-slate-200">{DOWNLOAD_TABS.find((a) => a.id === d.app)?.name ?? d.app}</span>}
                        <span className="px-1.5 py-0.5 rounded border border-slate-700 text-[10px] font-bold text-slate-300">
                          {ASSET[d.assetType] ?? d.assetType}
                        </span>
                        {d.version && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-[10px] font-bold text-blue-300">
                            v{d.version.replace(/^v/i, "")}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono max-w-[260px] truncate" title={d.fileName}>
                        {d.fileName}
                      </div>
                      <div className="lg:hidden text-[11px] text-slate-500">
                        {loc.flag} {loc.text}
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-slate-200 whitespace-nowrap">
                        <span>{loc.flag}</span>
                        <span className="truncate max-w-[160px]">{loc.text}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 whitespace-nowrap">
                        <span className="font-mono">{d.ipAddress || "—"}</span>
                        {d.userAgent && <span title={d.userAgent}> · {browser(d.userAgent)}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => remove([d.id])}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        title="Delete this record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div ref={sentinel} className="px-4 py-3 border-t border-slate-800 text-center text-xs text-slate-400">
          {loading || more ? (
            <>
              <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> Loading…
            </>
          ) : rows.length < total ? (
            `Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()}; more load as you scroll`
          ) : rows.length ? (
            <span className="inline-flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> All {total.toLocaleString()} shown
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={clearAll} disabled={busy !== null} className={`${btn} text-rose-400/80 hover:text-rose-300`}>
          {busy === "clear" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete every download record…
        </button>
      </div>
    </div>
  );
}
