"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity as ActivityIcon,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  FileUp,
  Files,
  Globe2,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  MapPinned,
  Monitor,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { GITHUB_REPO_URL, LATEST_VERSION } from "@/lib/site";
import FileViewer, { type ViewerFile } from "@/components/FileViewer";

export interface DashboardData {
  user: {
    name: string;
    email: string;
    organization: string | null;
    role: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    downloadCount: number;
    isAdmin: boolean;
  };
  plan: { fullAccess: boolean; maxPoints: number | null };
  stats: {
    conversions: number;
    exports: number;
    pointsConverted: number;
    formats: Record<string, number>;
    systems: Record<string, number>;
  };
  activities: {
    id: string;
    action: string;
    title: string;
    fileName: string | null;
    pointsCount: number | null;
    crs: string | null;
    exportFormat: string | null;
    status: string;
    timestamp: string;
  }[];
  files: {
    id: string;
    direction: "import" | "export";
    fileName: string;
    size: string;
    pointsCount: number | null;
    crs: string | null;
    platform: "web_app" | "windows_app";
    hasContent: boolean;
    timestamp: string;
  }[];
  downloads: { id: string; assetType: string; fileName: string; version: string; timestamp: string }[];
  /** Jobs kept from the app, newest first. */
  jobs: {
    jobId: string;
    name: string;
    points: number;
    photos: number;
    photosLeft: number;
    grid: string;
    size: number;
    updated: number;
    keptAt: string;
  }[];
  /** Converted points of the files saved while signed in, newest first. */
  points: {
    total: number;
    rows: {
      id: string;
      fileId: string | null;
      fileName: string | null;
      station: string;
      code: string;
      easting: number;
      northing: number;
      elevation: number | null;
      lat: string;
      lon: string;
      grid: string;
      timestamp: string;
    }[];
  };
}

type PointRow = DashboardData["points"]["rows"][number];

