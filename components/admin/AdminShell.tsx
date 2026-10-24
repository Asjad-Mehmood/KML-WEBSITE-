"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LogOut, Menu, Moon, RefreshCw, Shield, Sun, X, type LucideIcon } from "lucide-react";
import "@/app/admin/admin-theme.css";

export interface AdminSection {
  id: string;
  label: string;
  icon: LucideIcon;
  /** one line under the page title */
  text: string;
  /** a number beside the menu item: a total, or something waiting (shown highlighted) */
  count?: number;
  attention?: boolean;
}

export interface AdminGroup {
  label: string;
  sections: AdminSection[];
}

// Light or dark, remembered on this device; the first time it follows the computer's setting
const THEME_KEY = "kml.admin.theme";
function savedTheme(): "light" | "dark" {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // storage blocked: fall through to the system setting
  }
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

const ago = (t: number, now: number) => {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s} s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
};

/**
 * The admin's frame: a menu down the left grouped by topic (a drawer on phones), and a header
 * over each page with its title, when the data was loaded, a light/dark switch and a Refresh
 * button. Light mode is a stylesheet that turns the dark colours around (app/admin/admin-theme.css).
 */
export default function AdminShell({
  groups,
  active,
  onSelect,
  admin,
  onLogout,
  onRefresh,
  refreshing,
  updatedAt,
  children,
}: {
  groups: AdminGroup[];
  active: string;
  onSelect: (id: string) => void;
  admin: { name?: string; email?: string } | null;
  onLogout: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  updatedAt: number | null;
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);
  // Only shown after the sign-in check (never server-rendered), so reading storage here is safe
  const [theme, setTheme] = useState<"light" | "dark">(savedTheme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("admin-light", theme === "light");
    return () => root.classList.remove("admin-light");
  }, [theme]);
  const flipTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // not remembered, still switched
    }
  };
  useEffect(() => {
    if (!drawer) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [drawer]);

  const current = groups.flatMap((g) => g.sections).find((s) => s.id === active);
  const initial = (admin?.name || admin?.email || "A").trim().charAt(0).toUpperCase();

  const nav = (
    <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [scrollbar-width:thin]">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="px-3 mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">{g.label}</p>
          <ul className="space-y-0.5">
            {g.sections.map((s) => {
              const on = s.id === active;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      onSelect(s.id);
                      setDrawer(false);
                    }}
                    aria-current={on ? "page" : undefined}
                    className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-semibold transition-colors cursor-pointer ${
                      on ? "bg-blue-500/15 text-white" : "text-slate-400 hover:text-slate-100 hover:bg-[var(--adm-hover)]"
                    }`}
                  >
                    <s.icon className={`w-[17px] h-[17px] shrink-0 ${on ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} aria-hidden />
                    <span className="flex-1 text-left truncate">{s.label}</span>
                    {s.count !== undefined && s.count > 0 && (
                      <span
                        className={`min-w-[22px] px-1.5 py-px rounded-md text-[11px] font-bold tabular-nums text-center ${
                          s.attention ? "bg-amber-400 text-slate-950" : on ? "bg-blue-500/25 text-blue-200" : "bg-[var(--adm-hover)] text-slate-400"
                        }`}
                      >
                        {s.count > 9999 ? `${Math.round(s.count / 1000)}k` : s.count.toLocaleString()}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--adm-line)] shrink-0">
      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/25">
        <Shield className="w-4 h-4 text-white" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-[14px] font-extrabold tracking-tight text-white">Excel to KML</p>
        <p className="text-[11px] font-semibold text-slate-500">Admin</p>
      </div>
    </div>
  );

  const account = (
    <div className="shrink-0 border-t border-[var(--adm-line)] p-3 space-y-1">
      <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold text-slate-400 hover:text-slate-100 hover:bg-[var(--adm-hover)]">
        <ArrowUpRight className="w-4 h-4" aria-hidden /> View the website
      </Link>
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="w-8 h-8 shrink-0 rounded-full bg-slate-800 border border-slate-700 text-[13px] font-bold text-slate-200 flex items-center justify-center">{initial}</span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[13px] font-semibold text-slate-200 truncate">{admin?.name || "Admin"}</p>
          <p className="text-[11.5px] text-slate-500 truncate">{admin?.email}</p>
        </div>
        <button onClick={onLogout} title="Sign out" aria-label="Sign out" className="p-2 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer">
          <LogOut className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--adm-bg)] text-slate-100 selection:bg-blue-500/30">
      {/* Menu: always there on a wide screen */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-[var(--adm-side)] border-r border-[var(--adm-line)] z-30">
        {brand}
        {nav}
        {account}
      </aside>

      {/* Menu on phones and tablets: a drawer */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" aria-label="Close the menu" onClick={() => setDrawer(false)} />
          <aside className="relative h-full w-[280px] max-w-[85vw] flex flex-col bg-[var(--adm-side)] border-r border-[var(--adm-line)] shadow-2xl">
            <button onClick={() => setDrawer(false)} aria-label="Close the menu" className="absolute right-3 top-4 p-2 rounded-lg text-slate-400 hover:bg-[var(--adm-hover)] cursor-pointer">
              <X className="w-4 h-4" aria-hidden />
            </button>
            {brand}
            {nav}
            {account}
          </aside>
        </div>
      )}

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Page header */}
        <header className="sticky top-0 z-20 bg-[var(--adm-bg-glass)] backdrop-blur-xl border-b border-[var(--adm-line)]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 flex items-center gap-3">
            <button onClick={() => setDrawer(true)} aria-label="Open the menu" className="lg:hidden -ml-1 p-2 rounded-lg text-slate-300 hover:bg-[var(--adm-hover)] cursor-pointer">
              <Menu className="w-5 h-5" aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] sm:text-[19px] font-extrabold tracking-tight text-white truncate flex items-center gap-2">
                {current && <current.icon className="hidden sm:block w-[18px] h-[18px] text-blue-400" aria-hidden />}
                {current?.label ?? "Admin"}
              </h1>
              <p className="hidden md:block text-[12.5px] text-slate-500 truncate">{current?.text}</p>
            </div>
            {updatedAt && (
              <span className="hidden sm:inline text-[12px] text-slate-500 whitespace-nowrap" suppressHydrationWarning>
                Updated {ago(updatedAt, now)}
              </span>
            )}
            <button
              onClick={flipTheme}
              className="p-2 rounded-lg bg-[var(--adm-hover)] hover:bg-[var(--adm-hover-strong)] border border-[var(--adm-line)] text-slate-200 cursor-pointer"
              title={theme === "light" ? "Dark mode" : "Light mode"}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon className="w-4 h-4" aria-hidden /> : <Sun className="w-4 h-4" aria-hidden />}
            </button>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg bg-[var(--adm-hover)] hover:bg-[var(--adm-hover-strong)] border border-[var(--adm-line)] text-[13px] font-semibold text-slate-100 disabled:opacity-60 cursor-pointer"
              title="Load everything again"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
              <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
