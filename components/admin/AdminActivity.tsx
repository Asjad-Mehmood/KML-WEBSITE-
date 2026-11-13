"use client";

// Admin → Activity: everything that happens across the apps and tools, newest first
// (app/api/admin/activity-feed): what people do in Excel to KML, Traverse & Level and Slope
// Calculator, downloads, sign-ins and account changes, and what the Survey Toolkit does on PCs.
// Filter by app, action, person, dates, errors or words; open any line for all its details;
// follow it live; export what is shown.
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, FileSpreadsheet, Loader2, Pause, Play, RefreshCw, Search, User, X } from "lucide-react";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
interface Row {
  id: string;
  source: "activity" | "download" | "toolkit";
  app: string;
  platform: string | null;
  version: string | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  action: string;
  title: string;
  details: string | null;
  fileName: string | null;
  fileSize: string | null;
  points: number | null;
  status: string;
  error: string | null;
  durationMs: number | null;
  ip: string | null;
  place: string | null;
  device: string | null;
  at: string;
}
interface Facets {
  apps: Record<string, number>;
  actions: Record<string, number>;
  errors: number;
  total: number;
}

export const APPS: { id: string; name: string; tone: string }[] = [
  { id: "excel-to-kml", name: "Excel to KML", tone: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { id: "traverse", name: "Traverse & Level", tone: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { id: "slope", name: "Slope Calculator", tone: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  { id: "roadpro", name: "RoadPro", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { id: "folder-manager", name: "Folder Manager", tone: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  { id: "toolkit", name: "Survey Toolkit", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { id: "website", name: "Website", tone: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
];
const appOf = (id: string) => APPS.find((a) => a.id === id) ?? { id, name: id, tone: "bg-slate-500/15 text-slate-300 border-slate-500/30" };

/** Plain words for each action */
const ACTION: Record<string, string> = {
  conversion: "Converted",
  export: "Exported",
  file_upload: "Opened a file",
  file_import: "Imported a file",
  drag_drop_import: "Dropped a file",
  batch_process: "Batch",
  photos_attached: "Added photos",
  project_save: "Saved a project",
  browser_export: "Exported (browser)",
  settings_update: "Changed the account",
  settings_changed: "Changed settings",
  download: "Downloaded",
  sign_in: "Signed in",
  sign_up: "Made an account",
  sign_out: "Signed out",
  sign_in_refused: "Sign-in refused",
  login_failed: "Wrong password",
  app_signin: "Signed in an app",
  tl_open: "Opened a job",
  tl_import: "Imported",
  tl_export: "Exported",
  tl_simulation: "Simulated",
  slope_new: "Saved a calculation",
  slope_update: "Changed a calculation",
  slope_delete: "Deleted a calculation",
  review: "Wrote a review",
  toolkit_installed: "Installed",
  toolkit_updated: "Updated",
  toolkit_uninstalled: "Uninstalled",
  toolkit_failed: "Failed",
  toolkit_opened: "Opened",
};
const actionName = (a: string) => ACTION[a] ?? a.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const isError = (r: Row) => ["error", "failed"].includes(r.status);

const RANGES = [
  { id: "today", label: "Today", days: 1 },
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "all", label: "All time", days: 0 },
];
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function browserOf(ua: string | null): string {
  const u = ua || "";
  if (!u) return "";
  const os = /Windows/.test(u) ? "Windows" : /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : /Mac OS/.test(u) ? "Mac" : /Linux/.test(u) ? "Linux" : "";
  const br = /Edg\//.test(u) ? "Edge" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : /Dart|dart/.test(u) ? "App" : "";
  return [br, os].filter(Boolean).join(" on ") || u.slice(0, 60);
}

/** Details as the app sent them: JSON shown as a list, anything else as text */
function DetailList({ text }: { text: string | null }) {
  if (!text) return null;
  let obj: Record<string, unknown> | null = null;
  try {
    const v = JSON.parse(text);
    if (v && typeof v === "object" && !Array.isArray(v)) obj = v as Record<string, unknown>;
  } catch {
    // plain text
  }
  if (!obj) return <p className="text-[12.5px] text-slate-300 whitespace-pre-wrap break-words">{text}</p>;
  return (
    <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-1 text-[12.5px]">
      {Object.entries(obj)
        .filter(([, v]) => v !== null && v !== "" && v !== undefined)
        .map(([k, v]) => (
          <Fragment key={k}>
            <dt className="text-slate-500">{k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase())}</dt>
            <dd className="text-slate-200 break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
          </Fragment>
        ))}
    </dl>
  );
}

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function AdminActivity({
  adminFetch,
  onToast,
  onOpenAccount,
  onClearAll,
}: {
  adminFetch: Fetcher;
  onToast: (m: string, t?: "success" | "error") => void;
  onOpenAccount: (userId: string) => void;
  /** clears what people did in the apps (not downloads or the Toolkit's records); asks first */
  onClearAll?: () => Promise<void>;
}) {
  const [app, setApp] = useState("");
  const [action, setAction] = useState("");
  const [person, setPerson] = useState<{ id: string; label: string } | null>(null);
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [range, setRange] = useState("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [busy, setBusy] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const fetcher = useRef(adminFetch);
  const toast = useRef(onToast);
  useEffect(() => {
    fetcher.current = adminFetch;
    toast.current = onToast;
  });

  // typing waits a moment before it searches
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (app) p.set("app", app);
    if (action) p.set("action", action);
    if (person) p.set("user", person.id);
    if (term) p.set("q", term);
    if (errorsOnly) p.set("errors", "1");
    const r = RANGES.find((x) => x.id === range);
    if (range === "custom") {
      if (from) p.set("from", from);
      if (to) p.set("to", to);
    } else if (r && r.days) {
      p.set("days", String(r.days));
    }
    return p;
  }, [app, action, person, term, errorsOnly, range, from, to]);

  const load = useCallback(
    async (more: string | null) => {
      const p = new URLSearchParams(params);
      // a preset period counts back from today, worked out when the list is read
      const days = Number(p.get("days"));
      p.delete("days");
      if (days) p.set("from", isoDay(new Date(Date.now() - (days - 1) * 864e5)));
      if (more) p.set("before", more);
      else p.set("facets", "1");
      try {
        const r = await fetcher.current(`/api/admin/activity-feed?${p}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Couldn't read the activity.");
        setRows((old) => (more ? [...old, ...j.rows] : j.rows));
        setNext(j.next);
        if (j.facets) setFacets(j.facets);
      } catch (e) {
        toast.current(e instanceof Error ? e.message : "Couldn't read the activity.", "error");
      } finally {
        setBusy(false);
      }
    },
    [params]
  );

  useEffect(() => {
    void load(null);
  }, [load]);

  // live: the newest lines every 20 seconds
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => void load(null), 20_000);
    return () => clearInterval(t);
  }, [live, load]);

  const exportCsv = async () => {
    const p = new URLSearchParams(params);
    const days = Number(p.get("days"));
    p.delete("days");
    if (days) p.set("from", isoDay(new Date(Date.now() - (days - 1) * 864e5)));
    p.set("limit", "5000");
    const r = await adminFetch(`/api/admin/activity-feed?${p}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return onToast(j.error || "Couldn't export.", "error");
    const list = j.rows as Row[];
    const body = [
      ["When", "App", "Device", "Version", "Name", "Email", "What", "Title", "File", "Size", "Points", "Status", "Error", "Took (ms)", "IP", "Place", "Details"],
      ...list.map((r) => [r.at, appOf(r.app).name, r.platform, r.version, r.name, r.email, actionName(r.action), r.title, r.fileName, r.fileSize, r.points, r.status, r.error, r.durationMs, r.ip, r.place, r.details]),
    ]
      .map((r) => r.map(csvCell).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${isoDay(new Date())}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast(`${list.length.toLocaleString()} lines exported${list.length === 5000 ? " (the newest 5,000)" : ""}`, "success");
  };

  const refresh = () => {
    setBusy(true);
    void load(null);
  };
  const actions = Object.entries(facets?.actions ?? {}).sort((a, b) => b[1] - a[1]);
  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
      on ? "bg-blue-600 text-white border-blue-600" : "bg-[var(--adm-hover)] border-[var(--adm-line)] text-slate-300 hover:text-white"
    }`;
  const select = "px-3 py-2 rounded-xl bg-[var(--adm-hover)] border border-[var(--adm-line)] text-sm text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer";

  // the day heading over the first line of each day
  const heads = useMemo(() => {
    const out = new Map<string, string>();
    let last = "";
    for (const r of rows) {
      const label = new Date(r.at).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      if (label !== last) out.set(`${r.source}-${r.id}`, label);
      last = label;
    }
    return out;
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* apps */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => (setBusy(true), setApp(""), setAction(""))} className={chip(!app)}>
          All apps <span className="opacity-70 tabular-nums">{facets ? Object.values(facets.apps).reduce((a, b) => a + b, 0).toLocaleString() : ""}</span>
        </button>
        {APPS.map((a) => (
          <button key={a.id} onClick={() => (setBusy(true), setApp(a.id), setAction(""))} className={chip(app === a.id)}>
            {a.name} <span className="opacity-70 tabular-nums">{(facets?.apps[a.id] ?? 0).toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search person, file, title, error, IP"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--adm-hover)] border border-[var(--adm-line)] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select value={action} onChange={(e) => (setBusy(true), setAction(e.target.value))} className={select} aria-label="What">
          <option value="">Every action</option>
          {actions.map(([a, n]) => (
            <option key={a} value={a}>
              {actionName(a)} ({n.toLocaleString()})
            </option>
          ))}
        </select>
        <select value={range} onChange={(e) => (setBusy(true), setRange(e.target.value))} className={select} aria-label="When">
          {RANGES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
          <option value="custom">Dates…</option>
        </select>
        {range === "custom" && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={select} aria-label="From" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={select} aria-label="To" />
          </>
        )}
        <button onClick={() => (setBusy(true), setErrorsOnly(!errorsOnly))} className={chip(errorsOnly)}>
          <AlertTriangle className="w-3.5 h-3.5" /> Errors {facets ? `(${facets.errors.toLocaleString()})` : ""}
        </button>
        {person && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-200 border border-blue-500/40">
            <User className="w-3.5 h-3.5" /> {person.label}
            <button onClick={() => (setBusy(true), setPerson(null))} aria-label="Everyone" className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={() => setLive(!live)} className={chip(live)} title="Show new lines as they come (every 20 seconds)">
            {live ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} Live
          </button>
          <button onClick={refresh} className={chip(false)}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
          </button>
          {onClearAll && (
            <button
              onClick={async () => {
                await onClearAll();
                refresh();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border bg-red-600/10 border-red-500/30 text-red-300"
              title="Delete what people did in the apps and on the site. Downloads and the Toolkit's records stay."
            >
              Clear…
            </button>
          )}
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border bg-emerald-600/15 border-emerald-500/30 text-emerald-300">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {facets ? `${facets.total.toLocaleString()} lines match` : ""} · RoadPro and Project Folder Manager don&apos;t report what they do yet: their downloads show here,
        and the Toolkit&apos;s installs and updates of them.
      </p>

      {/* the list */}
      <div className="rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] overflow-hidden">
        {!rows.length && !busy && <p className="p-10 text-center text-sm text-slate-400">Nothing matches.</p>}
        {!rows.length && busy && (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        )}
        <ul>
          {rows.map((r) => {
            const d = new Date(r.at);
            const head = heads.get(`${r.source}-${r.id}`) ?? null;
            const a = appOf(r.app);
            const isOpen = open === r.id;
            return (
              <li key={`${r.source}-${r.id}`}>
                {head && <p className="px-4 pt-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-t border-[var(--adm-line)] first:border-t-0">{head}</p>}
                <button
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                  className={`w-full flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left cursor-pointer border-t border-[var(--adm-line)] hover:bg-[var(--adm-hover)] ${isOpen ? "bg-[var(--adm-hover)]" : ""}`}
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />}
                  <span className="w-[68px] shrink-0 whitespace-nowrap text-[12px] tabular-nums text-slate-400">{d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10.5px] font-bold ${a.tone}`}>{a.name}</span>
                  <span className={`shrink-0 text-[12px] font-semibold ${isError(r) ? "text-red-300" : "text-slate-300"}`}>{actionName(r.action)}</span>
                  <span className="min-w-0 flex-1 text-[13px] text-slate-100 truncate">{r.title}</span>
                  {isError(r) && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                  <span className="shrink-0 text-[12px] text-slate-400 truncate max-w-[200px]">{r.name || r.email || "Signed out"}</span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-12 pb-4 pt-1 bg-[var(--adm-hover)] grid lg:grid-cols-2 gap-4">
                    <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-1 text-[12.5px]">
                      <dt className="text-slate-500">When</dt>
                      <dd className="text-slate-200">{d.toLocaleString()}</dd>
                      <dt className="text-slate-500">App</dt>
                      <dd className="text-slate-200">
                        {a.name}
                        {r.platform ? ` · ${r.platform}` : ""}
                        {r.version ? ` · ${r.version}` : ""}
                      </dd>
                      <dt className="text-slate-500">Who</dt>
                      <dd className="text-slate-200">
                        {r.userId ? (
                          <span className="flex flex-wrap gap-x-3">
                            <span>{[r.name, r.email].filter(Boolean).join(" · ")}</span>
                            <button onClick={() => onOpenAccount(r.userId!)} className="text-blue-300 hover:text-blue-200 cursor-pointer">
                              Open account
                            </button>
                            <button
                              onClick={() => (setBusy(true), setPerson({ id: r.userId!, label: r.name || r.email || "This person" }))}
                              className="text-blue-300 hover:text-blue-200 cursor-pointer"
                            >
                              Only this person
                            </button>
                          </span>
                        ) : (
                          "Signed out"
                        )}
                      </dd>
                      {r.fileName && (
                        <>
                          <dt className="text-slate-500">File</dt>
                          <dd className="text-slate-200 break-all">
                            {r.fileName}
                            {r.fileSize ? ` · ${r.fileSize}` : ""}
                          </dd>
                        </>
                      )}
                      {r.points != null && (
                        <>
                          <dt className="text-slate-500">Points</dt>
                          <dd className="text-slate-200">{r.points.toLocaleString()}</dd>
                        </>
                      )}
                      {r.durationMs != null && (
                        <>
                          <dt className="text-slate-500">Took</dt>
                          <dd className="text-slate-200">{r.durationMs < 1000 ? `${r.durationMs} ms` : `${(r.durationMs / 1000).toFixed(1)} s`}</dd>
                        </>
                      )}
                      <dt className="text-slate-500">Result</dt>
                      <dd className={isError(r) ? "text-red-300" : "text-emerald-300"}>{r.status}</dd>
                      {r.error && (
                        <>
                          <dt className="text-slate-500">Error</dt>
                          <dd className="text-red-300 break-words">{r.error}</dd>
                        </>
                      )}
                      {(r.place || r.ip) && (
                        <>
                          <dt className="text-slate-500">From</dt>
                          <dd className="text-slate-200">{[r.place, r.ip].filter(Boolean).join(" · ")}</dd>
                        </>
                      )}
                      {r.device && (
                        <>
                          <dt className="text-slate-500">{r.source === "toolkit" ? "PC" : "Device"}</dt>
                          <dd className="text-slate-200" title={r.device}>
                            {r.source === "toolkit" ? r.device : browserOf(r.device)}
                          </dd>
                        </>
                      )}
                    </dl>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Details</p>
                      {r.details ? <DetailList text={r.details} /> : <p className="text-[12.5px] text-slate-500">No more details.</p>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {next && (
          <div className="p-3 border-t border-[var(--adm-line)] flex justify-center">
            <button onClick={() => (setBusy(true), void load(next))} className={chip(false)}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Show older
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
