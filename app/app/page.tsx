"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import { RotateCw, Maximize2, Minimize2, ArrowLeft, Download, Loader2 } from "lucide-react";

export default function WebAppPage() {
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(Date.now());
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

  const handleReload = () => {
    setIsReloading(true);
    setIsLoading(true);
    setReloadKey(Date.now());
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans">
      {/* Top App Bar */}
      {!isFullscreen && (
        <header className="flex-none h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Website</span>
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center p-1">
                <Image
                  src="/assets/icon.png"
                  alt="Excel to KML Pro"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                Excel to KML <span className="text-blue-600">PRO</span>
              </span>
              {appConfig && (
                appConfig.isRestricted ? (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Web Demo ({appConfig.maxPoints} Pts Limit)
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Full Pro Access
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Refresh Button */}
            <button
              onClick={handleReload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer"
              title="Refresh"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${isReloading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {user ? (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 px-2">
                <span className="font-semibold text-slate-800">{user.name}</span>
                <span className="text-slate-400">({user.role || "Surveyor"})</span>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
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
              <span className="hidden sm:inline">Fullscreen</span>
            </button>

            <Link
              href="/#download"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get Desktop .EXE</span>
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
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-2xs gap-3">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <span className="text-xs font-medium text-slate-600">Loading web app...</span>
          </div>
        )}
        <iframe
          key={reloadKey}
          src={`/api/app-html?v=${reloadKey}`}
          title="Excel to KML Pro"
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
