import React from "react";
import { Sparkles } from "lucide-react";

interface SpecRow {
  label: string;
  value: string[] | string;
  type: "tags" | "text";
  tagColor?: string;
}

const ROWS: SpecRow[] = [
  {
    label: "Input Formats",
    value: ["Excel (.xlsx / .xls)", "CSV (Comma-Separated)", "Tab-Separated TSV", "Space-Delimited TXT", "Total Station Raw Dumps"],
    type: "tags",
    tagColor: "text-blue-700 bg-blue-50 border border-blue-200/70",
  },
  {
    label: "Output Formats",
    value: ["OGC KML 2.2 Standard", "Compressed KMZ Archive", "3D Extruded Geometry", "Photo Inspection Balloons"],
    type: "tags",
    tagColor: "text-emerald-700 bg-emerald-50 border border-emerald-200/70",
  },
  {
    label: "Supported Projections",
    value: "Transverse Mercator, UTM Zones (1–60 N/S), Lambert Conformal Conic (1SP & 2SP), Oblique Mercator, Cassini-Soldner, Stereographic, Krovak, and Albers Equal Area.",
    type: "text",
  },
  {
    label: "Datums & Grids",
    value: "WGS84, ETRS89, GDA2020, NAD83, ED50, Dubai DLTM (EPSG:3997), Qatar QNG (EPSG:2932), Pakistan UTM 42N (EPSG:32642), Saudi Arabia UTM 38N (EPSG:32638), British National Grid (EPSG:27700), and 6,800+ national EPSG datums.",
    type: "text",
  },
  {
    label: "Coordinate Adjustments",
    value: "Automated 7-parameter Helmert (Bursa-Wolf) transformations, 3-parameter Molodensky shifts, and local 2D site calibration with residual error reporting.",
    type: "text",
  },
  {
    label: "Local System Execution",
    value: "Runs entirely on your local Windows PC using the native Microsoft Edge WebView2 runtime. Coordinates are processed locally with zero external server transmission.",
    type: "text",
  },
];

export default function SpecsTable() {
  return (
    <section id="specs" className="py-20 lg:py-24 bg-[#fafbfc] border-b border-slate-100">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">

        {/* Section Header */}
        <div className="text-center max-w-[620px] mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Technical Reference</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 mb-3">
            System &amp; Format Specifications
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Detailed engineering specifications for input formats, geodetic projections, and output compliance.
          </p>
        </div>

        {/* Specifications Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden">
          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`flex flex-col sm:flex-row gap-3 sm:gap-8 px-6 sm:px-8 py-5 sm:py-6 ${i !== ROWS.length - 1 ? "border-b border-slate-100" : ""
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

      </div>
    </section>
  );
}
