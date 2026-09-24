import React from "react";
import { 
  FileSpreadsheet, 
  Globe, 
  Layers, 
  ArrowRight, 
  Sparkles,
  CheckCircle2
} from "lucide-react";

interface StepItem {
  step: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  previewHeader: string;
  previewLines: { label: string; val: string }[];
}

const STEPS: StepItem[] = [
  {
    step: "Step 01",
    icon: FileSpreadsheet,
    title: "Import Your Spreadsheet",
    desc: "Paste rows directly from Excel or drag-and-drop raw CSV files. Automatically identifies Point ID, Easting, Northing, and Elevation columns.",
    previewHeader: "Spreadsheet Input",
    previewLines: [
      { label: "Format", val: "Excel (.xlsx) or CSV" },
      { label: "Columns", val: "Point, East, North, Elev" },
      { label: "Header Check", val: "Auto-detected" },
    ],
  },
  {
    step: "Step 02",
    icon: Globe,
    title: "Choose Your Map Grid",
    desc: "Select your country or EPSG coordinate system (such as Dubai DLTM, Qatar QNG, Pakistan UTM, or UK Grid). Datum shifts calculate automatically.",
    previewHeader: "Coordinate Datum",
    previewLines: [
      { label: "Target Grid", val: "EPSG:3997 (Dubai DLTM)" },
      { label: "Ellipsoid", val: "Direct WGS84 Shift" },
      { label: "Accuracy", val: "Under 1 mm precision" },
    ],
  },
  {
    step: "Step 03",
    icon: Layers,
    title: "Save KML or KMZ File",
    desc: "Click export to generate clean 3D placemark files with vertical altitude extrusions. Opens immediately in Google Earth and GIS software.",
    previewHeader: "3D Deliverable",
    previewLines: [
      { label: "Export File", val: "Survey_Project.kmz" },
      { label: "Placemarks", val: "3D elevation anchored" },
      { label: "Compatibility", val: "Google Earth Pro & Web" },
    ],
  },
];

export default function Workflow() {
  return (
    <section id="workflow" className="py-20 lg:py-24 bg-[#fafbfc] border-b border-slate-100">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-[620px] mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Three-Step Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 mb-3">
            From Raw Spreadsheets to 3D Models
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Three simple steps to transform coordinate tables into georeferenced Google Earth deliverables without complex GIS configurations.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div 
                key={s.step} 
                className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Step Pill & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-bold font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100/80">
                      {s.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200/60 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {s.desc}
                  </p>
                </div>

                {/* Clean Eye-Conforming Preview Box */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 font-mono text-xs space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans pb-1.5 border-b border-slate-200/60 flex items-center justify-between">
                    <span>{s.previewHeader}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  {s.previewLines.map((line, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 font-sans">{line.label}:</span>
                      <span className="font-semibold text-slate-800 text-right truncate">{line.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
