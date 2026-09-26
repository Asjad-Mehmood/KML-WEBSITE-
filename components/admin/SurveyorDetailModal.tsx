"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  ShieldCheck,
  Lock,
  Globe,
  Download,
  Activity,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  RefreshCw,
  HardDrive,
  Trash2,
  Save,
  Layers,
  Sparkles,
  ExternalLink,
  Calendar,
  Compass,
  Cpu,
  FolderArchive,
  MapPinned,
  FileText,
  Search,
  Eye as EyeIcon,
} from "lucide-react";
import FileViewer, { type ViewerFile } from "@/components/admin/FileViewer";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
  downloadCount: number;
  ipAddress?: string;
  location?: string;
  hasFullAccess?: boolean;
  customMaxPoints?: number;
}

export interface UserActivityItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName?: string | null;
  action: string;
  title: string;
  details?: string;
  fileName?: string;
  fileSize?: string;
  pointsCount?: number;
  linesCount?: number;
  polygonsCount?: number;
  crs?: string;
  exportFormat?: string;
  photosCount?: number;
  durationMs?: number;
  status?: "success" | "warning" | "error";
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface UserDownloadItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  assetType: string;
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
  platform: "windows_app" | "web_app";
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  downloadUrl: string;
}

interface UserDetailResponse {
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
  };
  activities: UserActivityItem[];
  downloads: UserDownloadItem[];
  files?: UserFileItem[];
  points?: { total: number; conversions: UserPointItem[] };
}

export interface UserPointItem {
  id: string;
  fileId?: string | null;
  fileName?: string | null;
  station: string;
  featureCode: string;
  easting: number;
  northing: number;
  elevation: number;
  coordSystem: string;
  lat: string;
  lon: string;
  timestamp: string;
}

interface SurveyorDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
  onToast: (msg: string, type?: "success" | "error") => void;
  globalMaxPoints?: number;
}

