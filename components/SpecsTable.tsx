import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Globe,
  CheckCircle2,
  FileSpreadsheet,
  FileOutput,
  ArrowRight,
  Compass,
  Layers,
  Crosshair,
  ShieldCheck,
  MapPin,
} from "lucide-react";

interface FormatItem {
  name: string;
  ext: string;
}

const INPUT_FORMATS: FormatItem[] = [
  { name: "Excel workbook", ext: ".xlsx / .xlsm" },
  { name: "Comma-separated values", ext: ".csv" },
  { name: "Tab-separated values", ext: ".tsv" },
  { name: "Space-delimited text", ext: ".txt" },
  { name: "Total station raw dumps", ext: "Leica · Trimble · Topcon · Sokkia" },
];

const OUTPUT_FORMATS: FormatItem[] = [
  { name: "OGC KML 2.2 standard", ext: ".kml" },
  { name: "Compressed KMZ archive", ext: ".kmz" },
  { name: "AutoCAD drawing exchange", ext: ".dxf" },
  { name: "Photo inspection balloons", ext: "Embedded media" },
  { name: "Survey boundary polygons", ext: "Closed parcels" },
];

const PROJECTIONS = [
  "Transverse Mercator",
  "UTM Zones (1–60 N/S)",
  "Lambert Conformal Conic (1SP & 2SP)",
  "Oblique Mercator",
  "Cassini-Soldner",
  "Stereographic",
  "Krovak",
  "Albers Equal Area",
];

const DATUMS: { name: string; code?: string }[] = [
  { name: "WGS84" },
  { name: "ETRS89" },
  { name: "GDA2020" },
  { name: "NAD83" },
  { name: "ED50" },
  { name: "Dubai DLTM", code: "EPSG:3997" },
  { name: "Qatar QNG", code: "EPSG:2932" },
  { name: "Pakistan UTM 42N", code: "EPSG:32642" },
  { name: "Saudi Arabia UTM 38N", code: "EPSG:32638" },
  { name: "British National Grid", code: "EPSG:27700" },
];

const ADJUSTMENTS = [
  { title: "7-parameter Helmert", detail: "Bursa-Wolf transformations, fully automated" },
  { title: "3-parameter Molodensky", detail: "Datum shifts between ellipsoids" },
  { title: "Local 2D site calibration", detail: "Real-time residual error reporting" },
];

const POPULAR_GRIDS = [
  { name: "Dubai DLTM", epsg: "EPSG:3997", region: "United Arab Emirates", datum: "WGS 84 / Dubai Local TM", href: "/convert/dubai-dltm" },
  { name: "Qatar National Grid", epsg: "EPSG:2932", region: "State of Qatar", datum: "Qatar 1995 / QNG", href: "/convert/qatar-national-grid" },
  { name: "Pakistan UTM 42N", epsg: "EPSG:32642", region: "Pakistan / Central Asia", datum: "WGS 84 / UTM Zone 42N", href: "/convert/utm-zone-42n" },
  { name: "Saudi Arabia UTM 38N", epsg: "EPSG:32638", region: "Kingdom of Saudi Arabia", datum: "WGS 84 / UTM Zone 38N", href: "/convert/utm-zone-38n" },
  { name: "British National Grid", epsg: "EPSG:27700", region: "United Kingdom (OSGB36)", datum: "OSGB 1936 / British National Grid", href: "/convert/british-national-grid" },
  { name: "USA State Plane (NAD83)", epsg: "EPSG:2227+", region: "United States (California, Texas, FL)", datum: "NAD83 (2011) State Plane", href: "/convert#americas" },
  { name: "Australia GDA2020", epsg: "EPSG:7855", region: "Australia (MGA Zone 55/56)", datum: "GDA2020 / MGA Zone 55", href: "/convert/australia-mga-zone-55" },
  { name: "UTM Zones 1–60 (N/S)", epsg: "EPSG:32601–32760", region: "Worldwide Universal Mercator", datum: "WGS 84 Global Ellipsoid", href: "/convert" },
];

