import React from "react";
import { Globe, Crosshair, Zap, Layers } from "lucide-react";

const METRICS = [
  {
    icon: Globe,
    value: "6,800+",
    label: "Map Datums Supported",
    detail: "Global EPSG coordinate systems",
  },
  {
    icon: Crosshair,
    value: "< 1 mm",
    label: "Calculation Precision",
    detail: "Sub-millimeter transformation math",
  },
  {
    icon: Zap,
    value: "10,000+",
    label: "Points Per Second",
    detail: "Instant batch spreadsheet processing",
  },
  {
    icon: Layers,
    value: "KML & KMZ",
    label: "3D Earth Formats",
    detail: "Google Earth & GIS compatible",
  },
];

export default function MetricsRibbon() {
  return (
    <section className="border-y border-slate-100 bg-[#f8fafc] py-10 sm:py-12">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/60">
          {METRICS.map(({ icon: Icon, value, label, detail }, idx) => (
            <div
              key={label}
              className={`flex flex-col items-center text-center ${
                idx > 0 ? "pt-5 lg:pt-0 lg:pl-6" : ""
              }`}
            >
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 mb-2.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                {value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-800 mt-1">
                {label}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
