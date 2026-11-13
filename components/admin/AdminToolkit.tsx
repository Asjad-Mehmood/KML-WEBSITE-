"use client";

// Admin → Survey Toolkit: everything about the Toolkit in one place.
//   Overview   accounts, PCs, downloads, installs, updates and failures; 30 days day by day;
//              each tool on the PCs (up to date or not); Toolkit and Windows versions
//   Accounts   each account that uses it: PCs, Toolkit version, what it did, when it downloaded
//   PCs        each PC with the version of every tool; its whole history on demand
//   Activity   every install, update, uninstall, failure and open, filtered and exported
//   Downloads  each download from the website (who, where, which version) and GitHub's counts
//   Access     open to everyone or only the testers, and the testers themselves
// Data from /api/toolkit/admin; testers added and removed with /api/toolkit/testers.
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  FileSpreadsheet,
  LayoutDashboard,
  Loader2,
  Lock,
  Monitor,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { isOlder } from "@/components/toolkit/ToolkitAdmin";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;

interface Tool {
  id: string;
  name: string;
  latest: string | null;
}
interface Tester {
  email: string;
  note: string;
  addedBy: string;
  createdAt: string;
  name: string | null;
  lastLogin: string | null;
  devices: number;
}
interface Device {
  id: string;
  userId: string;
  email: string | null;
  userName: string | null;
  name: string;
  windows: string;
  toolkitVersion: string;
  tools: Record<string, string>;
  firstSeen: string;
  lastSeen: string;
}
interface Event {
  id: string;
  deviceId: string;
  deviceName: string | null;
  email: string | null;
  tool: string;
  action: string;
  fromVersion: string;
  toVersion: string;
  message: string;
  createdAt: string;
}
interface Person {
  userId: string;
  email: string | null;
  name: string | null;
  organization: string | null;
  location: string | null;
  pcs: number;
  firstSeen: string;
  lastSeen: string;
  toolkitVersion: string;
  events: number;
  installs: number;
  updates: number;
  failures: number;
  lastDownload: string | null;
}
interface Day {
  day: string;
  pcs: number;
  installed: number;
  updated: number;
  uninstalled: number;
  failed: number;
  opened: number;
}
interface SiteDownload {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  version: string;
  location: string | null;
  userAgent: string | null;
  timestamp: string;
}
interface Data {
  tools: Tool[];
  testers: Tester[];
  devices: Device[];
  events: Event[];
  counts: Record<string, { all: number; automatic: number }>;
  downloads: {
    total: number;
    releases: { tag: string; published: string | null; prerelease: boolean; downloads: number }[];
    latest: { version: string } | null;
  } | null;
  users: Person[];
  daily: Day[];
  toolCounts: Record<string, Record<string, { all: number; recent: number }>>;
  siteDownloads: SiteDownload[];
  isPublic: boolean | null;
}

type Section = "overview" | "accounts" | "pcs" | "activity" | "downloads" | "access";
const SECTIONS: { id: Section; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "pcs", label: "PCs", icon: Monitor },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "access", label: "Access", icon: Lock },
];

const ACTIONS = ["installed", "updated", "uninstalled", "failed", "opened"] as const;
const ACTION_STYLE: Record<string, string> = {
  installed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  updated: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  uninstalled: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  opened: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};
const ACTION_LABEL: Record<string, string> = { installed: "Installed", updated: "Updated", uninstalled: "Uninstalled", failed: "Failed", opened: "Opened" };
const SHORT: Record<string, string> = { "excel-to-kml": "Excel to KML", roadpro: "RoadPro", traverse: "Traverse", "folder-manager": "Folder Mgr", slope: "Slope" };

