"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Globe,
  Layers,
  FileSpreadsheet,
  Compass,
  Camera,
  Shapes,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

interface FeatureCard {
  icon: React.ElementType;
  accent: string;
  accentLight: string;
  accentBorder: string;
  badge: string;
  title: string;
  desc: string;
  chips: string[];
}

const FEATURES: FeatureCard[] = [
  {
    icon: Globe,
    accent: "text-blue-600",
    accentLight: "bg-blue-50",
    accentBorder: "border-blue-200/70",
    badge: "Global Coverage",
    title: "Official Regional Map Grids",
    desc: "Works with government coordinate grids across UAE, Qatar, Pakistan, Saudi Arabia, the UK, and 6,800+ worldwide regions.",
    chips: ["Dubai DLTM", "Qatar QNG", "Pakistan UTM", "Saudi KSA"],
  },
  {
    icon: Layers,
    accent: "text-indigo-600",
    accentLight: "bg-indigo-50",
    accentBorder: "border-indigo-200/70",
    badge: "3D Visuals",
    title: "3D Elevations & Heights",
    desc: "Shows survey pegs with vertical lines rising from ground level, making slopes, cut-and-fill, and terrain heights easy to inspect.",
    chips: ["Vertical Pins", "Ground Anchors", "Elevation Tags"],
  },
  {
    icon: FileSpreadsheet,
    accent: "text-emerald-600",
    accentLight: "bg-emerald-50",
    accentBorder: "border-emerald-200/70",
    badge: "Instant Import",
    title: "Auto-Detects Spreadsheet Columns",
    desc: "Paste rows from Excel or open CSV files from Leica, Trimble, Topcon, or Sokkia. Auto-detects Point ID, Easting, Northing, and Elevation.",
    chips: ["Excel & CSV", "Auto Column Map", "Raw Dumps"],
  },
  {
    icon: Compass,
    accent: "text-violet-600",
    accentLight: "bg-violet-50",
    accentBorder: "border-violet-200/70",
    badge: "High Precision",
    title: "Local Site Calibration",
    desc: "Aligns local site coordinates with official control benchmarks, adjusting for scale and angle rotation with under 1 mm accuracy.",
    chips: ["Scale Match", "True North", "Under 1 mm"],
  },
  {
    icon: Shapes,
    accent: "text-amber-600",
    accentLight: "bg-amber-50",
    accentBorder: "border-amber-200/70",
    badge: "Land Boundaries",
    title: "Boundary Lines & Land Area",
    desc: "Connects survey points to draw property perimeter lines. Calculates boundary fence length and land area in square metres and hectares.",
    chips: ["Boundary Traverse", "Perimeter", "Hectares"],
  },
  {
    icon: Camera,
    accent: "text-rose-600",
    accentLight: "bg-rose-50",
    accentBorder: "border-rose-200/70",
    badge: "Site Photos",
    title: "Attach Site Inspection Photos",
    desc: "Links field photos to survey marks. Photos pack inside the file so clients click any pin in Google Earth to view the real site photo.",
    chips: ["Click-to-View", "Popup Balloons", "All-in-One KMZ"],
  },
];

function FeatureItem({ f, idx }: { f: FeatureCard; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Icon = f.icon;

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.08}s`,
      }}
    >
      <div className="group relative h-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col">
        {/* Hover accent top bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2.5px] ${f.accentLight} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500`}
        />

        <div className="p-6 sm:p-7 flex flex-col flex-1">
          {/* Icon + Badge Row */}
          <div className="flex items-start justify-between mb-5">
            <div
              className={`w-12 h-12 rounded-2xl ${f.accentLight} ${f.accent} ${f.accentBorder} border flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
            >
              <Icon className="w-5.5 h-5.5" strokeWidth={1.7} />
            </div>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
              {f.badge}
              <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-slate-400" />
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[16px] sm:text-[17px] font-bold text-slate-900 tracking-tight leading-snug mb-2.5 group-hover:text-blue-700 transition-colors duration-200">
            {f.title}
          </h3>

          {/* Description */}
          <p className="text-[13px] text-slate-500 leading-[1.7] mb-auto pb-5">
            {f.desc}
          </p>

          {/* Bottom Chips */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
            {f.chips.map((chip, i) => (
              <span
                key={i}
                className={`text-[10.5px] font-medium px-2.5 py-[5px] rounded-lg border ${f.accentBorder} ${f.accentLight} ${f.accent} opacity-80`}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-20 lg:py-28 bg-white border-b border-slate-100 overflow-hidden"
    >
      {/* Subtle gradient orbs */}
      <div className="absolute top-20 -left-40 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 -right-40 w-[500px] h-[500px] bg-indigo-100/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-[620px] mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-[11px] font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-4">
            Built for Everyday{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Surveying & Mapping</span>
              <span
                className="absolute bottom-1 left-0 right-0 h-[10px] bg-blue-200/35 rounded-sm -z-0"
                aria-hidden="true"
              />
            </span>
          </h2>
          <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed max-w-[500px] mx-auto">
            Convert field measurements from your total station or GPS rover into
            accurate, client-ready 3D models with zero guesswork.
          </p>
        </div>

        {/* 3×2 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {FEATURES.map((f, idx) => (
            <FeatureItem key={f.title} f={f} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