/** One group per saved file, points in the order they were in the file. */
function groupPoints(rows: PointRow[]) {
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

function pointsCsv(rows: PointRow[]) {
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

function downloadText(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

type Tab = "overview" | "jobs" | "files" | "points" | "activity" | "downloads" | "account";

const ACTION_LABEL: Record<string, string> = {
  conversion: "Conversion",
  export: "Export",
  file_upload: "File opened",
  batch_process: "Batch conversion",
  photos_attached: "Photos attached",
  project_save: "Job saved",
  settings_update: "Account updated",
};

const ASSET_LABEL: Record<string, string> = {
  windows_installer: "Windows installer",
  sample_csv: "Sample CSV",
  test_kml: "Test KML",
  web_app: "Web app",
};

const num = (n: number) => n.toLocaleString("en-US");
const fmtJobBytes = (n: number) =>
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

function When({ iso, withTime = true }: { iso: string; withTime?: boolean }) {
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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tint: string;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tint}`}>
          <Icon className="w-4 h-4" aria-hidden />
        </span>
        <span className="text-[12px] font-semibold text-slate-500">{label}</span>
      </div>
      <div className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="text-[11.5px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Empty({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
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

function PlatformTag({ platform }: { platform: "web_app" | "windows_app" }) {
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

function DirectionTag({ direction }: { direction: "import" | "export" }) {
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

function ActivityRow({ a }: { a: DashboardData["activities"][number] }) {
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
                : "bg-indigo-50 text-indigo-600"
        }`}
      >
        {a.action === "export" ? (
          <FileDown className="w-4 h-4" aria-hidden />
        ) : a.action === "settings_update" ? (
          <Settings2 className="w-4 h-4" aria-hidden />
        ) : a.action === "file_upload" ? (
          <FileUp className="w-4 h-4" aria-hidden />
        ) : (
          <RefreshCw className="w-4 h-4" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-[13.5px] font-semibold text-slate-900 break-words">{a.title}</p>
          {failed && <span className="text-[11px] font-semibold text-rose-600">Failed</span>}
        </div>
        <p className="text-[11.5px] text-slate-500 mt-0.5 break-words">
          {ACTION_LABEL[a.action] || a.action}
          {meta.length > 0 && <> · {meta.join(" · ")}</>}
        </p>
      </div>
      <span className="shrink-0 text-[11.5px] text-slate-500 tabular-nums">
        <When iso={a.timestamp} />
      </span>
    </li>
  );
}

function Bars({ entries, color }: { entries: [string, number][]; color: string }) {
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

export default function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [files, setFiles] = useState(data.files);
  const [jobs, setJobs] = useState(data.jobs);
  const [viewing, setViewing] = useState<ViewerFile | null>(null);
  const [pointRows, setPointRows] = useState(data.points.rows);
  const [pointsTotal, setPointsTotal] = useState(data.points.total);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pointGroups = useMemo(() => groupPoints(pointRows), [pointRows]);
  const [fileQuery, setFileQuery] = useState("");
  const [fileDir, setFileDir] = useState<"all" | "import" | "export">("all");
  const [actFilter, setActFilter] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const [name, setName] = useState(data.user.name);
  const [org, setOrg] = useState(data.user.organization || "");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { user, plan, stats, activities, downloads } = data;
  const firstName = user.name.split(" ")[0] || user.name;
  const initials = user.name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const imported = files.filter((f) => f.direction === "import").length;
  const exported = files.length - imported;
  const formatEntries = Object.entries(stats.formats).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const systemEntries = Object.entries(stats.systems).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const shownFiles = useMemo(() => {
    const q = fileQuery.trim().toLowerCase();
    return files.filter(
      (f) =>
        (fileDir === "all" || f.direction === fileDir) &&
        (!q || f.fileName.toLowerCase().includes(q) || (f.crs || "").toLowerCase().includes(q))
    );
  }, [files, fileQuery, fileDir]);

  const actionKinds = useMemo(() => Array.from(new Set(activities.map((a) => a.action))), [activities]);
  const shownActivities = actFilter === "all" ? activities : activities.filter((a) => a.action === actFilter);

  const deleteFile = async (id: string, fileName: string) => {
    if (!window.confirm(`Delete “${fileName}” and its points from your saved files? This can't be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/user/files/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setFiles((fs) => fs.filter((f) => f.id !== id));
      // its points go with it
      const gone = pointRows.filter((r) => r.fileId === id).length;
      setPointRows((rs) => rs.filter((r) => r.fileId !== id));
      setPointsTotal((t) => Math.max(0, t - gone));
      setNotice({ ok: true, text: `Deleted ${fileName}.` });
    } catch {
      setNotice({ ok: false, text: `Couldn't delete ${fileName}. Please try again.` });
    }
    setDeleting(null);
  };

  const deleteJob = async (jobId: string, jobName: string) => {
    if (!window.confirm(`Delete the job “${jobName}” from your account? Copies already on a computer stay there.`)) return;
    setDeleting(jobId);
    try {
      const res = await fetch(`/api/user/jobs/${encodeURIComponent(jobId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setJobs((js) => js.filter((j) => j.jobId !== jobId));
      setNotice({ ok: true, text: `Deleted the job ${jobName}.` });
    } catch {
      setNotice({ ok: false, text: `Couldn't delete ${jobName}. Please try again.` });
    }
    setDeleting(null);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), organization: org.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error);
      setNotice({ ok: true, text: "Profile saved." });
      router.refresh();
    } catch (err) {
      setNotice({ ok: false, text: (err as Error).message || "Couldn't save your profile. Please try again." });
    }
    setSaving(false);
  };

  const signOut = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't delete your account. Please try again.");
      await logout();
      router.push("/");
      router.refresh();
    } catch (err) {
      setDeleteError((err as Error).message);
      setDeletingAccount(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "jobs", label: "Jobs", icon: Briefcase, count: jobs.length },
    { id: "files", label: "Files", icon: Files, count: files.length },
    { id: "points", label: "Points", icon: MapPinned, count: pointsTotal },
    { id: "activity", label: "Activity", icon: ActivityIcon, count: activities.length },
    { id: "downloads", label: "Downloads", icon: Download, count: downloads.length },
    { id: "account", label: "Account", icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900">
      <Navbar onDownloadClick={() => router.push("/download")} />

      <main id="main-content" className="pt-24 sm:pt-28 pb-16">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-8">
          {/* Header */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <span className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#0ea5e9] text-white text-lg font-bold flex items-center justify-center">
                {initials}
              </span>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Welcome back, {firstName}</h1>
                <p className="text-[13px] text-slate-500 mt-0.5 break-words">
                  {user.email}
                  {user.organization && <> · {user.organization}</>}
                  {user.role && <> · {user.role}</>}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  {plan.fullAccess ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11.5px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Full access · no point limit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11.5px] font-semibold">
                      Web app · up to {num(plan.maxPoints || 50)} points per file
                    </span>
                  )}
                  <span className="text-[11.5px] text-slate-500">
                    Member since <When iso={user.createdAt} withTime={false} />
                  </span>
                  {user.lastLoginAt && (
                    <span className="text-[11.5px] text-slate-500">
                      Last sign-in <When iso={user.lastLoginAt} />
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Link
                href="/app"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-semibold"
              >
                Open web app <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-semibold"
              >
                <Download className="w-4 h-4" aria-hidden /> Windows app
              </Link>
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold"
                >
                  Admin panel
                </Link>
              )}
            </div>
          </section>

          {/* Totals */}
          <section aria-label="Your totals" className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-4 sm:mt-5">
            <StatCard icon={RefreshCw} label="Conversions" value={num(stats.conversions)} tint="bg-blue-50 text-blue-600" />
            <StatCard icon={MapPinned} label="Points converted" value={num(stats.pointsConverted)} tint="bg-indigo-50 text-indigo-600" />
            <StatCard icon={FileDown} label="Exports" value={num(stats.exports)} tint="bg-emerald-50 text-emerald-600" />
            <StatCard
              icon={Files}
              label="Saved files"
              value={num(files.length)}
              sub={`${num(imported)} imported · ${num(exported)} exported`}
              tint="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={Download}
              label="App downloads"
              value={num(user.downloadCount)}
              tint="bg-rose-50 text-rose-600"
              // Fifth card: full width on the two-column phone grid
              className="col-span-2 lg:col-span-1"
            />
          </section>

          {notice && (
            <p
              role="status"
              className={`mt-4 px-4 py-2.5 rounded-xl border text-[13px] font-medium ${
                notice.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {notice.text}
            </p>
          )}

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Dashboard sections"
            className="mt-6 flex gap-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-slate-200"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={active}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 -mb-px border-b-2 text-[13px] font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-lg ${
                    active ? "border-[#0071e3] text-[#0071e3]" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <t.icon className="w-4 h-4" aria-hidden />
                  {t.label}
                  {t.count !== undefined && (
                    <span className={`px-1.5 rounded-full text-[10.5px] tabular-nums ${active ? "bg-blue-50" : "bg-slate-100"}`}>{t.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-5">
            {/* Overview */}
            {tab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-[15px] font-bold">Recent activity</h2>
                    {activities.length > 6 && (
                      <button onClick={() => setTab("activity")} className="text-[12.5px] font-semibold text-[#0071e3] hover:underline cursor-pointer">
                        See all
                      </button>
                    )}
                  </div>
                  {activities.length ? (
                    <ul className="divide-y divide-slate-100">
                      {activities.slice(0, 6).map((a) => (
                        <ActivityRow key={a.id} a={a} />
                      ))}
                    </ul>
                  ) : (
                    <Empty icon={ActivityIcon} title="Nothing yet" text="Conversions and exports you make while signed in show up here." />
                  )}
                </section>

                <div className="space-y-4 sm:space-y-5">
                  <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6">
                    <h2 className="text-[15px] font-bold mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" aria-hidden /> Coordinate systems used
                    </h2>
                    {systemEntries.length ? (
                      <Bars entries={systemEntries} color="bg-indigo-500" />
                    ) : (
                      <p className="text-[13px] text-slate-500">Shows up once you convert with a grid selected.</p>
                    )}
                  </section>
                  <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6">
                    <h2 className="text-[15px] font-bold mb-3 flex items-center gap-2">
                      <FileDown className="w-4 h-4 text-emerald-600" aria-hidden /> Export formats
                    </h2>
                    {formatEntries.length ? (
                      <Bars entries={formatEntries} color="bg-emerald-500" />
                    ) : (
                      <p className="text-[13px] text-slate-500">KML, KMZ, DXF and other exports are counted here.</p>
                    )}
                  </section>
                  <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-[15px] font-bold">Latest files</h2>
                      {files.length > 3 && (
                        <button onClick={() => setTab("files")} className="text-[12.5px] font-semibold text-[#0071e3] hover:underline cursor-pointer">
                          See all
                        </button>
                      )}
                    </div>
                    {files.length ? (
                      <ul className="divide-y divide-slate-100">
                        {files.slice(0, 3).map((f) => (
                          <li key={f.id} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-800 truncate">{f.fileName}</p>
                              <p className="text-[11.5px] text-slate-500">
                                {f.direction === "export" ? "Exported" : "Imported"} · <When iso={f.timestamp} />
                              </p>
                            </div>
                            {f.hasContent && (
                              <a
                                href={`/api/user/files/${encodeURIComponent(f.id)}`}
                                download
                                aria-label={`Download ${f.fileName}`}
                                className="shrink-0 w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0071e3] hover:border-blue-200"
                              >
                                <Download className="w-4 h-4" aria-hidden />
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[13px] text-slate-500">Files you open or save in the web app are kept here.</p>
                    )}
                  </section>
                </div>
              </div>
            )}

            {/* Jobs */}
            {tab === "jobs" && (
              <section className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <p className="text-[13px] text-slate-600">
                    Jobs you keep in the app while signed in are copied here, so they open on any computer. Sign in to
                    the app on another computer and they appear in its <b>Jobs</b> list.
                  </p>
                </div>
                {jobs.length === 0 ? (
                  <Empty icon={Briefcase} title="No jobs in your account yet" text="In the app, open Jobs and press Keep as a job while signed in. The job and every change you make to it are kept here." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {jobs.map((j) => (
                      <li key={j.jobId} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-semibold text-slate-900 break-all">{j.name}</p>
                          <p className="text-[11.5px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>{j.points ? `${num(j.points)} points` : "no points yet"}</span>
                            {j.photos > 0 && <span>· {num(j.photos)} photo{j.photos === 1 ? "" : "s"}</span>}
                            {j.photosLeft > 0 && <span className="text-amber-700">· photos too large, kept on the computer only</span>}
                            {j.grid && <span>· {j.grid}</span>}
                            <span>· {fmtJobBytes(j.size)}</span>
                            <span>
                              · <When iso={new Date(j.updated || Date.parse(j.keptAt)).toISOString()} />
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`/api/user/jobs/${encodeURIComponent(j.jobId)}?download=1`}
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-blue-200 hover:text-[#0071e3]"
                          >
                            <Download className="w-3.5 h-3.5" aria-hidden /> Download
                          </a>
                          <button
                            onClick={() => deleteJob(j.jobId, j.name)}
                            disabled={deleting === j.jobId}
                            aria-label={`Delete ${j.name}`}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 cursor-pointer disabled:opacity-50"
                          >
                            {deleting === j.jobId ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Trash2 className="w-3.5 h-3.5" aria-hidden />}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Files */}
            {tab === "files" && (
              <section className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b border-slate-100">
                  <div className="relative sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                    <input
                      type="search"
                      value={fileQuery}
                      onChange={(e) => setFileQuery(e.target.value)}
                      placeholder="Search file name or grid"
                      aria-label="Search files"
                      className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-base sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div role="group" aria-label="Show" className="flex gap-1 bg-slate-100 p-1 rounded-lg self-start">
                    {(["all", "import", "export"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setFileDir(d)}
                        aria-pressed={fileDir === d}
                        className={`px-3 py-1 rounded-md text-[12px] font-semibold cursor-pointer ${
                          fileDir === d ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {d === "all" ? `All (${files.length})` : d === "import" ? `Imported (${imported})` : `Exported (${exported})`}
                      </button>
                    ))}
                  </div>
                </div>
                {files.length === 0 ? (
                  <Empty icon={Files} title="No saved files yet" text="Files you open or save in the web app or the Windows app while signed in are kept here so you can download them again." />
                ) : shownFiles.length === 0 ? (
                  <p className="p-8 text-center text-[13px] text-slate-500">No files match.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {shownFiles.map((f) => (
                      <li key={f.id} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[13.5px] font-semibold text-slate-900 break-all">{f.fileName}</p>
                            <DirectionTag direction={f.direction} />
                          </div>
                          <p className="text-[11.5px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>{f.size}</span>
                            {f.pointsCount != null && <span>· {num(f.pointsCount)} points</span>}
                            {f.crs && <span>· {f.crs}</span>}
                            <span>·</span>
                            <PlatformTag platform={f.platform} />
                            <span>
                              · <When iso={f.timestamp} />
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {f.hasContent && (
                            <button
                              onClick={() => setViewing({ fileName: f.fileName, url: `/api/user/files/${encodeURIComponent(f.id)}`, size: f.size })}
                              aria-label={`View ${f.fileName}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0071e3] text-[12px] font-semibold text-white hover:bg-[#0062c4] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" aria-hidden /> View
                            </button>
                          )}
                          {f.hasContent ? (
                            <a
                              href={`/api/user/files/${encodeURIComponent(f.id)}`}
                              download
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-blue-200 hover:text-[#0071e3]"
                            >
                              <Download className="w-3.5 h-3.5" aria-hidden /> Download
                            </a>
                          ) : (
                            <span className="text-[11.5px] text-slate-400">Details only</span>
                          )}
                          <button
                            onClick={() => deleteFile(f.id, f.fileName)}
                            disabled={deleting === f.id}
                            aria-label={`Delete ${f.fileName}`}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 cursor-pointer disabled:opacity-50"
                          >
                            {deleting === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Trash2 className="w-3.5 h-3.5" aria-hidden />}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Points */}
            {tab === "points" && (
              <section className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b border-slate-100">
                  <p className="text-[13px] text-slate-600">
                    {num(pointsTotal)} points in {num(pointGroups.length)} saved {pointGroups.length === 1 ? "file" : "files"}
                    {pointRows.length < pointsTotal && <> · showing the newest {num(pointRows.length)}</>}
                  </p>
                  <button
                    onClick={() => downloadText(pointsCsv(pointGroups.flatMap((g) => g.rows)), "Excel to KML points.csv")}
                    disabled={!pointRows.length}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-blue-200 hover:text-[#0071e3] cursor-pointer disabled:opacity-50 self-start"
                  >
                    <FileDown className="w-3.5 h-3.5" aria-hidden /> Download all as CSV
                  </button>
                </div>
                {pointGroups.length === 0 ? (
                  <Empty
                    icon={MapPinned}
                    title="No points yet"
                    text="Save a KML, KMZ, Excel, CSV, DXF or instrument file while signed in, and every point in it is kept here with its grid position and latitude and longitude."
                  />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {pointGroups.map((g, i) => {
                      const open = openGroup === null ? i === 0 : openGroup === g.key;
                      return (
                        <li key={g.key}>
                          <button
                            onClick={() => setOpenGroup(open ? "" : g.key)}
                            aria-expanded={open}
                            className="w-full px-4 sm:px-5 py-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-left cursor-pointer hover:bg-slate-50"
                          >
                            <span className="text-[13.5px] font-semibold text-slate-900 break-all">{g.name}</span>
                            <span className="text-[11.5px] text-slate-500 flex-1">
                              {num(g.rows.length)} points · {g.grid} · <When iso={g.when} />
                            </span>
                            <span className="text-[12px] font-semibold text-[#0071e3]">{open ? "Hide" : "Show"}</span>
                          </button>
                          {open && (
                            <div className="px-4 sm:px-5 pb-4">
                              <div className="overflow-auto max-h-[420px] border border-slate-200 rounded-lg">
                                <table className="w-full text-[12px] whitespace-nowrap">
                                  <thead className="bg-slate-50 text-slate-600 sticky top-0">
                                    <tr>
                                      {["Station", "Code", "Easting", "Northing", "Elevation", "Latitude", "Longitude"].map((h) => (
                                        <th key={h} className="text-left font-semibold px-3 py-2">{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="font-mono divide-y divide-slate-100">
                                    {g.rows.slice(0, 500).map((r) => {
                                      const noGrid = !r.easting && !r.northing;
                                      return (
                                        <tr key={r.id}>
                                          <td className="px-3 py-1.5 font-sans font-semibold text-slate-800">{r.station}</td>
                                          <td className="px-3 py-1.5">{r.code}</td>
                                          <td className="px-3 py-1.5">{noGrid ? "—" : r.easting.toFixed(3)}</td>
                                          <td className="px-3 py-1.5">{noGrid ? "—" : r.northing.toFixed(3)}</td>
                                          <td className="px-3 py-1.5">{r.elevation == null ? "—" : r.elevation.toFixed(3)}</td>
                                          <td className="px-3 py-1.5">{Number(r.lat).toFixed(7)}</td>
                                          <td className="px-3 py-1.5">{Number(r.lon).toFixed(7)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                {g.rows.length > 500 && (
                                  <span className="text-[11.5px] text-slate-500">and {num(g.rows.length - 500)} more in the CSV</span>
                                )}
                                <button
                                  onClick={() => downloadText(pointsCsv(g.rows), `${g.name.replace(/\.[a-z0-9]+$/i, "")} points.csv`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-blue-200 hover:text-[#0071e3] cursor-pointer"
                                >
                                  <FileDown className="w-3.5 h-3.5" aria-hidden /> Download these points as CSV
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {/* Activity */}
            {tab === "activity" && (
              <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6">
                {activities.length > 0 && actionKinds.length > 1 && (
                  <div role="group" aria-label="Filter activity" className="flex flex-wrap gap-1.5 mb-2">
                    {["all", ...actionKinds].map((k) => (
                      <button
                        key={k}
                        onClick={() => setActFilter(k)}
                        aria-pressed={actFilter === k}
                        className={`px-2.5 py-1 rounded-lg text-[12px] font-semibold border cursor-pointer ${
                          actFilter === k ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {k === "all" ? "All" : ACTION_LABEL[k] || k}
                      </button>
                    ))}
                  </div>
                )}
                {activities.length ? (
                  <ul className="divide-y divide-slate-100">
                    {shownActivities.map((a) => (
                      <ActivityRow key={a.id} a={a} />
                    ))}
                  </ul>
                ) : (
                  <Empty icon={ActivityIcon} title="No activity yet" text="Every conversion and export you make while signed in is listed here." />
                )}
              </section>
            )}

            {/* Downloads */}
            {tab === "downloads" && (
              <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6">
                {downloads.length ? (
                  <ul className="divide-y divide-slate-100">
                    {downloads.map((d) => (
                      <li key={d.id} className="py-3 flex items-center gap-3">
                        <span className="w-8 h-8 shrink-0 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                          <Download className="w-4 h-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-semibold text-slate-900 break-all">{d.fileName}</p>
                          <p className="text-[11.5px] text-slate-500">
                            {ASSET_LABEL[d.assetType] || d.assetType} · {d.version}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11.5px] text-slate-500">
                          <When iso={d.timestamp} />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-12 px-6">
                    <p className="font-semibold text-slate-800">No downloads yet</p>
                    <p className="text-[13px] text-slate-500 mt-1">Installer downloads made while signed in are listed here.</p>
                    <Link
                      href="/download"
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-semibold"
                    >
                      <Download className="w-4 h-4" aria-hidden /> Get the Windows app
                    </Link>
                  </div>
                )}
                <p className="mt-3 pt-3 border-t border-slate-100 text-[12px] text-slate-500">
                  Release notes and older versions are on{" "}
                  <a href={`${GITHUB_REPO_URL}/releases`} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0071e3] hover:underline">
                    GitHub
                  </a>
                  .
                </p>
              </section>
            )}

            {/* Account */}
            {tab === "account" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6">
                  <h2 className="text-[15px] font-bold mb-4">Profile</h2>
                  <form onSubmit={saveProfile} className="space-y-4 max-w-lg">
                    <div>
                      <label htmlFor="acc-name" className="block text-[12px] font-bold text-slate-700 mb-1.5">Full name</label>
                      <input
                        id="acc-name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="acc-org" className="block text-[12px] font-bold text-slate-700 mb-1.5">Organization</label>
                      <input
                        id="acc-org"
                        value={org}
                        onChange={(e) => setOrg(e.target.value)}
                        autoComplete="organization"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[12px] font-bold text-slate-700 mb-1.5">Email</span>
                      <p className="px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-500 break-all">{user.email}</p>
                    </div>
                    <button
                      type="submit"
                      disabled={saving || !name.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 text-white text-[13px] font-semibold cursor-pointer"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Save profile
                    </button>
                  </form>
                </section>
                <div className="space-y-4 sm:space-y-5">
                  <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6">
                    <h2 className="text-[15px] font-bold mb-1.5 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-slate-500" aria-hidden /> Password
                    </h2>
                    <p className="text-[13px] text-slate-500 mb-3">We&apos;ll email you a link to choose a new password.</p>
                    <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0071e3] hover:underline">
                      Change password <ArrowRight className="w-4 h-4" aria-hidden />
                    </Link>
                  </section>
                  <section className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6">
                    <h2 className="text-[15px] font-bold mb-1.5">Plan</h2>
                    <p className="text-[13px] text-slate-500">
                      {plan.fullAccess
                        ? "Full access: the web app has no point limit on your account."
                        : `The web app converts up to ${num(plan.maxPoints || 50)} points per file on your account. The Windows app has no limit.`}
                    </p>
                  </section>
                  <button
                    onClick={signOut}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[13px] font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden /> Sign out
                  </button>
                  {!user.isAdmin && (
                    <section className="bg-white rounded-2xl border border-rose-200/80 p-5 sm:p-6">
                      <h2 className="text-[15px] font-bold mb-1.5 flex items-center gap-2 text-rose-700">
                        <Trash2 className="w-4 h-4" aria-hidden /> Delete account
                      </h2>
                      <p className="text-[13px] text-slate-500 mb-3">
                        Removes your account, saved files and activity history. This can&apos;t be undone.
                      </p>
                      {!deleteOpen ? (
                        <button
                          onClick={() => setDeleteOpen(true)}
                          className="text-[13px] font-semibold text-rose-700 hover:underline cursor-pointer"
                        >
                          Delete my account…
                        </button>
                      ) : (
                        <form onSubmit={deleteAccount} className="space-y-3">
                          <div>
                            <label htmlFor="del-pass" className="block text-[12px] font-bold text-slate-700 mb-1.5">
                              Enter your password to confirm
                            </label>
                            <input
                              id="del-pass"
                              type="password"
                              required
                              autoComplete="current-password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                            />
                          </div>
                          {deleteError && (
                            <p role="alert" className="text-[12.5px] font-medium text-rose-700">
                              {deleteError}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={deletingAccount || !deletePassword}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-[13px] font-semibold cursor-pointer"
                            >
                              {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Delete permanently
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteOpen(false);
                                setDeletePassword("");
                                setDeleteError(null);
                              }}
                              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <FileViewer file={viewing} onClose={() => setViewing(null)} />
      <Footer
        versionTag={LATEST_VERSION}
        downloadUrl={`${GITHUB_REPO_URL}/releases/latest`}
        releaseNotesUrl={`${GITHUB_REPO_URL}/releases/latest`}
        onDownloadClick={() => router.push("/download")}
      />
    </div>
  );
}
