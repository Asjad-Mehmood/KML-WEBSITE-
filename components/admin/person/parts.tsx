"use client";

// The pieces of Admin → a person (components/admin/SurveyorDetailModal.tsx): its data types, names,
// time and place helpers, and the small table, search and switch parts.
import React from "react";
import { Search, Star } from "lucide-react";
import type { EmailStatus } from "@/lib/auth/emailVerify";
import type { ProgramVersions } from "@/lib/products/appUsage";
import type { UserActivityItem, UserItem } from "@/lib/admin/adminTypes";

export interface UserDownloadItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  assetType: string;
  app?: string;
  fileName: string;
  version: string;
  ipAddress?: string;
  location?: string;
  userAgent?: string;
  timestamp: string;
}

export interface UserFileItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName?: string | null;
  direction: "import" | "export";
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  pointsCount?: number;
  crs?: string;
  action: string;
  platform: "windows_app" | "web_app" | "traverse_app";
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  downloadUrl: string;
}

interface UserJobItem {
  jobId: string;
  name: string;
  points: number;
  photos: number;
  photosLeft: number;
  grid: string;
  size: number;
  survey?: string;
  updated: number;
  keptAt: string;
}

export interface UserPointItem {
  id: string;
  fileId?: string | null;
  fileName?: string | null;
  station: string;
  featureCode: string;
  easting: number;
  northing: number;
  elevation: number | null;
  coordSystem: string;
  lat: string;
  lon: string;
  timestamp: string;
}

export interface Person {
  user: UserItem;
  stats: {
    totalConversions: number;
    totalPointsProcessed: number;
    totalExports: number;
    totalUploads: number;
    formatBreakdown: Record<string, number>;
    topCrs: string;
    lastActive: string | null;
    totalActivities: number;
  } | null;
  activities: UserActivityItem[];
  downloads: UserDownloadItem[];
  files: UserFileItem[];
  jobs: UserJobItem[];
  traverseJobs: number;
  programs: ProgramVersions[];
  emailStatus: EmailStatus | null;
  points: { total: number; conversions: UserPointItem[] };
  counts: { activities: number; files: number; downloads: number } | null;
  slope: { id: string; name: string; summary: string; size: number; savedAt: string }[];
  reviews: { id: string; product: string; rating: number; comment: string; version: string; status: string; updatedAt: string | null }[];
  toolkit: {
    pcs: { id: string; name: string; windows: string; toolkitVersion: string; tools: Record<string, string>; firstSeen: string | null; lastSeen: string | null }[];
    events: { tool: string; action: string; fromVersion: string; toVersion: string; message: string; createdAt: string | null }[];
  };
  control: { blocked: boolean; reason: string; blockedBy: string; blockedAt: string | null } | null;
  sessions: number | null;
  releaseEmails: { subject: string; status: string; sentAt: string | null; error: string | null }[];
  optedOut: string | null;
  messages: { id: string; ref: string; topic: string; message: string; status: string; createdAt: string }[];
  adminLog: { id: string; at: string | null; adminEmail: string; action: string; details: string }[];
  failed: string[];
  loadedAt: string;
}

export type Tab = "overview" | "files" | "points" | "work" | "activity" | "downloads" | "toolkit" | "feedback" | "account";

export interface SurveyorDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export const APP_NAMES: Record<string, string> = {
  "excel-to-kml": "Excel to KML",
  traverse: "Traverse & Level",
  slope: "Slope Calculator",
  "slope-calculator": "Slope Calculator",
  "auto-draft": "Auto Drafting",
  roadpro: "RoadPro",
  "folder-manager": "Project Folder Manager",
  "project-folder-manager": "Project Folder Manager",
  toolkit: "Survey Toolkit",
};
export const ASSET_NAMES: Record<string, string> = {
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
export const PLATFORM = { windows_app: "Windows program", web_app: "Web app", traverse_app: "Traverse & Level" } as const;

// ---------------------------------------------------------------- small helpers

export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");
export const fmtDateTime = (s?: string | null) => (s ? new Date(s).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
export function ago(s?: string | null) {
  if (!s) return "never";
  const ms = Date.now() - new Date(s).getTime();
  if (ms < 60e3) return "just now";
  const m = Math.floor(ms / 60e3);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return d === 1 ? "yesterday" : `${d} days ago`;
  if (d < 365) return `${Math.floor(d / 30)} mo ago`;
  return `${Math.floor(d / 365)} y ago`;
}
export const bytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`);

export function placeOf(loc?: string | null): { text: string; flag: string } {
  if (!loc || !loc.trim()) return { text: "Not known", flag: "🌐" };
  const t = loc.trim();
  if (t === "Localhost (Dev)" || t === "127.0.0.1" || t === "Localhost") return { text: "Localhost (Dev)", flag: "💻" };
  if (t.length === 2) {
    const code = t.toUpperCase();
    let name = code;
    try {
      name = new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
    } catch {
      // older browsers: the code
    }
    return { text: name, flag: code.replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397)) };
  }
  const flags: [RegExp, string][] = [
    [/Pakistan|PK$/, "🇵🇰"],
    [/Emirates|Dubai|AE$/, "🇦🇪"],
    [/Saudi|SA$/, "🇸🇦"],
    [/Qatar|QA$/, "🇶🇦"],
    [/United Kingdom|London|GB$/, "🇬🇧"],
    [/United States|USA|US$/, "🇺🇸"],
    [/Canada|CA$/, "🇨🇦"],
    [/Germany|DE$/, "🇩🇪"],
    [/India|IN$/, "🇮🇳"],
    [/Oman|OM$/, "🇴🇲"],
    [/Kuwait|KW$/, "🇰🇼"],
    [/Bahrain|BH$/, "🇧🇭"],
  ];
  return { text: t, flag: flags.find(([re]) => re.test(t))?.[1] ?? "🌐" };
}

export function browserOf(ua?: string | null) {
  if (!ua) return "";
  if (/KMLToolkit|SurveyToolkit/i.test(ua)) return "Survey Toolkit";
  if (/ExcelToKML|WinHttp|Dart\//i.test(ua)) return "Windows program";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "";
  const b = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [b, os].filter(Boolean).join(" on ");
}

export const card = "rounded-2xl bg-slate-800/40 border border-slate-800";
export const input = "w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-base sm:text-sm focus:outline-none focus:border-blue-500";
export const th = "px-3 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider";
export const td = "px-3 py-2.5";

export function Empty({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text?: string }) {
  return (
    <div className="py-12 px-4 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800">
      <Icon className="w-7 h-7 text-slate-600 mx-auto mb-2" />
      <p className="text-sm font-semibold text-slate-400">{title}</p>
      {text && <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{text}</p>}
    </div>
  );
}

export function Head({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-base font-bold text-white">{title}</h3>
        {text && <p className="text-xs text-slate-400">{text}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">{children}</table>
      </div>
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
      ))}
    </span>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-52"
      />
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="group" className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap ${value === v ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- the window
