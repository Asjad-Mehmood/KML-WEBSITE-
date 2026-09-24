"use client";

import React from "react";
import { 
  Download, 
  ChevronRight, 
  FileSpreadsheet, 
  Layers,
  Globe
} from "lucide-react";
import ThreeMapHero from "./ThreeMapHero";

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
              LEFT: Minimal, Balanced Typography & Actions
             ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            
            {/* Version Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 mb-5">
              <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
              <span className="text-xs font-semibold text-slate-700">
                Excel to KML Pro <span className="text-[#0071e3]">{versionTag}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">Windows 64-bit</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-slate-900 leading-[1.18] mb-4">
              Convert Survey Spreadsheets into{" "}
              <span className="text-[#0071e3]">
                Google Earth 3D Models
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base text-slate-600 leading-relaxed mb-7 max-w-[460px]">
              Instantly turn raw Excel and CSV coordinates into georeferenced KML &amp; KMZ files with 6,864 national EPSG datums, Helmert 2D transformation, and true elevation extrusion.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-8 w-full sm:w-auto">
              <button 
                onClick={onDownloadClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download for Windows</span>
                <span className="text-blue-200 text-xs font-normal">({fileSizeText})</span>
              </button>

              <a 
                href="#showcase"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium transition-all"
              >
                <span>Live Demo</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Minimal Technical Specs */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-5 border-t border-slate-100 w-full max-w-[460px]">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                XLSX &amp; CSV
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Globe className="w-3.5 h-3.5 text-[#0071e3]" />
                KML &amp; KMZ Output
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                6,864 EPSG Grids
              </span>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT: Interactive 3D Geospatial Map Canvas (Three.js)
             ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 w-full flex items-center justify-center lg:justify-end">
            <ThreeMapHero />
          </div>

        </div>
      </div>
    </section>
  );
}
