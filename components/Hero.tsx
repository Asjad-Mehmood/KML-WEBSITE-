"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  Download,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  Globe,
  ArrowRight
} from "lucide-react";

// Dynamically import HeroConverter with radar without SSR
const HeroConverter = dynamic(() => import("./HeroConverter"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-2xl bg-slate-950 border border-slate-800 animate-pulse flex flex-col items-center justify-center gap-2 text-cyan-400 font-mono text-xs">
      <Globe className="w-6 h-6 animate-spin text-cyan-500" />
      <span>Loading Coordinate Converter...</span>
    </div>
  ),
});

interface HeroProps {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
}

export default function Hero({ versionTag, fileSizeText, onDownloadClick }: HeroProps) {
  return (
    <section className="relative pt-24 pb-14 md:pt-28 md:pb-16 lg:pt-32 lg:pb-20 overflow-hidden bg-white border-b border-slate-100">
      {/* Subtle Ambient Light */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-blue-50/50 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">

          {/* ══════════════════════════════════════════════════════════════════
              LEFT: Minimal, Modern & Balanced Typography
             ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">

            {/* Modern Version Badge */}
            <div className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50/90 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all mb-6">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071e3]"></span>
              </span>
              <span className="text-xs font-semibold text-slate-800">
                Excel to KML Pro <span className="text-[#0071e3] font-bold">{versionTag}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                Windows 64-bit
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.16] mb-4">
              Convert Survey Spreadsheets into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] via-[#0284c7] to-[#0ea5e9]">
                Google Earth 3D Models
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-[480px]">
              Convert survey coordinates directly from Excel or CSV into ready-to-view Google Earth files. Visualize points, boundaries, and 3D elevations in seconds—no complex GIS software required.
            </p>

            {/* Action Buttons with subtle modern polish */}
            <div className="flex flex-wrap items-center gap-3 mb-8 w-full sm:w-auto">
              <button
                onClick={onDownloadClick}
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.28)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.38)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                <span>Download for Windows</span>
                <span className="text-blue-100 text-xs font-normal">({fileSizeText})</span>
              </button>

              <a
                href={`/app?web=true`}
                className="group inline-flex items-center justify-center gap-1.5 px-5 py-3 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl text-sm font-medium shadow-xs transition-all duration-200"
              >
                <span>Try In Browser</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            {/* Minimal Modern Technical Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-5 border-t border-slate-100 w-full max-w-[480px]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200/60">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>XLSX &amp; CSV Input</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 text-blue-800 text-xs font-medium border border-blue-200/60">
                <Globe className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>KML &amp; KMZ Output</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200/60">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>6,864 EPSG Grids</span>
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT: Live Geospatial Coordinate Converter with Radar
             ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 w-full flex items-center justify-center lg:justify-end">
            <HeroConverter />
          </div>

        </div>
      </div>
    </section>
  );
}
