"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Download,
  Activity,
  Settings,
  Shield,
  Plus,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  LogOut,
  FileSpreadsheet,
  Globe,
  Lock,
  Layers,
  Sparkles,
  Server,
  Compass,
  ShieldCheck,
  Eye,
  BarChart3,
  HardDrive,
  Clock,
  Filter,
  Files,
  FileDown,
  FileUp,
  Loader2,
} from "lucide-react";
import SurveyorDetailModal from "@/components/admin/SurveyorDetailModal";
import FileViewer, { type ViewerFile } from "@/components/admin/FileViewer";

interface UserItem {
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

interface DownloadItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  assetType: string;
  fileName: string;
  version: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
}

interface ConversionItem {
  id: string;
  userEmail?: string | null;
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

interface UserActivityItem {
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

interface AdminFileItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  direction: "import" | "export";
  fileName: string;
  fileSize: number;
  size: string;
  pointsCount: number | null;
  crs: string | null;
  platform: "web_app" | "windows_app";
  hasContent: boolean;
  timestamp: string;
  downloadUrl: string;
}

const FILE_PAGE = 50;

interface AppSettings {
  appVersion: string;
  installerFileName: string;
  installerFileSize: string;
  requireAuthForDownload: boolean;
  maintenanceMode: boolean;
  announcementBanner: string;
  announcementActive: boolean;
  webAppRestricted: boolean;
  webMaxPoints: number;
  webWatermarkKml: boolean;
  webDisableReports: boolean;
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Share of a total as a bar width: nothing shows as an empty bar. */
function barWidth(n: number, total: number) {
  return `${total > 0 && n > 0 ? Math.max(4, Math.min(100, (n / total) * 100)) : 0}%`;
}

/** Page buttons under a long table */
function Pager({
  page,
  total,
  size,
  onPage,
  noun,
}: {
  page: number;
  total: number;
  size: number;
  onPage: (p: number) => void;
  noun: string;
}) {
  if (total <= size) return null;
  const pages = Math.ceil(total / size);
  const from = page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  const btn =
    "px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default";
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
      <span>
        {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()} {noun}
      </span>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page === 0} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="tabular-nums">
          {page + 1} / {pages}
        </span>
        <button className={btn} disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

const ASSET_NAME: Record<string, string> = {
  windows_installer: "Windows installer",
  sample_csv: "Sample CSV",
  test_kml: "Test KML",
  web_app: "Web app",
};

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "activities" | "downloads" | "files" | "conversions" | "settings"
  >("overview");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Individual person detail modal state
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Login form state