const DAY = 24 * 3600 * 1000;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const when = (s: string | null) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const date = (s: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
function ago(s: string | null, now: number): string {
  if (!s) return "—";
  const d = now - new Date(s).getTime();
  if (d < 60_000) return "just now";
  if (d < 3600_000) return `${Math.round(d / 60_000)} min ago`;
  if (d < DAY) return `${Math.round(d / 3600_000)} h ago`;
  if (d < 30 * DAY) return plural(Math.round(d / DAY), "day") + " ago";
  return date(s);
}
const automatic = (e: Event) => e.message === "automatic" || e.message.startsWith("automatic:");
const reason = (e: Event) => (e.message.startsWith("automatic:") ? e.message.slice(10).trim() : e.message === "automatic" ? "" : e.message);
/** "Windows 11 Pro 10.0.26100" → "Windows 11 Pro" */
const windowsName = (w: string) => (w.match(/Windows\s+\d+(\s+(Home|Pro|Enterprise|Education))?/i)?.[0] ?? (w || "Unknown"));
const browser = (ua: string | null) => {
  const u = ua || "";
  if (/Edg\//.test(u)) return "Edge";
  if (/Chrome\//.test(u)) return "Chrome";
  if (/Firefox\//.test(u)) return "Firefox";
  if (/Safari\//.test(u)) return "Safari";
  return u ? "Other" : "—";
};

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function saveCsv(name: string, head: string[], rows: unknown[][]) {
  const body = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const stamp = () => new Date().toISOString().slice(0, 10);

const card = "rounded-2xl border border-slate-800 bg-slate-900/70";
const th = "px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap";
const td = "px-3 py-2.5 text-[13px] text-slate-300 whitespace-nowrap";
const smallBtn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50";
const exportBtn = `${smallBtn} bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300`;

function Stat({ label, value, sub, warn }: { label: string; value: string | number; sub?: string; warn?: boolean }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-extrabold tabular-nums ${warn ? "text-red-300" : "text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function Version({ v, latest }: { v: string | undefined; latest: string | null | undefined }) {
  if (!v) return <span className="text-slate-600">—</span>;
  const old = !!latest && isOlder(v, latest);
  return (
    <span className={`tabular-nums font-semibold ${old ? "text-amber-300" : "text-emerald-300"}`} title={old ? `Latest is ${latest}` : "Up to date"}>
      {v}
    </span>
  );
}

function ActionTag({ e }: { e: Event }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${ACTION_STYLE[e.action] ?? ACTION_STYLE.uninstalled}`}>
        {ACTION_LABEL[e.action] ?? e.action}
      </span>
      {automatic(e) && <span className="text-[10.5px] font-semibold text-slate-500">automatic</span>}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className={`${card} p-10 text-center text-sm text-slate-400`}>{children}</div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-md">
      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function EventTable({ events, tools, showPc = true }: { events: Event[]; tools: Tool[]; showPc?: boolean }) {
  const nameOf = (id: string) => tools.find((t) => t.id === id)?.name ?? (id === "toolkit" ? "Survey Toolkit" : id);
  if (!events.length) return <p className="px-4 py-6 text-sm text-slate-400">Nothing yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800">
            <th className={th}>When</th>
            {showPc && <th className={th}>Account · PC</th>}
            <th className={th}>Tool</th>
            <th className={th}>What</th>
            <th className={th}>Version</th>
            <th className={th}>Details</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-slate-800/60 last:border-0 align-top">
              <td className={td}>{when(e.createdAt)}</td>
              {showPc && (
                <td className={td}>
                  <span className="block text-slate-200">{e.email ?? "—"}</span>
                  <span className="block text-[11.5px] text-slate-500">{e.deviceName || e.deviceId}</span>
                </td>
              )}
              <td className={td}>{nameOf(e.tool)}</td>
              <td className={td}>
                <ActionTag e={e} />
              </td>
              <td className={`${td} tabular-nums`}>
                {e.fromVersion && e.toVersion && e.fromVersion !== e.toVersion ? `${e.fromVersion} → ${e.toVersion}` : e.toVersion || e.fromVersion || "—"}
              </td>
              <td className="px-3 py-2.5 text-[12.5px] text-slate-400 max-w-[380px] break-words">{reason(e) || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminToolkit({ adminFetch, onToast }: { adminFetch: Fetcher; onToast: (s: string) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("overview");
  const [now, setNow] = useState(0);

  // the first load runs from the effect, so it only sets state once the answer is in
  const fetchData = useCallback(
    () =>
      adminFetch("/api/toolkit/admin", { cache: "no-store" })
        .then(async (r) => {
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.error || `The server answered ${r.status}.`);
          setData(j as Data);
          setNow(Date.now());
          setError("");
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the Toolkit's data."))
        .finally(() => setLoading(false)),
    [adminFetch]
  );
  const load = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              section === s.id ? "bg-blue-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </button>
        ))}
        <button onClick={load} disabled={loading} className={`${smallBtn} ml-auto bg-slate-900 border border-slate-800 text-slate-300 hover:text-white`}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {!data && loading && (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      )}
      {data && section === "overview" && <Overview data={data} now={now} onShow={setSection} />}
      {data && section === "accounts" && <Accounts data={data} now={now} />}
      {data && section === "pcs" && <Pcs data={data} now={now} adminFetch={adminFetch} onToast={onToast} onChanged={load} />}
      {data && section === "activity" && <ActivityLog data={data} />}
      {data && section === "downloads" && <Downloads data={data} />}
      {data && section === "access" && <Access data={data} adminFetch={adminFetch} onToast={onToast} onChanged={load} />}
    </div>
  );
}

// ---------------------------------------------------------------- Overview

function Overview({ data, now, onShow }: { data: Data; now: number; onShow: (s: Section) => void }) {
  const active7 = data.devices.filter((d) => now - new Date(d.lastSeen).getTime() < 7 * DAY).length;
  const active30 = data.devices.filter((d) => now - new Date(d.lastSeen).getTime() < 30 * DAY).length;
  const c = (a: string) => data.counts[a] ?? { all: 0, automatic: 0 };
  const latestToolkit = data.downloads?.latest?.version ?? null;
  const siteAccounts = new Set(data.siteDownloads.map((d) => d.userId).filter(Boolean)).size;

  // the last 30 days, every day (days without events are 0)
  const days = useMemo(() => {
    const byDay = new Map(data.daily.map((d) => [d.day, d]));
    const out: Day[] = [];
    for (let i = 29; i >= 0; i--) {
      const k = new Date(now - i * DAY).toISOString().slice(0, 10);
      out.push(byDay.get(k) ?? { day: k, pcs: 0, installed: 0, updated: 0, uninstalled: 0, failed: 0, opened: 0 });
    }
    return out;
  }, [data.daily, now]);
  const top = Math.max(1, ...days.map((d) => d.installed + d.updated + d.uninstalled + d.failed + d.opened));

  const versions = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data.devices) m.set(d.toolkitVersion || "?", (m.get(d.toolkitVersion || "?") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => (isOlder(a[0], b[0]) ? 1 : -1));
  }, [data.devices]);
  const windows = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data.devices) m.set(windowsName(d.windows), (m.get(windowsName(d.windows)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [data.devices]);
  const failures = data.events.filter((e) => e.action === "failed").slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Accounts using it" value={data.users.length} sub={`${data.devices.length} PCs in all`} />
        <Stat label="Active PCs" value={active7} sub={`last 7 days · ${active30} in 30 days`} />
        <Stat
          label="Downloads"
          value={data.siteDownloads.length}
          sub={`from the website, ${siteAccounts} accounts${data.downloads ? ` · ${data.downloads.total} on GitHub` : ""}`}
        />
        <Stat label="Access" value={data.isPublic === false ? "Testers" : "Everyone"} sub={data.isPublic === false ? `${data.testers.length} testers` : "with an account"} />
        <Stat label="Installs, 30 days" value={c("installed").all} sub={`${c("installed").automatic} automatic`} />
        <Stat label="Updates, 30 days" value={c("updated").all} sub={`${c("updated").automatic} automatic`} />
        <Stat label="Uninstalls, 30 days" value={c("uninstalled").all} />
        <Stat label="Failures, 30 days" value={c("failed").all} warn={c("failed").all > 0} sub={c("failed").all ? "see Activity" : "none"} />
      </div>

      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="text-[15px] font-bold text-white">The last 30 days</h3>
          <span className="text-xs text-slate-400">what the Toolkits did each day, and how many PCs</span>
          <span className="ml-auto flex flex-wrap gap-3 text-[11px] text-slate-400">
            <Key c="bg-emerald-400" t="Installed" />
            <Key c="bg-blue-400" t="Updated" />
            <Key c="bg-violet-400" t="Opened" />
            <Key c="bg-slate-400" t="Uninstalled" />
            <Key c="bg-red-400" t="Failed" />
          </span>
        </div>
        <div className="mt-4 flex items-end gap-[3px] h-40">
          {days.map((d) => {
            const seg = (n: number, cls: string) => (n ? <div className={cls} style={{ height: `${(n / top) * 100}%` }} /> : null);
            const total = d.installed + d.updated + d.uninstalled + d.failed + d.opened;
            return (
              <div
                key={d.day}
                className="flex-1 h-full flex flex-col justify-end rounded-sm overflow-hidden bg-slate-800/40"
                title={`${date(d.day)}: ${total} events on ${d.pcs} PCs (${d.installed} installed, ${d.updated} updated, ${d.opened} opened, ${d.uninstalled} uninstalled, ${d.failed} failed)`}
              >
                {seg(d.failed, "bg-red-400")}
                {seg(d.uninstalled, "bg-slate-400")}
                {seg(d.opened, "bg-violet-400")}
                {seg(d.updated, "bg-blue-400")}
                {seg(d.installed, "bg-emerald-400")}
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[10.5px] text-slate-500">
          <span>{date(days[0]?.day ?? null)}</span>
          <span>today</span>
        </div>
      </div>

      <div className={card}>
        <h3 className="px-5 pt-4 pb-3 text-[15px] font-bold text-white">Each tool on the PCs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-slate-800">
                <th className={th}>Tool</th>
                <th className={th}>Latest</th>
                <th className={th}>On PCs</th>
                <th className={th}>Up to date</th>
                <th className={th}>Older</th>
                <th className={th}>Installed</th>
                <th className={th}>Updated</th>
                <th className={th}>Opened</th>
                <th className={th}>Uninstalled</th>
                <th className={th}>Failed</th>
              </tr>
            </thead>
            <tbody>
              {data.tools.map((t) => {
                const on = data.devices.filter((d) => d.tools[t.id]);
                const old = on.filter((d) => t.latest && isOlder(d.tools[t.id], t.latest)).length;
                const n = (a: string) => data.toolCounts[t.id]?.[a] ?? { all: 0, recent: 0 };
                const cell = (a: string, warn = false) => (
                  <td className={`${td} tabular-nums`}>
                    <span className={warn && n(a).all ? "text-red-300 font-semibold" : ""}>{n(a).all}</span>
                    <span className="text-slate-500 text-[11px]"> · {n(a).recent} in 30 d</span>
                  </td>
                );
                return (
                  <tr key={t.id} className="border-b border-slate-800/60 last:border-0">
                    <td className={`${td} font-semibold text-white`}>{t.name}</td>
                    <td className={`${td} tabular-nums`}>{t.latest ?? "—"}</td>
                    <td className={`${td} tabular-nums`}>{on.length}</td>
                    <td className={`${td} tabular-nums text-emerald-300`}>{on.length - old}</td>
                    <td className={`${td} tabular-nums ${old ? "text-amber-300" : ""}`}>{old}</td>
                    {cell("installed")}
                    {cell("updated")}
                    {cell("opened")}
                    {cell("uninstalled")}
                    {cell("failed", true)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${card} p-5`}>
          <h3 className="text-[15px] font-bold text-white">Toolkit versions</h3>
          <p className="text-xs text-slate-400">on the PCs{latestToolkit ? ` · latest ${latestToolkit}` : ""}</p>
          <ul className="mt-3 space-y-2">
            {versions.map(([v, n]) => (
              <Bar key={v} label={v} n={n} of={data.devices.length} tone={latestToolkit && isOlder(v, latestToolkit) ? "bg-amber-400" : "bg-emerald-400"} />
            ))}
            {!versions.length && <li className="text-sm text-slate-500">No PCs yet</li>}
          </ul>
        </div>
        <div className={`${card} p-5`}>
          <h3 className="text-[15px] font-bold text-white">Windows</h3>
          <p className="text-xs text-slate-400">the PCs&apos; Windows</p>
          <ul className="mt-3 space-y-2">
            {windows.map(([v, n]) => (
              <Bar key={v} label={v} n={n} of={data.devices.length} tone="bg-blue-400" />
            ))}
            {!windows.length && <li className="text-sm text-slate-500">No PCs yet</li>}
          </ul>
        </div>
        <div className={`${card} p-5`}>
          <div className="flex items-center">
            <h3 className="flex-1 text-[15px] font-bold text-white">Latest failures</h3>
            <button onClick={() => onShow("activity")} className="text-xs font-semibold text-blue-300 hover:text-blue-200 cursor-pointer">
              All activity
            </button>
          </div>
          <ul className="mt-3 space-y-2.5">
            {failures.map((e) => (
              <li key={e.id} className="text-[12.5px]">
                <span className="flex items-center gap-1.5 text-red-300 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> {SHORT[e.tool] ?? e.tool} · {ago(e.createdAt, now)}
                </span>
                <span className="block text-slate-400 break-words">{reason(e) || "No reason given"}</span>
                <span className="block text-slate-500">{e.email ?? "—"}</span>
              </li>
            ))}
            {!failures.length && <li className="text-sm text-slate-500">No failures</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Key({ c, t }: { c: string; t: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${c}`} /> {t}
    </span>
  );
}

function Bar({ label, n, of, tone }: { label: string; n: number; of: number; tone: string }) {
  return (
    <li>
      <div className="flex justify-between text-[12.5px]">
        <span className="text-slate-200 tabular-nums">{label}</span>
        <span className="text-slate-400 tabular-nums">
          {n} · {of ? Math.round((n / of) * 100) : 0}%
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${of ? (n / of) * 100 : 0}%` }} />
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- Accounts

function Accounts({ data, now }: { data: Data; now: number }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const latestToolkit = data.downloads?.latest?.version ?? null;
  const shown = data.users.filter((u) =>
    `${u.name ?? ""} ${u.email ?? ""} ${u.organization ?? ""} ${u.location ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())
  );
  const exportAll = () =>
    saveCsv(
      `toolkit-accounts-${stamp()}.csv`,
      ["Name", "Email", "Organization", "Location", "PCs", "Toolkit version", "First seen", "Last seen", "Installs", "Updates", "Failures", "Events", "Last download"],
      shown.map((u) => [u.name, u.email, u.organization, u.location, u.pcs, u.toolkitVersion, u.firstSeen, u.lastSeen, u.installs, u.updates, u.failures, u.events, u.lastDownload ?? ""])
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email, organization, place" />
        <span className="text-xs text-slate-400">{shown.length} of {data.users.length} accounts</span>
        <button onClick={exportAll} disabled={!shown.length} className={`${exportBtn} ml-auto`}>
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      {!shown.length && <Empty>{data.users.length ? "No one matches" : "No account has used the Toolkit yet"}</Empty>}
      <ul className="space-y-2">
        {shown.map((u) => {
          const isOpen = open === u.userId;
          const pcs = data.devices.filter((d) => d.userId === u.userId);
          const events = data.events.filter((e) => e.email && e.email === u.email).slice(0, 50);
          const downloads = data.siteDownloads.filter((d) => d.userId === u.userId);
          return (
            <li key={u.userId} className={`rounded-2xl border ${isOpen ? "border-blue-500/40 bg-slate-900" : "border-slate-800 bg-slate-900/70"}`}>
              <button onClick={() => setOpen(isOpen ? null : u.userId)} aria-expanded={isOpen} className="w-full flex flex-wrap items-center gap-3 p-4 text-left cursor-pointer">
                {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white truncate">{u.name || u.email || u.userId}</span>
                  <span className="block text-xs text-slate-400 truncate">
                    {[u.email, u.organization, u.location].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2 text-[11.5px]">
                  <Chip>{plural(u.pcs, "PC")}</Chip>
                  <Chip tone={latestToolkit && u.toolkitVersion && isOlder(u.toolkitVersion, latestToolkit) ? "amber" : "slate"}>Toolkit {u.toolkitVersion || "?"}</Chip>
                  <Chip>{plural(u.installs, "install")}</Chip>
                  <Chip>{plural(u.updates, "update")}</Chip>
                  {u.failures > 0 && <Chip tone="red">{u.failures} failed</Chip>}
                  <Chip>seen {ago(u.lastSeen, now)}</Chip>
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-800 p-4 space-y-4">
                  <div className="grid sm:grid-cols-4 gap-3 text-[12.5px]">
                    <Fact k="First used" v={when(u.firstSeen)} />
                    <Fact k="Last seen" v={when(u.lastSeen)} />
                    <Fact k="Downloaded the Toolkit" v={downloads.length ? `${downloads.length}× · last ${when(downloads[0].timestamp)}` : "not from the website"} />
                    <Fact k="Everything it did" v={`${u.events} events`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">PCs and their tools</p>
                    <PcTable devices={pcs} tools={data.tools} now={now} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Latest activity</p>
                    <div className="rounded-xl border border-slate-800">
                      <EventTable events={events} tools={data.tools} />
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Chip({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "amber" | "red" }) {
  const c = tone === "red" ? "bg-red-500/15 text-red-300" : tone === "amber" ? "bg-amber-500/15 text-amber-300" : "bg-slate-800 text-slate-300";
  return <span className={`px-2 py-0.5 rounded-full font-semibold tabular-nums ${c}`}>{children}</span>;
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-slate-950/50 border border-slate-800 px-3 py-2">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{k}</p>
      <p className="mt-0.5 text-slate-200">{v}</p>
    </div>
  );
}

function PcTable({ devices, tools, now, onForget, onHistory, history }: {
  devices: Device[];
  tools: Tool[];
  now: number;
  onForget?: (d: Device) => void;
  onHistory?: (d: Device) => void;
  history?: { id: string; events: Event[] | null } | null;
}) {
  if (!devices.length) return <p className="text-sm text-slate-400">No PCs.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800">
            {onHistory && <th className={th} />}
            <th className={th}>PC</th>
            {onForget && <th className={th}>Account</th>}
            <th className={th}>Windows</th>
            <th className={th}>Toolkit</th>
            {tools.map((t) => (
              <th key={t.id} className={th} title={t.latest ? `Latest ${t.latest}` : undefined}>
                {SHORT[t.id] ?? t.name}
              </th>
            ))}
            <th className={th}>First seen</th>
            <th className={th}>Last seen</th>
            {onForget && <th className={th} />}
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => {
            const open = history?.id === d.id;
            return (
              <Fragment key={d.id}>
                <tr className="border-b border-slate-800/60 last:border-0">
                  {onHistory && (
                    <td className="pl-3">
                      <button onClick={() => onHistory(d)} aria-expanded={open} title="This PC's history" className="text-slate-400 hover:text-white cursor-pointer">
                        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                  <td className={`${td} font-semibold text-white`}>{d.name || d.id}</td>
                  {onForget && (
                    <td className={td}>
                      <span className="block text-slate-200">{d.userName || "—"}</span>
                      <span className="block text-[11.5px] text-slate-500">{d.email ?? "—"}</span>
                    </td>
                  )}
                  <td className={td} title={d.windows}>
                    {windowsName(d.windows)}
                  </td>
                  <td className={`${td} tabular-nums`}>{d.toolkitVersion || "—"}</td>
                  {tools.map((t) => (
                    <td key={t.id} className={td}>
                      <Version v={d.tools[t.id]} latest={t.latest} />
                    </td>
                  ))}
                  <td className={td}>{date(d.firstSeen)}</td>
                  <td className={td}>{ago(d.lastSeen, now)}</td>
                  {onForget && (
                    <td className="pr-3 text-right">
                      <button onClick={() => onForget(d)} title="Forget this PC" className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
                {open && (
                  <tr className="border-b border-slate-800/60">
                    <td colSpan={tools.length + 8} className="bg-slate-950/40">
                      {history?.events == null ? (
                        <div className="py-6 flex justify-center">
                          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                        </div>
                      ) : (
                        <EventTable events={history.events} tools={tools} showPc={false} />
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------- PCs

function Pcs({ data, now, adminFetch, onToast, onChanged }: { data: Data; now: number; adminFetch: Fetcher; onToast: (s: string) => void; onChanged: () => Promise<void> }) {
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<{ id: string; events: Event[] | null } | null>(null);
  const shown = data.devices.filter((d) => `${d.name} ${d.email ?? ""} ${d.userName ?? ""} ${d.windows}`.toLowerCase().includes(q.trim().toLowerCase()));

  const showHistory = async (d: Device) => {
    if (history?.id === d.id) return setHistory(null);
    setHistory({ id: d.id, events: null });
    const r = await adminFetch(`/api/toolkit/admin?device=${encodeURIComponent(d.id)}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      onToast(j.error || "Couldn't read that PC's history.");
      return setHistory(null);
    }
    setHistory({ id: d.id, events: j.events as Event[] });
  };
  const forget = async (d: Device) => {
    if (!confirm(`Forget ${d.name || d.id} and its history? It comes back the next time its Toolkit reports.`)) return;
    const r = await adminFetch(`/api/toolkit/admin?device=${encodeURIComponent(d.id)}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    onToast(r.ok ? `${d.name || "The PC"} is forgotten` : j.error || "Couldn't remove the PC.");
    if (r.ok) await onChanged();
  };
  const exportAll = () =>
    saveCsv(
      `toolkit-pcs-${stamp()}.csv`,
      ["PC", "Account", "Email", "Windows", "Toolkit", ...data.tools.map((t) => t.name), "First seen", "Last seen"],
      shown.map((d) => [d.name, d.userName, d.email, d.windows, d.toolkitVersion, ...data.tools.map((t) => d.tools[t.id] ?? ""), d.firstSeen, d.lastSeen])
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search PC, account, Windows" />
        <span className="text-xs text-slate-400">
          {shown.length} of {data.devices.length} PCs · <span className="text-emerald-300">green</span> up to date, <span className="text-amber-300">amber</span> older
        </span>
        <button onClick={exportAll} disabled={!shown.length} className={`${exportBtn} ml-auto`}>
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      {shown.length ? (
        <PcTable devices={shown} tools={data.tools} now={now} onForget={forget} onHistory={showHistory} history={history} />
      ) : (
        <Empty>{data.devices.length ? "No PC matches" : "No PC has reported yet"}</Empty>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Activity

function ActivityLog({ data }: { data: Data }) {
  const [q, setQ] = useState("");
  const [tool, setTool] = useState("all");
  const [action, setAction] = useState("all");
  const [auto, setAuto] = useState<"all" | "auto" | "hand">("all");
  const shown = data.events.filter(
    (e) =>
      (tool === "all" || e.tool === tool) &&
      (action === "all" || e.action === action) &&
      (auto === "all" || (auto === "auto") === automatic(e)) &&
      `${e.email ?? ""} ${e.deviceName ?? ""} ${e.message} ${e.toVersion} ${e.fromVersion}`.toLowerCase().includes(q.trim().toLowerCase())
  );
  const select = "px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer";
  const exportAll = () =>
    saveCsv(
      `toolkit-activity-${stamp()}.csv`,
      ["When", "Email", "PC", "Tool", "What", "Automatic", "From", "To", "Details"],
      shown.map((e) => [e.createdAt, e.email, e.deviceName, e.tool, e.action, automatic(e) ? "yes" : "no", e.fromVersion, e.toVersion, reason(e)])
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search account, PC, version, reason" />
        <select value={tool} onChange={(e) => setTool(e.target.value)} className={select} aria-label="Tool">
          <option value="all">All tools</option>
          {data.tools.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className={select} aria-label="What">
          <option value="all">Everything</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABEL[a]}
            </option>
          ))}
        </select>
        <select value={auto} onChange={(e) => setAuto(e.target.value as typeof auto)} className={select} aria-label="By whom">
          <option value="all">By hand or automatic</option>
          <option value="hand">By hand</option>
          <option value="auto">Automatic</option>
        </select>
        <button onClick={exportAll} disabled={!shown.length} className={`${exportBtn} ml-auto`}>
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      <p className="text-xs text-slate-400">
        {shown.length} of the newest {data.events.length} events. A PC&apos;s whole history is under PCs.
      </p>
      <div className={card}>
        <EventTable events={shown.slice(0, 500)} tools={data.tools} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Downloads

function Downloads({ data }: { data: Data }) {
  const [q, setQ] = useState("");
  const site = data.siteDownloads;
  const shown = site.filter((d) => `${d.userName ?? ""} ${d.userEmail ?? ""} ${d.location ?? ""} ${d.version}`.toLowerCase().includes(q.trim().toLowerCase()));
  const accounts = new Set(site.map((d) => d.userId).filter(Boolean)).size;
  const signedOut = site.filter((d) => !d.userId).length;
  const usedIt = new Set(data.users.map((u) => u.userId));
  const downloadedNotUsed = new Set(site.map((d) => d.userId).filter((id): id is string => !!id && !usedIt.has(id))).size;
  const places = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of site) {
      const c = (d.location || "").split(",").pop()?.trim() || "Unknown";
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [site]);
  const exportAll = () =>
    saveCsv(
      `toolkit-downloads-${stamp()}.csv`,
      ["When", "Name", "Email", "Version", "Location", "Browser"],
      shown.map((d) => [d.timestamp, d.userName, d.userEmail, d.version, d.location, browser(d.userAgent)])
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="From the website" value={site.length} sub={`${accounts} accounts${signedOut ? ` · ${signedOut} signed out` : ""}`} />
        <Stat label="On GitHub" value={data.downloads?.total ?? "—"} sub="every installer download, all releases" />
        <Stat label="Downloaded, not used yet" value={downloadedNotUsed} sub="accounts with no PC reporting" />
        <Stat label="Latest Toolkit" value={data.downloads?.latest?.version ?? "—"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${card} lg:col-span-2`}>
          <h3 className="px-5 pt-4 pb-3 text-[15px] font-bold text-white">By release (GitHub)</h3>
          {data.downloads?.releases.length ? (
            <table className="w-full">
              <thead>
                <tr className="border-y border-slate-800">
                  <th className={th}>Release</th>
                  <th className={th}>Published</th>
                  <th className={th}>Downloads</th>
                </tr>
              </thead>
              <tbody>
                {data.downloads.releases.map((r) => (
                  <tr key={r.tag} className="border-b border-slate-800/60 last:border-0">
                    <td className={`${td} font-semibold text-white`}>
                      {r.tag}
                      {r.prerelease && <span className="ml-2 text-[10.5px] font-bold text-amber-300">pre-release</span>}
                    </td>
                    <td className={td}>{date(r.published)}</td>
                    <td className={`${td} tabular-nums`}>{r.downloads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-5 pb-5 text-sm text-slate-400">GitHub can&apos;t be read just now.</p>
          )}
        </div>
        <div className={`${card} p-5`}>
          <h3 className="text-[15px] font-bold text-white">Where from</h3>
          <p className="text-xs text-slate-400">website downloads by country</p>
          <ul className="mt-3 space-y-2">
            {places.map(([p, n]) => (
              <Bar key={p} label={p} n={n} of={site.length} tone="bg-blue-400" />
            ))}
            {!places.length && <li className="text-sm text-slate-500">No downloads yet</li>}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email, place, version" />
        <span className="text-xs text-slate-400">{shown.length} downloads</span>
        <button onClick={exportAll} disabled={!shown.length} className={`${exportBtn} ml-auto`}>
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      {shown.length ? (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className={th}>When</th>
                <th className={th}>Who</th>
                <th className={th}>Version</th>
                <th className={th}>Location</th>
                <th className={th}>Browser</th>
                <th className={th}>Uses it</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 500).map((d) => (
                <tr key={d.id} className="border-b border-slate-800/60 last:border-0">
                  <td className={td}>{when(d.timestamp)}</td>
                  <td className={td}>
                    <span className="block text-slate-200">{d.userName || (d.userId ? "—" : "Signed out")}</span>
                    <span className="block text-[11.5px] text-slate-500">{d.userEmail ?? ""}</span>
                  </td>
                  <td className={`${td} tabular-nums`}>{d.version}</td>
                  <td className={td}>{d.location || "—"}</td>
                  <td className={td}>{browser(d.userAgent)}</td>
                  <td className={td}>{d.userId ? (usedIt.has(d.userId) ? <span className="text-emerald-300">Yes</span> : <span className="text-slate-500">Not yet</span>) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>{site.length ? "No download matches" : "No downloads recorded yet. From now on every download from the website is kept here."}</Empty>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Access

function Access({ data, adminFetch, onToast, onChanged }: { data: Data; adminFetch: Fetcher; onToast: (s: string) => void; onChanged: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    const r = await adminFetch("/api/toolkit/testers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, note }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    onToast(r.ok ? `${email.trim()} is a tester` : j.error || "Couldn't add the tester.");
    if (r.ok) {
      setEmail("");
      setNote("");
      await onChanged();
    }
  };
  const remove = async (t: Tester) => {
    if (!confirm(`Remove ${t.email} from the testers?`)) return;
    const r = await adminFetch(`/api/toolkit/testers?email=${encodeURIComponent(t.email)}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    onToast(r.ok ? `${t.email} removed` : j.error || "Couldn't remove the tester.");
    if (r.ok) await onChanged();
  };

  return (
    <div className="space-y-5">
      <div className={`${card} p-5`}>
        <h3 className="text-[15px] font-bold text-white">Who may use the Toolkit</h3>
        <p className="mt-1 text-sm text-slate-300">
          {data.isPublic === false
            ? "Only the testers below (and admins). Everyone else sees that it isn't open yet."
            : "Everyone with an account. The testers list only matters when the Toolkit is closed."}
        </p>
        <p className="mt-2 text-xs text-slate-400">Change this in Settings → Survey Toolkit. The Toolkit&apos;s front page options are on the Toolkit&apos;s own admin page.</p>
        <a href="/toolkit-beta/admin" className={`${smallBtn} mt-3 bg-slate-800 hover:bg-slate-700 text-slate-200`}>
          <ExternalLink className="w-3.5 h-3.5" /> Toolkit admin page
        </a>
      </div>

      <div className={card}>
        <div className="px-5 pt-4 pb-3 flex flex-wrap items-end gap-2">
          <h3 className="w-full text-[15px] font-bold text-white">Testers ({data.testers.length})</h3>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button onClick={add} disabled={busy || !email.trim()} className={`${smallBtn} py-2 bg-blue-600 hover:bg-blue-500 text-white`}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Add tester
          </button>
        </div>
        {data.testers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-slate-800">
                  <th className={th}>Email</th>
                  <th className={th}>Account</th>
                  <th className={th}>PCs</th>
                  <th className={th}>Note</th>
                  <th className={th}>Added</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {data.testers.map((t) => (
                  <tr key={t.email} className="border-b border-slate-800/60 last:border-0">
                    <td className={`${td} text-white`}>{t.email}</td>
                    <td className={td}>{t.name ? `${t.name} · signed in ${date(t.lastLogin)}` : <span className="text-slate-500">no account yet</span>}</td>
                    <td className={`${td} tabular-nums`}>{t.devices}</td>
                    <td className={td}>{t.note || "—"}</td>
                    <td className={td}>
                      {date(t.createdAt)}
                      {t.addedBy && <span className="block text-[11px] text-slate-500">by {t.addedBy}</span>}
                    </td>
                    <td className="pr-3 text-right">
                      <button onClick={() => remove(t)} title={`Remove ${t.email}`} className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 pb-5 text-sm text-slate-400">No testers.</p>
        )}
      </div>
    </div>
  );
}
