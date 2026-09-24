import React from "react";

const STEPS = [
  {
    num: "01",
    title: "Import Survey Points",
    desc: "Copy and paste rows directly from Excel, or drag-and-drop a CSV file. Auto-detects headers and column aliases.",
    code: ["STATION, EASTING, NORTHING, ELEV", "BM-01, 513556.612, 2787467.856, 14.85", "BM-02, 513642.180, 2787510.320, 15.22"],
  },
  {
    num: "02",
    title: "Select National Grid",
    desc: "Type your country, EPSG code, or AutoCAD zone name (e.g. DUB-DLTM, UTM 40N, British Grid). Verify with the built-in prover tool.",
    code: ["Grid: EPSG:3997 (Dubai DLTM)", "Datum: Direct WGS84 Alignment", "Tie Accuracy: < 1 metre certified"],
  },
  {
    num: "03",
    title: "Export 3D KML or KMZ",
    desc: "Press Save KML or Save KMZ. Open instantly in Google Earth, Google Earth Pro, or any GIS application.",
    code: ["Saved: W-15_Tree_Survey.kmz", "Placemarks: 48 · Boundaries: 3", "Photos: 12 embedded in balloons"],
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="py-24 bg-[#f5f5f7]">
      <div className="max-w-[980px] mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="text-[40px] sm:text-[48px] font-bold tracking-tight text-[#1d1d1f]">
            From Spreadsheets to Google Earth<br className="hidden sm:block" /> in 30 Seconds.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.num} className="bg-white rounded-[20px] border border-[#e8e8ed] p-8 relative overflow-hidden">
              <div className="absolute top-6 right-6 text-[56px] font-black text-[#f5f5f7] leading-none select-none">{s.num}</div>
              <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2 relative">{s.title}</h3>
              <p className="text-[14px] text-[#6e6e73] leading-relaxed mb-6 relative">{s.desc}</p>
              <div className="bg-[#1d1d1f] rounded-[12px] p-4 font-mono text-[11px] text-[#aeaeb2] leading-loose">
                {s.code.map((line, i) => (
                  <div key={i} className={i === 0 ? "text-[#6e6e73]" : "text-[#f5f5f7]"}>{line}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
