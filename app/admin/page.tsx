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
  Key,
  Lock,
  Layers,
  Sparkles,
  Server,
  MapPin,
  Compass,
} from "lucide-react";

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

interface AppSettings {
  appVersion: string;
  installerFileName: string;
  installerFileSize: string;
  requireAuthForDownload: boolean;
  maintenanceMode: boolean;
  announcementBanner: string;
  announcementActive: boolean;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "downloads" | "conversions" | "settings">("overview");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("admin@exceltokml.com");
  const [loginPassword, setLoginPassword] = useState("admin2026!");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalDownloads: number;
    totalConversions: number;
    roleCounts: Record<string, number>;
    assetCounts: Record<string, number>;
    locationCounts?: Record<string, number>;
    settings: AppSettings;
    recentUsers: UserItem[];
    recentDownloads: DownloadItem[];
    recentConversions: ConversionItem[];
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
  });

  // Downloads state
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [downloadFilter, setDownloadFilter] = useState("all");

  // Conversions state
  const [conversions, setConversions] = useState<ConversionItem[]>([]);

  // Settings state
  const [settingsForm, setSettingsForm] = useState<AppSettings>({
    appVersion: "v3.5.5",
    installerFileName: "ExcelToKMLPro-Lite-Setup.exe",
    installerFileSize: "3.2 MB",
    requireAuthForDownload: true,
    maintenanceMode: false,
    announcementBanner: "",
    announcementActive: false,
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

  // Check Admin session
  const verifyAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/auth");
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
    } catch {
      setIsAdminAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      // Load stats
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        if (data.stats.settings) {
          setSettingsForm(data.stats.settings);
        }
      }

      // Load users
      loadUsers();

      // Load downloads
      const dlRes = await fetch("/api/admin/downloads");
      if (dlRes.ok) {
        const data = await dlRes.json();
        setDownloads(data.downloads || []);
      }

      // Load conversions
      const convRes = await fetch("/api/admin/conversions");
      if (convRes.ok) {
        const data = await convRes.json();
        setConversions(data.conversions || []);
      }
    } catch (err) {
      console.error("Dashboard data load error", err);
    }
  };

  const loadUsers = async (query = "") => {
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/admin/users?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } finally {
      setUsersLoading(false);
    }
  };

  // Admin login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setIsAdminAuthenticated(true);
      setAdminUser(data.user);
      showToast("Master Admin authentication successful!");
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdminAuthenticated(false);
    setAdminUser(null);
  };

  // User CRUD
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update user");
        showToast("User updated successfully");
      } else {
        // Create user
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create user");
        showToast("New surveyor user created");
      }
      setUserModalOpen(false);
      setEditingUser(null);
      setUserForm({ name: "", email: "", organization: "", role: "Surveyor", password: "" });
      loadUsers(userSearch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving user";
      showToast(msg, "error");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
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
      const res = await fetch(`/api/admin/downloads?id=${id}`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/downloads", { method: "DELETE" });
      if (res.ok) {
        setDownloads([]);
        showToast("All download logs cleared");
      }
    } catch {
      showToast("Failed to clear logs", "error");
    }
  };

  // Clear conversions
  const handleClearConversions = async () => {
    if (!confirm("Are you sure you want to clear all conversion telemetry?")) return;
    try {
      const res = await fetch("/api/admin/conversions", { method: "DELETE" });
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
      const res = await fetch("/api/admin/settings", {
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
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Website
            </Link>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Lock className="w-3 h-3" /> Admin Only
            </span>
          </div>

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Control Center</h1>
            <p className="text-sm text-slate-400 mt-1">Manage users, gated downloads, conversions & system settings</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Admin Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="admin@exceltokml.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" /> Authenticate Administrator
                </>
              )}
            </button>

            {/* Quick Demo Fill */}
            <div className="pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("admin@exceltokml.com");
                  setLoginPassword("admin2026!");
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Auto-fill Master Admin Credentials
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD VIEW
  // --------------------------------------------------------------------------
  const filteredDownloads =
    downloadFilter === "all" ? downloads : downloads.filter((d) => d.assetType === downloadFilter);

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
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Excel to KML Pro</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-slate-400">Full System & Data Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">{adminUser?.name || "Admin"}</span>
            <span className="text-slate-500">({adminUser?.email})</span>
          </div>

          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> View Public Site
          </Link>

          <button
            onClick={handleAdminLogout}
            className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Metrics", icon: Activity },
            { id: "users", label: `Registered Surveyors (${users.length})`, icon: Users },
            { id: "downloads", label: `Download Logs (${downloads.length})`, icon: Download },
            { id: "conversions", label: `Conversions (${conversions.length})`, icon: Globe },
            { id: "settings", label: "System & Release Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================================================================== */}
        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {/* ================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider">Registered Surveyors</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{stats?.totalUsers ?? users.length}</div>
                  <p className="text-xs text-slate-400 mt-1">Verified cadastral accounts</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider">Gated Downloads</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{stats?.totalDownloads ?? downloads.length}</div>
                  <p className="text-xs text-slate-400 mt-1">Logged asset downloads</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider">Coordinates Converted</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{stats?.totalConversions ?? conversions.length}</div>
                  <p className="text-xs text-slate-400 mt-1">Live benchmark conversions</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider">Database Status</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Server className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-lg font-black text-emerald-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    Healthy & Operational
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Neon DB / Local Resilient Store</p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Telemetry Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" /> Asset Distribution
                  </h3>
                  <span className="text-xs text-slate-500">All-time downloads breakdown</span>
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
                          width: `${Math.min(
                            100,
                            Math.max(10, ((stats?.assetCounts?.windows_installer || 1) / (downloads.length || 1)) * 100)
                          )}%`,
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
                          width: `${Math.min(
                            100,
                            Math.max(10, ((stats?.assetCounts?.sample_csv || 0) / (downloads.length || 1)) * 100)
                          )}%`,
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
                          width: `${Math.min(
                            100,
                            Math.max(10, ((stats?.assetCounts?.test_kml || 0) / (downloads.length || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
                  <a
                    href="/api/admin/downloads?format=csv"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Downloads to CSV
                  </a>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="px-4 py-2.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-bold transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" /> Manage All Surveyors
                  </button>
                </div>
              </div>

              {/* System State Banner */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Engine Release
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Live Version:</span>
                      <span className="font-bold text-white">{settingsForm.appVersion}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Installer File:</span>
                      <span className="font-bold text-slate-300 truncate max-w-[140px]">{settingsForm.installerFileName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Installer Size:</span>
                      <span className="font-bold text-slate-300">{settingsForm.installerFileSize}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Gate Mode:</span>
                      <span className={`font-bold ${settingsForm.requireAuthForDownload ? "text-emerald-400" : "text-amber-400"}`}>
                        {settingsForm.requireAuthForDownload ? "Enabled (Auth Required)" : "Disabled (Public)"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("settings")}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Configure System Settings
                </button>
              </div>
            </div>

            {/* Geographic Distribution & Origin Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Locations Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" /> Geographic Origin Breakdown
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
                    <Activity className="w-4 h-4 text-blue-400" /> Latest Download IP Logs
                  </h3>
                  <button
                    onClick={() => setActiveTab("downloads")}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
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
        {/* TAB 2: USERS MANAGEMENT */}
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
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Refresh users"
                >
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setUserForm({ name: "", email: "", organization: "", role: "Surveyor", password: "" });
                    setUserModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
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
                      <th className="px-6 py-4">Surveyor / User</th>
                      <th className="px-6 py-4">Organization</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Registration IP &amp; Origin</th>
                      <th className="px-6 py-4">Downloads</th>
                      <th className="px-6 py-4">Registered</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          No users found matching query
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  {u.name}
                                  {u.role === "ADMIN" && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 text-xs">{u.organization || "—"}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const loc = formatLocationDisplay(u.location);
                              return (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 text-xs text-white font-medium">
                                    <span className="text-sm shrink-0">{loc.flag}</span>
                                    <span className="truncate max-w-[180px]">{loc.text}</span>
                                  </div>
                                  <div>
                                    <span className="font-mono text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                      {u.ipAddress || "127.0.0.1"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 font-bold text-blue-400">{u.downloadCount}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setUserForm({
                                    name: u.name,
                                    email: u.email,
                                    organization: u.organization || "",
                                    role: u.role || "Surveyor",
                                    password: "",
                                  });
                                  setUserModalOpen(true);
                                }}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Edit user"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {u.email !== "admin@exceltokml.com" && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
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

        {/* User Create / Edit Modal */}
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
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
                    placeholder="surveyor@firm.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Organization / Bureau
                  </label>
                  <input
                    type="text"
                    value={userForm.organization}
                    onChange={(e) => setUserForm({ ...userForm, organization: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Apex Survey & Mapping"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Discipline / Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Cadastral Surveyor">Cadastral Surveyor</option>
                    <option value="Civil Engineer">Civil Engineer</option>
                    <option value="GIS Specialist">GIS Specialist</option>
                    <option value="Drone Operator">Drone Operator</option>
                    <option value="Surveyor">General Surveyor</option>
                    <option value="ADMIN">Administrator (Full Access)</option>
                  </select>
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
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all"
                  >
                    {editingUser ? "Save Changes" : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: DOWNLOAD AUDIT TRAIL */}
        {/* ================================================================== */}
        {activeTab === "downloads" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                {["all", "windows_installer", "sample_csv", "test_kml"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setDownloadFilter(type)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
                  className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs font-bold transition-colors flex items-center gap-2 border border-rose-500/30"
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
                            <div className="font-bold text-white text-xs">{dl.userName || "Verified Surveyor"}</div>
                            <div className="text-[11px] text-slate-500">{dl.userEmail || "anonymous"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {dl.assetType}
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
                          <td className="px-6 py-4 text-xs text-slate-300 font-mono">{dl.fileName}</td>
                          <td className="px-6 py-4 text-xs text-slate-400 font-bold">{dl.version}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteDownload(dl.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete log entry"
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
        {/* TAB 4: CONVERSIONS AUDIT */}
        {/* ================================================================== */}
        {activeTab === "conversions" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Geodetic Conversion Log</h3>
                <p className="text-xs text-slate-400">Real-time coordinates converted via the interactive playground</p>
              </div>
              <button
                onClick={handleClearConversions}
                className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-xs font-bold transition-colors flex items-center gap-2 border border-rose-500/30"
              >
                <Trash2 className="w-4 h-4" /> Clear History
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/60 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4">Station</th>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Grid System</th>
                      <th className="px-6 py-4">Easting / Northing</th>
                      <th className="px-6 py-4">Output Lat / Lon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {conversions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          No coordinate conversions recorded yet
                        </td>
                      </tr>
                    ) : (
                      conversions.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(c.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 font-bold text-white text-xs">{c.station}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">{c.featureCode}</td>
                          <td className="px-6 py-4 text-xs font-medium text-blue-400">{c.coordSystem}</td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-300">
                            E: {c.easting.toFixed(2)}, N: {c.northing.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-emerald-400">
                            {c.lat}, {c.lon}
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
        {/* TAB 5: SYSTEM & RELEASE SETTINGS */}
        {/* ================================================================== */}
        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-6">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" /> Release & Platform Parameters
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Active Application Version
                    </label>
                    <input
                      type="text"
                      value={settingsForm.appVersion}
                      onChange={(e) => setSettingsForm({ ...settingsForm, appVersion: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="v3.5.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Installer File Size
                    </label>
                    <input
                      type="text"
                      value={settingsForm.installerFileSize}
                      onChange={(e) => setSettingsForm({ ...settingsForm, installerFileSize: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="3.2 MB"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Windows Installer Setup Filename
                  </label>
                  <input
                    type="text"
                    value={settingsForm.installerFileName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, installerFileName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="ExcelToKMLPro-Lite-Setup.exe"
                  />
                </div>

                {/* Toggles */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <div>
                      <div className="font-bold text-sm text-white">Require Surveyor Login to Download</div>
                      <div className="text-xs text-slate-400">
                        When enabled, visitors must register or sign in before downloading the software.
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
                      <div className="text-xs text-slate-400">Display maintenance indicator banner to public visitors</div>
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
                      Show on Home Page
                    </label>
                  </div>
                  <input
                    type="text"
                    value={settingsForm.announcementBanner}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcementBanner: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. v3.5.5 released with UK OSGB36 & Dubai DLTM improvements!"
                  />
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
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
    </div>
  );
}
