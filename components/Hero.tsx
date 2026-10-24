"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  PlayCircle,
  ShieldCheck,
  MonitorSmartphone,
} from "lucide-react";
import WebAppLink from "./WebAppLink";
import { PRODUCTS, badgeLabel, type Product } from "@/lib/products";

interface HeroProps {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
}

// The home page hero: every program we make, each with a tile sized by how much it matters.
// Excel to KML has the big tile on the left; the rest come from lib/products.ts (inHero, heroSize).
export default function Hero({ versionTag, fileSizeText, onDownloadClick }: HeroProps) {
  const others = PRODUCTS.filter((p) => p.inHero);
  return (
    <section className="relative pt-24 pb-14 md:pt-28 md:pb-16 lg:pt-30 lg:pb-20 overflow-hidden bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-blue-50/60 rounded-full blur-[100px] -z-10 pointer-events-none" aria-hidden />

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="max-w-[760px]">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">Free software for surveyors and site engineers</p>
            {/* Kept under 70 characters for search engines */}
            <h1 className="mt-3 text-[30px] sm:text-[40px] lg:text-[46px] font-extrabold tracking-tight text-slate-900 leading-[1.1] text-balance">
              Survey software that turns site data into{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] via-[#0284c7] to-[#0ea5e9]">finished work</span>
            </h1>
            <p className="mt-4 text-base sm:text-[17px] text-slate-600 leading-relaxed max-w-[620px]">
              Coordinates into Google Earth, complete roads in AutoCAD, traverses closed and checked, and every project folder in order.
            </p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] font-medium text-slate-600">
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden /> Free with an account</li>
            <li className="flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500" aria-hidden /> 5,800+ EPSG grids</li>
            <li className="flex items-center gap-2"><MonitorSmartphone className="w-4 h-4 text-[#0071e3]" aria-hidden /> Windows, AutoCAD and the web</li>
          </ul>
        </div>

        <div className="mt-8 lg:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <ExcelToKmlTile versionTag={versionTag} fileSizeText={fileSizeText} onDownloadClick={onDownloadClick} />
          <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5 min-w-0">
            {others.map((p) =>
              p.heroSize === "sm" ? <StripTile key={p.id} p={p} /> : p.heroSize === "md" ? <SideTile key={p.id} p={p} /> : <PictureTile key={p.id} p={p} />,
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The flagship: what it does, how to get it, and what it looks like */
function ExcelToKmlTile({ versionTag, fileSizeText, onDownloadClick }: HeroProps) {
  return (
    <article aria-labelledby="hero-kml" className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-slate-950 text-white p-5 sm:p-8 flex flex-col min-w-0 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
      <div className="absolute -top-28 -right-20 w-[420px] h-[300px] bg-[#0071e3]/30 rounded-full blur-[110px] pointer-events-none" aria-hidden />

      <div className="relative flex flex-wrap items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-[#0071e3] flex items-center justify-center shadow-[0_4px_14px_rgba(0,113,227,0.45)]">
          <FileSpreadsheet className="w-5 h-5" aria-hidden />
        </span>
        <span className="font-bold text-[15px]">Excel to KML</span>
        <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11.5px] font-bold text-sky-300">{versionTag}</span>
        <span className="text-[12.5px] text-slate-400">Windows · Web</span>
      </div>

      <h2 id="hero-kml" className="relative mt-5 text-[24px] sm:text-[30px] font-extrabold tracking-tight leading-[1.15] text-balance">
        Excel coordinates to Google Earth in seconds
      </h2>
      <p className="relative mt-3 text-[15px] sm:text-base text-slate-300 leading-relaxed max-w-[560px]">
        Open an Excel or CSV table on any grid and save KML, KMZ or DXF with site photos and reports. Points, boundaries and levels, no GIS software needed.
      </p>
      <p className="relative mt-4 flex flex-wrap gap-2" aria-label="Saves as KML, KMZ, DXF and PDF report">
        {["KML", "KMZ", "DXF", "PDF report"].map((f) => (
          <span key={f} aria-hidden className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[12.5px] font-bold tracking-wide text-sky-200">
            {f}
          </span>
        ))}
      </p>

      <div className="relative mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <button
          onClick={onDownloadClick}
          className="group inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" aria-hidden />
          <span>Download for Windows</span>
          <span className="text-white/80 text-xs font-normal">· {fileSizeText}</span>
        </button>
        <WebAppLink className="group inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
          <span>Try in browser</span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" aria-hidden />
        </WebAppLink>
      </div>

      {/* What it looks like: the map preview, with the table it came from */}
      <div className="relative mt-7 lg:mt-auto lg:pt-7">
        <div className="relative rounded-2xl border border-white/10 bg-black/40 p-1.5">
          <Image
            src="/tutorial/map.webp"
            alt="Excel to KML map preview: twelve survey points placed on the grid, ready to save as KMZ"
            width={1470}
            height={1000}
            priority
            sizes="(min-width: 1280px) 700px, (min-width: 1024px) 55vw, 100vw"
            className="w-full aspect-[16/7] object-cover object-top rounded-xl"
          />
          <div aria-hidden className="hidden sm:block absolute right-4 bottom-4 rounded-xl bg-white text-slate-800 shadow-[0_12px_30px_rgba(0,0,0,0.35)] p-2.5 text-[11px] font-mono">
            <p className="flex items-center gap-1.5 font-sans font-semibold text-[11px] text-emerald-700 mb-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" /> points.xlsx
            </p>
            <table className="border-collapse">
              <tbody>
                {[["Point", "Easting", "Northing"], ["TBM-01", "229 914.2", "391 776.4"], ["MH-01", "229 652.8", "391 813.0"], ["RD-01", "229 981.5", "392 006.7"]].map((r, i) => (
                  <tr key={r[0]} className={i === 0 ? "text-slate-500 font-sans font-semibold" : ""}>
                    {r.map((c) => (
                      <td key={c} className="px-1.5 py-0.5 border-t border-slate-100 first:pl-0 whitespace-nowrap">{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </article>
  );
}

/** "Coming soon" or "New", as on the program's own page */
function Badge({ p, dark = false }: { p: Product; dark?: boolean }) {
  const label = badgeLabel(p);
  if (!label) return null;
  return (
    <span className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider whitespace-nowrap ${dark ? "bg-amber-400 text-slate-950" : "bg-amber-500 text-white"}`}>
      {p.comingSoon ? "Soon" : label}
    </span>
  );
}

function Name({ p }: { p: Product }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px]">
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="font-bold text-slate-900 text-[14.5px]">{p.name}</span>
        <span className="font-bold text-amber-700">{p.version}</span>
        <Badge p={p} />
      </span>
      <span className="text-slate-500">{p.platform}</span>
    </p>
  );
}

const tileLink = "inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0071e3] hover:text-[#0058b0] focus-visible:outline-none focus-visible:underline";

/** Large: the picture on top, then the name and two links */
function PictureTile({ p }: { p: Product }) {
  return (
    <article className="group lg:flex-1 flex flex-col rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_14px_40px_rgba(15,23,42,0.1)] hover:border-slate-300 transition-all">
      <Link href={p.href} tabIndex={-1} aria-hidden className="flex-1 flex items-center bg-black overflow-hidden">
        <Image
          src={p.image.src}
          alt=""
          width={p.image.width}
          height={p.image.height}
          sizes="(min-width: 1280px) 500px, (min-width: 1024px) 40vw, 100vw"
          className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
        />
      </Link>
      <div className="p-5">
        <Name p={p} />
        <h2 className="mt-1.5 text-[17px] font-bold text-slate-900 leading-snug">{p.tagline}</h2>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <Link href={p.href} className={tileLink}>
            Explore {p.name} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          {p.demoHref && (
            <Link href={p.demoHref} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-600 hover:text-slate-900">
              <PlayCircle className="w-4 h-4" aria-hidden /> Watch the demo
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/** Medium: the words on the left, a small picture on the right */
function SideTile({ p }: { p: Product }) {
  const img = p.thumb ?? p.image;
  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-5 flex items-center gap-4 sm:gap-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_14px_40px_rgba(15,23,42,0.1)] hover:border-slate-300 transition-all">
      <div className="min-w-0 flex-1">
        <Name p={p} />
        <h2 className="mt-1.5 text-[16px] font-bold text-slate-900 leading-snug">{p.tagline}</h2>
        <Link href={p.href} className={`mt-3 ${tileLink}`}>
          Explore {p.name.split(" ")[0]} <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
      <Link href={p.href} tabIndex={-1} aria-hidden className="hidden min-[420px]:block w-[38%] max-w-[190px] shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <Image src={img.src} alt="" width={img.width} height={img.height} sizes="190px" className="w-full aspect-[16/10] object-cover object-left-top group-hover:scale-[1.03] transition-transform duration-300" />
      </Link>
    </article>
  );
}

/** Small: one line, the whole strip is the link */
function StripTile({ p }: { p: Product }) {
  const img = p.thumb ?? p.image;
  return (
    <Link
      href={p.href}
      className="group rounded-2xl border border-slate-200 bg-white/80 hover:bg-white px-4 py-3 flex items-center gap-4 hover:border-slate-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span className="hidden min-[420px]:block w-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
        <Image src={img.src} alt="" width={img.width} height={img.height} sizes="64px" className="w-full aspect-[16/10] object-cover object-left-top" />
      </span>
      <span className="min-w-0 flex-1">
        <Name p={p} />
        <span className="block text-[13px] text-slate-600">{p.tagline}</span>
      </span>
      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0071e3] group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden />
    </Link>
  );
}
