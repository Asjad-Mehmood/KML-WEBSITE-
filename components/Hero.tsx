"use client";

import React from "react";
import { Download, ChevronRight } from "lucide-react";

interface HeroProps {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
}

export default function Hero({ versionTag, fileSizeText, onDownloadClick }: HeroProps) {
  return (
    <section className="relative pt-20 pb-28 md:pt-28 md:pb-36 overflow-hidden bg-white">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_80%)]" />

      {/* Top gradient */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-[#d2d2d7]" />

      <div className="relative max-w-[980px] mx-auto px-5 sm:px-8 text-center">

        {/* Release pill */}
        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-[12px] font-medium text-[#6e6e73]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse-soft" />
          Latest Release &nbsp;
          <span className="font-semibold text-[#1d1d1f]">{versionTag}</span>
          <span className="mx-1 text-[#d2d2d7]">·</span>
          <span>Windows 64-bit</span>
        </div>

        {/* Headline */}
        <h1 className="text-[48px] sm:text-[64px] lg:text-[80px] font-bold tracking-tight leading-[1.05] text-[#1d1d1f] mb-6">
          Survey Sheets to<br />
          <span className="text-[#0071e3]">Google Earth KML.</span>
        </h1>

        {/* Sub */}
        <p className="max-w-[620px] mx-auto text-[17px] sm:text-[19px] text-[#6e6e73] leading-relaxed font-normal mb-10">
          Turn raw CSV, Excel, and total station exports into rich 3D KML &amp; KMZ with{" "}
          <strong className="text-[#1d1d1f] font-semibold">6,864 national EPSG grids</strong>. Runs completely offline.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button onClick={onDownloadClick}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-[17px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] rounded-full transition-colors duration-150 shadow-md"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <div>Download for Windows</div>
              <div className="text-[11px] text-blue-200 font-normal">{versionTag} · {fileSizeText}</div>
            </div>
          </button>

          <a href="#showcase"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[17px] font-medium text-[#0071e3] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors duration-150"
          >
            Try Live Demo
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-medium text-[#6e6e73]">
          {[
            { dot: "#34c759", label: "100% Offline & Private" },
            { dot: "#0071e3", label: "6,864 EPSG Grids" },
            { dot: "#ff9f0a", label: "Helmert 2D Calibration" },
            { dot: "#bf5af2", label: "KMZ Photo Balloons" },
          ].map(({ dot, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
