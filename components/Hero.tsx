"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  ChevronRight,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Route,
  Compass,
  FolderTree,
  ShieldCheck,
  Layers,
  MonitorSmartphone,
  Smartphone,
  Globe2,
  type LucideIcon,
} from "lucide-react";
import WebAppLink from "./WebAppLink";
import { PRODUCTS, badgeLabel, isNew } from "@/lib/products";
import type { PublicStats } from "@/lib/publicCounts";
import { SHOW_ANDROID } from "@/lib/site";

interface HeroProps {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
  /** real counts; the hero shows the number of countries once there are a few */
  stats?: PublicStats | null;
}

// An Android phone gets the Android app as the main button (the Windows installer is no use there).
// Read on the client only: the server renders the Windows button.
const noSubscribe = () => () => {};
// (only while the Android app is shown: lib/site.ts SHOW_ANDROID)
const onAndroid = () => SHOW_ANDROID && /Android/i.test(navigator.userAgent);

type Tab = {
  id: string;
  name: string;
  /** On phones, where four tabs share two rows */
  short: string;
  version: string;
  platform: string;
  tagline: string;
  highlights: string[];
  href: string;
  badge: string | null;
  Icon: LucideIcon;
  shot: { src: string; width: number; height: number; alt: string; title: string; position?: string };
};

/** A round number the count is truly more than: 32 → 30, 40 → 30, 17 → 15 */
const moreThan = (n: number) => (n > 20 ? Math.floor((n - 1) / 10) * 10 : Math.floor((n - 1) / 5) * 5);

const ICONS: Record<string, LucideIcon> = { roadpro: Route, traverse: Compass, "folder-manager": FolderTree };
const ROTATE_MS = 7000;