  // Stats
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalDownloads: number;
    totalConversions: number;
    totalActivities?: number;
    totalPointsProcessed?: number;
    totalPointsKept?: number;
    totalFilesStored?: number;
    totalFilesWithCopy?: number;
    totalStorageBytes?: number;
    roleCounts: Record<string, number>;
    assetCounts: Record<string, number>;
    locationCounts?: Record<string, number>;
    settings: AppSettings;
    recentUsers: UserItem[];
    recentDownloads: DownloadItem[];
    recentConversions: ConversionItem[];
    recentActivities?: UserActivityItem[];
  } | null>(null);

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    organization: "",
    role: "Surveyor",
    password: "",
    hasFullAccess: false,
    customMaxPoints: "",
  });

  // App activities telemetry state
  const [allActivities, setAllActivities] = useState<UserActivityItem[]>([]);
  const [activityFilter, setActivityFilter] = useState("all");
  const [activitySearch, setActivitySearch] = useState("");
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [actPage, setActPage] = useState(0);

  // Downloads state
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [downloadFilter, setDownloadFilter] = useState("all");

  // Conversions state
  const [conversions, setConversions] = useState<ConversionItem[]>([]);
  const [conversionsTotal, setConversionsTotal] = useState(0);
  const [convSearch, setConvSearch] = useState("");
  const [convPage, setConvPage] = useState(0);
  const [convLimit, setConvLimit] = useState(1000);

  // Files state: searched and paged on the server
  const [files, setFiles] = useState<AdminFileItem[]>([]);
  const [filesTotal, setFilesTotal] = useState(0);
  const [filesBytes, setFilesBytes] = useState(0);
  const [fileSearch, setFileSearch] = useState("");
  const [fileDir, setFileDir] = useState<"all" | "import" | "export">("all");
  const [filePage, setFilePage] = useState(0);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileDeleting, setFileDeleting] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ViewerFile | null>(null);

  // Settings state
  const [settingsForm, setSettingsForm] = useState<AppSettings>({
    appVersion: "v3.5.7",
    installerFileName: "ExcelToKMLPro-Lite-Setup.exe",
    installerFileSize: "3.2 MB",
    requireAuthForDownload: true,
    maintenanceMode: false,
    announcementBanner: "",
    announcementActive: false,
    webAppRestricted: true,
    webMaxPoints: 50,
    webWatermarkKml: true,
    webDisableReports: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Toast notice
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const formatLocationDisplay = (locStr?: string | null): { text: string; flag: string } => {
    if (!locStr || locStr === "Localhost (Dev)" || locStr === "127.0.0.1" || locStr === "Localhost") {
      return { text: "Localhost (Dev)", flag: "💻" };
    }

    const trimmed = locStr.trim();

    // If it's a 2-letter country code like "PK", "AE", "US", etc.
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
        const name = regionNames.of(code) || code;
        return { text: name, flag };
      } catch {
        return { text: code, flag };
      }
    }

    // Flag icons based on location text
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

  const getStoredToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("surveyor_session") || localStorage.getItem("surveyor_auth_token") || "";
  };

  const adminFetch = useCallback((url: string, options: RequestInit = {}) => {
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
  }, []);

  // Check Admin session
  const verifyAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/auth");
      if (res.ok) {
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdminAuthenticated(true);
          setAdminUser(data.user);
          loadDashboardData();
          return;
        }
      }
      setIsAdminAuthenticated(false);
      window.location.replace("/");
    } catch {
      setIsAdminAuthenticated(false);
      window.location.replace("/");
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      // Load stats
      const statsRes = await adminFetch("/api/admin/stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        if (data.stats.settings) {
          setSettingsForm(data.stats.settings);
        }
      }

      // Load users
      loadUsers();

      // Load activities
      loadActivities();

      // Load downloads
      const dlRes = await adminFetch("/api/admin/downloads");
      if (dlRes.ok) {
        const data = await dlRes.json();
        setDownloads(data.downloads || []);
      }

      // Load conversions
      const convRes = await adminFetch(`/api/admin/conversions?limit=${convLimit}`);
      if (convRes.ok) {
        const data = await convRes.json();
        setConversions(data.conversions || []);
        setConversionsTotal(data.total ?? (data.conversions || []).length);
      }
    } catch (err) {
      console.error("Dashboard data load error", err);
    }
  };

  const loadFiles = useCallback(
    async (q: string, dir: string, page: number) => {
      setFilesLoading(true);
      try {
        const qs = new URLSearchParams({ q, direction: dir, page: String(page), size: String(FILE_PAGE) });
        const res = await adminFetch(`/api/admin/files?${qs}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setFiles(data.files || []);
        setFilesTotal(data.total ?? 0);
        setFilesBytes(data.bytes ?? 0);
      } catch {
        showToast("Couldn't load the files", "error");
      } finally {
        setFilesLoading(false);
      }
    },
    [adminFetch]
  );

  // search after typing stops, and whenever the filter or page changes
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    const t = setTimeout(() => loadFiles(fileSearch, fileDir, filePage), fileSearch ? 300 : 0);
    return () => clearTimeout(t);
  }, [isAdminAuthenticated, fileSearch, fileDir, filePage, loadFiles]);

  const deleteAdminFile = async (f: AdminFileItem) => {
    if (!window.confirm(`Delete “${f.fileName}” from ${f.userEmail || "this account"}? Its points go with it. This can't be undone.`)) return;
    setFileDeleting(f.id);
    try {
      const res = await adminFetch(`/api/admin/files?id=${encodeURIComponent(f.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(`Deleted ${f.fileName}`);
      loadFiles(fileSearch, fileDir, filePage);
    } catch {
      showToast(`Couldn't delete ${f.fileName}`, "error");
    } finally {
      setFileDeleting(null);
    }
  };

  const loadUsers = async (query = "") => {
    setUsersLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } finally {
      setUsersLoading(false);
    }
  };

  const loadActivities = async () => {
    setActivitiesLoading(true);
    try {
      const res = await adminFetch("/api/admin/activities?limit=200");
      if (res.ok) {
        const data = await res.json();
        setAllActivities(data.activities || []);
      }
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await adminFetch("/api/admin/auth", { method: "DELETE" });
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem("surveyor_session");
      localStorage.removeItem("surveyor_auth_token");
    } catch {
      // ignore
    }
    window.location.replace("/");
  };

  // User CRUD
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        name: userForm.name,
        email: userForm.email,
        organization: userForm.organization,
        role: userForm.role,
        hasFullAccess: userForm.hasFullAccess,
        customMaxPoints: userForm.customMaxPoints ? parseInt(userForm.customMaxPoints, 10) : null,
      };
      if (userForm.password) payload.password = userForm.password;

      if (editingUser) {
        // Update user
        const res = await adminFetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update user");
        showToast("User updated successfully");
      } else {
        // Create user
        const res = await adminFetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create user");
        showToast("New surveyor user created");
      }
      setUserModalOpen(false);
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        organization: "",
        role: "Surveyor",
        password: "",
        hasFullAccess: false,
        customMaxPoints: "",
      });
      loadUsers(userSearch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving user";
      showToast(msg, "error");
    }
  };

  const handleToggleUserFullAccess = async (userId: string, grant: boolean) => {
    try {
      const res = await adminFetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasFullAccess: grant }),
      });
      if (res.ok) {
        showToast(grant ? "Granted full web access to surveyor" : "Applied web demo point limits to surveyor");
        loadUsers(userSearch);
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update access", "error");
      }
    } catch {
      showToast("Network error updating access", "error");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      showToast("User deleted successfully");
      loadUsers(userSearch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting user";
      showToast(msg, "error");
    }
  };

  // Delete single download log
  const handleDeleteDownload = async (id: string) => {
    if (!confirm("Delete this download log entry?")) return;
    try {
      const res = await adminFetch(`/api/admin/downloads?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDownloads((prev) => prev.filter((d) => d.id !== id));
        showToast("Download log entry removed");
      }
    } catch {
      showToast("Failed to remove log entry", "error");
    }
  };

  // Clear all download logs
  const handleClearDownloads = async () => {
    if (!confirm("Are you sure you want to clear ALL download logs?")) return;
    try {
      const res = await adminFetch("/api/admin/downloads", { method: "DELETE" });
      if (res.ok) {
        setDownloads([]);
        showToast("All download logs cleared");
      }
    } catch {
      showToast("Failed to clear logs", "error");
    }
  };

  // Clear all application activities
  const handleClearActivities = async () => {
    if (!confirm("Clear the whole activity log for every surveyor? This cannot be undone.")) return;
    try {
      const res = await adminFetch("/api/admin/activities", { method: "DELETE" });
      if (res.ok) {
        setAllActivities([]);
        showToast("Activity log cleared");
        loadDashboardData();
      }
    } catch {
      showToast("Could not clear the activity log", "error");
    }
  };

  // Clear conversions
  const loadConversions = async (limit: number) => {
    try {
      const res = await adminFetch(`/api/admin/conversions?limit=${limit}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConversions(data.conversions || []);
      setConversionsTotal(data.total ?? (data.conversions || []).length);
      setConvLimit(limit);
    } catch {
      showToast("Couldn't load more points", "error");
    }
  };

  const exportConversionsCsv = () => {
    const q = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = ["SAVED", "SURVEYOR", "FILE", "STATION", "CODE", "GRID", "EASTING", "NORTHING", "ELEVATION", "LATITUDE", "LONGITUDE"];
    const rows = filteredConversions.map((c) =>
      [c.timestamp, c.userEmail, c.fileName, c.station, c.featureCode, c.coordSystem, c.easting, c.northing, c.elevation, c.lat, c.lon]
        .map(q)
        .join(",")
    );
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + [head.join(","), ...rows].join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "Converted points.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleClearConversions = async () => {
    if (!confirm("Delete every converted point for every surveyor? The files stay. This cannot be undone.")) return;
    try {
      const res = await adminFetch("/api/admin/conversions", { method: "DELETE" });
      if (res.ok) {
        setConversions([]);
        showToast("Conversion history cleared");
      }
    } catch {
      showToast("Failed to clear conversions", "error");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      showToast("System settings updated & applied!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating settings";
      showToast(msg, "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Verifying Administrator Privileges...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ADMIN LOGIN VIEW
  // --------------------------------------------------------------------------
  // The server only serves this page to a signed-in admin; if the session
  // ends while it's open, leave quietly for the home page.
  if (!isAdminAuthenticated) return null;

  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD VIEW
  // --------------------------------------------------------------------------
  const filteredDownloads =
    downloadFilter === "all" ? downloads : downloads.filter((d) => d.assetType === downloadFilter);

  const filteredActivities = allActivities.filter((act) => {
    const matchesAction = activityFilter === "all" || act.action === activityFilter;
    if (!matchesAction) return false;
    if (!activitySearch.trim()) return true;
    const q = activitySearch.toLowerCase();
    return (
      (act.userName && act.userName.toLowerCase().includes(q)) ||
      (act.userEmail && act.userEmail.toLowerCase().includes(q)) ||
      (act.title && act.title.toLowerCase().includes(q)) ||
      (act.fileName && act.fileName.toLowerCase().includes(q)) ||
      (act.crs && act.crs.toLowerCase().includes(q))
    );
  });
  const filteredConversions = convSearch.trim()
    ? conversions.filter((c) =>
        [c.userEmail, c.fileName, c.station, c.featureCode, c.coordSystem]
          .join(" ")
          .toLowerCase()
          .includes(convSearch.trim().toLowerCase())
      )
    : conversions;
  const CONV_PAGE = 100;
  const convPageNow = Math.min(convPage, Math.max(0, Math.ceil(filteredConversions.length / CONV_PAGE) - 1));
  const pagedConversions = filteredConversions.slice(convPageNow * CONV_PAGE, (convPageNow + 1) * CONV_PAGE);
  const ACT_PAGE = 50;
  const actPageNow = Math.min(actPage, Math.max(0, Math.ceil(filteredActivities.length / ACT_PAGE) - 1));
  const pagedActivities = filteredActivities.slice(actPageNow * ACT_PAGE, (actPageNow + 1) * ACT_PAGE);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30">
      {/* Toast alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold animate-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
              : "bg-rose-950/90 text-rose-200 border-rose-500/30"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/30">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-extrabold text-[15px] tracking-tight text-white">Excel to KML Pro</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Admin
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400">Surveyors, their files and points, downloads and settings</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">{adminUser?.name || "Admin"}</span>
            <span className="text-slate-500">({adminUser?.email})</span>
          </div>

          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">View site</span>
          </Link>

          <button
            onClick={handleAdminLogout}
            className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Admin sections"
          className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Surveyors", icon: Users, count: users.length },
            { id: "activities", label: "Activity", icon: Activity, count: allActivities.length },
            { id: "downloads", label: "Downloads", icon: Download, count: downloads.length },
            { id: "files", label: "Files", icon: Files, count: filesTotal && !fileSearch && fileDir === "all" ? filesTotal : stats?.totalFilesStored },
            { id: "conversions", label: "Points", icon: Globe, count: conversionsTotal },
            { id: "settings", label: "Settings", icon: Settings },
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
                className={`flex-1 min-w-max flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-px rounded-md text-[11px] font-mono ${
                      active ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================================================================== */}
        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {/* ================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stat Cards (5 metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Surveyors</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{stats?.totalUsers ?? users.length}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Registered accounts</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Downloads</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{stats?.totalDownloads ?? downloads.length}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Installer and sample files</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Points Kept</span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-cyan-400 font-mono">
                    {(stats?.totalPointsKept ?? conversionsTotal).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Converted points in saved files</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Activity</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">
                    {(stats?.totalActivities ?? allActivities.length) || conversions.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Conversions, saves and opens logged</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Files Stored</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{(stats?.totalFilesStored ?? 0).toLocaleString()}</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {fmtBytes(stats?.totalStorageBytes ?? 0)} kept in {(stats?.totalFilesWithCopy ?? 0).toLocaleString()} copies
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Live Telemetry Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Distribution */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" /> Downloads by file
                  </h3>
                  <span className="text-xs text-slate-500">All-time downloads</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">Windows Lite Setup (.exe)</span>
                      <span className="text-blue-400">
                        {stats?.assetCounts?.windows_installer ?? 0} downloads
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: barWidth(stats?.assetCounts?.windows_installer ?? 0, downloads.length),
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">Sample Survey Benchmarks (.csv)</span>
                      <span className="text-indigo-400">{stats?.assetCounts?.sample_csv ?? 0} downloads</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: barWidth(stats?.assetCounts?.sample_csv ?? 0, downloads.length),
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">Dubai DLTM Test (.kml)</span>
                      <span className="text-emerald-400">{stats?.assetCounts?.test_kml ?? 0} downloads</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: barWidth(stats?.assetCounts?.test_kml ?? 0, downloads.length),
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2.5">
                  <a
                    href="/api/admin/downloads?format=csv"
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                  </a>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" /> All Surveyors ({users.length})
                  </button>
                </div>
              </div>

              {/* Live Application Telemetry Feed (Desktop & Web App) */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" /> Latest activity
                    </h3>
                    <p className="text-xs text-slate-400">
                      Conversions, saved files and opened files, newest first
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("activities")}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Log ({allActivities.length})</span> &rarr;
                  </button>
                </div>

                <div className="space-y-2.5">
                  {allActivities.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 text-xs bg-slate-800/30 rounded-2xl border border-slate-800">
                      No activity yet. Conversions and saved files show up here.
                    </div>
                  ) : (
                    allActivities.slice(0, 5).map((act) => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800/80 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/20 shrink-0">
                            {act.action.replace("_", " ")}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-md">
                              {act.title}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              {act.userId ? (
                                <button
                                  onClick={() => {
                                    setDetailUserId(act.userId);
                                    setDetailModalOpen(true);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 font-semibold underline decoration-dotted cursor-pointer"
                                >
                                  {act.userName || act.userEmail || "Surveyor"}
                                </button>
                              ) : (
                                <span className="text-slate-400">{act.userName || act.userEmail || "Anonymous"}</span>
                              )}
                              {act.pointsCount !== undefined && (
                                <span className="text-cyan-400 font-mono">• {act.pointsCount} points</span>
                              )}
                              {act.crs && <span className="text-amber-400 truncate max-w-[120px]">• {act.crs}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{act.ipAddress || "127.0.0.1"}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Geographic Distribution & Origin Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Locations Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" /> Where downloads come from
                  </h3>
                  <span className="text-xs text-slate-500">Top user locations</span>
                </div>

                <div className="space-y-3">
                  {stats?.locationCounts && Object.keys(stats.locationCounts).length > 0 ? (
                    Object.entries(stats.locationCounts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([locKey, count]) => {
                        const total = stats.totalDownloads || 1;
                        const pct = Math.round((count / total) * 100);
                        const loc = formatLocationDisplay(locKey);
                        return (
                          <div key={locKey} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className="text-sm shrink-0">{loc.flag}</span>
                                <span>{loc.text}</span>
                              </span>
                              <span className="text-emerald-400 font-mono">
                                {count} {count === 1 ? "event" : "events"} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.max(8, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">No location events recorded yet</p>
                  )}
                </div>
              </div>

              {/* Recent Real-time Activity Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-400" /> Latest downloads
                  </h3>
                  <button
                    onClick={() => setActiveTab("downloads")}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="space-y-2.5">
                  {downloads.slice(0, 4).map((dl) => {
                    const loc = formatLocationDisplay(dl.location);
                    return (
                      <div
                        key={dl.id}
                        className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                            <Download className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-[150px]">
                              {dl.userName || dl.userEmail || "Anonymous"}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <span className="text-xs shrink-0">{loc.flag}</span>
                              <span className="truncate max-w-[130px]">{loc.text}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 block mb-1">
                            {dl.ipAddress || "127.0.0.1"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(dl.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: USERS MANAGEMENT (WITH INDIVIDUAL PERSON DETAILS TRIGGER) */}
        {/* ================================================================== */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, role..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    loadUsers(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => loadUsers(userSearch)}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Refresh users"
                >
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setUserForm({
                      name: "",
                      email: "",
                      organization: "",
                      role: "Surveyor",
                      password: "",
                      hasFullAccess: false,
                      customMaxPoints: "",
                    });
                    setUserModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Surveyor
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/60 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Surveyor</th>
                      <th className="px-4 py-3.5">Organization</th>
                      <th className="px-4 py-3.5 hidden xl:table-cell">Signed up from</th>
                      <th className="px-4 py-3.5">Web access</th>
                      <th className="px-4 py-3.5 text-right">Downloads</th>
                      <th className="px-4 py-3.5 hidden md:table-cell">Joined</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                          No users found matching query
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <button
                                onClick={() => {
                                  setDetailUserId(u.id);
                                  setDetailModalOpen(true);
                                }}
                                className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-md hover:scale-105 transition-transform cursor-pointer shrink-0"
                                title="Open this surveyor"
                              >
                                {u.name.charAt(0)}
                              </button>
                              <div className="min-w-0">
                                <button
                                  onClick={() => {
                                    setDetailUserId(u.id);
                                    setDetailModalOpen(true);
                                  }}
                                  className="font-bold text-white hover:text-blue-400 flex items-center gap-2 transition-colors text-left cursor-pointer"
                                >
                                  <span>{u.name}</span>
                                  {u.role === "ADMIN" && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                      Admin
                                    </span>
                                  )}
                                </button>
                                <div className="text-xs text-slate-400 truncate max-w-[240px]">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div className="text-slate-200 max-w-[200px] truncate" title={u.organization || ""}>
                              {u.organization || "—"}
                            </div>
                            <div className="text-slate-500 max-w-[200px] truncate">{u.role}</div>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            {(() => {
                              const loc = formatLocationDisplay(u.location);
                              return (
                                <div className="flex flex-col gap-0.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-200">
                                    <span className="shrink-0">{loc.flag}</span>
                                    <span className="truncate max-w-[160px]">{loc.text}</span>
                                  </div>
                                  <span className="font-mono text-[11px] text-slate-500">{u.ipAddress || "—"}</span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            {u.hasFullAccess || u.role === "ADMIN" ? (
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Full access
                                </span>
                                {u.role !== "ADMIN" && (
                                  <button
                                    onClick={() => handleToggleUserFullAccess(u.id, false)}
                                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 border border-slate-700 transition-colors cursor-pointer"
                                    title="Apply the web point limit"
                                  >
                                    Restrict
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <Lock className="w-3.5 h-3.5" /> Demo · {u.customMaxPoints || settingsForm.webMaxPoints || 50} pts
                                </span>
                                <button
                                  onClick={() => handleToggleUserFullAccess(u.id, true)}
                                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-slate-700 transition-colors cursor-pointer"
                                  title="Grant full web access"
                                >
                                  Grant full
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-blue-400 text-right">{u.downloadCount}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap hidden md:table-cell">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              {/* Deep-dive individual person details */}
                              <button
                                onClick={() => {
                                  setDetailUserId(u.id);
                                  setDetailModalOpen(true);
                                }}
                                className="p-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/20 cursor-pointer"
                                title="Open this surveyor's files, points and activity"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setUserForm({
                                    name: u.name,
                                    email: u.email,
                                    organization: u.organization || "",
                                    role: u.role || "Surveyor",
                                    password: "",
                                    hasFullAccess: Boolean(u.hasFullAccess),
                                    customMaxPoints: u.customMaxPoints ? String(u.customMaxPoints) : "",
                                  });
                                  setUserModalOpen(true);
                                }}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Edit user"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {u.email !== "admin@exceltokml.com" && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: APP ACTIVITY & TELEMETRY (GLOBAL APPLICATION LOG) */}
        {/* ================================================================== */}
        {activeTab === "activities" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "all", label: "All" },
                  { id: "conversion", label: "Conversions" },
                  { id: "export", label: "Exports" },
                  { id: "file_upload", label: "File Uploads" },
                  { id: "batch_process", label: "Batch Process" },
                  { id: "photos_attached", label: "Photos Attached" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivityFilter(item.id);
                      setActPage(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activityFilter === item.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search file, surveyor, CRS..."
                    value={activitySearch}
                    onChange={(e) => {
                      setActivitySearch(e.target.value);
                      setActPage(0);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={loadActivities}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Refresh activity logs"
                >
                  <RefreshCw className={`w-4 h-4 ${activitiesLoading ? "animate-spin" : ""}`} />
                </button>

                <button
                  onClick={handleClearActivities}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All Logs
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">When</th>
                      <th className="px-4 py-3.5">Surveyor</th>
                      <th className="px-4 py-3.5">Action</th>
                      <th className="px-4 py-3.5">What</th>
                      <th className="px-4 py-3.5 text-right">Points</th>
                      <th className="px-4 py-3.5 hidden lg:table-cell">Grid</th>
                      <th className="px-4 py-3.5">Format</th>
                      <th className="px-4 py-3.5 hidden 2xl:table-cell">IP address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredActivities.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                          No activity matches
                        </td>
                      </tr>
                    ) : (
                      pagedActivities.map((act) => (
                        <tr key={act.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                            {new Date(act.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {act.userId ? (
                              <button
                                onClick={() => {
                                  setDetailUserId(act.userId);
                                  setDetailModalOpen(true);
                                }}
                                className="font-bold text-white hover:text-blue-400 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="underline decoration-dotted">{act.userName || "Surveyor"}</span>
                                <Eye className="w-3 h-3 text-blue-400" />
                              </button>
                            ) : (
                              <span className="text-slate-400">{act.userName || act.userEmail || "Anonymous"}</span>
                            )}
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{act.userEmail || "—"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                              {act.action.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white max-w-[220px] truncate" title={act.title}>
                              {act.title}
                            </div>
                            {act.fileName && (
                              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 whitespace-nowrap">
                                <span className="truncate max-w-[170px]">{act.fileName}</span>
                                {act.fileSize && <span className="text-slate-500">({act.fileSize})</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {act.pointsCount !== undefined && act.pointsCount !== null ? (
                              <span className="font-mono font-bold text-cyan-400">
                                {act.pointsCount.toLocaleString()} pts
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {act.crs ? (
                              <span className="block max-w-[190px] truncate text-[11px] text-amber-300" title={act.crs}>
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
                          <td className="px-4 py-3 font-mono text-slate-500 hidden 2xl:table-cell">
                            {act.ipAddress || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pager page={actPageNow} total={filteredActivities.length} size={ACT_PAGE} onPage={setActPage} noun="entries" />
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: DOWNLOAD AUDIT TRAIL */}
        {/* ================================================================== */}
        {activeTab === "downloads" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                {["all", "windows_installer", "sample_csv", "test_kml"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setDownloadFilter(type)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      downloadFilter === type
                        ? "bg-blue-600 text-white"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {type === "all" ? "All Assets" : type.replace("_", " ").toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/api/admin/downloads?format=csv"
                  className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold transition-colors flex items-center gap-2 border border-emerald-500/30"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </a>
                <button
                  onClick={handleClearDownloads}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs font-bold transition-colors flex items-center gap-2 border border-rose-500/30 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Clear All Logs
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/60 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Surveyor</th>
                      <th className="px-6 py-4">Asset Type</th>
                      <th className="px-6 py-4">Download IP &amp; Origin</th>
                      <th className="px-6 py-4">File Name</th>
                      <th className="px-6 py-4">Version</th>
                      <th className="px-6 py-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDownloads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          No download records logged yet
                        </td>
                      </tr>
                    ) : (
                      filteredDownloads.map((dl) => (
                        <tr key={dl.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(dl.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {dl.userId ? (
                              <button
                                onClick={() => {
                                  setDetailUserId(dl.userId);
                                  setDetailModalOpen(true);
                                }}
                                className="font-bold text-white hover:text-blue-400 text-xs text-left flex items-center gap-1 cursor-pointer"
                              >
                                <span>{dl.userName || dl.userEmail || "Verified Surveyor"}</span>
                                <Eye className="w-3 h-3 text-blue-400" />
                              </button>
                            ) : (
                              <div className="font-bold text-white text-xs">{dl.userName || "Verified Surveyor"}</div>
                            )}
                            <div className="text-[11px] text-slate-500">{dl.userEmail || "anonymous"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {ASSET_NAME[dl.assetType] || dl.assetType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const loc = formatLocationDisplay(dl.location);
                              return (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 text-xs text-white font-medium">
                                    <span className="text-sm shrink-0">{loc.flag}</span>
                                    <span className="truncate max-w-[180px]">{loc.text}</span>
                                  </div>
                                  <div>
                                    <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                      {dl.ipAddress || "127.0.0.1"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-300">{dl.fileName}</td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-400">{dl.version}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteDownload(dl.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: CONVERSIONS AUDIT */}
        {/* ================================================================== */}
        {activeTab === "files" && (
          <div className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">All files</h3>
                <p className="text-xs text-slate-400">
                  Every file surveyors opened or saved while signed in, newest first.{" "}
                  {filesTotal.toLocaleString()} {fileSearch || fileDir !== "all" ? "match" : "files"} · {fmtBytes(filesBytes)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={fileSearch}
                    onChange={(e) => {
                      setFileSearch(e.target.value);
                      setFilePage(0);
                    }}
                    placeholder="File, surveyor or grid"
                    aria-label="Search files"
                    className="w-64 max-w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div role="group" aria-label="Show" className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  {(["all", "import", "export"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setFileDir(d);
                        setFilePage(0);
                      }}
                      aria-pressed={fileDir === d}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        fileDir === d ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {d === "all" ? "All" : d === "import" ? "Opened" : "Saved"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => loadFiles(fileSearch, fileDir, filePage)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  aria-label="Refresh files"
                >
                  <RefreshCw className={`w-4 h-4 ${filesLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">File</th>
                      <th className="px-4 py-3.5">Surveyor</th>
                      <th className="px-4 py-3.5 hidden md:table-cell">Kind</th>
                      <th className="px-4 py-3.5 text-right hidden sm:table-cell">Size</th>
                      <th className="px-4 py-3.5 text-right hidden lg:table-cell">Points</th>
                      <th className="px-4 py-3.5 hidden xl:table-cell">Grid</th>
                      <th className="px-4 py-3.5 hidden lg:table-cell">When</th>
                      <th className="px-4 py-3.5 text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {files.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                          {filesLoading ? "Loading…" : fileSearch || fileDir !== "all" ? "No files match" : "No files kept yet"}
                        </td>
                      </tr>
                    ) : (
                      files.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="block max-w-[140px] sm:max-w-[260px] truncate font-semibold text-white" title={f.fileName}>
                              {f.fileName}
                            </span>
                            <span className="text-[11px] text-slate-500 md:hidden">
                              {f.direction === "export" ? "Saved" : "Opened"} · {f.size}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            {f.userId ? (
                              <button
                                onClick={() => {
                                  setDetailUserId(f.userId);
                                  setDetailModalOpen(true);
                                }}
                                className="block max-w-[110px] sm:max-w-[200px] truncate text-left text-blue-400 hover:text-blue-300 cursor-pointer"
                                title={f.userEmail || ""}
                              >
                                {f.userName || f.userEmail || "—"}
                              </button>
                            ) : (
                              <span className="text-slate-400">{f.userEmail || "—"}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                f.direction === "export" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                              }`}
                            >
                              {f.direction === "export" ? <FileDown className="w-3 h-3" /> : <FileUp className="w-3 h-3" />}
                              {f.direction === "export" ? "Saved" : "Opened"}
                            </span>
                            <span className="ml-2 text-[11px] text-slate-500">{f.platform === "web_app" ? "Web" : "Windows"}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-300 hidden sm:table-cell whitespace-nowrap">{f.size}</td>
                          <td className="px-4 py-2.5 text-right text-slate-300 hidden lg:table-cell">
                            {f.pointsCount != null ? f.pointsCount.toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-2.5 hidden xl:table-cell">
                            <span className="block max-w-[180px] truncate text-slate-400" title={f.crs || ""}>
                              {f.crs || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 hidden lg:table-cell whitespace-nowrap">
                            {new Date(f.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-2">
                              {f.hasContent && (
                                <button
                                  onClick={() => setViewing({ fileName: f.fileName, url: f.downloadUrl, size: f.size })}
                                  aria-label={`View ${f.fileName}`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white whitespace-nowrap cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" aria-hidden />
                                  <span className="sr-only sm:not-sr-only">View</span>
                                </button>
                              )}
                              {f.hasContent ? (
                                <a
                                  href={f.downloadUrl}
                                  download
                                  aria-label={`Download ${f.fileName}`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-white whitespace-nowrap"
                                >
                                  <Download className="w-3.5 h-3.5" aria-hidden />
                                  <span className="sr-only sm:not-sr-only">Download</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-500 whitespace-nowrap" title="The file was too big to keep; only its name and size are recorded">
                                  Details only
                                </span>
                              )}
                              <button
                                onClick={() => deleteAdminFile(f)}
                                disabled={fileDeleting === f.id}
                                aria-label={`Delete ${f.fileName}`}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50"
                              >
                                {fileDeleting === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pager page={filePage} total={filesTotal} size={FILE_PAGE} onPage={setFilePage} noun="files" />
            </div>
          </div>
        )}

        {activeTab === "conversions" && (
          <div className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Converted points</h3>
                <p className="text-xs text-slate-400">
                  Every point in the files surveyors saved while signed in, newest first.{" "}
                  {conversions.length < conversionsTotal
                    ? `Showing the newest ${conversions.length.toLocaleString()} of ${conversionsTotal.toLocaleString()}.`
                    : `${conversionsTotal.toLocaleString()} points.`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={convSearch}
                    onChange={(e) => {
                      setConvSearch(e.target.value);
                      setConvPage(0);
                    }}
                    placeholder="Surveyor, file, station, code or grid"
                    className="w-64 max-w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {conversions.length < conversionsTotal && (
                  <button
                    onClick={() => loadConversions(Math.min(5000, convLimit + 1000))}
                    disabled={convLimit >= 5000}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Load 1,000 more
                  </button>
                )}
                <button
                  onClick={exportConversionsCsv}
                  disabled={!filteredConversions.length}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 text-xs font-bold transition-colors flex items-center gap-2 border border-emerald-500/30 cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
                <button
                  onClick={handleClearConversions}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/15 text-rose-400 hover:bg-rose-600/25 text-xs font-bold transition-colors flex items-center gap-2 border border-rose-500/30 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Clear all
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 hidden 2xl:table-cell">Saved</th>
                      <th className="px-4 py-3.5">Surveyor</th>
                      <th className="px-4 py-3.5">File</th>
                      <th className="px-4 py-3.5">Station</th>
                      <th className="px-4 py-3.5 hidden xl:table-cell">Code</th>
                      <th className="px-4 py-3.5 hidden lg:table-cell">Grid</th>
                      <th className="px-4 py-3.5 text-right">Easting</th>
                      <th className="px-4 py-3.5 text-right">Northing</th>
                      <th className="px-4 py-3.5 text-right hidden xl:table-cell">Elevation</th>
                      <th className="px-4 py-3.5 text-right">Latitude</th>
                      <th className="px-4 py-3.5 text-right">Longitude</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredConversions.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-12 text-center text-slate-500 font-sans">
                          {conversions.length ? "No points match" : "No converted points yet"}
                        </td>
                      </tr>
                    ) : (
                      pagedConversions.map((conv) => {
                        const noGrid = !conv.easting && !conv.northing;
                        return (
                          <tr key={conv.id} className="hover:bg-slate-800/30 transition-colors whitespace-nowrap">
                            <td className="px-4 py-2.5 text-slate-400 font-sans hidden 2xl:table-cell">{new Date(conv.timestamp).toLocaleString()}</td>
                            <td className="px-4 py-2.5 font-sans">
                              <span className="block max-w-[180px] truncate text-slate-200" title={conv.userEmail || ""}>
                                {conv.userEmail || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="block max-w-[160px] truncate text-slate-300" title={conv.fileName || ""}>
                                {conv.fileName || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-white">{conv.station}</td>
                            <td className="px-4 py-2.5 text-slate-300 hidden xl:table-cell">{conv.featureCode || "—"}</td>
                            <td className="px-4 py-2.5 hidden lg:table-cell font-sans">
                              <span className="block max-w-[170px] truncate text-blue-400" title={conv.coordSystem}>
                                {conv.coordSystem}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{noGrid ? "—" : conv.easting.toFixed(3)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{noGrid ? "—" : conv.northing.toFixed(3)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300 hidden xl:table-cell">{conv.elevation.toFixed(3)}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-400">{Number(conv.lat).toFixed(7)}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-400">{Number(conv.lon).toFixed(7)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <Pager page={convPageNow} total={filteredConversions.length} size={CONV_PAGE} onPage={setConvPage} noun="points" />
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 6: SETTINGS & RELEASE MANAGEMENT */}
        {/* ================================================================== */}
        {activeTab === "settings" && (
          <div className="max-w-3xl w-full mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl">
              <div className="mb-6 pb-6 border-b border-slate-800 flex items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-400" /> Settings
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    The release shown on the site, who may download, maintenance, and the web app&apos;s limits
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Whole site
                </span>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Application Version */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Current version
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.appVersion}
                      onChange={(e) => setSettingsForm({ ...settingsForm, appVersion: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="v3.5.7"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Installer file
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.installerFileName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, installerFileName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Installer size
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.installerFileSize}
                      onChange={(e) => setSettingsForm({ ...settingsForm, installerFileSize: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="3.2 MB"
                    />
                  </div>
                </div>

                <p className="-mt-3 text-xs text-slate-500">
                  Shown on the download section until the latest GitHub release loads (GitHub&apos;s details win when
                  it answers). The installer file name is also used for the download link.
                </p>

                {/* Gate & Maintenance Mode */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <div>
                      <div className="font-bold text-sm text-white">Require Surveyor Login to Download</div>
                      <div className="text-xs text-slate-400">
                        On: visitors sign in or register before the Windows download starts. Off: the download starts straight away.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.requireAuthForDownload}
                        onChange={(e) => setSettingsForm({ ...settingsForm, requireAuthForDownload: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <div>
                      <div className="font-bold text-sm text-white">Maintenance Mode</div>
                      <div className="text-xs text-slate-400">Pauses the web app for everyone except admins and shows a maintenance notice on the site. The Windows app is not affected.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.maintenanceMode}
                        onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>

                {/* Web App Demo Restrictions Card */}
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-amber-500/20 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-700/60">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Web App Demo Restrictions &amp; Point Limits
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Drive Desktop Downloads
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Limit web features so users are prompted to download the full offline Windows Desktop Edition
                      </p>
                    </div>
                  </div>

                  {/* Master Web Restriction Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/80 border border-slate-700/70">
                    <div>
                      <div className="font-bold text-xs text-white">Enforce Web App Demo Mode</div>
                      <div className="text-[11px] text-slate-400">
                        When enabled, visitors &amp; standard surveyors cannot bulk convert without downloading desktop app.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.webAppRestricted}
                        onChange={(e) => setSettingsForm({ ...settingsForm, webAppRestricted: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {settingsForm.webAppRestricted && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Default Web Points Limit per Conversion
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="5000"
                            value={settingsForm.webMaxPoints}
                            onChange={(e) => setSettingsForm({ ...settingsForm, webMaxPoints: parseInt(e.target.value, 10) || 50 })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                            placeholder="50"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Converting datasets larger than this triggers the Desktop Download modal.
                          </p>
                        </div>

                        <div className="flex flex-col justify-center space-y-2.5 pt-1">
                          <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsForm.webDisableReports}
                              onChange={(e) => setSettingsForm({ ...settingsForm, webDisableReports: e.target.checked })}
                              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                            />
                            <span>Lock PDF &amp; Cadastral Reports on Web</span>
                          </label>

                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Announcement Banner */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Global Announcement Banner
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={settingsForm.announcementActive}
                        onChange={(e) => setSettingsForm({ ...settingsForm, announcementActive: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                      />
                      Show on the site
                    </label>
                  </div>
                  <input
                    type="text"
                    value={settingsForm.announcementBanner}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcementBanner: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. v3.5.7 released with UK OSGB36 & Dubai DLTM improvements!"
                  />
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {settingsSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Settings className="w-4 h-4" />}
                    {settingsSaved ? "Settings Saved!" : "Save & Apply Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Surveyor Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingUser ? "Edit Surveyor Account" : "Create New Surveyor"}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Asjad Mehmood"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="surveyor@company.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={userForm.organization}
                    onChange={(e) => setUserForm({ ...userForm, organization: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Geotech Ltd"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Surveyor">Surveyor</option>
                    <option value="Cadastral Surveyor">Cadastral Surveyor</option>
                    <option value="Chief Surveyor">Chief Surveyor</option>
                    <option value="Civil Engineer">Civil Engineer</option>
                    <option value="GIS Specialist">GIS Specialist</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {editingUser ? "New Password (leave blank to keep unchanged)" : "Password"}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder={editingUser ? "Unchanged" : "••••••••••••"}
                />
              </div>

              {/* Web Restrictions & Limit Settings per User */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Web App Access &amp; Limits
                </div>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.hasFullAccess}
                    onChange={(e) => setUserForm({ ...userForm, hasFullAccess: e.target.checked })}
                    className="mt-0.5 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Grant Full Unrestricted Web Access</div>
                    <div className="text-[11px] text-slate-400">
                      Bypasses the web demo points limit &amp; report restrictions for this account.
                    </div>
                  </div>
                </label>

                {!userForm.hasFullAccess && (
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      Custom Point Limit (optional)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="10000"
                      value={userForm.customMaxPoints}
                      onChange={(e) => setUserForm({ ...userForm, customMaxPoints: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                      placeholder={`Leave blank to use global default (${settingsForm.webMaxPoints || 50} pts)`}
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Overrides the global limit for this specific surveyor account.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  {editingUser ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Person Details & Telemetry Deep-Dive Modal */}
      <FileViewer file={viewing} onClose={() => setViewing(null)} />
      <SurveyorDetailModal
        userId={detailUserId}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailUserId(null);
        }}
        onUserUpdated={() => {
          loadUsers(userSearch);
          loadDashboardData();
        }}
        onToast={showToast}
        globalMaxPoints={settingsForm.webMaxPoints || 50}
      />
    </div>
  );
}
