"use client";

import React from "react";
import { Download, ArrowRight, Sparkles } from "lucide-react";
import WebAppLink from "./WebAppLink";

interface CtaBannerProps {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
}

export default function CtaBanner({ versionTag, onDownloadClick }: CtaBannerProps) {
  return (
    <section className="py-20 lg:py-24 bg-[#fafbfc] border-b border-slate-100">
      <div className="max-w-[760px] mx-auto px-5 sm:px-8 text-center">
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Get Started Free</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 mb-4 leading-tight">
          Ready to convert your survey spreadsheets to 3D?
        </h2>

        <p className="text-sm sm:text-base text-slate-600 mb-8 max-w-[540px] mx-auto leading-relaxed">
          Download Excel to KML {versionTag} for Windows. Free to use for field surveyors, civil engineers, and GIS specialists.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button 
            onClick={onDownloadClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] active:translate-y-0.5 rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.28)] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download for Windows</span>
          </button>

          <WebAppLink
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/90 shadow-xs transition-colors"
          >
            <span>Launch Web App</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </WebAppLink>
        </div>

      </div>
    </section>
  );
}
