"use client";

import React from "react";
import { Download, ArrowRight, Sparkles, WifiOff, ShieldCheck, Globe } from "lucide-react";

interface CtaBannerProps {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
}

export default function CtaBanner({ versionTag, fileSizeText, onDownloadClick }: CtaBannerProps) {
  const displayVersion = versionTag.startsWith("v") ? versionTag : `v${versionTag}`;

  return (
    <section className="py-16 lg:py-24 bg-[#fafbfc] border-b border-slate-100" aria-labelledby="cta-heading">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0a1638] via-[#0d2a6b] to-[#0058b0] px-6 py-12 sm:px-12 sm:py-16 text-center shadow-[0_24px_60px_-24px_rgba(0,88,176,0.55)]">
          {/* Contour-line texture + glow */}
          <svg
            aria-hidden
            className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none"
            preserveAspectRatio="xMidYMid slice"
            viewBox="0 0 800 400"
          >
            {[60, 110, 160, 210, 260, 310].map((r) => (
              <ellipse key={r} cx="680" cy="340" rx={r * 1.6} ry={r} fill="none" stroke="white" strokeWidth="1" />
            ))}
            {[50, 95, 140].map((r) => (
              <ellipse key={r} cx="90" cy="40" rx={r * 1.4} ry={r} fill="none" stroke="white" strokeWidth="1" />
            ))}
          </svg>
          <div
            aria-hidden
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[radial-gradient(closest-side,rgba(10,132,255,0.35),transparent)] pointer-events-none"
          />

          <div className="relative max-w-[640px] mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-blue-100 text-[11px] font-semibold uppercase tracking-wider mb-5">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Get Started Free</span>
            </div>

            <h2
              id="cta-heading"
              className="text-[28px] sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white mb-4 leading-[1.12]"
            >
              Ready to convert your survey spreadsheets to 3D?
            </h2>

            <p className="text-sm sm:text-base text-blue-100/80 mb-8 max-w-[500px] mx-auto leading-relaxed">
              Download Excel to KML Pro {displayVersion} for Windows. Free to use for field surveyors, civil engineers, and GIS specialists.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                onClick={onDownloadClick}
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-[#0058b0] bg-white hover:bg-blue-50 active:translate-y-0.5 rounded-xl shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d2a6b]"
              >
                <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                <span>Download for Windows</span>
                <span className="text-[#0058b0]/60 text-xs font-normal">· {fileSizeText}</span>
              </button>

              <a
                href="/app"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 rounded-xl border border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d2a6b]"
              >
                <Globe className="w-4 h-4 text-blue-200" />
                <span>Launch Web App</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-blue-100/75">
              <li className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-emerald-300" />
                Works 100% offline
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                Data never leaves your PC
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-mono text-blue-200">{displayVersion}</span>
                <span className="text-blue-100/40">·</span>
                Windows 10 / 11
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
