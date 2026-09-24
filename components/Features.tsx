"use client";

import React from "react";
import { 
  Globe, 
  Layers, 
  FileSpreadsheet, 
  Compass, 
  Camera, 
  Shapes,
  Sparkles
} from "lucide-react";

interface FeatureCard {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge: string;
  title: string;
  desc: string;
  chips: string[];
}

const FEATURES: FeatureCard[] = [
  {
    icon: Globe,
    iconBg: "bg-blue-50/90 border-blue-100",
    iconColor: "text-blue-600",
    badge: "Global Coverage",
    title: "Official Regional Map Grids",
    desc: "Works with government coordinate grids across UAE, Qatar, Pakistan, Saudi Arabia, the UK, and 6,800+ worldwide regions. Points land in the exact real-world location.",
    chips: ["Dubai DLTM", "Qatar QNG", "Pakistan UTM", "Saudi KSA"],
  },
  {
    icon: Layers,
    iconBg: "bg-indigo-50/90 border-indigo-100",
    iconColor: "text-indigo-600",
    badge: "3D Visuals",
    title: "3D Elevations & Heights",
    desc: "Shows your survey pegs with vertical lines rising from the ground, making ground slopes, cut-and-fill levels, and terrain heights easy to inspect in 3D.",
    chips: ["Vertical Height Pins", "Ground-Level Anchors", "Elevation Tags"],
  },
  {
    icon: FileSpreadsheet,
    iconBg: "bg-emerald-50/90 border-emerald-100",
    iconColor: "text-emerald-600",
    badge: "Instant Import",
    title: "Auto-Detects Spreadsheet Columns",
    desc: "Paste rows directly from Excel or open raw CSV files from Leica, Trimble, Topcon, or Sokkia. Automatically detects Point ID, Easting, Northing, and Elevation.",
    chips: ["Excel & CSV Files", "Auto Column Mapping", "Raw Instrument Dumps"],
  },
  {
    icon: Compass,
    iconBg: "bg-violet-50/90 border-violet-100",
    iconColor: "text-violet-600",
    badge: "High Precision",
    title: "Local Site Calibration",
    desc: "Aligns local site coordinates with official government control benchmarks, adjusting for scale and angle rotation with under 1mm verification accuracy.",
    chips: ["Ground Scale Match", "True North Alignment", "Under 1mm Accuracy"],
  },
  {
    icon: Shapes,
    iconBg: "bg-amber-50/90 border-amber-100",
    iconColor: "text-amber-600",
    badge: "Land Boundaries",
    title: "Boundary Lines & Land Area",
    desc: "Connects survey points to draw property perimeter lines in Google Earth. Automatically calculates total boundary fence length and land area in square metres and hectares.",
    chips: ["Property Boundary Traverses", "Perimeter Distance", "Hectares & Acres"],
  },
  {
    icon: Camera,
    iconBg: "bg-rose-50/90 border-rose-100",
    iconColor: "text-rose-600",
    badge: "Site Photos",
    title: "Attach Site Inspection Photos",
    desc: "Links field photos directly to your survey marks. Photos are packed inside the file so clients or engineers can click any pin in Google Earth to view the real site photo.",
    chips: ["Click-to-View Photos", "Info Popup Balloons", "All-in-One KMZ File"],
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 lg:py-24 bg-white border-b border-slate-100">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        
        {/* Section Header with Refined Typography */}
        <div className="text-center max-w-[640px] mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[38px] font-extrabold tracking-tight text-slate-900 leading-[1.18] mb-3.5">
            Built for Everyday Surveying &amp; Mapping
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Convert field measurements from your total station or GPS rover into accurate, client-ready 3D models with zero guesswork.
          </p>
        </div>

        {/* Premium Compact 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div 
                key={f.title}
                className="group p-6 sm:p-7 rounded-2xl bg-[#fafbfc] border border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Refined Icon + Modern Category Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs ${f.iconBg} ${f.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                      {f.badge}
                    </span>
                  </div>

                  {/* Title & Description with Clear Typographic Hierarchy */}
                  <h3 className="text-[17px] sm:text-lg font-bold text-slate-900 tracking-tight leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-[13px] sm:text-[13.5px] text-slate-600 leading-[1.65] mb-5">
                    {f.desc}
                  </p>
                </div>

                {/* Bottom Micro-Pills: Meaningful Real Capabilities */}
                <div className="pt-3.5 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                  {f.chips.map((chip, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
