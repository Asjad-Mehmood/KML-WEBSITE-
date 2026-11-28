"use client";

// Admin → a person: everything about one account in one window (data from GET /api/admin/users/[id],
// gathered by lib/admin/personProfile.ts). Overview first: who they are, what they use and what they did
// lately; then a part for each kind of thing: files, points, jobs and calculations, activity,
// downloads, Survey Toolkit PCs, reviews and messages, and the account itself (profile, email,
// controls, release emails and what admins changed). Refresh keeps what's on screen while it loads.
import AccountControls from "@/components/admin/AccountControls";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, Ban, Briefcase, Calendar, Check, CheckCircle2, Clock, Compass, Copy, Download, Eye as EyeIcon, FolderArchive, Inbox, LayoutGrid, Loader2, LogIn, Mail, MapPin, MapPinned, Monitor, RefreshCw, Save, ScrollText, ShieldCheck, Star, Trash2, TrendingUp, User, UserCog, X } from "lucide-react";
import FileViewer, { type ViewerFile } from "@/components/FileViewer";
import { TraverseUserJobs } from "@/components/admin/AdminTraverse";
import { actionLabel, adminActionTag } from "@/lib/admin/activityKinds";
import AppVersions from "@/components/AppVersions";
import EmailConfirmPanel from "@/components/admin/EmailConfirmPanel";
import type { UserActivityItem, UserItem } from "@/lib/admin/adminTypes";
import { APP_NAMES, ASSET_NAMES, Empty, Head, PLATFORM, SearchBox, Seg, Stars, Table, ago, browserOf, bytes, card, fmtDate, fmtDateTime, input, placeOf, td, th, type Person, type SurveyorDetailModalProps, type Tab } from "@/components/admin/person/parts";
export type { UserActivityItem, UserItem };

