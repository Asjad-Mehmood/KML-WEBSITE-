"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import { WEB_APP_LOGIN_URL } from "@/lib/authRedirect";
import { RotateCw, Maximize2, Minimize2, ArrowLeft, Download, Loader2 } from "lucide-react";

export default function WebAppClient() {
  const { user, isLoading: authLoading } = useAuth();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [appConfig, setAppConfig] = useState<{
    isRestricted: boolean;
    hasFullAccess: boolean;
    maxPoints: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAppConfig({
            isRestricted: data.isRestricted,
            hasFullAccess: data.hasFullAccess,
            maxPoints: data.maxPoints,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  // The iframe's load event can fire before React attaches onLoad (a slow
  // phone often finishes the frame first), and it also waits for every map
  // tile. So also watch the frame's document and hide the overlay as soon as
  // the app has been parsed, with a timeout as a last resort.
  useEffect(() => {
    const done = () => {
      setIsLoading(false);
      setIsReloading(false);
    };
    const check = setInterval(() => {
      try {
        const doc = frameRef.current?.contentDocument;
        if (doc && doc.URL !== "about:blank" && doc.readyState !== "loading" && doc.body?.childElementCount) done();
      } catch {
        // not readable (shouldn't happen, same origin): leave it to onLoad
      }
    }, 250);
    const giveUp = setTimeout(done, 15000);
    return () => {
      clearInterval(check);
      clearTimeout(giveUp);
    };
  }, [reloadKey]);

  const handleReload = () => {
    setIsReloading(true);
    setIsLoading(true);
    setReloadKey(Date.now());
  };

  return (
    <div className="flex flex-col h-screen h-dvh w-screen overflow-hidden bg-white text-slate-900 font-sans">
      {/* Top App Bar */}
      {!isFullscreen && (
        <header className="flex-none h-14 bg-white border-b border-slate-200 px-2 sm:px-4 flex items-center justify-between gap-2 z-30 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              aria-label="Back to website"
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-slate-600 hover:text-blue-600 px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Website</span>
            </Link>

            <div className="hidden sm:block h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center p-1">
                <Image
                  src="/assets/icon.png"
                  alt="Excel to KML"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <span className="hidden sm:inline whitespace-nowrap font-extrabold text-sm text-slate-900 tracking-tight">
                Excel to KML
              </span>
              {appConfig && (
                appConfig.isRestricted ? (
                  <span className="hidden xl:inline-flex whitespace-nowrap items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Web Demo ({appConfig.maxPoints} Pts Limit)
                  </span>
                ) : (
                  <span className="hidden xl:inline-flex whitespace-nowrap items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Full access
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Refresh Button */}
            <button
              onClick={handleReload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer"
              title="Refresh"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${isReloading ? "animate-spin" : ""}`} />
              <span className="hidden lg:inline">Refresh</span>
            </button>

            {user ? (
              <div className="hidden lg:flex whitespace-nowrap items-center gap-2 text-xs text-slate-600 px-2">
                <span className="font-semibold text-slate-800">{user.name}</span>
                <span className="text-slate-400">({user.role || "Surveyor"})</span>
              </div>
            ) : authLoading ? null : (
              <Link
                href={WEB_APP_LOGIN_URL}
                className="whitespace-nowrap text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Fullscreen</span>
            </button>

            <Link
              href="/download"
              aria-label="Get the Windows desktop app"
              className="whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Get Desktop .EXE</span>
              <span className="sm:hidden">.EXE</span>
            </Link>
          </div>
        </header>
      )}

      {/* Floating Exit Fullscreen Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-3 right-3 z-50 bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Fullscreen</span>
        </button>
      )}

      {/* Main Web App Frame */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-slate-50">
        {isLoading && (
          <div className="app-loader absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-2xs gap-3">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <span className="text-xs font-medium text-slate-600">Loading web app...</span>
          </div>
        )}
        <iframe
          key={reloadKey}
          ref={frameRef}
          src={`/api/app-html?v=${reloadKey}`}
          title="Excel to KML"
          className="w-full h-full border-0 absolute inset-0"
          allow="clipboard-read; clipboard-write; geolocation"
          onLoad={() => {
            setIsLoading(false);
            setIsReloading(false);
          }}
        />
      </main>
    </div>
  );
}
