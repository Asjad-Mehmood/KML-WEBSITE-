import React from "react";

export default function Features() {
  return (
    <section className="py-20 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-200">
            Engineered For Surveyors
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-4">
            Built for Cadastral Surveyors, Civil Engineers &amp; GIS Professionals
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Excel to KML Pro eliminates tedious coordinate conversion errors. Designed specifically for construction
            site benchmarks, infrastructure surveys, boundary traverses, and drone operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">6,864 World Grid Systems</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Search by country, EPSG code, or AutoCAD drawing code (e.g. <code>DUB-DLTM</code>, <code>DUB-OLD40</code>,{" "}
              <code>OSGB36</code>). Every projection family is supported with automated 3-parameter and 7-parameter
              datum shift onto WGS84.
            </p>
            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 font-semibold">
              <span className="text-slate-400">Accuracy Badges</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                &lt; 1m / 1-2m Tied
              </span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">100% Offline &amp; Air-Gapped</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Everything runs purely on your workstation inside the Windows Edge WebView2 engine. No survey benchmarks,
              defense projects, or confidential site coordinates are ever transmitted to any cloud or remote server.
            </p>
            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 font-semibold">
              <span className="text-slate-400">Privacy Standard</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Air-Gapped Ready
              </span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Column &amp; Raw Importer</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Paste rows straight from Excel or drag-and-drop raw total station CSV files. Automatically recognises column
              aliases (<code>Easting</code>, <code>E</code>, <code>X</code>, <code>Level</code>, <code>RL</code>, <code>Z</code>)
              or reads position-based dumps with no headers.
            </p>
            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 font-semibold">
              <span className="text-slate-400">Auto Detection</span>
              <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                6 Headerless Orders
              </span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-6 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Helmert 2D Site Calibration</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Fit a local project site grid onto national control with multi-point least-squares calibration. Calculates
              shift, rotation in seconds, and scale in PPM, displaying residual errors on every control point.
            </p>
            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 font-semibold">
              <span className="text-slate-400">Verification</span>
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                Known-Point Prover
              </span>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">KMZ Geotagged Site Photos</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Attach site inspection photos matching point names or coordinate tags. Automatically bundles the pictures
              directly inside a portable <code>.kmz</code> file, displaying high-res photos inside Google Earth popup balloons.
            </p>
            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 font-semibold">
              <span className="text-slate-400">Packaging</span>
              <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                Embedded KMZ Media
              </span>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Boundary Polygons &amp; Areas</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Connect points by feature code or sequential run. Automatically closes shapes to compute exact ground
              perimeter length and ellipsoidal surface area in square metres (m²) and hectares (ha).
            </p>
            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 font-semibold">
              <span className="text-slate-400">Ground Geometry</span>
              <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
                m² &amp; Hectare Areas
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
