"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const PHASES = [
  "Initializing coordinates...",
  "Loading 6,864 EPSG grids...",
  "Calibrating geodetic engine...",
  "Ready",
];

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("kml_preloader_seen");
    const duration = hasSeen ? 400 : 900; // fast and snappy
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 35) {
        setPhaseIndex(0);
      } else if (pct < 70) {
        setPhaseIndex(1);
      } else if (pct < 95) {
        setPhaseIndex(2);
      } else {
        setPhaseIndex(3);
      }

      if (pct >= 100) {
        clearInterval(interval);
        sessionStorage.setItem("kml_preloader_seen", "true");
        setFadeOut(true);
        setTimeout(() => setVisible(false), 400);
      }
    }, 20);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#fafbfc]/90 backdrop-blur-xl transition-all duration-400 ease-out select-none ${
        fadeOut ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Soft ambient center glow */}
      <div className="absolute w-80 h-80 rounded-full bg-blue-500/[0.07] blur-[80px] pointer-events-none" />

      {/* Floating Modern White Card */}
      <div className="relative flex flex-col items-center bg-white/95 px-8 py-7 rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.02)] min-w-[280px] sm:min-w-[320px]">
        
        {/* App Icon with subtle status dot */}
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 p-2.5 flex items-center justify-center shadow-xs">
            <Image
              src="/assets/icon.png"
              alt="Excel to KML Pro"
              width={38}
              height={38}
              className="object-contain"
              priority
            />
          </div>
          {/* Active GPS sync indicator */}
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
        </div>

        {/* Wordmark */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-base font-bold text-slate-900 tracking-tight">
              Excel to KML
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded-md">
              PRO
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-1 transition-all duration-150">
            {PHASES[phaseIndex]}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full space-y-2">
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5">
            <span className="text-slate-400">EPSG · WGS84</span>
            <span className="font-semibold text-blue-600">{progress}%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
