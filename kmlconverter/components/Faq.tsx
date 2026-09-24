"use client";

import React, { useState } from "react";

export default function Faq() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does this tool upload my survey data to the internet?",
      a: (
        <span>
          <strong>No, absolutely not.</strong> All coordinate parsing, projection mathematics, Helmert fitting,
          and KML/KMZ packaging occur 100% locally on your PC. No points or site photos are ever sent over a
          network. The only optional feature that touches the internet is the &quot;Load Satellite&quot; toggle on the
          map preview if you choose to turn it on.
        </span>
      ),
    },
    {
      q: "Why does Windows SmartScreen show a warning when running the installer?",
      a: (
        <span>
          Windows SmartScreen warns about any newly released or open-source executable that does not have an
          expensive commercial digital certificate ($400+/year). This is completely normal for community
          open-source software. Simply click <strong>&quot;More info&quot;</strong> and then{" "}
          <strong>&quot;Run anyway&quot;</strong>. You can verify the official SHA-256 hash or review the open-source code on GitHub.
        </span>
      ),
    },
    {
      q: "How does the 6,864 World Grid list work with AutoCAD drawing settings?",
      a: (
        <span>
          In AutoCAD Civil 3D, check your Drawing Settings under <em>Units and Zone</em>. For example,{" "}
          <code>DUB-DLTM</code> is Dubai Local Transverse Mercator (EPSG:3997), and <code>DUB-OLD40</code> is Old
          Dubai on UTM Zone 40 (EPSG:27040). You can type those exact CAD codes straight into the grid search box in
          Excel to KML Pro, and a yellow CAD badge will confirm the match.
        </span>
      ),
    },
    {
      q: "Can I import raw controller data with no heading rows?",
      a: (
        <span>
          Yes. Raw exports from total stations (Leica, Trimble, Topcon, Sokkia) frequently contain only numbers.
          Excel to KML Pro automatically identifies that no headers exist and reads the columns by position. A
          yellow bar appears displaying the assumed column order, allowing you to select between 6 different orders
          (e.g., Station-Easting-Northing-Elevation or Point-Northing-Easting).
        </span>
      ),
    },
    {
      q: "How does the Site Calibration (Helmert 2D Fit) feature work?",
      a: (
        <span>
          When you enter 3 or more known control benchmark coordinates, the calibration engine solves the best
          transformation parameters: Translation (X and Y shifts), Rotation (in seconds of arc), and Scale factor
          (in PPM). It highlights residual errors on each mark so you can instantly detect if a physical survey
          peg has been disturbed or mismeasured.
        </span>
      ),
    },
    {
      q: "What is the difference between the Lite build and the heavy build?",
      a: (
        <span>
          The <strong>Lite build (3.2 MB)</strong> uses the Edge WebView2 engine already pre-installed in Windows 10
          and 11, resulting in a tiny download and instantaneous startup. The heavy Electron build (~62 MB) includes
          its own Chromium rendering engine and is only needed if running on an outdated or stripped-down Windows
          installation lacking WebView2.
        </span>
      ),
    },
  ];

  return (
    <section className="py-20 bg-white" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-200">
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-4">
            Answers to Common Surveyor Inquiries
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Everything you need to know about coordinate accuracy, offline privacy, and file compatibility.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full py-4.5 px-6 text-left font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="text-base">{item.q}</span>
                <svg
                  className={`w-5 h-5 text-slate-400 transform transition-transform shrink-0 ${
                    activeFaq === idx ? "rotate-180 text-blue-600" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
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
