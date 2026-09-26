"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Upload,
  MapPin,
  Download,
} from "lucide-react";

interface StepItem {
  step: string;
  number: string;
  icon: React.ElementType;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentGlow: string;
  title: string;
  desc: string;
  previewHeader: string;
  previewLines: { label: string; val: string; highlight?: boolean }[];
}

const STEPS: StepItem[] = [
  {
    step: "Step 01",
    number: "01",
    icon: Upload,
    accent: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
    accentGlow: "shadow-blue-500/10",
    title: "Import Your Spreadsheet",
    desc: "Paste rows directly from Excel or drag-and-drop raw CSV files. Auto-identifies Point ID, Easting, Northing, and Elevation columns.",
    previewHeader: "Spreadsheet Input",
    previewLines: [
      { label: "Format", val: "Excel (.xlsx) or CSV" },
      { label: "Columns", val: "Point, East, North, Elev", highlight: true },
      { label: "Header", val: "Auto-detected ✓" },
    ],
  },
  {
    step: "Step 02",
    number: "02",
    icon: MapPin,
    accent: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    accentGlow: "shadow-emerald-500/10",
    title: "Choose Your Map Grid",
    desc: "Select country or EPSG coordinate system — Dubai DLTM, Qatar QNG, Pakistan UTM, or UK Grid. Datum shifts calculate automatically.",
    previewHeader: "Coordinate Datum",
    previewLines: [
      { label: "Target Grid", val: "EPSG:3997 (Dubai DLTM)", highlight: true },
      { label: "Ellipsoid", val: "Direct WGS84 Shift" },
      { label: "Accuracy", val: "Under 1 mm precision" },
    ],
  },
  {
    step: "Step 03",
    number: "03",
    icon: Download,
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentGlow: "shadow-amber-500/10",
    title: "Export KML or KMZ File",
    desc: "Save a KML or KMZ with your points, boundary lines and photo balloons. Opens straight in Google Earth and GIS software.",
    previewHeader: "Deliverable",
    previewLines: [
      { label: "Export", val: "Survey_Project.kmz", highlight: true },
      { label: "Placemarks", val: "Level in every balloon" },
      { label: "Compatibility", val: "Google Earth Pro & Web" },
    ],
  },
];

function AnimatedStep({
  s,
  idx,
  isLast,
}: {
  s: StepItem;
  idx: number;
  isLast: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
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
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Icon = s.icon;

  return (
    <li
      ref={ref}
      // Reduced-motion users see the step immediately, without the reveal animation
      className="relative flex flex-col items-center motion-reduce:!opacity-100 motion-reduce:!transform-none motion-reduce:!transition-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.15}s`,
      }}
    >
      {/* Card */}
      <div
        className={`
          relative w-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden
          shadow-sm hover:shadow-xl ${s.accentGlow}
          transition-all duration-500 ease-out group
        `}
      >
        {/* Top accent line */}
        <div
          className={`absolute top-0 left-0 right-0 h-[3px] ${s.accentBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          style={{
            background:
              idx === 0
                ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
                : idx === 1
                ? "linear-gradient(90deg, #10b981, #34d399)"
                : "linear-gradient(90deg, #f59e0b, #fbbf24)",
          }}
        />

        <div className="p-6 sm:p-7">
          {/* Step Number & Icon Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`
                  w-11 h-11 rounded-2xl ${s.accentBg} ${s.accent} ${s.accentBorder}
                  flex items-center justify-center border
                  group-hover:scale-110 transition-transform duration-300
                `}
              >
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[10px] font-bold font-mono uppercase tracking-[0.15em] text-slate-500">
                  {s.step}
                </div>
                <h3 className="text-[15px] sm:text-base font-bold text-slate-900 leading-tight">
                  {s.title}
                </h3>
              </div>
            </div>

            {/* Large step number watermark */}
            <span
              aria-hidden="true"
              data-n={s.number}
              className={`text-[52px] font-black leading-none ${s.accent} opacity-[0.06] select-none pointer-events-none before:content-[attr(data-n)]`}
            />
          </div>

          {/* Description */}
          <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
            {s.desc}
          </p>

          {/* Technical Preview Box */}
          <div className="bg-slate-50/90 rounded-xl border border-slate-200/60 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200/50 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {s.previewHeader}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {s.previewLines.map((line, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 text-[11.5px]"
                >
                  <span className="text-slate-500 shrink-0">{line.label}</span>
                  <span
                    className={`font-mono font-semibold text-right truncate ${
                      line.highlight ? "text-slate-900" : "text-slate-600"
                    }`}
                  >
                    {line.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connector Arrow (between cards on md+) */}
      {!isLast && (
        <div aria-hidden="true" className="hidden md:flex absolute -right-[22px] top-1/2 -translate-y-1/2 z-10 w-[44px] items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      )}

      {/* Connector Arrow (between cards on mobile) */}
      {!isLast && (
        <div aria-hidden="true" className="flex md:hidden my-4 items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center rotate-90">
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      )}
    </li>
  );
}

export default function Workflow() {
  return (
    <section
      id="workflow"
      className="relative py-20 lg:py-28 bg-[#fafbfc] border-b border-slate-100 overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-[600px] mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-[11px] font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Three-Step Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.15]">
            From Raw Data to{" "}
            <span className="relative">
              <span className="relative z-10">3D Models</span>
              <span
                className="absolute bottom-0.5 left-0 right-0 h-[10px] bg-blue-200/40 rounded-sm -z-0"
                aria-hidden="true"
              />
            </span>
          </h2>
          <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed max-w-[480px] mx-auto">
            Three simple steps to transform coordinate tables into georeferenced
            Google Earth deliverables — no complex GIS setup required.
          </p>
        </div>

        {/* Steps Grid */}
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">
          {STEPS.map((s, idx) => (
            <AnimatedStep
              key={s.step}
              s={s}
              idx={idx}
              isLast={idx === STEPS.length - 1}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
