"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import {
  Download,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Shield,
  LayoutDashboard,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

// Absolute paths so the links also work from /faq and other pages
// id: a home-page section (highlighted while in view); path: a page section of its own
const NAV_LINKS: { label: string; href: string; id?: string; path?: string }[] = [
  { label: "Features", href: "/#features", id: "features" },
  { label: "Demo", href: "/#showcase", id: "showcase" },
  { label: "Grids", href: "/convert", path: "/convert" },
  { label: "Guides", href: "/guides", path: "/guides" },
];

export default function Navbar({ onDownloadClick }: { onDownloadClick: () => void }) {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Highlight the nav link of the section currently in view
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => (l.id ? document.getElementById(l.id) : null)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Mobile menu: close on Escape and stop the page scrolling behind it
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileMenuOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  // Leaving a signed-in-only page after signing out
  const signOut = async () => {
    await logout();
    if (pathname?.startsWith("/dashboard")) router.push("/");
  };

  // Sign in goes to the login page, which returns the visitor here afterwards
  // (from the home page no ?next= is needed: home is the default after sign-in)
  const loginHref = pathname && pathname !== "/login" && pathname !== "/" ? `/login?next=${encodeURIComponent(pathname)}` : "/login";

  const initials = user ? user.name.substring(0, 2).toUpperCase() : "";

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 pt-4 sm:pt-6 px-4 sm:px-6 pointer-events-none flex justify-center transition-all duration-500">
        {/* The Floating Pill */}
        <div
          className={`pointer-events-auto w-full max-w-5xl rounded-full transition-all duration-500 flex items-center justify-between p-1.5 ${scrolled
            ? "bg-white/85 backdrop-blur-2xl border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
            : "bg-white/50 backdrop-blur-md border border-white/40 shadow-lg shadow-black/[0.03]"
            }`}
        >
          {/* Logo */}
          <Link
            href="/"
            aria-label="Excel to KML — home"
            className="flex items-center pl-1.5 pr-3 sm:pr-4 py-1 rounded-full hover:bg-black/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden bg-gradient-to-tr from-slate-800 to-slate-950 shadow-inner flex items-center justify-center">
              <Image src="/assets/icon.png" alt="" width={32} height={32} className="w-full h-full object-contain p-0.5" priority />
            </span>
            <span className="ml-2.5 hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-extrabold text-[15px] tracking-tight text-slate-900">Excel to KML</span>
            </span>
          </Link>

          {/* Center Links */}
          <nav aria-label="Main" className="hidden md:flex items-center gap-0.5 lg:gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = link.path ? Boolean(pathname?.startsWith(link.path)) : activeId === link.id;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={isActive ? (link.path ? "page" : "location") : undefined}
                  className={`whitespace-nowrap px-2.5 lg:px-3 xl:px-4 py-2 text-[14px] font-semibold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive ? "text-slate-900 bg-black/[0.05]" : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 pr-1">
            <a
              href="https://github.com/Asjad-Mehmood/kml-convertor/releases"
              target="_blank"
              rel="noreferrer"
              aria-label="Excel to KML releases on GitHub"
              title="Releases on GitHub"
              className="w-9 h-9 items-center justify-center rounded-full hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-colors hidden sm:flex md:hidden lg:flex"
            >
              <GithubIcon className="w-4 h-4" />
            </a>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-black/5 hover:bg-black/[0.03] transition-all bg-white shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0071e3] to-[#34aadc] text-white flex items-center justify-center text-xs font-bold shadow-sm">{initials}</div>
                  <span className="text-sm font-semibold text-slate-700">{user.name.split(" ")[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] overflow-hidden animate-in slide-in-from-top-2">
                    <div className="p-4 bg-slate-50/80 border-b border-black/[0.05]">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" /> My Dashboard
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4 text-blue-600" /> Admin Panel
                        </Link>
                      )}
                      <button onClick={() => { signOut(); setDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href={loginHref} className="hidden sm:block whitespace-nowrap px-3 lg:px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                Sign in
              </Link>
            )}

            <button
              onClick={onDownloadClick}
              className="bg-[#0071e3] text-white px-4 lg:px-5 py-2 rounded-full text-sm font-bold shadow-md shadow-[#0071e3]/20 hover:shadow-lg hover:shadow-[#0071e3]/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="w-10 h-10 flex md:hidden items-center justify-center rounded-full bg-slate-100 text-slate-900 shadow-sm border border-black/5"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Fullscreen Overlay */}
      <div
        id="mobile-menu"
        // Closed menu is invisible; inert also keeps its links out of the tab order
        inert={!mobileMenuOpen}
        className={`fixed inset-0 z-40 bg-white transition-all duration-400 ease-in-out flex flex-col md:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-4"}`}
      >
        <div className="flex-1 overflow-y-auto pt-28 px-6 pb-6 flex flex-col">
          <nav aria-label="Main" className="flex flex-col gap-6 flex-1">
            {NAV_LINKS.map(link => (
              <Link key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-between group">
                <span>{link.label}</span>
                <ChevronDown className="w-6 h-6 -rotate-90 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-[#0071e3]" />
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-4">
            {!user ? (
              <Link href={loginHref} onClick={() => setMobileMenuOpen(false)} className="w-full py-4 rounded-2xl bg-slate-100 text-slate-900 border border-black/5 font-bold text-lg text-center active:scale-95 transition-transform">
                Sign In
              </Link>
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-sm">
                <p className="text-sm text-slate-500 mb-1">Signed in as</p>
                <p className="font-bold text-slate-900 text-lg mb-2">{user.name}</p>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 mb-2 rounded-xl bg-slate-100 text-slate-900 font-bold flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" /> My Dashboard
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 mb-2 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Go to Admin Panel
                  </Link>
                )}
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="w-full py-3 rounded-xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
