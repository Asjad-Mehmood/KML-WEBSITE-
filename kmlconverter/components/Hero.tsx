"use client";

import React from "react";

interface HeroProps {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
}

export default function Hero({ versionTag, fileSizeText, onDownloadClick }: HeroProps) {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-white">
      {/* Soft Ambient Highlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/40 via-sky-50/30 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200 text-blue-800 text-xs font-semibold mb-8 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span>Latest Release</span>
          <span className="font-mono bg-blue-600 text-white px-2 py-0.5 rounded text-[11px]">
            {versionTag}
          </span>
          <span className="text-slate-300">•</span>
          <span>Windows 64-bit</span>
          <span className="text-slate-300">•</span>
          <span>Edge WebView2</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 tracking-tight leading-[1.1] max-w-4xl mx-auto mb-6">
          Convert Survey Sheets to <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
            Google Earth KML &amp; KMZ
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed font-normal mb-10">
          Turn raw CSV, total station exports, and Excel benchmark tables into rich 3D Google Earth Placemarks,
          boundary polygons, and geotagged photo reports. Powered by{" "}
          <strong className="text-slate-900 font-semibold">6,864 national EPSG grids</strong> &mdash; 100% offline
          on your machine.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto mb-12">
          <button
            onClick={onDownloadClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="w-6 h-6 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <div className="text-left">
              <div className="text-base leading-snug">Download for Windows</div>
              <div className="text-xs font-normal text-blue-100">
                {versionTag} • Installer • {fileSizeText}
              </div>
            </div>
          </button>

          <a
            href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border border-slate-200/90 shadow-xs transition-all hover:border-slate-300"
          >
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
            </svg>
            <span>Launch Web App</span>
          </a>

          <a
            href="#showcase"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold rounded-2xl border border-slate-200/60 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Interactive Demo</span>
          </a>
        </div>

        {/* Value Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            <svg className="w-4 h-4 text-emerald-600 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>100% Offline &amp; Private</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
            <svg className="w-4 h-4 text-blue-600 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>6,864 EPSG Grids</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            <svg className="w-4 h-4 text-amber-600 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Helmert 2D Site Fit</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800">
            <svg className="w-4 h-4 text-purple-600 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>KMZ Photo Balloons</span>
          </div>
        </div>
      </div>
    </section>
  );
}
