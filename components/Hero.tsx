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
import Link from "next/link";
import WebAppLink from "./WebAppLink";
import { PRODUCTS, badgeLabel } from "@/lib/products";

// Dynamically import HeroConverter with radar without SSR
const HeroConverter = dynamic(() => import("./HeroConverter"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 text-cyan-300 font-mono text-xs">
      <Globe className="w-6 h-6 animate-spin text-cyan-500" aria-hidden />
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

            {/* Version badge, then a badge for each product we spotlight (lib/products.ts) */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
            <a
              href="#download"
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50/90 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:bg-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071e3]"></span>
              </span>
              <span className="text-xs font-semibold text-slate-800">
                Excel to KML <span className="text-[#0071e3] font-bold">{versionTag}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                Windows 64-bit
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </a>
            {PRODUCTS.filter((p) => p.inHero).map((p) => (
              <Link
                key={p.id}
                href={p.href}
                className="group inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 shadow-xs hover:border-amber-300 hover:bg-amber-100/70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {badgeLabel(p) && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{badgeLabel(p)}</span>
                )}
                <span className="text-xs font-semibold text-slate-800">
                  {p.name} <span className="text-amber-700 font-bold">{p.version}</span>
                </span>
                <span className="text-amber-300">·</span>
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  {p.platform}
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
            </div>

            {/* Headline: kept short (under 70 characters) for search engines */}
            <h1 className="text-[29px] sm:text-[38px] lg:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.12] text-balance">
              Convert Geospatial Coordinate Tables into{" "}
              <span className="whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] via-[#0284c7] to-[#0ea5e9]">
                Google Earth 3D
              </span>
            </h1>
            <p className="mt-4 mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <span className="sr-only">Save as KML, KMZ and DXF with site photos and comprehensive reports</span>
              {["KML", "KMZ", "DXF"].map((f) => (
                <span
                  key={f}
                  aria-hidden
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[13px] sm:text-sm font-bold tracking-wide text-[#0071e3]"
                >
                  {f}
                </span>
              ))}
              <span aria-hidden className="text-[15px] sm:text-base font-medium text-slate-500 leading-snug">
                with site photos &amp; comprehensive reports
              </span>
            </p>

            {/* Subtitle */}
            <p className="text-base sm:text-[17px] text-slate-600 leading-relaxed mb-8 max-w-[480px]">
              Open your Excel or CSV coordinates on any grid and get a file that opens straight in Google Earth — points, boundaries and elevations in seconds, no GIS software needed.
            </p>

            {/* Action Buttons with subtle modern polish */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-8 w-full">
              <button
                onClick={onDownloadClick}
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.28)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.38)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                <span>Download for Windows</span>
                <span className="text-white text-xs font-normal">· {fileSizeText}</span>
              </button>

              <WebAppLink
                className="group inline-flex items-center justify-center gap-1.5 px-5 py-3 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl text-sm font-medium shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span>Try in browser</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </WebAppLink>
            </div>

            {/* Minimal Modern Technical Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-5 border-t border-slate-100 w-full max-w-[480px]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200/60">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>XLSX &amp; CSV Input</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200/60">
                <Globe className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>KML &amp; KMZ Output</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200/60">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>5,800+ EPSG Grids</span>
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT: Live Geospatial Coordinate Converter with Radar
             ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 w-full min-w-0 flex items-center justify-center lg:justify-end">
            <HeroConverter />
          </div>

        </div>
      </div>
    </section>
  );
}
