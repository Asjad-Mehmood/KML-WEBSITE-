"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ChevronRight, Globe, Radar } from "lucide-react";
import WebAppLink from "./WebAppLink";

// Loaded in the browser only: the map and the radar need the window
const HeroConverter = dynamic(() => import("./HeroConverter"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 text-cyan-300 font-mono text-xs">
      <Globe className="w-6 h-6 animate-spin text-cyan-500" aria-hidden />
      <span>Loading Coordinate Converter...</span>
    </div>
  ),
});

// Home page, right after the hero: the live coordinate converter, to try before downloading
export default function ConverterSection() {
  return (
    <section id="try" aria-labelledby="try-heading" className="scroll-mt-24 py-16 lg:py-20 bg-white border-b border-slate-100">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        <div className="lg:col-span-5">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">
            <Radar className="w-4 h-4" aria-hidden /> Try it now
          </p>
          <h2 id="try-heading" className="mt-2 text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Convert a coordinate right here
          </h2>
          <p className="mt-3 text-[15px] sm:text-base text-slate-600 leading-relaxed max-w-[480px]">
            Pick a grid, type an easting and northing or paste a few rows, and see where they land on the map. For a whole table, open the web app or the Windows program.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <WebAppLink className="group inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors">
              Open the web app <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
            </WebAppLink>
            <Link href="/convert" className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold">
              Every grid we support <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="lg:col-span-7 w-full min-w-0 flex items-center justify-center lg:justify-end">
          <HeroConverter />
        </div>
      </div>
    </section>
  );
}
