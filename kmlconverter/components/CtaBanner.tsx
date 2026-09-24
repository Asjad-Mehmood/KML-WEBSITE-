"use client";

import React from "react";

interface CtaBannerProps {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
}

export default function CtaBanner({
  versionTag,
  fileSizeText,
  onDownloadClick,
}: CtaBannerProps) {
  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-center shadow-2xl shadow-blue-500/30">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Start Converting Your Survey Files Today
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto mb-8 font-normal">
            Download Excel to KML Pro ({versionTag}) for Windows or try the full web app directly in your browser. Fast, accurate, and completely free.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onDownloadClick}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-blue-50 text-blue-900 font-extrabold rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-98 cursor-pointer"
            >
              <svg className="w-5 h-5 stroke-2 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download for Windows ({fileSizeText})</span>
            </button>
            <a
              href="/app"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-700/60 hover:bg-blue-700 text-white font-bold rounded-2xl border border-blue-400/40 transition-colors"
            >
              <span>Launch Web App &rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
