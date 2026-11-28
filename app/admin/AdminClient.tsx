"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { ACTIVITY_APPS, DOWNLOAD_TABS, FILE_APPS, REVIEW_APPS, SETTINGS_SECTIONS, TOOLKIT_SECTIONS, type ToolkitSection } from "@/components/admin/menus";
import AdminSearch, { SearchButton } from "@/components/admin/AdminSearch";
import AdminShell, { type AdminGroup } from "../../components/admin/AdminShell";
import { Users,
  Download,
  Activity,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Compass,
  BarChart3,
  Gauge,
  CreditCard,
  Files,
  Inbox,
  Send,
  Star,
  Megaphone,
  TrendingUp,
  LayoutGrid,
  Route,
  FolderTree,
  PenTool,
  ScrollText } from "lucide-react";
import type { ViewerFile } from "@/components/FileViewer";
import { PROGRAMS } from "@/lib/products/programs";
import { formatLocationDisplay } from "@/components/admin/format";
import type { AdminStats, ConversionItem, DownloadItem, UserActivityItem, UserItem } from "@/lib/admin/adminTypes";

const AdminOverview = dynamic(() => import("@/components/admin/AdminOverview"));
// Each tab's code loads when the tab is first opened (the menu reads components/admin/menus.ts)
const AdminMessages = dynamic(() => import("@/components/admin/AdminMessages"));
const AdminMail = dynamic(() => import("@/components/admin/AdminMail"));
const AdminSurveyors = dynamic(() => import("@/components/admin/AdminSurveyors"));
const AdminDownloads = dynamic(() => import("@/components/admin/AdminDownloads"));
const AdminReviews = dynamic(() => import("@/components/admin/AdminReviews"));
const AdminReleases = dynamic(() => import("@/components/admin/AdminReleases"));
const SettingsPanel = dynamic(() => import("@/components/admin/SettingsPanel"));
const AdminPoints = dynamic(() => import("@/components/admin/AdminPoints"));
const AdminTraverse = dynamic(() => import("@/components/admin/AdminTraverse"));
const AdminSlope = dynamic(() => import("@/components/admin/AdminSlope"));
const AdminToolkit = dynamic(() => import("@/components/admin/AdminToolkit"));
const AdminExcelToKml = dynamic(() => import("@/components/admin/AdminExcelToKml"));
const AdminProgram = dynamic(() => import("@/components/admin/AdminProgram"));
const AdminLog = dynamic(() => import("@/components/admin/AdminLog"));
const AdminUsage = dynamic(() => import("@/components/admin/AdminUsage"));
const AdminPayments = dynamic(() => import("@/components/admin/AdminPayments"));
const AdminActivity = dynamic(() => import("@/components/admin/AdminActivity"));
const AdminFiles = dynamic(() => import("@/components/admin/AdminFiles"));
const SurveyorDetailModal = dynamic(() => import("@/components/admin/SurveyorDetailModal"));
const FileViewer = dynamic(() => import("@/components/FileViewer"));
const AppSettings = dynamic(() => import("@/components/admin/AppTab").then((m) => m.AppSettings));









/** Page buttons under a long table */

/** The apps under Releases in the menu (lib/products/programs.ts) */
const RELEASE_TABS = PROGRAMS;

const ADMIN_TABS = ["overview", "usage", "payments", "users", "activities", "downloads", "files", "conversions", "excel", "traverse", "slope", "autodraft", "roadpro", "pfm", "toolkit", "releases", "reviews", "messages", "mail", "settings", "log"] as const;
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
  const [stats, setStats] = useState<AdminStats | null>(null);

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

  // Check the admin session once, then load the dashboard (the page starts in its loading state)
  const loadRef = React.useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let live = true;
    (async () => {
      let ok = false;
      let user: UserItem | null = null;
      try {
        const res = await adminFetch("/api/admin/auth");
        const data = res.ok ? await res.json() : null;
        ok = Boolean(data?.isAdmin);
        user = ok ? data.user : null;
      } catch {
        ok = false;
      }
      if (!live) return;
      setIsAdminAuthenticated(ok);
      if (ok) setAdminUser(user);
      setLoading(false);
      if (ok) void loadRef.current();
      else window.location.replace("/");
    })();
    return () => {
      live = false;
    };
  }, [adminFetch]);


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
      const dlRes = await adminFetch("/api/admin/downloads?limit=8");
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
  useEffect(() => {
    loadRef.current = loadDashboardData;
  });

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
      sections: [
        { id: "overview", label: "Dashboard", icon: BarChart3, text: "Accounts, downloads and what people did lately, at a glance" },
        { id: "usage", label: "Usage", icon: Gauge, text: "Monthly active people against the goal before a paid plan, and who uses the programs most" },
        { id: "payments", label: "Payments", icon: CreditCard, text: "Switch the paid plans on and off, the free limits and prices, the Paddle set-up checklist, and giving Pro" },
      ],
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
          count: stats?.totalDownloads,
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
        { id: "autodraft", label: "Auto Drafting", icon: PenTool, text: "Everything about Auto Drafting: downloads, people, versions, the drawings saved (DXF, PDF, KML), the PCs with it, Toolkit installs and failures, and its releases on GitHub" },
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
        { id: "mail", label: "Email", icon: Send, text: "Write an email to one person, people you pick, everyone who uses an app, or everyone" },
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
          <AdminOverview
            stats={stats}
            downloads={downloads}
            users={users}
            conversions={conversions}
            conversionsTotal={conversionsTotal}
            allActivities={allActivities}
            activitiesTotal={activitiesTotal}
            adminFetch={adminFetch}
            onShow={selectSection}
            onTab={setActiveTab}
            onOpenUser={(id) => {
              setDetailUserId(id);
              setDetailModalOpen(true);
            }}
          />
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
        {(activeTab === "roadpro" || activeTab === "pfm" || activeTab === "autodraft") && (
          <AdminProgram
            key={activeTab}
            app={activeTab === "roadpro" ? "roadpro" : activeTab === "autodraft" ? "auto-draft" : "folder-manager"}
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

        {activeTab === "mail" && <AdminMail adminFetch={adminFetch} onToast={showToast} />}
        {activeTab === "usage" && <AdminUsage adminFetch={adminFetch} />}
        {activeTab === "payments" && <AdminPayments adminFetch={adminFetch} />}

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
