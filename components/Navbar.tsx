"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  onDownloadClick: () => void;
}

export default function Navbar({ onDownloadClick }: NavbarProps) {
  const { user, logout, setAuthModalOpen, setAuthModalMode, setAuthIntentText } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setAuthIntentText(
      mode === "register"
        ? "Create a free surveyor account to download Excel to KML Pro."
        : "Sign in to your surveyor account to download Excel to KML Pro."
    );
    setAuthModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center p-1.5 shadow-xs transition-transform group-hover:scale-105">
            <Image
              src="/assets/icon.png"
              alt="Excel to KML Pro"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Excel to KML
              </span>
              <span className="bg-blue-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded tracking-wider shadow-xs">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
              Survey Benchmark Engine
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-1 text-sm font-semibold text-slate-600">
          <a
            href="#features"
            className="px-3.5 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors"
          >
            Features
          </a>
          <a
            href="#showcase"
            className="px-3.5 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors"
          >
            Live Playground
          </a>
          <a
            href="#workflow"
            className="px-3.5 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors"
          >
            How It Works
          </a>
          <a
            href="#specs"
            className="px-3.5 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors"
          >
            Specifications
          </a>
          <a
            href="#faq"
            className="px-3.5 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors"
          >
            FAQ
          </a>
          <Link
            href="/app"
            className="px-3.5 py-2 rounded-lg text-blue-600 font-bold hover:bg-blue-50 transition-colors flex items-center gap-1"
          >
            Web App
            <span className="text-xs">↗</span>
          </Link>
        </nav>

        {/* Auth & Action CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* GitHub link */}
          <a
            href="https://github.com/chaudaryyabdullah03-collab/kml-convertor"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors border border-slate-200/60"
            title="GitHub Repository"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span className="hidden lg:inline">GitHub</span>
          </a>

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block text-left pr-2">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {user.role || "Surveyor"}
                  </div>
                </div>
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 9l6 6 6-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <div className="text-xs font-bold text-slate-900">{user.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                    <div className="mt-1.5 inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Licensed Surveyor
                    </div>
                  </div>

                  <div className="px-3 py-1.5 text-xs text-slate-600 flex justify-between">
                    <span>Downloads:</span>
                    <span className="font-bold text-blue-600">{user.downloadCount || 0}</span>
                  </div>

                  {user.organization && (
                    <div className="px-3 py-1 text-xs text-slate-500 truncate">
                      🏢 {user.organization}
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAuth("login")}
                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Sign In
              </button>

              <button
                onClick={() => handleOpenAuth("register")}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/80 rounded-xl border border-blue-200/80 transition-colors"
              >
                Register
              </button>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={onDownloadClick}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <svg className="w-4 h-4 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="hidden sm:inline">Download .EXE</span>
            <span className="sm:hidden">Download</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 xl:hidden text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 shadow-lg">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Features
          </a>
          <a
            href="#showcase"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Live Playground
          </a>
          <a
            href="#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            How It Works
          </a>
          <a
            href="#specs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Specifications
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            FAQ
          </a>
          <Link
            href="/app"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-bold text-blue-600 bg-blue-50/60"
          >
            Launch Web App ↗
          </Link>
          {!user && (
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  handleOpenAuth("login");
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 text-center text-sm font-bold text-slate-700 bg-slate-100 rounded-xl"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  handleOpenAuth("register");
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 text-center text-sm font-bold text-white bg-blue-600 rounded-xl"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
