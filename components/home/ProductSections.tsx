"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronRight, Download, Globe, Info, PlayCircle, Radar } from "lucide-react";
import WebAppLink from "../WebAppLink";
import RoadProDownload from "../RoadProDownload";
import TraverseDownload from "../TraverseDownload";
import FolderManagerDownload from "../FolderManagerDownload";
import AppWindow from "./AppWindow";
import { PRODUCTS, badgeLabel } from "@/lib/products";
import { TRAVERSE_APP } from "@/lib/traverse";

// Loaded in the browser only: the map and the radar need the window
const HeroConverter = dynamic(() => import("../HeroConverter"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 text-cyan-300 font-mono text-xs">
      <Globe className="w-6 h-6 animate-spin text-cyan-500" aria-hidden />
      <span>Loading Coordinate Converter...</span>
    </div>
  ),
});

const primary = "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.28)] cursor-pointer transition-colors";
const secondary = "inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors";
const textLink = "inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-600 hover:text-[#0071e3]";

const product = (id: string) => PRODUCTS.find((p) => p.id === id);

/** Name, version, "New" and where it runs, above each program's heading */
function Label({ name, version, platform, badge }: { name: string; version: string; platform: string; badge?: string | null }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
      <span className="font-bold text-[#0071e3] uppercase tracking-wider text-[12px]">{name}</span>
      <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11.5px] font-bold text-slate-700">{version}</span>
      {badge && <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider">{badge}</span>}
      <span className="text-slate-500">{platform}</span>
    </p>
  );
}

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-[14px] text-slate-700 leading-snug">
          <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-emerald-600" aria-hidden />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

function Needs({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 flex items-start gap-2 text-[12.5px] text-slate-500 leading-relaxed">
      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden /> {children}
    </p>
  );
}

/** Excel to KML: the biggest section, with the live converter to try */
export function ExcelToKmlSection({ versionTag, fileSizeText, onDownloadClick }: { versionTag: string; fileSizeText: string; onDownloadClick: () => void }) {
  return (
    <section id="tool-excel-to-kml" aria-labelledby="tool-excel-to-kml-h" className="scroll-mt-24 py-20 lg:py-24 bg-white border-b border-slate-100">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
        <div className="lg:col-span-5">
          <Label name="Excel to KML" version={versionTag} platform="Windows and web" />
          <h2 id="tool-excel-to-kml-h" className="mt-3 text-[28px] sm:text-[34px] lg:text-[40px] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Your survey sheet, in Google Earth
          </h2>
          <p className="mt-4 text-[15px] sm:text-base text-slate-600 leading-relaxed">
            Open the Excel or CSV file from site, choose the grid it was surveyed on and save a KMZ that opens straight in Google Earth, with labels, symbols, site photos and a PDF report. Prove the grid on a known mark first, so every point lands where it really is.
          </p>
          <Points
            items={[
              "5,800+ EPSG grids and site calibration",
              "KML, KMZ and DXF: points, lines and areas",
              "Site photos in the Google Earth balloons",
              "Quality checks and points against design",
            ]}
          />
          <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <button onClick={onDownloadClick} className={primary} title={fileSizeText ? `Windows installer, ${fileSizeText}` : undefined}>
              <Download className="w-4 h-4" aria-hidden /> Download for Windows
            </button>
            <WebAppLink className={secondary}>
              Open the web app <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden />
            </WebAppLink>
          </div>
          <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/features" className={textLink}>
              Every feature <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
            <Link href="/tutorial" className={textLink}>
              <BookOpen className="w-3.5 h-3.5" aria-hidden /> Step-by-step tutorial
            </Link>
          </p>
        </div>

        <div className="lg:col-span-7 min-w-0">
          <p className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-slate-500">
            <Radar className="w-4 h-4 text-cyan-600" aria-hidden /> Try it here: convert a point
          </p>
          <div className="flex justify-center lg:justify-end">
            <HeroConverter />
          </div>
        </div>
      </div>
    </section>
  );
}

type RowProps = {
  id: string;
  title: string;
  text: string;
  points: string[];
  needs: React.ReactNode;
  actions: React.ReactNode;
  shot: { src: string; width: number; height: number; alt: string; title: string; dark?: boolean };
  /** picture on the left instead of the right */
  flip?: boolean;
  tint?: boolean;
};

