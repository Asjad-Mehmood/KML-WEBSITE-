"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Minus, 
  HelpCircle, 
  MessageSquare, 
  FileSpreadsheet, 
  ExternalLink,
  Sparkles
} from "lucide-react";

type FaqCategory = "all" | "grids" | "import" | "earth" | "security";

interface FaqItem {
  id: number;
  category: "grids" | "import" | "earth" | "security";
  categoryLabel: string;
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    id: 1,
    category: "grids",
    categoryLabel: "Coordinate Grids",
    q: "How do I find my regional government map grid?",
    a: "You can search by country name (like Dubai, Qatar, Pakistan, Saudi Arabia, UK) or standard EPSG number (like EPSG:3997, EPSG:2932, EPSG:32642). If you use AutoCAD Civil 3D, you can type the same drawing zone code. The tool automatically handles the math so your points land in the exact real-world spot on Google Earth.",
  },
  {
    id: 2,
    category: "grids",
    categoryLabel: "Coordinate Grids",
    q: "How does local site calibration work if my project has its own coordinate system?",
    a: "If your site uses a local total station grid (such as a 1000, 1000 base), enter 3 or more known government control benchmarks. The software calculates scale correction and True North rotation, showing you the exact millimeter differences on each mark before exporting to Google Earth.",
  },
  {
    id: 3,
    category: "import",
    categoryLabel: "Excel & CSV",
    q: "Can I import raw survey data from total stations without headers?",
    a: "Yes. Field data collectors from Leica, Trimble, Topcon, and Sokkia often export comma-separated numbers without column headers. The importer lets you verify which column is Point ID, Easting, Northing, and Elevation before processing.",
  },
  {
    id: 4,
    category: "import",
    categoryLabel: "Excel & CSV",
    q: "Is there a limit on how many survey points I can convert at once?",
    a: "No. The desktop application handles 10,000+ points in under a second. You can paste large Excel sheets or drag in multi-megabyte CSV files containing entire highway traverses, cadastral boundary pegs, or topographic contour grids.",
  },
  {
    id: 5,
    category: "earth",
    categoryLabel: "Google Earth 3D",
    q: "How do 3D elevations and height extrusions display in Google Earth?",
    a: "You can choose to place survey pins directly on ground terrain, or extrude vertical 3D lines rising from the ground up to your measured Z height. This makes slope changes, structure heights, and cut-and-fill depths clearly visible in 3D.",
  },
  {
    id: 6,
    category: "earth",
    categoryLabel: "Google Earth 3D",
    q: "Can I connect points to draw boundary property lines and calculate land area?",
    a: "Yes. By grouping survey points with feature codes (like BOUNDARY, FENCE, or LOT), the software draws closed 3D polygon outlines in Google Earth and automatically calculates boundary perimeter length and total ground area in square metres and hectares.",
  },
  {
    id: 7,
    category: "security",
    categoryLabel: "Privacy & PC",
    q: "Does this tool upload my survey coordinates or site photos to the internet?",
    a: "No. All coordinate parsing, geodetic math, and KML/KMZ packaging runs 100% locally on your PC. No coordinates, client project details, or site photos are ever sent to external cloud servers.",
  },
  {
    id: 8,
    category: "security",
    categoryLabel: "Privacy & PC",
    q: "Why does Windows SmartScreen show an unrecognized app prompt on first run?",
    a: "Windows SmartScreen routinely shows this safety prompt on newly released open-source software that doesn't purchase an expensive commercial code-signing certificate. Click \"More info\" and then \"Run anyway\". You can also verify the official SHA-256 binary hash on GitHub.",
  },
];

export default function Faq() {
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>("all");
  const [openId, setOpenId] = useState<number | null>(1);

  const filteredFaqs = selectedCategory === "all" 
    ? FAQS 
    : FAQS.filter(f => f.category === selectedCategory);

  return (
    <section id="faq" className="py-20 lg:py-26 bg-[#fafbfc] border-b border-slate-100">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-[620px] mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Help &amp; Answers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">
            Frequently Asked Questions — Coordinate Conversion &amp; Google Earth KML
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Everything you need to know about coordinate systems, exports, data security, and troubleshooting.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: "all", label: "All Questions" },
            { id: "grids", label: "Coordinates & Grids" },
            { id: "import", label: "Excel & CSV Import" },
            { id: "earth", label: "Google Earth 3D" },
            { id: "security", label: "Privacy & Local PC" },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as FaqCategory)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Support Card (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5 lg:sticky lg:top-24">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Have a Project-Specific Question?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Working with an unusual local site datum or encountering an AutoCAD coordinate mismatch? Our community can help.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <a
                href="https://github.com/chaudaryyabdullah03-collab/kml-convertor/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200/80 transition-all group"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  GitHub Discussions
                </span>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </a>

              <a
                href="#download"
                className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200/80 transition-all group"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Download Sample CSV
                </span>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </a>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              💡 <strong>Instant Check:</strong> You can test single coordinates in the <a href="#showcase" className="text-blue-600 font-semibold hover:underline">Interactive Studio</a> above before processing bulk files.
            </div>
          </div>

          {/* Right Accordion List (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            {filteredFaqs.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? "border-blue-200/90 shadow-[0_4px_20px_rgba(37,99,235,0.04)]" 
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="w-full flex items-start justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
                  >
                    <div className="space-y-1 pr-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">
                        {item.categoryLabel}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {item.q}
                      </h4>
                    </div>
                    
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                      isOpen ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