export default function SurveyorDetailModal({ userId, isOpen, onClose, onUserUpdated, onToast }: SurveyorDetailModalProps) {
  const [data, setData] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [viewing, setViewing] = useState<ViewerFile | null>(null);
  const [copied, setCopied] = useState(false);
  // per-part search and filters
  const [fileDir, setFileDir] = useState<"all" | "import" | "export">("all");
  const [fileQ, setFileQ] = useState("");
  const [pointQ, setPointQ] = useState("");
  const [actQ, setActQ] = useState("");
  const [actKind, setActKind] = useState<"all" | "errors" | "account">("all");
  const [dlApp, setDlApp] = useState("all");

  const [editForm, setEditForm] = useState({ name: "", email: "", organization: "", role: "Surveyor", password: "" });
  const [saving, setSaving] = useState(false);

  const adminFetch = useCallback((url: string, options: RequestInit = {}) => {
    const token = typeof window === "undefined" ? "" : localStorage.getItem("surveyor_session") || localStorage.getItem("surveyor_auth_token") || "";
    const headers = new Headers(options.headers || {});
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...options, credentials: "include", headers });
  }, []);

  // the newest request wins: opening another person while one loads drops the older answer
  const req = useRef(0);
  const toast = useRef(onToast);
  useEffect(() => {
    toast.current = onToast;
  });
  const load = useCallback(
    async (id: string) => {
      const mine = ++req.current;
      setLoading(true);
      setError(null);
      try {
        const res = await adminFetch(`/api/admin/users/${encodeURIComponent(id)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (mine !== req.current) return;
        if (!res.ok || !json.success) throw new Error(json.error || (res.status === 404 ? "This account doesn't exist any more." : `The server answered ${res.status}.`));
        const p = json as Person;
        setData(p);
        setEditForm({ name: p.user.name || "", email: p.user.email || "", organization: p.user.organization || "", role: p.user.role || "Surveyor", password: "" });
      } catch (e) {
        if (mine !== req.current) return;
        const msg = e instanceof Error ? e.message : "Couldn't load this account.";
        setError(msg);
        toast.current(msg, "error");
      } finally {
        if (mine === req.current) setLoading(false);
      }
    },
    [adminFetch]
  );

  // a new person: start on Overview, clear the filters, load
  useEffect(() => {
    if (!isOpen || !userId) return;
    const t = setTimeout(() => {
      setData(null);
      setTab("overview");
      setFileQ("");
      setPointQ("");
      setActQ("");
      setActKind("all");
      setDlApp("all");
      setFileDir("all");
      void load(userId);
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen, userId, load]);

  const reload = useCallback(() => {
    if (userId) void load(userId);
  }, [userId, load]);

  // Esc closes (unless a file is open on top); R loads again
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (viewing) return;
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if (e.key === "Escape") onClose();
      else if (!typing && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "r") reload();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, reload, viewing]);

  const u = data?.user;
  const files = useMemo(() => data?.files ?? [], [data]);
  const activities = useMemo(() => data?.activities ?? [], [data]);
  const downloads = useMemo(() => data?.downloads ?? [], [data]);
  const points = useMemo(() => data?.points?.conversions ?? [], [data]);
  const pointsTotal = data?.points?.total ?? points.length;
  const counts = data?.counts;
  const jobsTotal = (data?.jobs.length ?? 0) + (data?.slope.length ?? 0) + (data?.traverseJobs ?? 0);
  const feedbackTotal = (data?.reviews.length ?? 0) + (data?.messages.length ?? 0);

  // what they did lately, across everything
  const timeline = useMemo(() => {
    if (!data) return [];
    type Ev = { at: string; kind: string; title: string; sub?: string; tone: string; go: Tab };
    const ev: Ev[] = [
      ...data.activities.slice(0, 40).map((a) => ({
        at: a.timestamp,
        kind: actionLabel(a.action),
        title: a.title,
        sub: [a.fileName, a.pointsCount ? `${a.pointsCount.toLocaleString()} points` : "", a.crs].filter(Boolean).join(" · "),
        tone: a.status === "error" ? "text-rose-300" : "text-slate-200",
        go: "activity" as Tab,
      })),
      ...data.downloads.slice(0, 20).map((d) => ({
        at: d.timestamp,
        kind: "Download",
        title: `${APP_NAMES[d.app ?? ""] ?? d.assetType} ${d.version}`,
        sub: d.fileName,
        tone: "text-blue-300",
        go: "downloads" as Tab,
      })),
      ...data.reviews.map((r) => ({ at: r.updatedAt ?? "", kind: "Review", title: `${r.rating}★ ${APP_NAMES[r.product] ?? r.product}`, sub: r.comment, tone: "text-amber-300", go: "feedback" as Tab })),
      ...data.messages.map((m) => ({ at: m.createdAt, kind: "Message", title: `Contact form: ${m.topic}`, sub: m.message, tone: "text-violet-300", go: "feedback" as Tab })),
      ...data.toolkit.events.slice(0, 10).map((e) => ({
        at: e.createdAt ?? "",
        kind: "Toolkit",
        title: `${e.action} ${APP_NAMES[e.tool] ?? e.tool}${e.toVersion ? ` ${e.toVersion}` : ""}`,
        sub: e.message,
        tone: e.action === "failed" ? "text-rose-300" : "text-emerald-300",
        go: "toolkit" as Tab,
      })),
    ];
    return ev.filter((e) => e.at).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14);
  }, [data]);

  const filteredFiles = useMemo(() => {
    const q = fileQ.trim().toLowerCase();
    return files.filter((f) => (fileDir === "all" || f.direction === fileDir) && (!q || [f.fileName, f.crs, f.action].some((x) => x?.toLowerCase().includes(q))));
  }, [files, fileDir, fileQ]);
  const filteredPoints = useMemo(() => {
    const q = pointQ.trim().toLowerCase();
    return q ? points.filter((p) => [p.station, p.featureCode, p.fileName, p.coordSystem].some((x) => x?.toLowerCase().includes(q))) : points;
  }, [points, pointQ]);
  const filteredActs = useMemo(() => {
    const q = actQ.trim().toLowerCase();
    return activities.filter(
      (a) =>
        (actKind === "all" || (actKind === "errors" ? a.status === "error" || a.status === "warning" : /settings|login|password|account|email/.test(a.action))) &&
        (!q || [a.title, a.fileName, a.crs, a.details, a.action, a.ipAddress].some((x) => x?.toLowerCase().includes(q)))
    );
  }, [activities, actKind, actQ]);
  const dlApps = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of downloads) m.set(d.app ?? d.assetType, (m.get(d.app ?? d.assetType) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [downloads]);
  const filteredDls = useMemo(() => (dlApp === "all" ? downloads : downloads.filter((d) => (d.app ?? d.assetType) === dlApp)), [downloads, dlApp]);

  if (!isOpen) return null;

  const place = placeOf(u?.location);
  const blocked = data?.control?.blocked;
  const emailState = data?.emailStatus?.verifiedAt ? "confirmed" : data?.emailStatus?.required ? "waiting" : "older";
  const lastDownload = downloads[0]?.timestamp ?? null;
  const lastActivity = activities[0]?.timestamp ?? data?.stats?.lastActive ?? null;

  const copyEmail = async () => {
    if (!u) return;
    try {
      await navigator.clipboard.writeText(u.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onToast("Couldn't copy", "error");
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        organization: editForm.organization.trim(),
        role: editForm.role.trim(),
      };
      if (editForm.password.trim()) payload.password = editForm.password.trim();
      const res = await adminFetch(`/api/admin/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Couldn't save");
      onToast(`Saved ${editForm.name}`);
      onUserUpdated?.();
      reload();
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Couldn't save", "error");
    } finally {
      setSaving(false);
    }
  };
  const profileChanged =
    !!u &&
    (editForm.name !== (u.name || "") || editForm.email !== (u.email || "") || editForm.organization !== (u.organization || "") || editForm.role !== (u.role || "Surveyor") || !!editForm.password);

  const clearActivity = async () => {
    if (!userId || !u) return;
    if (!confirm(`Delete every activity line of ${u.name}? Their files, downloads and jobs stay. This can't be undone.`)) return;
    const res = await adminFetch(`/api/admin/activities?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
    if (res.ok) {
      onToast("Activity cleared");
      reload();
    } else onToast("Couldn't clear the activity", "error");
  };
  const deleteFile = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from their account? This can't be undone.`)) return;
    const res = await adminFetch(`/api/user/files/${id}`, { method: "DELETE" });
    if (res.ok) {
      onToast(`Deleted ${name}`);
      reload();
    } else onToast("Couldn't delete the file", "error");
  };
  const deleteSlope = async (id: string, name: string) => {
    if (!confirm(`Delete the calculation "${name}"? This can't be undone.`)) return;
    const res = await adminFetch(`/api/admin/slope?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      onToast(`Deleted ${name}`);
      reload();
    } else onToast("Couldn't delete the calculation", "error");
  };

  const TABS: { id: Tab; label: string; short?: string; icon: React.ElementType; count?: number; alert?: boolean }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "files", label: "Files", icon: FolderArchive, count: counts?.files ?? files.length },
    { id: "points", label: "Points", icon: MapPinned, count: pointsTotal },
    { id: "work", label: "Jobs & calculations", short: "Jobs", icon: Briefcase, count: jobsTotal },
    { id: "activity", label: "Activity", icon: Activity, count: counts?.activities ?? activities.length },
    { id: "downloads", label: "Downloads", icon: Download, count: counts?.downloads ?? downloads.length },
    { id: "toolkit", label: "Survey Toolkit", short: "Toolkit", icon: Monitor, count: data?.toolkit.pcs.length },
    { id: "feedback", label: "Reviews & messages", short: "Feedback", icon: Star, count: feedbackTotal },
    { id: "account", label: "Account", icon: UserCog, alert: blocked || emailState === "waiting" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={u ? `${u.name}, account` : "Account"}
        className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 sm:rounded-3xl shadow-2xl flex flex-col h-full sm:h-[min(90vh,940px)] overflow-hidden"
      >
        {/* ---------------- who */}
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shrink-0 ${
                blocked ? "bg-gradient-to-tr from-rose-700 to-rose-500" : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500"
              }`}
              aria-hidden
            >
              {u ? (u.name || u.email).charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate max-w-full">{u ? u.name : loading ? "Loading…" : "Account"}</h2>
                {u?.role === "ADMIN" && <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">Admin</span>}
                {blocked && <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/40">Blocked</span>}
                {u?.hasFullAccess && u.role !== "ADMIN" && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Full access</span>
                )}
                {data && emailState === "confirmed" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                    <CheckCircle2 className="w-3 h-3" /> Email confirmed
                  </span>
                )}
                {data && emailState === "waiting" && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">Email not confirmed</span>}
              </div>
              {u && (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <span className="text-slate-200 font-medium break-all">{u.email}</span>
                    <button onClick={copyEmail} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer" title="Copy the email address" aria-label="Copy the email address">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </span>
                  <span>
                    {u.organization || "Independent Surveyor"}
                    {u.role && u.role !== "ADMIN" ? ` · ${u.role}` : ""}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {u && (
                <a href={`mailto:${u.email}`} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200" title="Write to them">
                  <Mail className="w-4 h-4" /> Email
                </a>
              )}
              <button onClick={reload} disabled={loading} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer disabled:opacity-60" title="Load again (R)" aria-label="Load again">
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer" title="Close (Esc)" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* the facts at a glance */}
          {u && (
            <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-2 text-xs">
              {(
                [
                  [Calendar, "Joined", fmtDate(u.createdAt), ago(u.createdAt)],
                  [LogIn, "Last signed in", ago(u.lastLoginAt), fmtDateTime(u.lastLoginAt)],
                  [Clock, "Last active", ago(lastActivity), fmtDateTime(lastActivity)],
                  [Download, "Last download", ago(lastDownload), fmtDateTime(lastDownload)],
                  [MapPin, "From", `${place.flag} ${place.text}`, u.ipAddress || ""],
                  [ShieldCheck, "Signed in on", data?.sessions == null ? "—" : `${data.sessions} ${data.sessions === 1 ? "device" : "devices"}`, "sessions open now"],
                ] as [React.ElementType, string, string, string][]
              ).map(([Icon, label, value, hint]) => (
                <div key={label} className="min-w-0" title={hint}>
                  <dt className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                    <Icon className="w-3 h-3" /> {label}
                  </dt>
                  <dd className="text-slate-200 font-semibold truncate">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* ---------------- parts */}
        <div role="tablist" aria-label="Parts" className="flex items-center gap-0.5 px-2 sm:px-5 border-b border-slate-800/80 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                ref={(el) => {
                  if (el && on) el.scrollIntoView({ block: "nearest", inline: "nearest" });
                }}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-3 py-3 text-[13px] font-bold border-b-2 whitespace-nowrap cursor-pointer ${
                  on ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                {t.short ? (
                  <>
                    <span className="sm:hidden">{t.short}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </>
                ) : (
                  t.label
                )}
                {t.count !== undefined && t.count > 0 && <span className="px-1.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-400">{t.count.toLocaleString()}</span>}
                {t.alert && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-label="needs a look" />}
              </button>
            );
          })}
        </div>

        {/* ---------------- body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {data && data.failed.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4" /> Some parts couldn&apos;t be read: {data.failed.join(", ")}. The rest is up to date.
              <button onClick={reload} className="ml-auto font-bold underline cursor-pointer">
                Try again
              </button>
            </div>
          )}

          {!data && loading && (
            <div className="space-y-4" aria-busy="true" aria-label="Loading">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-800/50 animate-pulse" />
                ))}
              </div>
              <div className="h-48 rounded-2xl bg-slate-800/40 animate-pulse" />
            </div>
          )}

          {!data && !loading && (
            <div className="py-16 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-slate-300">{error || "Couldn't load this account."}</p>
              <button onClick={reload} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Try again
              </button>
            </div>
          )}

          {data && u && (
            <>
              {/* ======================= Overview */}
              {tab === "overview" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        [Download, "Downloads", counts?.downloads ?? downloads.length, `${dlApps.length} ${dlApps.length === 1 ? "program" : "programs"}`, "downloads", "text-blue-400"],
                        [FolderArchive, "Files kept", counts?.files ?? files.length, bytes(files.reduce((s, f) => s + (f.fileSize || 0), 0)), "files", "text-cyan-400"],
                        [MapPinned, "Points", pointsTotal, `${(data.stats?.totalPointsProcessed ?? 0).toLocaleString()} converted in all`, "points", "text-emerald-400"],
                        [Briefcase, "Jobs & calculations", jobsTotal, `${data.jobs.length} Excel · ${data.traverseJobs} Traverse · ${data.slope.length} Slope`, "work", "text-violet-400"],
                        [Activity, "Things done", counts?.activities ?? activities.length, `${activities.filter((a) => a.status === "error").length} ${activities.filter((a) => a.status === "error").length === 1 ? "problem" : "problems"} lately`, "activity", "text-indigo-400"],
                        [Monitor, "Toolkit PCs", data.toolkit.pcs.length, data.toolkit.pcs[0] ? `last seen ${ago(data.toolkit.pcs[0].lastSeen)}` : "doesn't use it", "toolkit", "text-teal-400"],
                        [Star, "Reviews", data.reviews.length, data.reviews.length ? `${(data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length).toFixed(1)}★ average` : "none written", "feedback", "text-amber-400"],
                        [Inbox, "Messages", data.messages.length, data.messages.filter((m) => m.status === "new").length ? `${data.messages.filter((m) => m.status === "new").length} new` : "via the contact form", "feedback", "text-fuchsia-400"],
                      ] as [React.ElementType, string, number, string, Tab, string][]
                    ).map(([Icon, label, n, sub, go, tone]) => (
                      <button key={label} onClick={() => setTab(go)} className={`${card} p-4 text-left hover:border-slate-600 cursor-pointer`}>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <Icon className={`w-3.5 h-3.5 ${tone}`} /> {label}
                        </span>
                        <span className="block mt-1 text-2xl font-black text-white tabular-nums">{n.toLocaleString()}</span>
                        <span className="block text-[11px] text-slate-500 truncate">{sub}</span>
                      </button>
                    ))}
                  </div>

                  {(blocked || emailState === "waiting" || data.optedOut) && (
                    <div className="space-y-2">
                      {blocked && (
                        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-200">
                          <Ban className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>
                            Blocked {data.control?.blockedAt ? `on ${fmtDate(data.control.blockedAt)}` : ""} {data.control?.blockedBy ? `by ${data.control.blockedBy}` : ""}
                            {data.control?.reason ? `: “${data.control.reason}”` : ""}. They can&apos;t sign in.{" "}
                            <button onClick={() => setTab("account")} className="underline font-semibold cursor-pointer">
                              Account controls
                            </button>
                          </span>
                        </div>
                      )}
                      {emailState === "waiting" && (
                        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200">
                          <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>
                            Hasn&apos;t confirmed the email address yet, so can&apos;t sign in.{" "}
                            <button onClick={() => setTab("account")} className="underline font-semibold cursor-pointer">
                              Confirm or resend
                            </button>
                          </span>
                        </div>
                      )}
                      {data.optedOut && (
                        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-slate-300">
                          <Mail className="w-4 h-4 mt-0.5 shrink-0" /> Stopped release emails on {fmtDate(data.optedOut)}.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-5 lg:grid-cols-5">
                    {/* lately */}
                    <section className={`${card} p-5 lg:col-span-3`}>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-blue-400" /> Lately
                      </h4>
                      {timeline.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">Nothing yet: no activity, downloads, reviews or messages.</p>
                      ) : (
                        <ol className="relative border-l border-slate-700/70 ml-1.5 space-y-3">
                          {timeline.map((e, i) => (
                            <li key={i} className="pl-4">
                              <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                              <button onClick={() => setTab(e.go)} className="text-left w-full cursor-pointer group">
                                <span className="flex flex-wrap items-baseline gap-x-2">
                                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{e.kind}</span>
                                  <span className={`text-[13px] font-semibold group-hover:underline ${e.tone}`}>{e.title}</span>
                                  <span className="ml-auto text-[11px] text-slate-500 whitespace-nowrap" title={fmtDateTime(e.at)}>
                                    {ago(e.at)}
                                  </span>
                                </span>
                                {e.sub && <span className="block text-[11.5px] text-slate-400 truncate">{e.sub}</span>}
                              </button>
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>

                    <div className="lg:col-span-2 space-y-5">
                      {/* how they work */}
                      <section className={`${card} p-5`}>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-emerald-400" /> How they work
                        </h4>
                        <dl className="text-xs divide-y divide-slate-800">
                          <div className="py-2 flex justify-between gap-3">
                            <dt className="text-slate-400">Grid used most</dt>
                            <dd className="text-amber-300 font-semibold text-right truncate" title={data.stats?.topCrs || ""}>
                              {data.stats && (data.stats.totalConversions || data.stats.totalUploads || data.stats.totalExports) ? data.stats.topCrs || "—" : "—"}
                            </dd>
                          </div>
                          <div className="py-2 flex justify-between gap-3">
                            <dt className="text-slate-400">Conversions</dt>
                            <dd className="text-slate-200 font-semibold">{(data.stats?.totalConversions ?? 0).toLocaleString()}</dd>
                          </div>
                          <div className="py-2 flex justify-between gap-3">
                            <dt className="text-slate-400">Files opened · saved</dt>
                            <dd className="text-slate-200 font-semibold">
                              {(data.stats?.totalUploads ?? 0).toLocaleString()} · {(data.stats?.totalExports ?? 0).toLocaleString()}
                            </dd>
                          </div>
                          {data.stats?.formatBreakdown && Object.keys(data.stats.formatBreakdown).length > 0 && (
                            <div className="py-2">
                              <dt className="text-slate-400 mb-1.5">Saves as</dt>
                              <dd className="flex flex-wrap gap-1">
                                {Object.entries(data.stats.formatBreakdown)
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([f, c]) => (
                                    <span key={f} className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[10.5px]">
                                      {f} {c}
                                    </span>
                                  ))}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </section>
                    </div>
                  </div>

                  {/* programs: full width, the cards need the room */}
                  <section className={`${card} p-5`}>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Download className="w-4 h-4 text-blue-400" /> Programs and versions
                    </h4>
                    {data.programs.length ? <AppVersions programs={data.programs} dark /> : <p className="text-xs text-slate-500">Hasn&apos;t downloaded or opened a program yet.</p>}
                  </section>
                </div>
              )}

              {/* ======================= Files */}
              {tab === "files" && (
                <div className="space-y-4">
                  <Head
                    title="Files"
                    text={`What they opened or saved while signed in${(counts?.files ?? 0) > files.length ? `: the newest ${files.length} of ${counts?.files.toLocaleString()}` : ""}.`}
                  >
                    <Seg value={fileDir} onChange={setFileDir} options={[["all", "All"], ["import", "Opened"], ["export", "Saved"]]} />
                    <SearchBox value={fileQ} onChange={setFileQ} placeholder="Search files" />
                  </Head>
                  {filteredFiles.length === 0 ? (
                    <Empty icon={FolderArchive} title={files.length ? "No file matches" : "No files yet"} text="Files they open or save in the web app or the Windows program show here." />
                  ) : (
                    <Table>
                      <thead className="bg-slate-800/70 border-b border-slate-800">
                        <tr>
                          <th className={th}>When</th>
                          <th className={th}>File</th>
                          <th className={`${th} hidden sm:table-cell`}>Size</th>
                          <th className={`${th} hidden md:table-cell`}>Points · grid</th>
                          <th className={`${th} hidden lg:table-cell`}>Where</th>
                          <th className={`${th} text-right`}>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {filteredFiles.map((f) => (
                          <tr key={f.id} className="hover:bg-slate-800/30">
                            <td className={`${td} text-slate-400 whitespace-nowrap`}>{fmtDateTime(f.timestamp)}</td>
                            <td className={td}>
                              <span className={`mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${f.direction === "import" ? "bg-emerald-500/15 text-emerald-300" : "bg-blue-500/15 text-blue-300"}`}>
                                {f.direction === "import" ? "Opened" : "Saved"}
                              </span>
                              <span className="font-mono text-white break-all">{f.fileName}</span>
                            </td>
                            <td className={`${td} text-slate-300 font-mono whitespace-nowrap hidden sm:table-cell`}>{f.fileSizeFormatted}</td>
                            <td className={`${td} hidden md:table-cell`}>
                              {f.pointsCount != null ? <span className="font-mono text-cyan-300">{f.pointsCount.toLocaleString()}</span> : <span className="text-slate-500">—</span>}
                              {f.crs && (
                                <span className="block max-w-[200px] truncate text-[11px] text-amber-300" title={f.crs}>
                                  {f.crs}
                                </span>
                              )}
                            </td>
                            <td className={`${td} text-slate-400 whitespace-nowrap hidden lg:table-cell`}>{PLATFORM[f.platform] ?? f.platform}</td>
                            <td className={`${td} text-right`}>
                              <span className="inline-flex items-center gap-1.5">
                                <button onClick={() => setViewing({ fileName: f.fileName, url: f.downloadUrl, size: f.fileSizeFormatted })} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white cursor-pointer" title="View">
                                  <EyeIcon className="w-3.5 h-3.5" />
                                </button>
                                <a href={f.downloadUrl} download={f.fileName} className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white" title="Download">
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                <button onClick={() => deleteFile(f.id, f.fileName)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </div>
              )}

              {/* ======================= Points */}
              {tab === "points" && (
                <div className="space-y-4">
                  <Head title="Converted points" text={`In the files they saved, newest first${points.length < pointsTotal ? `: ${points.length.toLocaleString()} of ${pointsTotal.toLocaleString()} shown; Admin → Points has them all` : ""}.`}>
                    <SearchBox value={pointQ} onChange={setPointQ} placeholder="Station, code, file or grid" />
                  </Head>
                  {filteredPoints.length === 0 ? (
                    <Empty icon={MapPinned} title={points.length ? "No point matches" : "No converted points yet"} />
                  ) : (
                    <Table>
                      <thead className="bg-slate-800/70 border-b border-slate-800 whitespace-nowrap">
                        <tr>
                          <th className={`${th} hidden md:table-cell`}>Saved</th>
                          <th className={th}>File</th>
                          <th className={th}>Station</th>
                          <th className={`${th} hidden sm:table-cell`}>Code</th>
                          <th className={`${th} hidden lg:table-cell`}>Grid</th>
                          <th className={`${th} text-right`}>Easting</th>
                          <th className={`${th} text-right`}>Northing</th>
                          <th className={`${th} text-right hidden lg:table-cell`}>Elevation</th>
                          <th className={`${th} text-right hidden sm:table-cell`}>Lat, lon</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 font-mono whitespace-nowrap">
                        {filteredPoints.slice(0, 1000).map((p) => {
                          const noGrid = !p.easting && !p.northing;
                          return (
                            <tr key={p.id} className="hover:bg-slate-800/30">
                              <td className={`${td} text-slate-400 font-sans hidden md:table-cell`}>{fmtDateTime(p.timestamp)}</td>
                              <td className={td}>
                                <span className="block max-w-[150px] truncate text-slate-300" title={p.fileName || ""}>
                                  {p.fileName || "—"}
                                </span>
                              </td>
                              <td className={`${td} font-bold text-white`}>{p.station}</td>
                              <td className={`${td} text-slate-300 hidden sm:table-cell`}>{p.featureCode || "—"}</td>
                              <td className={`${td} font-sans hidden lg:table-cell`}>
                                <span className="block max-w-[180px] truncate text-blue-300" title={p.coordSystem}>
                                  {p.coordSystem}
                                </span>
                              </td>
                              <td className={`${td} text-right text-slate-300`}>{noGrid ? "—" : p.easting.toFixed(3)}</td>
                              <td className={`${td} text-right text-slate-300`}>{noGrid ? "—" : p.northing.toFixed(3)}</td>
                              <td className={`${td} text-right text-slate-300 hidden lg:table-cell`}>{p.elevation == null ? "—" : p.elevation.toFixed(3)}</td>
                              <td className={`${td} text-right text-emerald-300 hidden sm:table-cell`}>
                                {Number(p.lat).toFixed(6)}, {Number(p.lon).toFixed(6)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </div>
              )}

              {/* ======================= Jobs & calculations */}
              {tab === "work" && (
                <div className="space-y-6">
                  <section className="space-y-3">
                    <Head title={`Excel to KML jobs (${data.jobs.length})`} text="Kept from the app with Keep as a job. Download one to open it with Import a job file." />
                    {data.jobs.length === 0 ? (
                      <Empty icon={Briefcase} title="No Excel to KML jobs" />
                    ) : (
                      <Table>
                        <thead className="bg-slate-800/70 border-b border-slate-800">
                          <tr>
                            <th className={th}>Job</th>
                            <th className={`${th} text-right`}>Points</th>
                            <th className={`${th} text-right hidden sm:table-cell`}>Photos</th>
                            <th className={`${th} hidden md:table-cell`}>Grid</th>
                            <th className={`${th} hidden sm:table-cell`}>Changed</th>
                            <th className={th}>
                              <span className="sr-only">Download</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {data.jobs.map((j) => (
                            <tr key={j.jobId} className="hover:bg-slate-800/30">
                              <td className={`${td} text-white font-medium`}>
                                {j.name}
                                {j.survey && <span className="block text-[11px] text-amber-300/90">{j.survey}</span>}
                                <span className="block text-[11px] text-slate-500">{bytes(j.size)}</span>
                              </td>
                              <td className={`${td} text-right font-mono text-cyan-300`}>{j.points.toLocaleString()}</td>
                              <td className={`${td} text-right font-mono text-slate-300 hidden sm:table-cell`}>
                                {j.photos}
                                {j.photosLeft ? <span className="text-amber-400"> (+{j.photosLeft})</span> : null}
                              </td>
                              <td className={`${td} text-slate-300 max-w-[200px] truncate hidden md:table-cell`} title={j.grid}>
                                {j.grid || "—"}
                              </td>
                              <td className={`${td} text-slate-400 whitespace-nowrap hidden sm:table-cell`}>{fmtDateTime(new Date(j.updated || j.keptAt).toISOString())}</td>
                              <td className={`${td} text-right`}>
                                <a
                                  href={`/api/admin/jobs?userId=${encodeURIComponent(u.id)}&jobId=${encodeURIComponent(j.jobId)}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                                >
                                  <Download className="w-3.5 h-3.5" /> Job
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </section>

                  <section className="space-y-3">
                    <Head title={`Slope Calculator calculations (${data.slope.length})`} text="Kept in the account from the Windows program or the web app." />
                    {data.slope.length === 0 ? (
                      <Empty icon={TrendingUp} title="No Slope Calculator calculations" />
                    ) : (
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {data.slope.map((s) => (
                          <li key={s.id} className={`${card} px-4 py-3 flex items-start gap-3`}>
                            <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                              {s.summary && <p className="text-[11.5px] text-slate-400">{s.summary}</p>}
                              <p className="text-[11px] text-slate-500">
                                Saved {ago(s.savedAt)} · {bytes(s.size)}
                              </p>
                            </div>
                            <button onClick={() => deleteSlope(s.id, s.name)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="space-y-3">
                    <Head title={`Traverse & Level jobs (${data.traverseJobs})`} text="Traverses and level runs saved in the app. View shows the points and the adjusted results." />
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <TraverseUserJobs adminFetch={adminFetch} userId={u.id} who={u.email} onToast={onToast} onChanged={reload} />
                    </div>
                  </section>
                </div>
              )}

              {/* ======================= Activity */}
              {tab === "activity" && (
                <div className="space-y-4">
                  <Head
                    title="Activity"
                    text={`Everything they did in the apps and on the site${(counts?.activities ?? 0) > activities.length ? `: the newest ${activities.length} of ${counts?.activities.toLocaleString()}` : ""}.`}
                  >
                    <Seg value={actKind} onChange={setActKind} options={[["all", "All"], ["errors", "Problems"], ["account", "Account"]]} />
                    <SearchBox value={actQ} onChange={setActQ} placeholder="Search activity" />
                    {activities.length > 0 && (
                      <button onClick={clearActivity} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/15 text-rose-300 hover:bg-rose-600/25 text-xs font-bold border border-rose-500/30 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" /> Clear…
                      </button>
                    )}
                  </Head>
                  {filteredActs.length === 0 ? (
                    <Empty icon={Activity} title={activities.length ? "Nothing matches" : "No activity yet"} text="Conversions, files, sign-ins and changes to the account show here." />
                  ) : (
                    <Table>
                      <thead className="bg-slate-800/70 border-b border-slate-800">
                        <tr>
                          <th className={th}>When</th>
                          <th className={th}>What</th>
                          <th className={`${th} hidden md:table-cell`}>Points · grid</th>
                          <th className={`${th} hidden lg:table-cell`}>From</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {filteredActs.map((a) => (
                          <tr key={a.id} className={a.status === "error" ? "bg-rose-500/5" : "hover:bg-slate-800/30"}>
                            <td className={`${td} text-slate-400 whitespace-nowrap align-top`}>{fmtDateTime(a.timestamp)}</td>
                            <td className={`${td} align-top`}>
                              <span className={`mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border whitespace-nowrap ${adminActionTag(a.action)}`}>{actionLabel(a.action)}</span>
                              {a.status === "error" && <AlertTriangle className="inline w-3.5 h-3.5 text-rose-400 mr-1" />}
                              <span className="text-white font-semibold">{a.title}</span>
                              {a.fileName && (
                                <span className="block text-[11px] text-slate-400 font-mono break-all">
                                  {a.fileName}
                                  {a.fileSize ? ` (${a.fileSize})` : ""}
                                </span>
                              )}
                              {a.details && <span className="block mt-0.5 text-[11px] text-slate-400 whitespace-pre-line break-words max-w-[520px]">{a.details}</span>}
                            </td>
                            <td className={`${td} align-top hidden md:table-cell`}>
                              {a.pointsCount != null ? <span className="font-mono text-cyan-300">{a.pointsCount.toLocaleString()} pts</span> : <span className="text-slate-500">—</span>}
                              {a.exportFormat && <span className="ml-1 px-1 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-bold uppercase">{a.exportFormat}</span>}
                              {a.crs && (
                                <span className="block max-w-[200px] truncate text-[11px] text-amber-300" title={a.crs}>
                                  {a.crs}
                                </span>
                              )}
                            </td>
                            <td className={`${td} align-top text-slate-400 hidden lg:table-cell`}>
                              <span className="font-mono text-[11px]">{a.ipAddress || "—"}</span>
                              {a.userAgent && <span className="block text-[11px] text-slate-500">{browserOf(a.userAgent)}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </div>
              )}

              {/* ======================= Downloads */}
              {tab === "downloads" && (
                <div className="space-y-4">
                  <Head title="Downloads" text="Every installer, manual and sample they downloaded, newest first.">
                    {dlApps.length > 1 && (
                      <Seg
                        value={dlApp}
                        onChange={setDlApp}
                        options={[["all", `All ${downloads.length}`] as [string, string], ...dlApps.map(([a, c]) => [a, `${APP_NAMES[a] ?? a} ${c}`] as [string, string])]}
                      />
                    )}
                  </Head>
                  {filteredDls.length === 0 ? (
                    <Empty icon={Download} title="No downloads yet" />
                  ) : (
                    <Table>
                      <thead className="bg-slate-800/70 border-b border-slate-800">
                        <tr>
                          <th className={th}>When</th>
                          <th className={th}>What</th>
                          <th className={`${th} hidden md:table-cell`}>From</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {filteredDls.map((d) => {
                          const pl = placeOf(d.location);
                          return (
                            <tr key={d.id} className="hover:bg-slate-800/30">
                              <td className={`${td} text-slate-400 whitespace-nowrap`}>{fmtDateTime(d.timestamp)}</td>
                              <td className={td}>
                                <span className="text-white font-semibold">{APP_NAMES[d.app ?? ""] ?? d.assetType}</span>
                                <span className="ml-1.5 px-1.5 py-0.5 rounded border border-slate-700 text-[10px] font-bold text-slate-300">{ASSET_NAMES[d.assetType] ?? d.assetType}</span>
                                {d.version && <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-bold">v{d.version.replace(/^v/i, "")}</span>}
                                <span className="block text-[11px] text-slate-500 font-mono break-all">{d.fileName}</span>
                              </td>
                              <td className={`${td} text-slate-300 hidden md:table-cell`}>
                                <span className="whitespace-nowrap">
                                  {pl.flag} {pl.text}
                                </span>
                                <span className="block text-[11px] text-slate-500">
                                  <span className="font-mono">{d.ipAddress || "—"}</span>
                                  {d.userAgent ? ` · ${browserOf(d.userAgent)}` : ""}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </div>
              )}

              {/* ======================= Survey Toolkit */}
              {tab === "toolkit" && (
                <div className="space-y-5">
                  <Head title="Survey Toolkit" text="Each PC where they use the Toolkit, the programs on it, and what it did lately." />
                  {data.toolkit.pcs.length === 0 ? (
                    <Empty icon={Monitor} title="No PC with the Survey Toolkit" text="When they sign in to the Toolkit on a PC, it reports its version and the programs on it here." />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {data.toolkit.pcs.map((pc) => (
                        <div key={pc.id} className={`${card} p-4`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{pc.name || "A PC"}</p>
                              <p className="text-[11px] text-slate-400">{pc.windows || "Windows"}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/25 text-teal-300 text-[10.5px] font-bold whitespace-nowrap">Toolkit {pc.toolkitVersion || "?"}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(pc.tools).filter(([, v]) => v).length === 0 ? (
                              <span className="text-[11px] text-slate-500">No programs installed through it</span>
                            ) : (
                              Object.entries(pc.tools)
                                .filter(([, v]) => v)
                                .map(([t, v]) => (
                                  <span key={t} className="px-1.5 py-0.5 rounded border border-slate-700 text-[10.5px] text-slate-300">
                                    {APP_NAMES[t] ?? t} <span className="font-mono text-slate-400">{v}</span>
                                  </span>
                                ))
                            )}
                          </div>
                          <p className="mt-2 text-[11px] text-slate-500">
                            Last seen {ago(pc.lastSeen)} · first {fmtDate(pc.firstSeen)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.toolkit.events.length > 0 && (
                    <Table>
                      <thead className="bg-slate-800/70 border-b border-slate-800">
                        <tr>
                          <th className={th}>When</th>
                          <th className={th}>What</th>
                          <th className={`${th} hidden sm:table-cell`}>Version</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {data.toolkit.events.map((e, i) => (
                          <tr key={i} className={e.action === "failed" ? "bg-rose-500/5" : ""}>
                            <td className={`${td} text-slate-400 whitespace-nowrap`}>{fmtDateTime(e.createdAt)}</td>
                            <td className={td}>
                              <span className={`font-semibold capitalize ${e.action === "failed" ? "text-rose-300" : "text-white"}`}>{e.action}</span> {APP_NAMES[e.tool] ?? e.tool}
                              {e.message && <span className="block text-[11px] text-slate-400 break-words">{e.message}</span>}
                            </td>
                            <td className={`${td} font-mono text-slate-300 hidden sm:table-cell`}>
                              {e.fromVersion && e.toVersion && e.fromVersion !== e.toVersion ? `${e.fromVersion} → ${e.toVersion}` : e.toVersion || e.fromVersion || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </div>
              )}

              {/* ======================= Reviews & messages */}
              {tab === "feedback" && (
                <div className="space-y-6">
                  <section className="space-y-3">
                    <Head title={`Reviews (${data.reviews.length})`} text="Their star ratings of the programs. Publish or hide them in Admin → Reviews." />
                    {data.reviews.length === 0 ? (
                      <Empty icon={Star} title="No reviews" />
                    ) : (
                      <ul className="space-y-2">
                        {data.reviews.map((r) => (
                          <li key={r.id} className={`${card} px-4 py-3`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <Stars n={r.rating} />
                              <span className="text-sm font-semibold text-white">{APP_NAMES[r.product] ?? r.product}</span>
                              {r.version && <span className="text-[11px] text-slate-500">v{r.version.replace(/^v/i, "")}</span>}
                              <span
                                className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  r.status === "published" ? "bg-emerald-500/15 text-emerald-300" : r.status === "hidden" ? "bg-slate-700 text-slate-300" : "bg-amber-500/15 text-amber-300"
                                }`}
                              >
                                {r.status === "pending" ? "Waiting" : r.status}
                              </span>
                            </div>
                            {r.comment ? <p className="mt-1 text-[13px] text-slate-300 whitespace-pre-line">{r.comment}</p> : <p className="mt-1 text-xs text-slate-500">No comment</p>}
                            <p className="mt-1 text-[11px] text-slate-500">{fmtDateTime(r.updatedAt)}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <section className="space-y-3">
                    <Head title={`Messages (${data.messages.length})`} text="What they sent through the contact form. Answer them in Admin → Messages." />
                    {data.messages.length === 0 ? (
                      <Empty icon={Inbox} title="No messages" />
                    ) : (
                      <ul className="space-y-2">
                        {data.messages.map((m) => (
                          <li key={m.id} className={`${card} px-4 py-3`}>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-bold">{m.topic}</span>
                              <span className="font-mono text-slate-500">{m.ref}</span>
                              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${m.status === "new" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}>{m.status}</span>
                              <span className="ml-auto text-slate-500">{fmtDateTime(m.createdAt)}</span>
                            </div>
                            <p className="mt-1.5 text-[13px] text-slate-300 whitespace-pre-line break-words">{m.message}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}

              {/* ======================= Account */}
              {tab === "account" && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-5">
                    <form onSubmit={saveProfile} className={`${card} p-5 space-y-4`}>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" /> Profile
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block">
                          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name</span>
                          <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={input} />
                        </label>
                        <label className="block">
                          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</span>
                          <input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={input} />
                        </label>
                        <label className="block">
                          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Organization</span>
                          <input value={editForm.organization} onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })} className={input} placeholder="Independent Surveyor" />
                        </label>
                        <label className="block">
                          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role</span>
                          <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className={input}>
                            {editForm.role && !["Surveyor", "Senior Surveyor", "Cadastral Lead", "Civil Engineer", "GIS Specialist", "ADMIN"].includes(editForm.role) && (
                              <option value={editForm.role}>{editForm.role} (as they typed it)</option>
                            )}
                            <option value="Surveyor">Surveyor</option>
                            <option value="Senior Surveyor">Senior Surveyor</option>
                            <option value="Cadastral Lead">Cadastral Lead</option>
                            <option value="Civil Engineer">Civil Engineer</option>
                            <option value="GIS Specialist">GIS Specialist</option>
                            <option value="ADMIN">Administrator</option>
                          </select>
                        </label>
                      </div>
                      <label className="block">
                        <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">New password (optional)</span>
                        <input type="password" autoComplete="new-password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className={input} placeholder="Leave empty to keep theirs" />
                      </label>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-500 font-mono">ID {u.id}</span>
                        <button
                          type="submit"
                          disabled={saving || !profileChanged}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                        </button>
                      </div>
                    </form>

                    <EmailConfirmPanel
                      userId={u.id}
                      status={data.emailStatus}
                      isAdmin={u.role === "ADMIN"}
                      fetcher={adminFetch}
                      onChanged={(s) => setData((d) => (d ? { ...d, emailStatus: s } : d))}
                      onToast={onToast}
                    />

                    <section className={`${card} p-5 space-y-3`}>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-400" /> Release emails
                      </h3>
                      <p className="text-xs text-slate-400">{data.optedOut ? `Stopped them on ${fmtDate(data.optedOut)}; they get no more release emails.` : "They get an email when a program they use has a new version."}</p>
                      {data.releaseEmails.length === 0 ? (
                        <p className="text-xs text-slate-500">None sent yet.</p>
                      ) : (
                        <ul className="divide-y divide-slate-800 text-xs">
                          {data.releaseEmails.map((r, i) => (
                            <li key={i} className="py-2 flex items-start justify-between gap-3">
                              <span className="text-slate-200 min-w-0">
                                {r.subject}
                                {r.error && <span className="block text-[11px] text-rose-300 break-words">{r.error}</span>}
                              </span>
                              <span className={`shrink-0 font-semibold ${r.status === "sent" ? "text-emerald-300" : r.status === "failed" ? "text-rose-300" : "text-slate-400"}`}>
                                {r.status === "sent" ? `Sent ${fmtDate(r.sentAt)}` : r.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>

                  <div className="space-y-5">
                    <AccountControls userId={u.id} email={u.email} adminFetch={adminFetch} onToast={onToast} onChanged={() => (onUserUpdated?.(), reload())} allData={data} />

                    <section className={`${card} p-5 space-y-3`}>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-blue-400" /> What admins changed
                      </h3>
                      {data.adminLog.length === 0 ? (
                        <p className="text-xs text-slate-500">No admin has changed this account.</p>
                      ) : (
                        <ul className="divide-y divide-slate-800 text-xs">
                          {data.adminLog.map((l) => (
                            <li key={l.id} className="py-2">
                              <span className="flex flex-wrap justify-between gap-2">
                                <span className="font-semibold text-slate-200">{l.action}</span>
                                <span className="text-slate-500">{fmtDateTime(l.at)}</span>
                              </span>
                              <span className="block text-slate-400">by {l.adminEmail || "an admin"}</span>
                              {l.details && <span className="block text-[11px] text-slate-500 whitespace-pre-line break-words">{l.details}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ---------------- foot: how fresh */}
        {data && (
          <div className="px-4 sm:px-6 py-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-2 shrink-0">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Compass className="w-3 h-3" />}
            {loading ? "Loading again…" : `Loaded ${ago(data.loadedAt)}`}
            <span className="ml-auto hidden sm:inline">Esc closes · R loads again</span>
          </div>
        )}
      </div>
      <FileViewer file={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