/** One of the other programs: the words on one side, its screenshot on the other */
function ProductRow({ id, title, text, points, needs, actions, shot, flip = false, tint = false }: RowProps) {
  const p = product(id);
  if (!p) return null;
  return (
    <section id={`tool-${id}`} aria-labelledby={`tool-${id}-h`} className={`scroll-mt-24 py-20 lg:py-24 border-b border-slate-100 ${tint ? "bg-slate-50" : "bg-white"}`}>
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
        <div className={flip ? "lg:order-2" : ""}>
          <Label name={p.name} version={p.version} platform={p.platform} badge={p.comingSoon ? "Soon" : badgeLabel(p)} />
          <h2 id={`tool-${id}-h`} className="mt-3 text-[26px] sm:text-[32px] lg:text-[36px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            {title}
          </h2>
          <p className="mt-4 text-[15px] sm:text-base text-slate-600 leading-relaxed">{text}</p>
          <Points items={points} />
          <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">{actions}</div>
          <Needs>{needs}</Needs>
        </div>
        <div className={`min-w-0 ${flip ? "lg:order-1" : ""}`}>
          <AppWindow {...shot} />
        </div>
      </div>
    </section>
  );
}

export function RoadProSection() {
  return (
    <ProductRow
      id="roadpro"
      tint
      flip
      title="Draw the centre line. RoadPro draws the rest."
      text="One command in AutoCAD adds the edges, turning radius, barricades or kerb, signs sized to the speed limit, road markings, chainage and the cross section, then writes the quantities to Excel. Junctions and turning lanes join new roads to old ones."
      points={["Lanes, median, sidewalks and drains", "Junctions and turning lanes", "Signs and markings to standard", "Excel quantity report and LandXML"]}
      needs="Full AutoCAD, Civil 3D or Map 3D 2014 or newer. AutoCAD LT is not supported."
      shot={{ src: "/roadpro/signs.webp", width: 1330, height: 600, alt: "RoadPro in AutoCAD: a two-lane road with barricades, chainage, lane arrows and the sign legend", title: "AutoCAD · RoadPro sign legend", dark: true }}
      actions={
        <>
          <RoadProDownload className={primary} label="Download RoadPro" />
          <Link href="/roadpro" className={secondary}>
            Explore RoadPro <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden />
          </Link>
          <Link href="/roadpro#demo" className={`${textLink} sm:self-center sm:ml-1`}>
            <PlayCircle className="w-4 h-4" aria-hidden /> Watch the 3-minute demo
          </Link>
        </>
      }
    />
  );
}

export function TraverseSection() {
  return (
    <ProductRow
      id="traverse"
      title="Close the traverse. Hand over a signed report."
      text="Enter site coordinates, or the angles and distances from your field book, and close on a known point. Traverse & Level checks the misclosure, adjusts it and gives a report ready to sign. Level books are reduced by Rise & Fall or Height of Instrument with every arithmetic check."
      points={["Bowditch, Transit, Equal or least squares", "Rise & Fall and HI level books", "PDF report, CSV and Google Earth", "Jobs saved to your account and shared"]}
      needs="Runs in the browser, on a phone and as a Windows program for Windows 10 and 11. Sign in with your free account."
      shot={{ src: "/traverse/screens/v2-reports.webp", width: 1440, height: 900, alt: "Traverse & Level reports: a traverse adjustment report and a levelling report, both accepted within the allowable misclosure", title: "Traverse & Level · Reports" }}
      actions={
        <>
          <Link href={TRAVERSE_APP} className={primary}>
            Open the web app <ChevronRight className="w-4 h-4" aria-hidden />
          </Link>
          <TraverseDownload className={secondary} label="Windows program" />
          <Link href="/traverse" className={`${textLink} sm:self-center sm:ml-1`}>
            Explore Traverse &amp; Level <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </>
      }
    />
  );
}

export function FolderManagerSection() {
  return (
    <ProductRow
      id="folder-manager"
      tint
      flip
      title="Every project folder, one click away"
      text="One screen for the project's master folder: the modules from 00 Admin to 99 Archive with their disciplines, a look inside any folder, instant search, copy, move and bulk rename, and the space left on every drive."
      points={["Modules by discipline, checked on disk", "Instant search after one index", "Copy, move and rename in bulk", "Free space on every drive"]}
      needs="Windows 10 or 11. Nothing to install: unzip and open."
      shot={{ src: "/project-folder-manager/folder-manager-panel.webp", width: 1600, height: 900, alt: "Project Folder Manager: the project modules on the left and the 10_Survey folder open in the panel", title: "Project Folder Manager · D:\\Project", dark: true }}
      actions={
        <>
          <FolderManagerDownload className={primary} label="Download free" />
          <Link href="/project-folder-manager" className={secondary}>
            Explore Folder Manager <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden />
          </Link>
        </>
      }
    />
  );
}
