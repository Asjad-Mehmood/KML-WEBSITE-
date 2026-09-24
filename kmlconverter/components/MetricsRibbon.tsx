import React from "react";

export default function MetricsRibbon() {
  return (
    <section className="py-12 border-y border-slate-200 bg-slate-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              6,864<span className="text-blue-600">+</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              National Grids &amp; EPSG Systems
            </div>
          </div>

          <div className="p-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              3.2<span className="text-blue-600"> MB</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Ultra-Lightweight Windows Installer
            </div>
          </div>

          <div className="p-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              100<span className="text-emerald-600">%</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Offline &amp; Secure (Zero Cloud Risk)
            </div>
          </div>

          <div className="p-4">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              &lt; 1<span className="text-blue-600">s</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Instant 10,000+ Point Conversion
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
