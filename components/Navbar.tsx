"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { Download, Menu, X, ChevronDown, LogOut, ExternalLink, Zap } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const NAV_LINKS = [
  { label: "Features",     href: "#features"  },
  { label: "Demo",         href: "#showcase"  },
  { label: "How It Works", href: "#workflow"  },
  { label: "Specs",        href: "#specs"     },
  { label: "FAQ",          href: "#faq"       },
];

interface NavbarProps { onDownloadClick: () => void; }

export default function Navbar({ onDownloadClick }: NavbarProps) {
  const { user, logout, setAuthModalOpen, setAuthModalMode, setAuthIntentText } = useAuth();
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { rootMargin: "-35% 0px -60% 0px" }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const openAuth = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setAuthIntentText(mode === "register" ? "Create a free account to download Excel to KML Pro." : "Sign in to continue.");
    setAuthModalOpen(true);
  };

  const initials = user ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "";

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-[background,box-shadow] duration-300 ${
          scrolled
            ? "bg-white/75 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.08)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 flex items-center justify-between h-16 gap-6">

          {/* ── LOGO ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group select-none">
            {/* Simple coloured square mark */}
            <div className="w-8 h-8 rounded-[9px] bg-[#0071e3] flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white">
                <path d="M3 5a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h7a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" />
              </svg>
            </div>
            {/* Word mark */}
            <span className="text-[16px] font-bold tracking-tight text-[#1d1d1f]">
              KML <span className="text-[#0071e3]">Pro</span>
            </span>
          </Link>

          {/* ── CENTRE NAV ── */}
          <nav className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = activeSection === href.slice(1);
              return (
                <a
                  key={label}
                  href={href}
                  className={`px-4 py-2 text-[13.5px] font-medium rounded-full transition-all duration-150 ${
                    isActive
                      ? "text-[#0071e3] bg-[#0071e3]/[0.09]"
                      : "text-[#1d1d1f]/65 hover:text-[#1d1d1f] hover:bg-black/[0.05]"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </nav>

          {/* ── RIGHT ACTIONS ── */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* GitHub */}
            <a
              href="https://github.com/chaudaryyabdullah03-collab/kml-convertor"
              target="_blank" rel="noopener noreferrer"
              title="GitHub"
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.06] transition-all"
            >
              <GithubIcon className="w-4 h-4" />
            </a>

            {/* Auth */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-black/[0.05] transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0071e3] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                    {initials}
                  </div>
                  <span className="text-[13px] font-medium text-[#1d1d1f] hidden sm:block">{user.name.split(" ")[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#aeaeb2] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-[260px] rounded-[18px] bg-white border border-black/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.13)] overflow-hidden z-50">
                    <div className="px-4 py-4 border-b border-[#f0f0f5]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0071e3] flex items-center justify-center text-[14px] font-bold text-white shrink-0">{initials}</div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-[#1d1d1f] truncate">{user.name}</p>
                          <p className="text-[12px] text-[#6e6e73] truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#34c759] bg-[#34c759]/10 px-2.5 py-1 rounded-full">
                        <Zap className="w-3 h-3" />
                        Licensed Surveyor
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="flex items-center justify-between px-3 py-2 text-[13px]">
                        <span className="text-[#6e6e73]">Downloads</span>
                        <span className="font-semibold text-[#0071e3]">{user.downloadCount ?? 0}</span>
                      </div>
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[#ff3b30] hover:bg-[#ff3b30]/[0.06] rounded-[12px] transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuth("login")}
                className="hidden sm:block px-4 py-2 text-[13.5px] font-medium text-[#1d1d1f]/65 hover:text-[#1d1d1f] hover:bg-black/[0.05] rounded-full transition-all"
              >
                Sign In
              </button>
            )}

            {/* Download CTA */}
            <button
              id="nav-download-btn"
              onClick={onDownloadClick}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13.5px] font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] active:scale-[0.97] rounded-full transition-all duration-150 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-[#1d1d1f]/60 hover:text-[#1d1d1f] hover:bg-black/[0.06] rounded-full transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 lg:hidden bg-black/20 backdrop-blur-sm transition-opacity duration-250 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      {/* Panel */}
      <div
        className={`fixed top-[72px] inset-x-4 z-40 lg:hidden rounded-[20px] bg-white border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.14)] overflow-hidden transition-all duration-250 origin-top ${
          mobileOpen ? "scale-y-100 opacity-100" : "scale-y-95 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="px-3 py-3 space-y-0.5">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-4 py-3 text-[15px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-[12px] transition-colors"
            >
              {label}
            </a>
          ))}
          <a
            href="https://github.com/chaudaryyabdullah03-collab/kml-convertor"
            target="_blank" rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] rounded-[12px] transition-colors"
          >
            <GithubIcon className="w-4 h-4" />
            GitHub
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-40" />
          </a>
        </nav>
        <div className="px-3 pb-4 pt-2 border-t border-[#f0f0f5] flex flex-col gap-2">
          {!user ? (
            <>
              <button
                onClick={() => { openAuth("login"); setMobileOpen(false); }}
                className="w-full py-3.5 text-[15px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#eaeaea] rounded-[14px] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { onDownloadClick(); setMobileOpen(false); }}
                className="w-full py-3.5 text-[15px] font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-[14px] flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Free
              </button>
            </>
          ) : (
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="w-full py-3.5 text-[15px] font-medium text-[#ff3b30] hover:bg-[#ff3b30]/[0.06] rounded-[14px] transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="h-16 shrink-0" />
    </>
  );
}
