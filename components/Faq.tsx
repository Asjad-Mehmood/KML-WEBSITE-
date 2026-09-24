"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "Does this tool upload my survey data to the internet?",
    a: "No, absolutely not. All coordinate parsing, projection math, Helmert fitting, and KML/KMZ packaging runs 100% locally on your PC. No points or site photos are ever sent over a network.",
  },
  {
    q: "Why does Windows SmartScreen show a warning?",
    a: "SmartScreen warns about any newly released open-source executable without an expensive commercial code-signing certificate. Click \"More info\" then \"Run anyway\". You can verify the official SHA-256 hash on the GitHub releases page.",
  },
  {
    q: "How does the 6,864 World Grid list work with AutoCAD?",
    a: "In AutoCAD Civil 3D, check Drawing Settings → Units and Zone. For example, DUB-DLTM is Dubai Local Transverse Mercator (EPSG:3997). Type those exact CAD codes into Excel to KML Pro's grid search and a confirmation badge appears.",
  },
  {
    q: "Can I import raw controller data with no header rows?",
    a: "Yes. Exports from Leica, Trimble, Topcon, and Sokkia often contain only numbers. Excel to KML Pro reads by column position and shows the assumed order so you can choose among 6 different arrangements.",
  },
  {
    q: "How does the Helmert 2D Site Calibration feature work?",
    a: "Enter 3 or more known control benchmark coordinates. The engine solves Translation (X/Y shifts), Rotation (seconds of arc), and Scale (PPM) and highlights residual errors on each mark.",
  },
  {
    q: "What is the difference between the Lite build and heavy build?",
    a: "The Lite build (3.2 MB) uses Edge WebView2 already pre-installed in Windows 10/11. The heavy Electron build (~62 MB) includes its own Chromium engine for stripped-down Windows installations.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-[720px] mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-[40px] sm:text-[48px] font-bold tracking-tight text-[#1d1d1f]">Common Questions.</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <div key={i} className="bg-[#fbfbfd] border border-[#e8e8ed] rounded-[16px] overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-[15px] font-semibold text-[#1d1d1f]">{item.q}</span>
                <div className="w-6 h-6 rounded-full bg-[#e8e8ed] flex items-center justify-center shrink-0 transition-colors duration-200">
                  {open === i
                    ? <Minus className="w-3.5 h-3.5 text-[#6e6e73]" />
                    : <Plus className="w-3.5 h-3.5 text-[#6e6e73]" />
                  }
                </div>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-[14px] text-[#6e6e73] leading-relaxed border-t border-[#e8e8ed] pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
