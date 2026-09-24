import React from "react";

export default function SpecsTable() {
  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200" id="specs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-200">
            Engineering Reference
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-4">
            Technical Specifications &amp; Compatibility
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Standardized geodetic math formulas, projection definitions, and supported field instrument formats.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  <th className="py-4 px-6 w-1/4">Category</th>
                  <th className="py-4 px-6 w-3/4">Specifications &amp; Supported Standards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900 align-top">
                    Supported Input Formats
                  </td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs border border-blue-200">
                        CSV (Comma-Separated)
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs border border-blue-200">
                        TSV (Tab-Separated)
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs border border-blue-200">
                        Space-Delimited TXT
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs border border-blue-200">
                        Direct Excel Paste
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs border border-blue-200">
                        Total Station Raw Exports
                      </span>
                    </div>
                    <small className="text-slate-500 text-xs block">
                      Auto-detects header row or position order (Point, Easting, Northing, Elevation, Code).
                    </small>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900 align-top">
                    Supported Output Formats
                  </td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-200">
                        KML 2.2 Standard
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-200">
                        KMZ Compressed Archive
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-200">
                        Interactive HTML Survey Balloon
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium text-xs border border-emerald-200">
                        GeoJSON Compatible Elements
                      </span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900 align-top">
                    Geodetic Projections
                  </td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">
                    Transverse Mercator, Universal Transverse Mercator (UTM 1&ndash;60 N/S), Lambert Conformal Conic (1SP &amp; 2SP), Oblique Mercator, Cassini-Soldner, Stereographic, Krovak, Albers Equal Area, and National Custom Grids.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900 align-top">
                    Ellipsoids &amp; Datums
                  </td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">
                    WGS84, ETRS89, GDA94/GDA2020, NAD83, ED50, Clarke 1880, Airy 1830, Bessel 1841, Everest 1830, Hayford 1909, Qatar National Datum (QND95), DLTM, and 1,000+ local historical datums.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900 align-top">
                    Datum Shift Models
                  </td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">
                    Automated 7-parameter Helmert (Bursa-Wolf) transformation, 3-parameter Molodensky shifts, and custom 2D site calibration from local control points.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900 align-top">
                    Client Engine &amp; Security
                  </td>
                  <td className="py-4 px-6 text-slate-600 leading-relaxed">
                    Microsoft Edge WebView2 (Chromium 120+ based) with Go wrapper. 0 MB network egress for conversions, air-gapped security, zero external telemetry.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
