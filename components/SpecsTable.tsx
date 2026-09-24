import React from "react";

const ROWS = [
  {
    label: "Input Formats",
    value: ["CSV (Comma-Separated)", "TSV (Tab-Separated)", "Space-Delimited TXT", "Direct Excel Paste", "Total Station Raw Exports"],
    type: "tags",
    tagColor: "text-[#0071e3] bg-[#0071e3]/10",
  },
  {
    label: "Output Formats",
    value: ["KML 2.2 Standard", "KMZ Compressed Archive", "Interactive HTML Survey Balloon", "GeoJSON Compatible"],
    type: "tags",
    tagColor: "text-[#34c759] bg-[#34c759]/10",
  },
  {
    label: "Geodetic Projections",
    value: "Transverse Mercator, UTM (1–60 N/S), Lambert Conformal Conic (1SP & 2SP), Oblique Mercator, Cassini-Soldner, Stereographic, Krovak, Albers Equal Area.",
    type: "text",
  },
  {
    label: "Ellipsoids & Datums",
    value: "WGS84, ETRS89, GDA94/GDA2020, NAD83, ED50, Clarke 1880, Airy 1830, Bessel 1841, Everest 1830, Hayford 1909, QND95, DLTM, and 1,000+ local historical datums.",
    type: "text",
  },
  {
    label: "Datum Shift Models",
    value: "Automated 7-parameter Helmert (Bursa-Wolf), 3-parameter Molodensky shifts, and custom 2D site calibration from local control points.",
    type: "text",
  },
  {
    label: "Engine & Security",
    value: "Microsoft Edge WebView2 (Chromium 120+). Zero network egress for conversions, air-gapped security, zero external telemetry.",
    type: "text",
  },
];

export default function SpecsTable() {
  return (
    <section id="specs" className="py-24 bg-[#f5f5f7]">
      <div className="max-w-[980px] mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest mb-3">Engineering Reference</p>
          <h2 className="text-[40px] sm:text-[48px] font-bold tracking-tight text-[#1d1d1f]">
            Technical Specifications.
          </h2>
        </div>

        <div className="bg-white rounded-[20px] border border-[#e8e8ed] overflow-hidden">
          {ROWS.map((row, i) => (
            <div key={row.label}
              className={`flex flex-col sm:flex-row gap-4 sm:gap-8 px-8 py-6 ${i !== ROWS.length - 1 ? "border-b border-[#e8e8ed]" : ""}`}
            >
              <div className="sm:w-44 shrink-0 text-[13px] font-semibold text-[#1d1d1f]">{row.label}</div>
              <div className="flex-1">
                {row.type === "tags" ? (
                  <div className="flex flex-wrap gap-2">
                    {(row.value as string[]).map((v) => (
                      <span key={v} className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${row.tagColor}`}>{v}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-[#6e6e73] leading-relaxed">{row.value as string}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
