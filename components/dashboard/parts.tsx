"use client";

// The pieces of the dashboard (app/dashboard/DashboardClient.tsx): points as CSV, times, labels,
// activity rows and bars.
import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Compass, FileDown, FileUp, Globe2, Monitor, RefreshCw, Settings2, TrendingUp, Waypoints } from "lucide-react";
import { actionLabel } from "@/lib/admin/activityKinds";
import type { DashboardData } from "@/app/dashboard/DashboardClient";

type PointRow = DashboardData["points"]["rows"][number];

/** One group per saved file, points in the order they were in the file. */
export function groupPoints(rows: PointRow[]) {
  const groups: { key: string; name: string; grid: string; when: string; rows: PointRow[] }[] = [];
  const byKey = new Map<string, (typeof groups)[number]>();
  for (const r of rows) {
    const key = r.fileId || r.timestamp;
    let g = byKey.get(key);
    if (!g) {
      g = { key, name: r.fileName || "Saved file", grid: r.grid, when: r.timestamp, rows: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    g.rows.push(r);
  }
  const order = (id: string) => parseInt(id.split("_").pop() || "0", 10) || 0;
  for (const g of groups) g.rows.sort((a, b) => order(a.id) - order(b.id));
  return groups;
}

export function pointsCsv(rows: PointRow[]) {
  const q = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ["FILE", "SAVED", "STATION", "CODE", "EASTING", "NORTHING", "ELEVATION", "LATITUDE", "LONGITUDE", "GRID"];
  const body = rows.map((r) =>
    [r.fileName, r.timestamp, r.station, r.code, r.easting, r.northing, r.elevation, r.lat, r.lon, r.grid].map(q).join(",")
  );
  return "\ufeff" + [head.join(","), ...body].join("\r\n") + "\r\n";
}

export function downloadText(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export type Tab = "overview" | "jobs" | "traverse" | "files" | "points" | "activity" | "downloads" | "account";

export const ASSET_LABEL: Record<string, string> = {
  windows_installer: "Windows installer",
  sample_csv: "Sample CSV",
  test_kml: "Test KML",
  web_app: "Web app",
  roadpro: "RoadPro (AutoCAD)",
  traverse: "Traverse & Level (Windows)",
  traverse_manual: "Traverse & Level manual",
  traverse_sample: "Traverse & Level sample file",
};

export const num = (n: number) => n.toLocaleString("en-US");
export const fmtJobBytes = (n: number) =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;

// Dates: the server renders a fixed UTC date so the first client render
// matches; after hydration the visitor's own time zone and "x ago" take over.
// "Now" is read once per page load, so every row agrees and renders stay pure.
const subscribeNoop = () => () => {};
let pageNow = 0;
const clientNow = () => (pageNow ||= Date.now());
function useNow() {
  return useSyncExternalStore(subscribeNoop, clientNow, () => 0);
}

export function When({ iso, withTime = true }: { iso: string; withTime?: boolean }) {
  const now = useNow();
  const d = new Date(iso);
  if (!now) {
    return <time dateTime={iso}>{d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time>;
  }
  const mins = Math.round((now - d.getTime()) / 60000);
  let rel: string | null = null;
  if (mins < 1) rel = "just now";
  else if (mins < 60) rel = `${mins} min ago`;
  else if (mins < 60 * 24) rel = `${Math.round(mins / 60)} h ago`;
  else if (mins < 60 * 24 * 7) rel = `${Math.round(mins / 1440)} d ago`;
  const full = d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const dateOnly = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return (
    <time dateTime={iso} title={full}>
      {rel && withTime ? rel : withTime ? full : dateOnly}
    </time>
  );
}

export function Empty({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="text-center py-12 px-6">
      <span className="mx-auto w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" aria-hidden />
      </span>
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">{text}</p>
      <Link
        href="/app"
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-semibold"
      >
        Open the web app <ArrowRight className="w-4 h-4" aria-hidden />
      </Link>
    </div>
  );
}

export function PlatformTag({ platform }: { platform: "web_app" | "windows_app" | "traverse_app" }) {
  if (platform === "traverse_app")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
        <Compass className="w-3 h-3" aria-hidden /> Traverse &amp; Level
      </span>
    );
  return platform === "windows_app" ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
      <Monitor className="w-3 h-3" aria-hidden /> Windows app
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
      <Globe2 className="w-3 h-3" aria-hidden /> Web app
    </span>
  );
}

export function DirectionTag({ direction }: { direction: "import" | "export" }) {
  return direction === "export" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-semibold">
      <FileDown className="w-3 h-3" aria-hidden /> Exported
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/70 text-blue-700 text-[11px] font-semibold">
      <FileUp className="w-3 h-3" aria-hidden /> Imported
    </span>
  );
}

function activityMeta(a: DashboardData["activities"][number]) {
  return [
    a.fileName,
    a.pointsCount != null ? `${num(a.pointsCount)} points` : null,
    a.exportFormat ? a.exportFormat.toUpperCase() : null,
    a.crs,
  ].filter(Boolean) as string[];
}

export function ActivityRow({ a }: { a: DashboardData["activities"][number] }) {
  const meta = activityMeta(a);
  const failed = a.status === "error" || a.status === "failed";
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={`mt-0.5 w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${
          a.action === "export"
            ? "bg-emerald-50 text-emerald-600"
            : a.action === "conversion"
              ? "bg-blue-50 text-blue-600"
              : a.action === "settings_update"
                ? "bg-slate-100 text-slate-500"
                : a.action === "traverse"
                  ? "bg-amber-50 text-amber-700"
                  : a.action === "levelling"
                    ? "bg-violet-50 text-violet-600"
                    : "bg-indigo-50 text-indigo-600"
        }`}
      >
        {a.action === "export" ? (
          <FileDown className="w-4 h-4" aria-hidden />
        ) : a.action === "settings_update" ? (
          <Settings2 className="w-4 h-4" aria-hidden />
        ) : a.action === "file_upload" ? (
          <FileUp className="w-4 h-4" aria-hidden />
        ) : a.action === "traverse" ? (
          <Waypoints className="w-4 h-4" aria-hidden />
        ) : a.action === "levelling" ? (
          <TrendingUp className="w-4 h-4" aria-hidden />
        ) : (
          <RefreshCw className="w-4 h-4" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-[13.5px] font-semibold text-slate-900 break-words">{a.title}</p>
          {failed && <span className="text-[11px] font-semibold text-rose-600">Failed</span>}
        </div>
        {a.details && <p className="text-[12px] text-slate-600 mt-0.5 whitespace-pre-line break-words">{a.details}</p>}
        <p className="text-[11.5px] text-slate-500 mt-0.5 break-words">
          {actionLabel(a.action)}
          {meta.length > 0 && <> · {meta.join(" · ")}</>}
        </p>
      </div>
      <span className="shrink-0 text-[11.5px] text-slate-500 tabular-nums">
        <When iso={a.timestamp} />
      </span>
    </li>
  );
}

export function Bars({ entries, color }: { entries: [string, number][]; color: string }) {
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <ul className="space-y-2.5">
      {entries.map(([k, v]) => (
        <li key={k}>
          <div className="flex items-center justify-between text-[12.5px] mb-1">
            <span className="font-medium text-slate-700 truncate pr-3">{k}</span>
            <span className="tabular-nums text-slate-500">{num(v)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