function FormatCard({
  title,
  subtitle,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: FormatItem[];
  tone: "blue" | "emerald";
}) {
  const accent =
    tone === "blue"
      ? { tile: "bg-blue-50 text-blue-600 border-blue-100", dot: "bg-blue-500", ext: "text-blue-700 bg-blue-50" }
      : { tile: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-500", ext: "text-emerald-700 bg-emerald-50" };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] p-5 sm:p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${accent.tile}`}>
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 leading-tight">{title}</h3>
          <p className="text-[12px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((f) => (
          <li key={f.name} className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex items-center gap-2.5 text-[13px] text-slate-700 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accent.dot}`} />
              <span>{f.name}</span>
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md text-right ${accent.ext} ${
                f.ext.startsWith(".") ? "font-mono" : ""
              }`}
            >
              {f.ext}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpecBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 px-5 sm:px-8 py-5 sm:py-6">
      <div className="sm:w-56 shrink-0 flex items-center sm:items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" strokeWidth={1.8} />
        </div>
        <h3 className="text-[13px] sm:text-sm font-bold text-slate-900 sm:pt-1.5">{title}</h3>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export default function SpecsTable() {
  return (
    <section id="specs" className="py-20 lg:py-28 bg-[#fafbfc] border-b border-slate-100" aria-labelledby="specs-heading">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-[620px] mx-auto mb-12 lg:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-[11px] font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Technical Reference</span>
          </div>
          <h2
            id="specs-heading"
            className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.15]"
          >
            System &amp; Format Specifications
          </h2>
          <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed max-w-[520px] mx-auto">
            What goes in, what comes out, and the geodetic engine in between — from spreadsheet columns to Google Earth–ready KML.
          </p>
        </div>

        {/* ── Input → Output ── */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 mb-6">
          <FormatCard
            title="Input formats"
            subtitle="Spreadsheets & field instrument exports"
            icon={FileSpreadsheet}
            items={INPUT_FORMATS}
            tone="blue"
          />
          <div
            aria-hidden
            className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm items-center justify-center"
          >
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
          <FormatCard
            title="Output formats"
            subtitle="Google Earth–compliant deliverables"
            icon={FileOutput}
            items={OUTPUT_FORMATS}
            tone="emerald"
          />
        </div>

        {/* ── Geodetic engine ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] divide-y divide-slate-100 mb-14">
          <SpecBlock icon={Compass} title="Supported projections">
            <div className="flex flex-wrap gap-1.5">
              {PROJECTIONS.map((p) => (
                <span
                  key={p}
                  className="text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg"
                >
                  {p}
                </span>
              ))}
            </div>
          </SpecBlock>

          <SpecBlock icon={Layers} title="Datums & grids">
            <div className="flex flex-wrap gap-1.5">
              {DATUMS.map((d) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg"
                >
                  {d.name}
                  {d.code && <span className="font-mono text-[10.5px] text-blue-600">{d.code}</span>}
                </span>
              ))}
              <span className="text-[12px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                + 5,800+ EPSG coordinate systems
              </span>
            </div>
          </SpecBlock>

          <SpecBlock icon={Crosshair} title="Coordinate adjustments">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {ADJUSTMENTS.map((a) => (
                <div key={a.title} className="rounded-xl bg-slate-50 border border-slate-200/70 px-3.5 py-3">
                  <div className="text-[13px] font-semibold text-slate-900">{a.title}</div>
                  <div className="text-[12px] text-slate-500 mt-0.5 leading-snug">{a.detail}</div>
                </div>
              ))}
            </div>
          </SpecBlock>

          <SpecBlock icon={ShieldCheck} title="Local system execution">
            <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed mb-2.5">
              Runs entirely on your local Windows PC using the native Microsoft Edge WebView2 runtime.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Coordinates never leave your PC
            </span>
          </SpecBlock>
        </div>

        {/* ── Popular EPSG Grids Reference ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
            <div>
              <h3 className="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                <Globe className="w-5 h-5 text-blue-600" />
                Popular survey coordinate systems
              </h3>
              <p className="text-[13px] sm:text-sm text-slate-500 mt-1 max-w-[620px]">
                5,800+ projections from the official EPSG registry, transformed directly to WGS84 for Google Earth.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {POPULAR_GRIDS.map((grid) => (
              <Link
                key={grid.name}
                href={grid.href}
                className="group p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 hover:border-blue-200 hover:shadow-[0_8px_24px_-12px_rgba(0,113,227,0.25)] transition-all flex flex-col"
              >
                <span className="self-start font-mono text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded mb-2.5">
                  {grid.epsg}
                </span>
                <div className="text-[13px] font-bold text-slate-900 leading-snug">{grid.name}</div>
                <p className="text-[12px] text-slate-500 mt-0.5">{grid.datum}</p>
                <div className="mt-auto pt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{grid.region}</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-right">
            <Link href="/convert" className="text-[13px] font-semibold text-[#0071e3] hover:underline">
              All grid converters →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
