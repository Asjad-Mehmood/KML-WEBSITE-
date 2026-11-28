"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity as ActivityIcon, ArrowRight, Briefcase, Compass, Download, Eye, FileDown, Files, KeyRound, Layers, Loader2, LogOut, MapPinned, Search, Sparkles, Trash2, UserRound } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { GITHUB_REPO_URL, LATEST_VERSION } from "@/lib/content/site";
import FileViewer, { type ViewerFile } from "@/components/FileViewer";
import { actionLabel } from "@/lib/admin/activityKinds";
import TraverseJobsPanel from "@/components/dashboard/TraverseJobsPanel";
import type { TraverseJobCard } from "@/lib/products/traverseJobs";
import AppVersions from "@/components/AppVersions";
import ConfirmEmailBanner from "@/components/ConfirmEmailBanner";
import type { ProgramVersions } from "@/lib/products/appUsage";
import ProgramsHub from "@/components/dashboard/ProgramsHub";
import PlanCard from "@/components/dashboard/PlanCard";
import InviteCard from "@/components/dashboard/InviteCard";
import TeamsPanel from "@/components/dashboard/TeamsPanel";
import { ASSET_LABEL, ActivityRow, Bars, DirectionTag, Empty, PlatformTag, When, downloadText, fmtJobBytes, groupPoints, num, pointsCsv, type Tab } from "@/components/dashboard/parts";
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
  stats: {
    conversions: number;
    exports: number;
    pointsConverted: number;
    /** Traverses adjusted and level runs closed in the app (Traverse adjust) */
    traverses: number;
    levelRuns: number;
    formats: Record<string, number>;
    systems: Record<string, number>;
  };
  activities: {
    id: string;
    action: string;
    title: string;
    details: string | null;
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
    platform: "web_app" | "windows_app" | "traverse_app";
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
    survey: string;
    updated: number;
    keptAt: string;
  }[];
  /** Traverse & Level jobs kept in the account, and those colleagues shared with it */
  traverse: { own: TraverseJobCard[]; shared: TraverseJobCard[] };
  /** Which version of each program this account has, and whether it is the newest */
  programs: ProgramVersions[];
  /** How much they have done in each app, and when last (activities by app) */
  usage: Record<string, { count: number; last: string }>;
  /** Slope Calculator calculations kept in the account */
  slopeCalcs: number;
  /** false: the dashboard asks them to confirm their email */
  emailConfirmed: boolean;
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

  const { user, stats, activities, downloads } = data;
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
    { id: "traverse", label: "Traverse & Level", icon: Compass, count: data.traverse.own.length },
    { id: "files", label: "Files", icon: Files, count: files.length },
    { id: "points", label: "Points", icon: MapPinned, count: pointsTotal },
    { id: "activity", label: "Activity", icon: ActivityIcon, count: activities.length },
    { id: "downloads", label: "Downloads", icon: Download, count: downloads.length },
    { id: "account", label: "Account", icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <Navbar onDownloadClick={() => router.push("/download")} />

      <main id="main-content" className="pt-24 sm:pt-28 pb-16">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-8">
          {/* Header */}
          <section className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <span className="w-14 h-14 shrink-0 rounded-2xl bg-[#071a44] text-[#ffd21f] text-lg font-bold flex items-center justify-center">
                {initials}
              </span>
              <div className="min-w-0">
                <h1 className="text-[22px] sm:text-[28px] font-extrabold tracking-tight leading-tight">Welcome back, {firstName}</h1>
                <p className="text-[13px] text-slate-500 mt-0.5 break-words">
                  {user.email}
                  {user.organization && <> · {user.organization}</>}
                  {user.role && <> · {user.role}</>}
                </p>
                <p className="text-[12px] text-slate-400 mt-1">
                  Member since <When iso={user.createdAt} withTime={false} />
                  {user.lastLoginAt && (
                    <>
                      {" "}· Last sign-in <When iso={user.lastLoginAt} />
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTab("account")}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-semibold cursor-pointer"
              >
                <UserRound className="w-4 h-4" aria-hidden /> Account
              </button>
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

          {!data.emailConfirmed && <ConfirmEmailBanner email={user.email} />}

          {/* every program, with what they have done in it */}
          <ProgramsHub
            programs={data.programs}
            When={When}
            stats={{
              conversions: stats.conversions,
              points: stats.pointsConverted,
              exports: stats.exports,
              traverses: stats.traverses,
              levelRuns: stats.levelRuns,
              traverseJobs: data.traverse.own.length,
              slopeCalcs: data.slopeCalcs,
              usage: data.usage,
            }}
          />

          <PlanCard />
          <TeamsPanel />
          <InviteCard />

          <h2 className="mt-10 text-[18px] font-bold tracking-tight text-slate-900">Your work</h2>
          <p className="text-[13px] text-slate-500">Your jobs, files and activity.</p>

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
            className="mt-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active ? "bg-[#071a44] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <t.icon className="w-4 h-4" aria-hidden />
                  {t.label}
                  {t.count !== undefined && (
                    <span className={`px-1.5 rounded-full text-[10.5px] tabular-nums ${active ? "bg-white/15" : "bg-slate-100"}`}>{t.count}</span>
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
                            {j.survey && <span className="text-amber-800">· {j.survey}</span>}
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

            {/* Traverse & Level */}
            {tab === "traverse" && <TraverseJobsPanel own={data.traverse.own} shared={data.traverse.shared} />}

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
                        {k === "all" ? "All" : actionLabel(k)}
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
                <section aria-labelledby="acc-apps-h" className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6">
                  <h2 id="acc-apps-h" className="text-[15px] font-bold">Where you use them</h2>
                  <p className="mt-1 mb-4 text-[13px] text-slate-500">
                    The version you have of each program, where you last opened it, and whether a newer one is out.
                  </p>
                  <AppVersions programs={data.programs} />
                </section>
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
