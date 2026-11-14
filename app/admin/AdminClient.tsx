"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminMessages from "../../components/admin/AdminMessages";
import AdminSurveyors from "@/components/admin/AdminSurveyors";
import AdminDownloads, { DOWNLOAD_TABS } from "@/components/admin/AdminDownloads";
import AdminReviews, { REVIEW_APPS } from "../../components/admin/AdminReviews";
import AdminReleases from "../../components/admin/AdminReleases";
import SettingsPanel, { SETTINGS_SECTIONS } from "../../components/admin/SettingsPanel";
import AdminPoints from "../../components/admin/AdminPoints";
import AdminTraverse from "../../components/admin/AdminTraverse";
import AdminSlope from "../../components/admin/AdminSlope";
import AdminToolkit, { TOOLKIT_SECTIONS, type ToolkitSection } from "@/components/admin/AdminToolkit";
import AdminExcelToKml from "@/components/admin/AdminExcelToKml";
import AdminProgram from "@/components/admin/AdminProgram";
import { AppSettings } from "@/components/admin/AppTab";
import AdminLog from "@/components/admin/AdminLog";
import AdminTrends from "@/components/admin/AdminTrends";
import AdminActivity, { APPS as ACTIVITY_APPS } from "@/components/admin/AdminActivity";
import AdminSearch, { SearchButton } from "@/components/admin/AdminSearch";
import AdminFiles, { FILE_APPS } from "../../components/admin/AdminFiles";
import AdminShell, { type AdminGroup } from "../../components/admin/AdminShell";
import {
  Users,
  Download,
  Activity,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Layers,
  Sparkles,
  Server,
  Compass,
  BarChart3,
  Files,
  Inbox,
  Star,
  Megaphone,
  TrendingUp,
  LayoutGrid,
  Route,
  FolderTree,
  ScrollText,
} from "lucide-react";
import SurveyorDetailModal from "@/components/admin/SurveyorDetailModal";
import FileViewer, { type ViewerFile } from "@/components/FileViewer";
import { actionLabel, adminActionTag } from "@/lib/activityKinds";

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
  /** confirmed, waiting (signed up but never confirmed: maybe a fake address) or older (before confirmation started) */
  emailState?: "confirmed" | "waiting" | "older";
  blocked?: boolean;
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
  elevation: number | null;
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

/** The apps under Releases in the menu (lib/releases.ts RELEASE_APPS, which the page can't import) */
const RELEASE_TABS = [
  { id: "excel-to-kml", name: "Excel to KML" },
  { id: "traverse", name: "Traverse & Level" },
  { id: "slope", name: "Slope Calculator" },
  { id: "roadpro", name: "RoadPro" },
  { id: "folder-manager", name: "Project Folder Manager" },
  { id: "toolkit", name: "Survey Toolkit" },
];

const ADMIN_TABS = ["overview", "users", "activities", "downloads", "files", "conversions", "excel", "traverse", "slope", "roadpro", "pfm", "toolkit", "releases", "reviews", "messages", "settings", "log"] as const;
type AdminTab = (typeof ADMIN_TABS)[number];
function tabFromAddress(): AdminTab {
  const id = typeof window === "undefined" ? "" : window.location.hash.slice(1);
  return (ADMIN_TABS as readonly string[]).includes(id) ? (id as AdminTab) : "overview";
}
/** When the data was loaded, for "Updated 2 min ago" */
const stamp = () => Date.now();

