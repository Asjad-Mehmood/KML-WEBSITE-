import React from "react";

export default function Workflow() {
  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200" id="workflow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-200">
            Simple 3-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-4">
            From Spreadsheets to Google Earth in 30 Seconds
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            No complicated CAD export setups or paid GIS subscriptions. Follow these 3 intuitive steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg mb-6 shadow-md shadow-blue-500/20">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Import Survey Points</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Copy and paste rows straight from Excel, drag-and-drop a CSV file, or type points by hand with auto-incrementing station IDs (TBM-01 &rarr; TBM-02).
            </p>
            <div className="p-3.5 rounded-xl bg-slate-100 font-mono text-xs text-slate-800 leading-relaxed border border-slate-200">
              STATION,EASTING,NORTHING,ELEV<br />
              BM-01,513556.612,2787467.856,14.85<br />
              BM-02,513642.180,2787510.320,15.22
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg mb-6 shadow-md shadow-blue-500/20">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Select National Grid</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Type your country or AutoCAD zone code (e.g. <code>DUB-DLTM</code>, <code>UTM 40N</code>, <code>British Grid</code>). Check your known benchmark with the integrated prover tool.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-100 font-mono text-xs text-slate-800 leading-relaxed border border-slate-200">
              Grid: EPSG:3997 (Dubai DLTM)<br />
              Datum: Direct WGS84 Alignment<br />
              Tie Accuracy: &lt; 1 metre certified
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg mb-6 shadow-md shadow-blue-500/20">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Export 3D KML or KMZ</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Press <strong>Save KML</strong> or <strong>Save KMZ</strong>. Open the generated file in Google Earth, Google Earth Pro, or GIS apps for instant 3D inspection.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-100 font-mono text-xs text-slate-800 leading-relaxed border border-slate-200">
              Saved: W-15_Tree_Survey.kmz<br />
              Placemarks: 48 &bull; Boundaries: 3<br />
              Photos: 12 embedded in balloon
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