// The home page hero, in the manner of a software maker's front page: one headline for the
// whole toolkit, then a tab per program with its real screenshot in a window frame.
// Excel to KML is the first tab and the main download; the rest come from lib/products.ts (inHero).
export default function Hero({ versionTag, fileSizeText, onDownloadClick, stats }: HeroProps) {
  const android = useSyncExternalStore(noSubscribe, onAndroid, () => false);
  // only the number of countries (not the number of accounts), once there are a few
  const showStats = stats && stats.countries >= 6;
  const tabs: Tab[] = [
    {
      id: "excel-to-kml",
      name: "Excel to KML",
      short: "Excel to KML",
      version: versionTag,
      platform: "Windows and web",
      tagline: "Excel and CSV coordinates into Google Earth, on any of 5,800+ grids",
      highlights: ["KML, KMZ and DXF", "Site photos and PDF reports", "Quality checks before you save"],
      href: "/features",
      badge: null,
      Icon: FileSpreadsheet,
      shot: {
        src: "/tutorial/load-points.webp",
        width: 1600,
        height: 1000,
        alt: "Excel to KML: twelve survey points read from Excel on the Qatar National Grid, shown as a table and on the map, ready to save as KMZ",
        title: "Excel to KML · Benchmarks",
      },
    },
    ...PRODUCTS.filter((p) => p.inHero && p.shot).map((p) => ({
      id: p.id,
      name: p.name,
      short: p.name.replace("Project ", "").replace(" & Level", ""),
      version: p.version,
      platform: p.platform,
      tagline: p.tagline,
      highlights: p.highlights.slice(0, 3),
      href: p.href,
      badge: p.comingSoon ? "Soon" : badgeLabel(p),
      Icon: ICONS[p.id] ?? FileSpreadsheet,
      shot: p.shot!,
    })),
  ];
  const news = PRODUCTS.find((p) => isNew(p) && !p.comingSoon);

  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);

  // Steps through the programs until the visitor picks one; still while the pointer is on it
  useEffect(() => {
    if (!auto || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % tabs.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [active, auto, paused, tabs.length]);

  const pick = (i: number) => {
    setAuto(false);
    setActive(i);
  };
  const tab = tabs[active];

  return (
    <section className="hero-grid relative pt-28 pb-16 md:pt-32 md:pb-20 lg:pt-32 lg:pb-24 overflow-hidden bg-white border-b border-slate-100">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-[radial-gradient(closest-side,rgba(0,113,227,0.14),transparent)] pointer-events-none" aria-hidden />

      <div className="relative max-w-[1180px] mx-auto px-5 sm:px-8">
        <div className="max-w-[860px] mx-auto text-center flex flex-col items-center">
          {news && (
            <Link
              href={news.href}
              className="group inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs hover:border-slate-300 text-[13px] text-slate-700 transition-colors"
            >
              <span className="px-2 py-0.5 rounded-full bg-[#0071e3] text-white text-[11px] font-bold">New</span>
              <span className="font-medium">
                {news.name} {news.version}
                <span className="hidden sm:inline text-slate-500"> · {news.tagline}</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" aria-hidden />
            </Link>
          )}

          {/* Kept under 70 characters for search engines */}
          <h1 className="mt-6 text-[34px] sm:text-[48px] lg:text-[60px] font-extrabold tracking-[-0.03em] text-slate-900 leading-[1.05] text-balance">
            Professional survey software for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] to-[#0ea5e9]">engineers on site</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-[680px] text-balance">
            Excel to KML, RoadPro, Traverse &amp; Level, Slope Calculator and Project Folder Manager: from survey coordinates to finished drawings, adjustments and reports. Free for Windows, AutoCAD and the web.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {android ? (
              <Link
                href="/download#android"
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-[15px] font-semibold shadow-[0_6px_20px_rgba(0,113,227,0.3)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <Smartphone className="w-4 h-4" aria-hidden />
                Get the Android app
              </Link>
            ) : (
              <button
                onClick={onDownloadClick}
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-[15px] font-semibold shadow-[0_6px_20px_rgba(0,113,227,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" aria-hidden />
                Download Excel to KML
                <span className="text-white/75 text-xs font-normal">{fileSizeText}</span>
              </button>
            )}
            <WebAppLink className="group inline-flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-[15px] font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Try it in your browser
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" aria-hidden />
            </WebAppLink>
          </div>

          {showStats && (
            <p className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[13px] font-semibold text-emerald-900">
              <Globe2 className="w-4 h-4 text-emerald-600" aria-hidden />
              Used in more than {moreThan(stats.countries)} countries
            </p>
          )}
          <ul className={`${showStats ? "mt-4" : "mt-6"} flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-slate-500`}>
            <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden /> Free with an account</li>
            <li className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-500" aria-hidden /> 5,800+ EPSG grids</li>
            <li className="flex items-center gap-1.5"><MonitorSmartphone className="w-4 h-4 text-[#0071e3]" aria-hidden /> Windows, AutoCAD and the web</li>
            {SHOW_ANDROID && !android && (
              <li>
                <Link href="/download#android" className="flex items-center gap-1.5 text-[#0071e3] hover:underline">
                  <Smartphone className="w-4 h-4" aria-hidden /> Android app
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* One tab per program, then its screenshot */}
        <div className="mt-12 lg:mt-14" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div role="tablist" aria-label="Our programs" className="mx-auto w-full sm:w-fit grid grid-cols-2 sm:flex gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80">
            {tabs.map((t, i) => {
              const on = i === active;
              return (
                <button
                  key={t.id}
                  id={`hero-tab-${t.id}`}
                  role="tab"
                  aria-selected={on}
                  aria-controls="hero-panel"
                  onClick={() => pick(i)}
                  className={`relative overflow-hidden flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-semibold whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    on ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.12)]" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <t.Icon className={`w-4 h-4 shrink-0 ${on ? "text-[#0071e3]" : "text-slate-400"}`} aria-hidden />
                  <span className="sm:hidden">{t.short}</span>
                  <span className="hidden sm:inline">{t.name}</span>
                  {t.badge && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-label={t.badge} />}
                  {on && auto && !paused && (
                    <span key={active} className="hero-tab-progress absolute left-3 right-3 bottom-1 h-0.5 rounded-full bg-[#0071e3]/70 origin-left" style={{ animationDuration: `${ROTATE_MS}ms` }} aria-hidden />
                  )}
                </button>
              );
            })}
          </div>

          <div id="hero-panel" role="tabpanel" aria-labelledby={`hero-tab-${tab.id}`} className="mt-7">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
                  <span className="font-bold text-slate-900">{tab.name}</span>
                  <span className="font-semibold text-[#0071e3]">{tab.version}</span>
                  {tab.badge && <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider">{tab.badge}</span>}
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{tab.platform}</span>
                </p>
                <h2 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{tab.tagline}</h2>
                <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                  {tab.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-1.5 text-[13.5px] text-slate-600">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden /> {h}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={tab.href} className="group shrink-0 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0071e3] hover:text-[#0058b0]">
                {tab.id === "excel-to-kml" ? "See every feature" : `Explore ${tab.name}`}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
              </Link>
            </div>

            {/* The window: every screenshot is stacked and faded in, so switching is instant */}
            <div className="rounded-2xl p-1.5 sm:p-2 bg-gradient-to-b from-slate-200/80 to-slate-100/40 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.35)]">
              <div className="rounded-xl overflow-hidden border border-slate-300/70 bg-slate-950">
                <div className="flex items-center gap-3 px-3.5 h-9 bg-slate-100 border-b border-slate-200">
                  <span className="flex gap-1.5" aria-hidden>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </span>
                  <span className="flex-1 text-center text-[12px] font-medium text-slate-500 truncate pr-10">{tab.shot.title}</span>
                </div>
                <div className="relative aspect-[16/10] bg-black">
                  {tabs.map((t, i) => (
                    <Image
                      key={t.id}
                      src={t.shot.src}
                      alt={i === active ? t.shot.alt : ""}
                      aria-hidden={i !== active}
                      width={t.shot.width}
                      height={t.shot.height}
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      sizes="(min-width: 1180px) 1140px, 100vw"
                      style={{ objectPosition: t.shot.position ?? "left top" }}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                        i === active ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