export default function SurveyorDetailModal({
  userId,
  isOpen,
  onClose,
  onUserUpdated,
  onToast,
  globalMaxPoints = 50,
}: SurveyorDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "files" | "points" | "activities" | "downloads" | "settings">("overview");

  // Files filter & search
  const [fileFilter, setFileFilter] = useState<"all" | "import" | "export">("all");
  const [viewing, setViewing] = useState<ViewerFile | null>(null);
  const [fileSearch, setFileSearch] = useState("");

  // Form state for permissions & profile edits
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    organization: "",
    role: "Surveyor",
    hasFullAccess: false,
    customMaxPoints: "",
    password: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const getStoredToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("surveyor_session") || localStorage.getItem("surveyor_auth_token") || "";
  };

  const adminFetch = (url: string, options: RequestInit = {}) => {
    const token = getStoredToken();
    const headers = new Headers(options.headers || {});
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(url, {
      ...options,
      credentials: "include",
      headers,
    });
  };

  // Escape closes the window
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails(userId);
    } else {
      setData(null);
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load user intelligence profile");
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
        setEditForm({
          name: json.user.name || "",
          email: json.user.email || "",
          organization: json.user.organization || "",
          role: json.user.role || "Surveyor",
          hasFullAccess: Boolean(json.user.hasFullAccess),
          customMaxPoints: json.user.customMaxPoints ? String(json.user.customMaxPoints) : "",
          password: "",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading user details";
      onToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingSettings(true);

    try {
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        organization: editForm.organization.trim(),
        role: editForm.role.trim(),
        hasFullAccess: editForm.hasFullAccess,
        customMaxPoints: editForm.customMaxPoints ? parseInt(editForm.customMaxPoints, 10) : null,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await adminFetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to update surveyor permissions");

      onToast(`Updated settings for ${editForm.name}`);
      if (onUserUpdated) onUserUpdated();
      fetchUserDetails(userId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving changes";
      onToast(msg, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClearUserActivity = async () => {
    if (!userId || !data) return;
    if (!confirm(`Are you sure you want to clear activity records for ${data.user.name}?`)) {
      return;
    }

    try {
      const res = await adminFetch(`/api/admin/activities?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onToast("User activity history cleared");
        fetchUserDetails(userId);
      } else {
        throw new Error("Failed to clear activities");
      }
    } catch {
      onToast("Error clearing activities", "error");
    }
  };

  const handleDeleteStoredFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete stored file "${fileName}" from the database vault?`)) return;
    try {
      const res = await adminFetch(`/api/user/files/${fileId}`, { method: "DELETE" });
      if (res.ok) {
        onToast(`Deleted file ${fileName}`);
        if (userId) fetchUserDetails(userId);
      } else {
        throw new Error("Failed to delete file");
      }
    } catch {
      onToast("Error deleting file", "error");
    }
  };

  const formatLocationDisplay = (locStr?: string | null): { text: string; flag: string } => {
    if (!locStr || locStr === "Localhost (Dev)" || locStr === "127.0.0.1" || locStr === "Localhost") {
      return { text: "Localhost (Dev)", flag: "💻" };
    }
    const trimmed = locStr.trim();
    if (trimmed.length === 2) {
      const code = trimmed.toUpperCase();
      let flag = "🌐";
      try {
        flag = code.replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397));
      } catch {
        // ignore
      }
      try {
        const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
        return { text: regionNames.of(code) || code, flag };
      } catch {
        return { text: code, flag };
      }
    }
    let flag = "🌐";
    if (trimmed.includes("Pakistan") || trimmed.endsWith("PK")) flag = "🇵🇰";
    else if (trimmed.includes("Emirates") || trimmed.includes("Dubai") || trimmed.endsWith("AE")) flag = "🇦🇪";
    else if (trimmed.includes("United States") || trimmed.endsWith("US") || trimmed.includes("USA")) flag = "🇺🇸";
    else if (trimmed.includes("United Kingdom") || trimmed.endsWith("GB") || trimmed.includes("London")) flag = "🇬🇧";
    else if (trimmed.includes("Saudi Arabia") || trimmed.endsWith("SA")) flag = "🇸🇦";
    else if (trimmed.includes("Qatar") || trimmed.endsWith("QA")) flag = "🇶🇦";
    else if (trimmed.includes("Canada") || trimmed.endsWith("CA")) flag = "🇨🇦";
    else if (trimmed.includes("Germany") || trimmed.endsWith("DE")) flag = "🇩🇪";
    else if (trimmed.includes("India") || trimmed.endsWith("IN")) flag = "🇮🇳";
    return { text: trimmed, flag };
  };

  if (!isOpen) return null;

  const user = data?.user;
  const stats = data?.stats;
  const activities = data?.activities || [];
  const downloads = data?.downloads || [];
  const files = data?.files || [];
  const points = data?.points?.conversions || [];
  const pointsTotal = data?.points?.total ?? points.length;
  const loc = formatLocationDisplay(user?.location);

  const filteredFiles = files.filter((f) => {
    if (fileFilter !== "all" && f.direction !== fileFilter) return false;
    if (!fileSearch.trim()) return true;
    const q = fileSearch.toLowerCase();
    return (
      f.fileName.toLowerCase().includes(q) ||
      (f.crs && f.crs.toLowerCase().includes(q)) ||
      (f.action && f.action.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* One height for every tab, so the window does not jump; full screen on a phone */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={user ? `Surveyor ${user.name}` : "Surveyor"}
        className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 sm:rounded-3xl shadow-2xl flex flex-col h-full sm:h-[min(88vh,920px)] overflow-hidden"
      >
        {/* Top Header */}
        <div className="px-4 py-4 sm:p-6 bg-slate-900/90 border-b border-slate-800/80 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-600/30 shrink-0">
              {user ? user.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                  {user ? user.name : "Loading Surveyor Profile..."}
                </h2>
                {user?.role === "ADMIN" && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Administrator
                  </span>
                )}
                {user?.hasFullAccess || user?.role === "ADMIN" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> Full access
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    <Lock className="w-3.5 h-3.5" /> Demo · {user?.customMaxPoints || globalMaxPoints} pts
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span className="text-slate-300 font-medium break-all">{user?.email}</span>
                <span className="hidden sm:inline">•</span>
                <span>{user?.organization || "Independent Surveyor"}</span>
                <span className="hidden md:inline">•</span>
                <span className="text-slate-400 hidden md:flex items-center gap-1">
                  <span>{loc.flag}</span>
                  <span>{loc.text}</span>
                  <code className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded ml-1">
                    {user?.ipAddress || "127.0.0.1"}
                  </code>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          role="tablist"
          className="flex items-center gap-1 px-3 sm:px-6 pt-2 bg-slate-900 border-b border-slate-800/80 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "files", label: "Files", icon: FolderArchive, count: files.length },
            { id: "points", label: "Points", icon: MapPinned, count: pointsTotal },
            { id: "activities", label: "Activity", icon: HardDrive, count: activities.length },
            { id: "downloads", label: "Downloads", icon: Download, count: downloads.length },
            { id: "settings", label: "Access", icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                ref={(el) => {
                  if (el && active) el.scrollIntoView({ block: "nearest", inline: "nearest" });
                }}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-3 text-[13px] font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "border-blue-500 text-blue-400 bg-blue-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1.5 py-px rounded-md text-[11px] font-mono bg-slate-800 text-slate-400">
                    {tab.count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm font-semibold">Retrieving individual person details from database...</p>
            </div>
          ) : !data ? (
            <div className="py-16 text-center text-slate-400">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p>User details not found or failed to load.</p>
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* TAB 1: OVERVIEW & TELEMETRY */}
              {/* ========================================================= */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Metric Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Points Kept
                      </div>
                      <div className="text-2xl font-black text-white font-mono">{pointsTotal.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-500 mt-1">In the files this surveyor saved</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <FolderArchive className="w-3.5 h-3.5 text-cyan-400" /> Files Kept
                      </div>
                      <div className="text-2xl font-black text-white font-mono">
                        {files.length}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Archived imports &amp; exports</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" /> Exports Created
                      </div>
                      <div className="text-2xl font-black text-white font-mono">
                        {stats?.totalExports ?? 0}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">KMZ, KML &amp; DXF outputs</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-amber-400" /> Most Used Grid
                      </div>
                      <div className="text-sm font-bold text-amber-300 truncate mt-1.5" title={stats?.topCrs}>
                        {stats?.topCrs || "WGS84 / UTM"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Primary coordinate system</div>
                    </div>
                  </div>

                  {/* Format Breakdown & Profile Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export Format Distribution */}
                    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" /> Export Format Breakdown
                      </h4>

                      {stats?.formatBreakdown && Object.keys(stats.formatBreakdown).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(stats.formatBreakdown).map(([fmt, count]) => {
                            const total = stats.totalExports || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                              <div key={fmt} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-300 font-mono">{fmt}</span>
                                  <span className="text-blue-400">
                                    {count} {count === 1 ? "export" : "exports"} ({pct}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${Math.max(10, pct)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No exports recorded yet for this surveyor.
                        </div>
                      )}
                    </div>

                    {/* Account Security & IP Records */}
                    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Account &amp; Access Details
                      </h4>

                      <div className="divide-y divide-slate-800 text-xs">
                        <div className="py-2 flex justify-between">
                          <span className="text-slate-400">User ID</span>
                          <code className="text-slate-300 font-mono text-[11px]">{user?.id}</code>
                        </div>
                        <div className="py-2 flex justify-between items-center">
                          <span className="text-slate-400">Registration Date</span>
                          <span className="text-slate-200">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
                          </span>
                        </div>
                        <div className="py-2 flex justify-between items-center">
                          <span className="text-slate-400">Last Active / Login</span>
                          <span className="text-slate-200">
                            {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
                          </span>
                        </div>
                        <div className="py-2 flex justify-between items-center">
                          <span className="text-slate-400">Origin Location</span>
                          <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                            <span>{loc.flag}</span>
                            <span>{loc.text}</span>
                          </span>
                        </div>
                        <div className="py-2 flex justify-between items-center">
                          <span className="text-slate-400">Registration IP</span>
                          <code className="text-blue-400 font-mono text-[11px] bg-blue-500/10 px-2 py-0.5 rounded">
                            {user?.ipAddress || "127.0.0.1"}
                          </code>
                        </div>
                        <div className="py-2 flex justify-between items-center">
                          <span className="text-slate-400">Total Downloads</span>
                          <span className="text-indigo-400 font-bold font-mono">{user?.downloadCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Files Vault Preview */}
                  <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FolderArchive className="w-4 h-4 text-cyan-400" /> Latest files
                      </h4>
                      {files.length > 0 && (
                        <button
                          onClick={() => setActiveTab("files")}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                        >
                          View All Files ({files.length}) &rarr;
                        </button>
                      )}
                    </div>

                    {files.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        No files imported or exported yet by this surveyor.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {files.slice(0, 3).map((f) => (
                          <div
                            key={f.id}
                            className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                                  f.direction === "import"
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {f.direction}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate max-w-sm font-mono">{f.fileName}</div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                  <span>{f.fileSizeFormatted}</span>
                                  {f.pointsCount !== undefined && <span className="text-cyan-400">• {f.pointsCount} pts</span>}
                                  <span className="text-slate-500">• {f.platform === "windows_app" ? "🪟 Windows App" : "🌐 Web App"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setViewing({ fileName: f.fileName, url: f.downloadUrl, size: f.fileSizeFormatted })}
                              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <EyeIcon className="w-3.5 h-3.5" /> View
                            </button>
                            <a
                              href={f.downloadUrl}
                              download={f.fileName}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-md shadow-blue-600/30"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: CLOUD FILES VAULT (IMPORTS & EXPORTS) */}
              {/* ========================================================= */}
              {activeTab === "files" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FolderArchive className="w-4 h-4 text-cyan-400" /> Files
                      </h3>
                      <p className="text-xs text-slate-400">
                        Every file this surveyor opened or saved while signed in, in the web app or the Windows program
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                        {(["all", "import", "export"] as const).map((dir) => (
                          <button
                            key={dir}
                            onClick={() => setFileFilter(dir)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              fileFilter === dir ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {dir === "all" ? "All Files" : dir === "import" ? "📥 Imports" : "📤 Exports"}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search files..."
                          value={fileSearch}
                          onChange={(e) => setFileSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
                        />
                      </div>
                    </div>
                  </div>

                  {filteredFiles.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800">
                      <FolderArchive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No stored files matching filter</p>
                      <p className="text-xs text-slate-500 mt-1">
                        When this surveyor opens total station files or saves KMZ, KML, CSV, or DXF files in the app, they appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-800/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Timestamp</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3">File Name</th>
                              <th className="px-4 py-3">Size</th>
                              <th className="px-4 py-3">Points</th>
                              <th className="px-4 py-3">Coordinate System</th>
                              <th className="px-4 py-3">Platform</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {filteredFiles.map((f) => (
                              <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                                  {new Date(f.timestamp).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${
                                      f.direction === "import"
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                        : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                    }`}
                                  >
                                    {f.direction === "import" ? "📥 Import" : "📤 Export"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono font-medium text-white max-w-[200px] truncate" title={f.fileName}>
                                  {f.fileName}
                                </td>
                                <td className="px-4 py-3 text-slate-300 font-mono whitespace-nowrap">
                                  {f.fileSizeFormatted}
                                </td>
                                <td className="px-4 py-3">
                                  {f.pointsCount !== undefined ? (
                                    <span className="font-mono text-cyan-400 font-bold">{f.pointsCount.toLocaleString()} pts</span>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {f.crs ? (
                                    <span className="block max-w-[200px] truncate text-[11px] text-amber-300" title={f.crs}>
                                      {f.crs}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                                  {f.platform === "windows_app" ? "🪟 Windows App" : "🌐 Web App"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      onClick={() => setViewing({ fileName: f.fileName, url: f.downloadUrl, size: f.fileSizeFormatted })}
                                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                      title="View the file here"
                                    >
                                      <EyeIcon className="w-3.5 h-3.5" /> View
                                    </button>
                                    <a
                                      href={f.downloadUrl}
                                      download={f.fileName}
                                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                                      title="Download file to computer"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Download
                                    </a>
                                    <button
                                      onClick={() => handleDeleteStoredFile(f.id, f.fileName)}
                                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                      title="Delete file"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: APP ACTIVITY & TELEMETRY */}
              {/* ========================================================= */}
              {activeTab === "activities" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Full Application Telemetry History</h3>
                      <p className="text-xs text-slate-400">
                        Detailed log of all survey files, coordinate conversions, and exports executed by this user
                      </p>
                    </div>
                    {activities.length > 0 && (
                      <button
                        onClick={handleClearUserActivity}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear History
                      </button>
                    )}
                  </div>

                  {activities.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800">
                      <HardDrive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No activity records logged yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        When this user converts files or exports KMZ in the web app or desktop app, records will show here.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-800/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Timestamp</th>
                              <th className="px-4 py-3">Action</th>
                              <th className="px-4 py-3">File / Operation</th>
                              <th className="px-4 py-3">Points &amp; Geometry</th>
                              <th className="px-4 py-3">Coordinate System (CRS)</th>
                              <th className="px-4 py-3">Format</th>
                              <th className="px-4 py-3 hidden xl:table-cell">IP Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {activities.map((act) => (
                              <tr key={act.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                                  {new Date(act.timestamp).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                                    {act.action.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-white max-w-[200px] truncate" title={act.title}>
                                    {act.title}
                                  </div>
                                  {act.fileName && (
                                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                      <span className="truncate max-w-[150px]">{act.fileName}</span>
                                      {act.fileSize && <span className="text-slate-500">({act.fileSize})</span>}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {act.pointsCount !== undefined ? (
                                    <span className="font-mono font-bold text-cyan-400">
                                      {act.pointsCount.toLocaleString()} pts
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {act.crs ? (
                                    <span className="block max-w-[200px] truncate text-[11px] text-amber-300" title={act.crs}>
                                      {act.crs}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {act.exportFormat ? (
                                    <span className="font-bold text-emerald-400 uppercase text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                      {act.exportFormat}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-400 hidden xl:table-cell">
                                  {act.ipAddress || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* CONVERTED POINTS */}
              {/* ========================================================= */}
              {activeTab === "points" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Converted Points</h3>
                      <p className="text-xs text-slate-400">
                        Every point in the files this user saved while signed in, newest first
                        {points.length < pointsTotal ? ` (showing ${points.length} of ${pointsTotal})` : ""}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {pointsTotal} Points
                    </span>
                  </div>

                  {points.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800">
                      <MapPinned className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No converted points recorded for this user</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-800/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-3 py-3 hidden md:table-cell">Saved</th>
                              <th className="px-3 py-3">File</th>
                              <th className="px-3 py-3">Station</th>
                              <th className="px-3 py-3 hidden sm:table-cell">Code</th>
                              <th className="px-3 py-3 hidden lg:table-cell">Grid</th>
                              <th className="px-3 py-3 text-right">Easting</th>
                              <th className="px-3 py-3 text-right">Northing</th>
                              <th className="px-3 py-3 text-right hidden lg:table-cell">Elevation</th>
                              <th className="px-3 py-3 text-right hidden sm:table-cell">Latitude</th>
                              <th className="px-3 py-3 text-right hidden sm:table-cell">Longitude</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50 font-mono">
                            {points.slice(0, 1000).map((pt) => {
                              const noGrid = !pt.easting && !pt.northing;
                              return (
                                <tr key={pt.id} className="hover:bg-slate-800/30 transition-colors">
                                  <td className="px-3 py-2 text-slate-400 font-sans hidden md:table-cell">{new Date(pt.timestamp).toLocaleString()}</td>
                                  <td className="px-3 py-2">
                                    <span className="block max-w-[150px] truncate text-slate-300" title={pt.fileName || ""}>
                                      {pt.fileName || "—"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 font-bold text-white">{pt.station}</td>
                                  <td className="px-3 py-2 text-slate-300 hidden sm:table-cell">{pt.featureCode || "—"}</td>
                                  <td className="px-3 py-2 font-sans hidden lg:table-cell">
                                    <span className="block max-w-[190px] truncate text-blue-400" title={pt.coordSystem}>
                                      {pt.coordSystem}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right text-slate-300">{noGrid ? "—" : pt.easting.toFixed(3)}</td>
                                  <td className="px-3 py-2 text-right text-slate-300">{noGrid ? "—" : pt.northing.toFixed(3)}</td>
                                  <td className="px-3 py-2 text-right text-slate-300 hidden lg:table-cell">{pt.elevation.toFixed(3)}</td>
                                  <td className="px-3 py-2 text-right text-emerald-400 hidden sm:table-cell">{Number(pt.lat).toFixed(7)}</td>
                                  <td className="px-3 py-2 text-right text-emerald-400 hidden sm:table-cell">{Number(pt.lon).toFixed(7)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {points.length > 1000 && (
                        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
                          Showing the newest 1,000 points. The Points tab on the main page has them all, with search and CSV export.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: DOWNLOADS LOG */}
              {/* ========================================================= */}
              {activeTab === "downloads" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Download Records</h3>
                      <p className="text-xs text-slate-400">
                        History of all software installers and test data sets downloaded by this user
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {downloads.length} Download Events
                    </span>
                  </div>

                  {downloads.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-800">
                      <Download className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No downloads recorded for this user</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-800/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Timestamp</th>
                              <th className="px-4 py-3">Asset Type</th>
                              <th className="px-4 py-3">File Name</th>
                              <th className="px-4 py-3">Version</th>
                              <th className="px-4 py-3">IP Address</th>
                              <th className="px-4 py-3">Location Origin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {downloads.map((dl) => {
                              const dloc = formatLocationDisplay(dl.location);
                              return (
                                <tr key={dl.id} className="hover:bg-slate-800/30 transition-colors">
                                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                                    {new Date(dl.timestamp).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                                      {dl.assetType}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-mono font-medium text-white">
                                    {dl.fileName}
                                  </td>
                                  <td className="px-4 py-3 text-slate-300 font-mono">
                                    {dl.version}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-emerald-400">
                                    {dl.ipAddress || "127.0.0.1"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-300 flex items-center gap-1.5">
                                    <span>{dloc.flag}</span>
                                    <span>{dloc.text}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 5: ACCESS & RESTRICTION CONTROLS */}
              {/* ========================================================= */}
              {activeTab === "settings" && (
                <form onSubmit={handleSaveUserPermissions} className="space-y-6 max-w-2xl mx-auto">
                  <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" /> Web Access &amp; Point Restrictions
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure individual access tiers. Note: Windows Desktop App users automatically have full unrestricted access without limits.
                    </p>

                    {/* Master Full Access Toggle */}
                    <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={editForm.hasFullAccess}
                        onChange={(e) => setEditForm({ ...editForm, hasFullAccess: e.target.checked })}
                        className="mt-0.5 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-0 w-4 h-4"
                      />
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Grant Full Unrestricted Web Access</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Pro Surveyor
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          When checked, this account can convert unlimited points on the web without any watermark or download prompts.
                        </div>
                      </div>
                    </label>

                    {/* Custom Point Limit */}
                    {!editForm.hasFullAccess && (
                      <div className="pt-2 space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Custom Point Limit for this User
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="5"
                            max="50000"
                            value={editForm.customMaxPoints}
                            onChange={(e) => setEditForm({ ...editForm, customMaxPoints: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                            placeholder={`Default: ${globalMaxPoints} points`}
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                            points
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Leave blank to inherit the global web limitation ({globalMaxPoints} points).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Profile & Role Configuration */}
                  <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" /> Account Profile &amp; Role
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Organization
                        </label>
                        <input
                          type="text"
                          value={editForm.organization}
                          onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="e.g. Apex Survey Bureau"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Surveyor Role
                        </label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="Surveyor">Surveyor</option>
                          <option value="Senior Surveyor">Senior Surveyor</option>
                          <option value="Cadastral Lead">Cadastral Lead</option>
                          <option value="Civil Engineer">Civil Engineer</option>
                          <option value="GIS Specialist">GIS Specialist</option>
                          <option value="ADMIN">Administrator</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Reset Password (optional)
                      </label>
                      <input
                        type="password"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Leave blank to keep unchanged"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Individual Permissions
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
      <FileViewer file={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}