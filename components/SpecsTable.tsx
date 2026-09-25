import React from "react";
import { Sparkles, Globe, MapPin, Compass, Layers, CheckCircle2 } from "lucide-react";

interface SpecRow {
  label: string;
  value: string[] | string;
  type: "tags" | "text";
  tagColor?: string;
}

const ROWS: SpecRow[] = [
  {
    label: "Input Formats",
    value: [
      "Excel (.xlsx / .xls)",
      "CSV (Comma-Separated)",
      "Tab-Separated TSV",
      "Space-Delimited TXT",
      "Total Station Raw Dumps (Leica, Trimble, Topcon, Sokkia)",
    ],
    type: "tags",
    tagColor: "text-blue-700 bg-blue-50 border border-blue-200/70",
  },
  {
    label: "Output Formats",
    value: [
      "OGC KML 2.2 Standard (.kml)",
      "Compressed KMZ Archive (.kmz)",
      "3D Extruded Geometry",
      "Photo Inspection Balloons",
      "Survey Boundary Polygons",
    ],
    type: "tags",
    tagColor: "text-emerald-700 bg-emerald-50 border border-emerald-200/70",
  },
  {
    label: "Supported Projections",
    value:
      "Transverse Mercator, UTM Zones (1–60 N/S), Lambert Conformal Conic (1SP & 2SP), Oblique Mercator, Cassini-Soldner, Stereographic, Krovak, and Albers Equal Area.",
    type: "text",
  },
  {
    label: "Datums & Grids",
    value:
      "WGS84, ETRS89, GDA2020, NAD83, ED50, Dubai DLTM (EPSG:3997), Qatar QNG (EPSG:2932), Pakistan UTM 42N (EPSG:32642), Saudi Arabia UTM 38N (EPSG:32638), British National Grid (EPSG:27700), and 6,864+ national EPSG datums.",
    type: "text",
  },
  {
    label: "Coordinate Adjustments",
    value:
      "Automated 7-parameter Helmert (Bursa-Wolf) transformations, 3-parameter Molodensky shifts, and local 2D site calibration with real-time residual error reporting.",
    type: "text",
  },
  {
    label: "Local System Execution",
    value:
      "Runs entirely on your local Windows PC using the native Microsoft Edge WebView2 runtime. Coordinates are processed locally with zero external server transmission.",
    type: "text",
  },
];

const POPULAR_GRIDS = [
  {
    name: "Dubai DLTM",
    epsg: "EPSG:3997",
    region: "United Arab Emirates",
    datum: "WGS 84 / Dubai Local TM",
  },
  {
    name: "Qatar National Grid",
    epsg: "EPSG:2932",
    region: "State of Qatar",
    datum: "Qatar 1995 / QNG",
  },
  {
    name: "Pakistan UTM 42N",
    epsg: "EPSG:32642",
    region: "Pakistan / Central Asia",
    datum: "WGS 84 / UTM Zone 42N",
  },
  {
    name: "Saudi Arabia UTM 38N",
    epsg: "EPSG:32638",
    region: "Kingdom of Saudi Arabia",
    datum: "WGS 84 / UTM Zone 38N",
  },
  {
    name: "British National Grid",
    epsg: "EPSG:27700",
    region: "United Kingdom (OSGB36)",
    datum: "OSGB 1936 / British National Grid",
  },
  {
    name: "USA State Plane (NAD83)",
    epsg: "EPSG:2227+",
    region: "United States (California, Texas, FL)",
    datum: "NAD83 (2011) State Plane",
  },
  {
    name: "Australia GDA2020",
    epsg: "EPSG:7855",
    region: "Australia (MGA Zone 55/56)",
    datum: "GDA2020 / MGA Zone 55",
  },
  {
    name: "UTM Zones 1–60 (N/S)",
    epsg: "EPSG:32601–32760",
    region: "Worldwide Universal Mercator",
    datum: "WGS 84 Global Ellipsoid",
  },
];

export default function SpecsTable() {
  return (
    <section id="specs" className="py-20 lg:py-24 bg-[#fafbfc] border-b border-slate-100">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-[640px] mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Technical Reference</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 mb-3">
            System &amp; Format Specifications
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Detailed engineering specifications for input spreadsheet formats, geodetic projections, and Google Earth KML deliverable compliance.
          </p>
        </div>

        {/* Specifications Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden mb-12">
          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`flex flex-col sm:flex-row gap-3 sm:gap-8 px-6 sm:px-8 py-5 sm:py-6 ${
                i !== ROWS.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className="sm:w-52 shrink-0 text-xs sm:text-sm font-bold text-slate-800">
                {row.label}
              </div>
              <div className="flex-1">
                {row.type === "tags" ? (
                  <div className="flex flex-wrap gap-2">
                    {(row.value as string[]).map((v) => (
                      <span
                        key={v}
                        className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-md font-mono ${row.tagColor}`}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {row.value as string}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Popular EPSG Grids Reference (Rich Keyword Section for Geomatics Search Intent) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Popular Survey Coordinate Systems &amp; Datums Included
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6 max-w-2xl">
            Excel to KML Pro includes 6,864 pre-configured geodetic projections from the official EPSG registry, transforming national grid coordinates directly to WGS84 for Google Earth.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {POPULAR_GRIDS.map((grid) => (
              <div
                key={grid.name}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {grid.name}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                      {grid.epsg}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{grid.datum}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{grid.region}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
