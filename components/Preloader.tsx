"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("kml_preloader_seen");
    const duration = hasSeen ? 300 : 750; // fast and unobtrusive
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        sessionStorage.setItem("kml_preloader_seen", "true");
        setFadeOut(true);
        setTimeout(() => setVisible(false), 300);
      }
    }, 16);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-300 ease-out select-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-3.5">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/90 p-2 flex items-center justify-center shadow-xs">
          <Image
            src="/assets/icon.png"
            alt="Excel to KML Pro"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
            Excel to KML <span className="text-blue-600">Pro</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Loading...</p>
        </div>

        {/* Clean, Simple Progress Line */}
        <div className="w-36 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