export default function AdminClient() {
  // Opens on the page named in the address (/admin#releases); the first render is the
  // loading screen, so reading the address here can't upset hydration
  const [activeTab, setActiveTab] = useState<AdminTab>(tabFromAddress);
  const [newMessages, setNewMessages] = useState(0);
  // Refresh in the page header: loads everything again (refreshKey remounts the open page)
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Individual person detail modal state
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  // Ctrl+K (⌘K) or "/" opens the search (components/admin/AdminSearch.tsx)
  const [searchOpen, setSearchOpen] = useState(false);
  // Activity → an app, from the menu or the page's own chips (components/admin/AdminActivity.tsx)
  const [activityApp, setActivityApp] = useState("");
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({});
  // Files → an app, from the menu (components/admin/AdminFiles.tsx)
  const [filesApp, setFilesApp] = useState("");
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  // Releases → an app (components/admin/AdminReleases.tsx)
  const [releasesApp, setReleasesApp] = useState("");
  const [releaseCounts, setReleaseCounts] = useState<Record<string, number>>({});
  // Reviews → a program
  const [reviewsApp, setReviewsApp] = useState("");
  const [reviewWaiting, setReviewWaiting] = useState<Record<string, number>>({});
  // Survey Toolkit → one part of its detail (components/admin/AdminToolkit.tsx)
  const [toolkitPart, setToolkitPart] = useState("");
  // Settings → one part of it
  const [settingsPart, setSettingsPart] = useState("");
  // Downloads → a program
  const [downloadsApp, setDownloadsApp] = useState("");
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});
  // Surveyors: loads again after the add/edit window saves
  const [usersReload, setUsersReload] = useState(0);
  // a menu item: a section, or "<section>:<part>" for a part of it
  const selectSection = (id: string) => {
    const [tab, part] = id.split(":");
    if (tab === "activities") setActivityApp(part ?? "");
    if (tab === "files") setFilesApp(part ?? "");
    if (tab === "releases") setReleasesApp(part ?? "");
    if (tab === "reviews") setReviewsApp(part ?? "");
    if (tab === "downloads") setDownloadsApp(part ?? "");
    if (tab === "settings") setSettingsPart(part ?? "");
    if (tab === "toolkit") setToolkitPart(part ?? "");
    setActiveTab(tab as typeof activeTab);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if ((e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    /** Traverse & Level jobs: null when their tables could not be read */
    traverse?: { jobs: number; traverses: number; levels: number; accepted: number; rejected: number; surveyors: number } | null;
    /** Slope Calculator: calculations kept in accounts; null when the table could not be read */
    slope?: { jobs: number; surveyors: number } | null;
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
  // every entry in the database; allActivities holds the newest of them, 200 more per "Load more"
  const [activitiesTotal, setActivitiesTotal] = useState(0);

  // Downloads state
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  // Conversions state
  const [conversions, setConversions] = useState<ConversionItem[]>([]);
  const [conversionsTotal, setConversionsTotal] = useState(0);
  const convLimit = 1000;

  // Files state: searched and paged on the server
  const [viewing, setViewing] = useState<ViewerFile | null>(null);


  // Toast notice
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const formatLocationDisplay = (locStr?: string | null): { text: string; flag: string } => {
    if (!locStr || !locStr.trim()) return { text: "Not known", flag: "🌐" };
    if (locStr === "Localhost (Dev)" || locStr === "127.0.0.1" || locStr === "Localhost") {
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
    // New contact messages, for the badge on the Messages tab
    adminFetch("/api/admin/messages?status=new")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setNewMessages(d.counts?.new || 0))
      .catch(() => {});
    try {
      // Load stats
      const statsRes = await adminFetch("/api/admin/stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
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
    setUpdatedAt(stamp());
  };

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      setRefreshKey((k) => k + 1);
    } finally {
      setRefreshing(false);
    }
  };

  // The open page is kept in the address (/admin#releases), so a reload or a shared link opens it
  useEffect(() => {
    const want = activeTab === "overview" ? "" : `#${activeTab}`;
    if (window.location.hash !== want) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${want}`);
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const loadUsers = async (query = "") => {
    try {
      const res = await adminFetch(`/api/admin/users?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // the page shows what it has
    }
  };

  const loadActivities = async () => {
    try {
      const res = await adminFetch("/api/admin/activities?limit=20");
      if (res.ok) {
        const data = await res.json();
        setAllActivities(data.activities || []);
        setActivitiesTotal(data.total ?? (data.activities || []).length);
      }
    } catch {
      // the page shows what it has
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
      loadUsers();
      setUsersReload((x) => x + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving user";
      showToast(msg, "error");
    }
  };

  // Clear all application activities
  const handleClearActivities = async () => {
    if (!confirm("Clear the whole activity log for every surveyor? This cannot be undone.")) return;
    try {
      const res = await adminFetch("/api/admin/activities", { method: "DELETE" });
      if (res.ok) {
        setAllActivities([]);
        setActivitiesTotal(0);
        showToast("Activity log cleared");
        loadDashboardData();
      }
    } catch {
      showToast("Could not clear the activity log", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--adm-bg)] flex items-center justify-center text-white">
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

  // The menu, grouped by topic (components/admin/AdminShell.tsx)
  const groups: AdminGroup[] = [
    {
      label: "Overview",
      sections: [{ id: "overview", label: "Dashboard", icon: BarChart3, text: "Accounts, downloads and what people did lately, at a glance" }],
    },
    {
      label: "People",
      sections: [
        { id: "users", label: "Surveyors", icon: Users, text: "Every account: who they are, where from, what they downloaded and whether their email is confirmed", count: stats?.totalUsers ?? users.length },
        {
          id: "activities",
          label: "Activity",
          icon: Activity,
          text: activityApp
            ? `Everything in ${ACTIVITY_APPS.find((a) => a.id === activityApp)?.name ?? activityApp}: what people do, downloads and sign-ins`
            : "Everything across the apps and tools: what people do, downloads, sign-ins and the Toolkit",
          count: Math.max(activitiesTotal, allActivities.length),
          sub: ACTIVITY_APPS.map((a) => ({ id: a.id, label: a.name, count: activityCounts[a.id] })),
        },
        {
          id: "downloads",
          label: "Downloads",
          icon: Download,
          text: downloadsApp
            ? `Every download of ${DOWNLOAD_TABS.find((a) => a.id === downloadsApp)?.name ?? downloadsApp}: by whom, which version and from where`
            : "Every program download: by whom, which version and from where",
          count: stats?.totalDownloads ?? downloads.length,
          sub: DOWNLOAD_TABS.map((a) => ({ id: a.id, label: a.name, count: downloadCounts[a.id] })),
        },
      ],
    },
    {
      label: "Data",
      sections: [
        {
          id: "files",
          label: "Files",
          icon: Files,
          text: filesApp
            ? `Everything people keep from ${FILE_APPS.find((a) => a.id === filesApp)?.name ?? filesApp}: files, jobs and calculations`
            : "Files, jobs and calculations people keep in their accounts, app by app",
          count: Object.keys(fileCounts).length ? Object.values(fileCounts).reduce((s, n) => s + n, 0) : stats?.totalFilesStored,
          sub: FILE_APPS.map((a) => ({ id: a.id, label: a.name, count: fileCounts[a.id] })),
        },
        { id: "conversions", label: "Points", icon: Globe, text: "The converted points in saved files", count: conversionsTotal },
      ],
    },
    {
      label: "Apps",
      sections: [
        { id: "excel", label: "Excel to KML", icon: FileSpreadsheet, text: "Everything about Excel to KML: downloads, people, versions, points, grids, problems and its settings" },
        { id: "traverse", label: "Traverse & Level", icon: Compass, text: "Everything about Traverse & Level: downloads, people, versions, jobs and results, sharing, problems, its settings and every job", count: stats?.traverse?.jobs },
        { id: "slope", label: "Slope Calculator", icon: TrendingUp, text: "Everything about Slope Calculator: downloads, people, versions, calculations, how steep and how long, projects, problems, its settings and every calculation", count: stats?.slope?.jobs },
        { id: "roadpro", label: "RoadPro", icon: Route, text: "Everything about RoadPro: downloads, the PCs with it and their versions, Toolkit installs and failures, and its releases on GitHub" },
        { id: "pfm", label: "Project Folder Manager", icon: FolderTree, text: "Everything about Project Folder Manager: downloads, the PCs with it and their versions, Toolkit installs and failures, and its releases on GitHub" },
        {
          id: "toolkit",
          label: "Survey Toolkit",
          icon: LayoutGrid,
          text: toolkitPart
            ? `Survey Toolkit: ${TOOLKIT_SECTIONS.find((x) => x.id === toolkitPart)?.label ?? toolkitPart}`
            : "Everything about the Survey Toolkit: downloads, people, every PC and its version, installs, updates and failures, GitHub, who may use it, and every account, PC and event",
          sub: TOOLKIT_SECTIONS.map((x) => ({ id: x.id, label: x.label })),
        },
      ],
    },
    {
      label: "Engage",
      sections: [
        {
          id: "releases",
          label: "Releases",
          icon: Megaphone,
          text: releasesApp
            ? `${RELEASE_TABS.find((a) => a.id === releasesApp)?.name ?? releasesApp}: its versions, the emails about them, review requests`
            : "Every app's versions, every release, the emails sent and who stopped them",
          sub: RELEASE_TABS.map((a) => ({ id: a.id, label: a.name, count: releaseCounts[a.id] })),
        },
        {
          id: "reviews",
          label: "Reviews",
          icon: Star,
          text: reviewsApp ? `${REVIEW_APPS.find((a) => a.id === reviewsApp)?.name ?? reviewsApp}: its reviews to publish or hide` : "Star ratings and comments: publish the good ones, hide the rest",
          count: pendingReviews || undefined,
          attention: pendingReviews > 0,
          sub: REVIEW_APPS.map((a) => ({ id: a.id, label: a.name, count: reviewWaiting[a.id] || undefined })),
        },
        { id: "messages", label: "Messages", icon: Inbox, text: "What people sent through the contact form", count: newMessages || undefined, attention: newMessages > 0 },
      ],
    },
    {
      label: "System",
      sections: [
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          text: settingsPart
            ? `${SETTINGS_SECTIONS.find(([id]) => id === settingsPart)?.[1] ?? "Settings"}: change it and save; it's live on the site within a minute`
            : "Sign-ups, email confirmation, the home page, announcements and maintenance",
          sub: SETTINGS_SECTIONS.map(([id, label]) => ({ id, label })),
        },
        { id: "log", label: "Admin log", icon: ScrollText, text: "Every change made in Admin: who, what and when" },
      ],
    },
  ];

  return (
    <AdminShell
      headerExtra={<SearchButton onOpen={() => setSearchOpen(true)} />}
      groups={groups}
      active={activeTab}
      onSelect={selectSection}
      activeSub={
        activeTab === "activities" ? activityApp : activeTab === "files" ? filesApp : activeTab === "releases" ? releasesApp : activeTab === "reviews" ? reviewsApp : activeTab === "downloads" ? downloadsApp : activeTab === "settings" ? settingsPart : activeTab === "toolkit" ? toolkitPart : ""
      }
      admin={adminUser}
      onLogout={handleAdminLogout}
      onRefresh={refreshAll}
      refreshing={refreshing}
      updatedAt={updatedAt}
    >
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


      {/* Remounted by Refresh, so every page loads its data again */}
      <div key={refreshKey} className="flex flex-col gap-8">
        {/* ================================================================== */}
        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {/* ================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <AdminTrends adminFetch={adminFetch} onShow={selectSection} />
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500 -mb-4">All time</h2>
            {/* Stat Cards (5 metrics) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Surveyors</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-[28px] leading-none font-extrabold tracking-tight text-white tabular-nums">{stats?.totalUsers ?? users.length}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Registered accounts</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Downloads</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-[28px] leading-none font-extrabold tracking-tight text-white tabular-nums">{stats?.totalDownloads ?? downloads.length}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Installer and sample files</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Points Kept</span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-[28px] leading-none font-extrabold tracking-tight text-cyan-300 tabular-nums">
                    {(stats?.totalPointsKept ?? conversionsTotal).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Converted points in saved files</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Activity</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-[28px] leading-none font-extrabold tracking-tight text-white tabular-nums">
                    {(stats?.totalActivities ?? allActivities.length) || conversions.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Conversions, saves and opens logged</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">Files Stored</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-[28px] leading-none font-extrabold tracking-tight text-white tabular-nums">{(stats?.totalFilesStored ?? 0).toLocaleString()}</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {fmtBytes(stats?.totalStorageBytes ?? 0)} kept in {(stats?.totalFilesWithCopy ?? 0).toLocaleString()} copies
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Live Telemetry Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Distribution */}
              <div className="p-6 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] space-y-6">
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
                      <span className="text-slate-300">RoadPro for AutoCAD (.zip)</span>
                      <span className="text-amber-400">{stats?.assetCounts?.roadpro ?? 0} downloads</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: barWidth(stats?.assetCounts?.roadpro ?? 0, downloads.length),
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">Traverse &amp; Level for Windows (.exe)</span>
                      <span className="text-yellow-300">{stats?.assetCounts?.traverse ?? 0} downloads</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{
                          width: barWidth(stats?.assetCounts?.traverse ?? 0, downloads.length),
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">Project Folder Manager for Windows</span>
                      <span className="text-teal-300">{stats?.assetCounts?.folder_manager ?? 0} downloads</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-teal-400 rounded-full"
                        style={{
                          width: barWidth(stats?.assetCounts?.folder_manager ?? 0, downloads.length),
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">Slope Calculator for Windows (.exe)</span>
                      <span className="text-sky-300">{stats?.assetCounts?.slope ?? 0} downloads</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full"
                        style={{
                          width: barWidth(stats?.assetCounts?.slope ?? 0, downloads.length),
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
              <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] space-y-4">
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
                    <span>Full Log ({Math.max(activitiesTotal, allActivities.length)})</span> &rarr;
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
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 ${adminActionTag(act.action)}`}>
                            {actionLabel(act.action)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-md">
                              {act.title}
                            </div>
                            {(act.action === "settings_update" || act.action === "settings_changed") && act.details && (
                              <div className="mt-0.5 text-[11px] text-slate-400 whitespace-pre-line break-words max-w-md">{act.details}</div>
                            )}
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

            {/* The latest downloads (where they come from is in "Downloads by country" above) */}
            <div className="grid grid-cols-1 gap-6">
              {/* Recent Real-time Activity Card */}
              <div className="p-6 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] space-y-4">
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

                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                  {downloads.slice(0, 8).map((dl) => {
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
                            {dl.ipAddress || "—"}
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
          <AdminSurveyors
            adminFetch={adminFetch}
            onToast={showToast}
            reloadKey={usersReload}
            place={formatLocationDisplay}
            me={adminUser?.id ?? ""}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
            onAdd={() => {
              setEditingUser(null);
              setUserForm({ name: "", email: "", organization: "", role: "Surveyor", password: "", hasFullAccess: false, customMaxPoints: "" });
              setUserModalOpen(true);
            }}
            onEdit={(u) => {
              setEditingUser(u as unknown as UserItem);
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
          />
        )}

        {/* ================================================================== */}
        {/* TAB 3: APP ACTIVITY & TELEMETRY (GLOBAL APPLICATION LOG) */}
        {/* ================================================================== */}
        {activeTab === "activities" && (
          <AdminActivity
            key={activityApp}
            app={activityApp}
            onCounts={setActivityCounts}
            adminFetch={adminFetch}
            onToast={showToast}
            onClearAll={handleClearActivities}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
        )}

        {activeTab === "downloads" && (
          <AdminDownloads
            key={downloadsApp}
            app={downloadsApp}
            adminFetch={adminFetch}
            onToast={showToast}
            onCounts={setDownloadCounts}
            place={formatLocationDisplay}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
        )}

        {/* ================================================================== */}
        {/* TAB 5: CONVERSIONS AUDIT */}
        {/* ================================================================== */}
        {activeTab === "files" && (
          <AdminFiles
            key={filesApp}
            app={filesApp}
            onCounts={setFileCounts}
            adminFetch={adminFetch}
            onToast={showToast}
            onView={(f) => setViewing(f)}
            onApp={(id) => selectSection(`files:${id}`)}
            onOpenUser={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
        )}

        {activeTab === "conversions" && <AdminPoints adminFetch={adminFetch} onToast={showToast} />}
        {activeTab === "traverse" && (
          <AdminTraverse
            adminFetch={adminFetch}
            onToast={showToast}
            onShow={selectSection}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
        )}
        {activeTab === "slope" && (
          <AdminSlope
            adminFetch={adminFetch}
            onToast={showToast}
            onShow={selectSection}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
        )}
        {activeTab === "excel" && (
          <AdminExcelToKml
            adminFetch={adminFetch}
            onToast={showToast}
            onShow={selectSection}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
        )}
        {(activeTab === "roadpro" || activeTab === "pfm") && (
          <AdminProgram
            key={activeTab}
            app={activeTab === "roadpro" ? "roadpro" : "folder-manager"}
            adminFetch={adminFetch}
            onToast={showToast}
            onShow={selectSection}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
        )}
        {activeTab === "toolkit" && toolkitPart && (
          <AdminToolkit
            adminFetch={adminFetch}
            onToast={showToast}
            embedded
            part={toolkitPart as ToolkitSection}
            onPart={(s) => selectSection(`toolkit:${s}`)}
          />
        )}
        {activeTab === "toolkit" && !toolkitPart && (
          <AdminProgram
            app="toolkit"
            adminFetch={adminFetch}
            onToast={showToast}
            onShow={selectSection}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
            extra={
              <div className="grid lg:grid-cols-2 gap-4">
                <AppSettings
                  adminFetch={adminFetch}
                  onToast={showToast}
                  onShow={selectSection}
                  fields={[
                    {
                      key: "toolkitPublic",
                      kind: "switch",
                      label: "Open to everyone",
                      on: "Everyone with an account can download and use the Survey Toolkit.",
                      off: "Only the testers in Access (below) can download and use it.",
                    },
                  ]}
                />
              </div>
            }
            footer={() => (
              <section className="pt-4 border-t border-[var(--adm-line)] space-y-3">
                <h2 className="text-lg font-extrabold text-white">In detail</h2>
                <AdminToolkit adminFetch={adminFetch} onToast={showToast} embedded part="overview" onPart={(s) => selectSection(`toolkit:${s}`)} />
              </section>
            )}
          />
        )}
        {activeTab === "log" && <AdminLog adminFetch={adminFetch} onToast={showToast} />}

        {/* ================================================================== */}
        {/* TAB 6: SETTINGS & RELEASE MANAGEMENT */}
        {/* ================================================================== */}
        {activeTab === "releases" && (
          <AdminReleases
            key={releasesApp}
            app={releasesApp}
            adminFetch={adminFetch}
            onToast={showToast}
            onShow={selectSection}
            onCounts={setReleaseCounts}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
        )}

        {activeTab === "reviews" && (
          <AdminReviews
            key={reviewsApp}
            app={reviewsApp}
            adminFetch={adminFetch}
            onToast={showToast}
            onCounts={setPendingReviews}
            onPerApp={setReviewWaiting}
            onShow={selectSection}
            onOpenAccount={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
        )}

        {activeTab === "messages" && (
          <AdminMessages adminFetch={adminFetch} onToast={showToast} onCounts={setNewMessages} />
        )}

        {activeTab === "settings" && (
          <SettingsPanel adminFetch={adminFetch} onToast={showToast} part={settingsPart} />
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
                  placeholder="Full name"
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
                    {userForm.role &&
                      !["Surveyor", "Cadastral Surveyor", "Chief Surveyor", "Civil Engineer", "GIS Specialist", "ADMIN"].includes(userForm.role) && (
                        <option value={userForm.role}>{userForm.role} (as they typed it)</option>
                      )}
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
      <AdminSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        groups={groups}
        adminFetch={adminFetch}
        onSection={selectSection}
        onAccount={(id) => {
          setDetailUserId(id);
          setDetailModalOpen(true);
        }}
      />
      <SurveyorDetailModal
        userId={detailUserId}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailUserId(null);
        }}
        onUserUpdated={() => {
          loadUsers();
          loadDashboardData();
        }}
        onToast={showToast}
      />
    </AdminShell>
  );
}
