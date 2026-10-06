"use client";

import React, { useRef, useEffect, useState } from "react";
import FeatureDetailDialog, { type DialogTheme } from "./FeatureDetailDialog";
import {
  Camera,
  Sparkles,
  Search,
  CheckCircle2,
  Info,
} from "lucide-react";

import { FEATURES, type FeatureCard } from "@/lib/featureGroups";

const GRID_PREVIEW = [
  { name: "Qatar National Grid", epsg: "EPSG:2932" },
  { name: "Dubai DLTM", epsg: "EPSG:3997" },
  { name: "Pakistan UTM 42N", epsg: "EPSG:32642" },
  { name: "Saudi Arabia UTM 38N", epsg: "EPSG:32638" },
];

function GridsPreview({ onOpen }: { onOpen: (name: string) => void }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 overflow-hidden">
      <div aria-hidden className="flex items-center gap-2 px-3.5 py-2 border-b border-slate-200/70 bg-white">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] text-slate-500">Search grid or EPSG code…</span>
      </div>
      <ul className="divide-y divide-slate-200/60">
        {GRID_PREVIEW.map((g, i) => (
          <li key={g.epsg}>
            <button
              type="button"
              onClick={() => onOpen(g.name)}
              aria-haspopup="dialog"
              className={`group/row w-full flex items-center justify-between gap-3 px-3.5 py-2 text-[12px] text-left cursor-pointer transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                i === 0 ? "bg-blue-50/70" : ""
              }`}
            >
              <span className={`flex items-center gap-2 ${i === 0 ? "text-blue-800 font-semibold" : "text-slate-700"}`}>
                {i === 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> : <span className="w-3.5" />}
                {g.name}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-[10.5px] font-semibold text-blue-600">{g.epsg}</span>
                <Info className="w-3.5 h-3.5 text-slate-400 group-hover/row:text-blue-600 transition-colors" aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="px-3.5 py-2 text-[11px] font-semibold text-slate-500 border-t border-slate-200/70">
        5,800+ coordinate systems worldwide · select a grid for details
      </div>
    </div>
  );
}

function PhotoPreview() {
  return (
    <div className="relative rounded-xl border border-slate-200/80 bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)] overflow-hidden" aria-hidden>
      <div className="h-24 sm:h-28 bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_110%,rgba(120,53,15,0.35),transparent_60%)]" />
        <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/45 text-white text-[10px] font-mono px-1.5 py-0.5">
          <Camera className="w-3 h-3" /> IMG_0412.jpg
        </div>
      </div>
      <div className="px-3.5 py-2.5">
        <div className="text-[12px] font-bold text-slate-900">CP-02 · Boundary Corner Peg</div>
        <div className="text-[11px] font-mono text-slate-500 mt-0.5">E 513720.400 · N 2787590.200 · Z 26.50</div>
      </div>
    </div>
  );
}

/* T1 of the app's example: a closed loop on two pillars, and how it closed */
function TraversePreview() {
  const pts: [number, number, string][] = [
    [40, 104, "CP-01"], [96, 142, "TS-01"], [160, 124, "TS-02"], [180, 64, "TS-03"], [126, 30, "TS-04"], [64, 50, "TS-05"],
  ];
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <div className="relative rounded-xl border border-slate-200/80 bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)] overflow-hidden" aria-hidden>
      <div className="flex items-center justify-between px-3.5 pt-2.5">
        <div className="text-[12px] font-bold text-slate-900">T1 Primary loop</div>
        <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5">Within tolerance</span>
      </div>
      <svg viewBox="0 0 220 160" className="w-full h-28 sm:h-32">
        <line x1="40" y1="104" x2="146" y2="14" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
        <polygon points={line} fill="rgba(234,88,12,0.06)" stroke="#C2410C" strokeWidth="2" strokeLinejoin="round" />
        <path d="M146 8l5 9h-10z" fill="#0F172A" />
        {pts.map(([x, y, n], i) =>
          i === 0 ? (
            <path key={n} d={`M${x} ${y - 6}l5.5 9.5h-11z`} fill="#0F172A" />
          ) : (
            <circle key={n} cx={x} cy={y} r="3.6" fill="#C2410C" stroke="#fff" strokeWidth="1.5" />
          )
        )}
        {pts.map(([x, y, n]) => (
          <text key={`t${n}`} x={x + 6} y={y - 5} fontSize="8.5" fontFamily="ui-monospace, monospace" fill="#334155">
            {n}
          </text>
        ))}
      </svg>
      <div className="grid grid-cols-3 border-t border-slate-100 text-center">
        {[["Angular", "+2.0″"], ["Precision", "1 : 125,383"], ["Height", "−7.0 mm"]].map(([k, v]) => (
          <div key={k} className="px-2 py-2">
            <div className="text-[9.5px] uppercase tracking-wider text-slate-400 font-semibold">{k}</div>
            <div className="text-[11.5px] font-mono font-semibold text-slate-900">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureItem({ f, idx, onOpen }: { f: FeatureCard; idx: number; onOpen: (chip: string) => void }) {
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
  const isWide = f.layout === "wide";
  const isBanner = f.layout === "banner";
  const hasPreview = Boolean(f.preview);

  const span = isWide
    ? "md:col-span-2"
    : isBanner
      ? "md:col-span-2 lg:col-span-3"
      : "";

  return (
    <div
      ref={ref}
      // Reduced-motion users see cards immediately, without the reveal animation
      className={`${span} motion-reduce:!opacity-100 motion-reduce:!transform-none motion-reduce:!transition-none`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.06}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.06}s`,
      }}
    >
      <article className="group relative h-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-slate-300 hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.18)] transition-all duration-300">
        {/* Accent bar on hover */}
        <div
          aria-hidden
          className={`absolute top-0 left-0 right-0 h-[3px] ${f.accentBar} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500`}
        />

        <div
          className={`h-full p-5 sm:p-7 ${
            hasPreview ? `grid grid-cols-1 ${isBanner ? "md:grid-cols-[1.4fr_1fr]" : "sm:grid-cols-[1.1fr_1fr]"} gap-5 sm:gap-7 items-center` : "flex flex-col"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Icon + Badge */}
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${f.accentLight} ${f.accent} ${f.accentBorder} border flex items-center justify-center shrink-0`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <span className={`text-[10.5px] font-bold uppercase tracking-wider ${f.accent}`}>
                {f.badge}
              </span>
            </div>

            <h3 className="text-[16px] sm:text-[17px] font-bold text-slate-900 tracking-tight leading-snug mb-2">
              {f.title}
            </h3>

            <p className="text-[13px] text-slate-500 leading-[1.7] pb-4 sm:pb-5">
              {f.desc}
            </p>

            <div className="mt-auto flex flex-wrap gap-1.5">
              {f.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onOpen(chip)}
                  aria-haspopup="dialog"
                  className="feature-chip"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {f.preview === "grids" && <GridsPreview onOpen={onOpen} />}
          {f.preview === "traverse" && (
            <div className="md:max-w-[340px] md:justify-self-end w-full">
              <TraversePreview />
            </div>
          )}
          {f.preview === "photo" && (
            <div className="md:max-w-[340px] md:justify-self-end w-full">
              <PhotoPreview />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

export default function Features() {
  // Which tag's popup is open, and on which card
  const [open, setOpen] = useState<{ item: string; card: number } | null>(null);
  const card = open ? FEATURES[open.card] : null;
  const theme: DialogTheme | null = card
    ? { icon: card.icon, badge: card.badge, accent: card.accent, accentLight: card.accentLight, accentBorder: card.accentBorder }
    : null;

  return (
    <section
      id="features"
      className="relative py-20 lg:py-28 bg-white border-b border-slate-100 overflow-hidden"
    >
      {/* Subtle gradient orbs */}
      <div aria-hidden className="absolute top-20 -left-40 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div aria-hidden className="absolute bottom-20 -right-40 w-[500px] h-[500px] bg-indigo-100/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-[620px] mx-auto mb-12 lg:mb-14">
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

        {/* Bento Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {FEATURES.map((f, idx) => (
            <FeatureItem key={f.title} f={f} idx={idx} onOpen={(item) => setOpen({ item, card: idx })} />
          ))}
        </div>

        <FeatureDetailDialog
          item={open?.item ?? null}
          siblings={card ? (card.preview === "grids" ? [...GRID_PREVIEW.map((g) => g.name), ...card.chips] : card.chips) : []}
          theme={theme}
          onSelect={(item) => setOpen((o) => (o ? { ...o, item } : o))}
          onClose={() => setOpen(null)}
        />
      </div>
    </section>
  );
}
