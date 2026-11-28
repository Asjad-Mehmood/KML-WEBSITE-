"use client";

// What Admin → Survey Toolkit reads (app/api/toolkit/admin), and the small parts its sections share.
import { Activity, Download, LayoutDashboard, Lock, Monitor, Search, Users } from "lucide-react";
import { isOlder } from "@/components/toolkit/ToolkitAdmin";
import type { ToolkitSection } from "@/components/admin/menus";

export type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;

export interface Tool {
  id: string;
  name: string;
  latest: string | null;
}
export interface Tester {
  email: string;
  note: string;
  addedBy: string;
  createdAt: string;
  name: string | null;
  lastLogin: string | null;
  devices: number;
}
export interface Device {
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
export interface Event {
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
export interface Day {
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
export interface Data {
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

export type Section = ToolkitSection;
export const SECTIONS: { id: Section; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "pcs", label: "PCs", icon: Monitor },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "access", label: "Access", icon: Lock },
];

export const ACTIONS = ["installed", "updated", "uninstalled", "failed", "opened"] as const;
const ACTION_STYLE: Record<string, string> = {
  installed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  updated: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  uninstalled: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  opened: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};
export const ACTION_LABEL: Record<string, string> = { installed: "Installed", updated: "Updated", uninstalled: "Uninstalled", failed: "Failed", opened: "Opened" };
export const SHORT: Record<string, string> = { "excel-to-kml": "Excel to KML", roadpro: "RoadPro", traverse: "Traverse", "folder-manager": "Folder Mgr", slope: "Slope" };

export const DAY = 24 * 3600 * 1000;
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const when = (s: string | null) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
export const date = (s: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
export function ago(s: string | null, now: number): string {
  if (!s) return "—";
  const d = now - new Date(s).getTime();
  if (d < 60_000) return "just now";
  if (d < 3600_000) return `${Math.round(d / 60_000)} min ago`;
  if (d < DAY) return `${Math.round(d / 3600_000)} h ago`;
  if (d < 30 * DAY) return plural(Math.round(d / DAY), "day") + " ago";
  return date(s);
}
export const automatic = (e: Event) => e.message === "automatic" || e.message.startsWith("automatic:");
export const reason = (e: Event) => (e.message.startsWith("automatic:") ? e.message.slice(10).trim() : e.message === "automatic" ? "" : e.message);
/** "Windows 11 Pro 10.0.26100" → "Windows 11 Pro" */
export const windowsName = (w: string) => (w.match(/Windows\s+\d+(\s+(Home|Pro|Enterprise|Education))?/i)?.[0] ?? (w || "Unknown"));
export const browser = (ua: string | null) => {
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
export function saveCsv(name: string, head: string[], rows: unknown[][]) {
  const body = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const stamp = () => new Date().toISOString().slice(0, 10);

export const card = "rounded-2xl border border-slate-800 bg-slate-900/70";
export const th = "px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap";
export const td = "px-3 py-2.5 text-[13px] text-slate-300 whitespace-nowrap";
export const smallBtn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50";
export const exportBtn = `${smallBtn} bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300`;

export function Stat({ label, value, sub, warn }: { label: string; value: string | number; sub?: string; warn?: boolean }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-extrabold tabular-nums ${warn ? "text-red-300" : "text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function Version({ v, latest }: { v: string | undefined; latest: string | null | undefined }) {
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

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className={`${card} p-10 text-center text-sm text-slate-400`}>{children}</div>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
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

export function EventTable({ events, tools, showPc = true }: { events: Event[]; tools: Tool[]; showPc?: boolean }) {
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
