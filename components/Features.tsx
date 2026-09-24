import React from "react";

const FEATURES = [
  {
    icon: "🌐",
    title: "6,864 World Grid Systems",
    desc: "Search by country or EPSG code. Every projection family supported — Transverse Mercator, Lambert, UTM, and more — with automated datum shifts onto WGS84.",
    tag: "< 1m Accuracy",
    tagColor: "text-[#34c759] bg-[#34c759]/10",
  },
  {
    icon: "🔒",
    title: "100% Offline & Air-Gapped",
    desc: "All math runs locally on your Windows PC. No benchmarks, site photos, or client coordinates are ever transmitted to any server.",
    tag: "Air-Gapped Ready",
    tagColor: "text-[#0071e3] bg-[#0071e3]/10",
  },
  {
    icon: "📋",
    title: "Smart Column Importer",
    desc: "Paste rows from Excel or drag-and-drop raw total station CSV files. Automatically recognizes column aliases or reads position-based headerless dumps.",
    tag: "6 Headerless Orders",
    tagColor: "text-[#bf5af2] bg-[#bf5af2]/10",
  },
  {
    icon: "📐",
    title: "Helmert 2D Site Calibration",
    desc: "Fit your local project grid onto national control points with multi-point least-squares. Displays residual errors on every control mark.",
    tag: "Known-Point Prover",
    tagColor: "text-[#ff9f0a] bg-[#ff9f0a]/10",
  },
  {
    icon: "📷",
    title: "KMZ Geotagged Photos",
    desc: "Attach site inspection photos that match point names. Bundled directly inside the portable .kmz, displayed in Google Earth photo balloons.",
    tag: "Embedded Media",
    tagColor: "text-[#ff3b30] bg-[#ff3b30]/10",
  },
  {
    icon: "🗺️",
    title: "Boundary Polygons & Areas",
    desc: "Connect points by feature code. Automatically closes shapes and computes exact ground perimeter and ellipsoidal surface area in m² and hectares.",
    tag: "m² & Hectares",
    tagColor: "text-[#34c759] bg-[#34c759]/10",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-[980px] mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest mb-3">Engineered for Surveyors</p>
          <h2 className="text-[40px] sm:text-[48px] font-bold tracking-tight text-[#1d1d1f] leading-tight">
            Built for Cadastral Surveyors,<br className="hidden sm:block" /> Civil Engineers & GIS Professionals.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="group p-7 rounded-[20px] bg-[#fbfbfd] border border-[#e8e8ed] hover:border-[#d2d2d7] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <div className="text-[32px] mb-5 group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
              <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">{f.title}</h3>
              <p className="text-[14px] text-[#6e6e73] leading-relaxed mb-5">{f.desc}</p>
              <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${f.tagColor}`}>
                {f.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
