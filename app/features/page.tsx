import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  FolderOpen,
  Globe,
  Lightbulb,
  Map as MapIcon,
  Radar,
  RotateCcw,
  ShieldCheck,
  Tags,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import NextSteps from "../../components/NextSteps";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { FEATURES } from "@/lib/featureGroups";
import { FEATURE_DETAILS } from "@/lib/featureDetails";
import { openGraphFor } from "@/lib/site";

const TITLE = "Features";
const DESCRIPTION =
  "Everything Excel to KML does: 5,800+ grids offline, automatic column detection, site calibration, levels, boundaries and areas, site photos in Google Earth, and exports for GIS, CAD and survey instruments.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/features" },
  openGraph: openGraphFor("/features", `${TITLE} | Excel to KML`, DESCRIPTION),
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* Tools in the program that the cards above don't cover. Each line describes what it does now. */
const MORE: { icon: React.ElementType; title: string; text: string }[] = [
  {
    icon: FileSpreadsheet,
    title: "Open Excel files directly",
    text: "Open or drag in an .xlsx or .xlsm file. The first sheet with data is read, and you can switch to any other sheet in one click.",
  },
  {
    icon: MapIcon,
    title: "Save for GIS and GPS",
    text: "Besides KML and KMZ: Excel, CSV, AutoCAD DXF, a zipped Shapefile, GeoJSON, GPX, Leica GSI-16 and Trimble files, and a PDF survey report.",
  },
  {
    icon: FolderOpen,
    title: "Jobs",
    text: "Keep the whole job — points, grid, symbols, photos and settings — under a name, and carry on later. Signed in, jobs open on any computer.",
  },
  {
    icon: ShieldCheck,
    title: "Quality checks and design comparison",
    text: "Catches a point shot twice, points on top of each other and levels that jump; compares surveyed points with design coordinates.",
  },
  {
    icon: Tags,
    title: "Symbol library",
    text: "Set the marker and colour for each code once — TBM, MH, TREE — and every job uses it. Export the library to share it with the team.",
  },
  {
    icon: Radar,
    title: "Radar simulator",
    text: "Set up on any point and see every other point by bearing and distance, with a simulated rover and a setting-out sheet to save.",
  },
  {
    icon: RotateCcw,
    title: "Undo and redo",
    text: "Take back a clear, a paste or an edit to your rows with Ctrl+Z, and put it back with Ctrl+Y.",
  },
  {
    icon: Globe,
    title: "Works offline",
    text: "The Windows app converts with no internet connection. Only satellite pictures, updates and signing in use it.",
  },
];

export default function FeaturesPage() {
  return (
    <PageShell>
      <BreadcrumbStructuredData name="Features" path="/features" />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro eyebrow="Features" title="Everything it does, and how" lead={DESCRIPTION}>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-semibold"
          >
            See how it works <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          <Link href="/formats" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-[14px] font-semibold text-slate-800">
            File formats
          </Link>
        </PageIntro>

        {/* jump list */}
        <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <a
              key={f.title}
              href={`#${slug(f.title)}`}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-[#0071e3]"
            >
              {f.title}
            </a>
          ))}
          <a href="#more" className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-[#0071e3]">
            More in the program
          </a>
        </nav>

        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <section key={f.title} id={slug(f.title)} className="mt-16 scroll-mt-28">
              <div className="flex items-start gap-4 max-w-3xl">
                <span className={`shrink-0 w-11 h-11 rounded-xl ${f.accentLight} border ${f.accentBorder} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${f.accent}`} aria-hidden />
                </span>
                <div>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${f.accent}`}>{f.badge}</p>
                  <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-slate-900">{f.title}</h2>
                  <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {f.chips.map((chip) => {
                  const d = FEATURE_DETAILS[chip];
                  if (!d) return null;
                  return (
                    <article key={chip} className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
                      <h3 className="text-[16px] font-bold text-slate-900">{d.title}</h3>
                      <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">{d.summary}</p>
                      <ul className="mt-3 space-y-2">
                        {d.points.map((p) => (
                          <li key={p} className="flex gap-2 text-[13.5px] text-slate-700 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                      {d.specs && (
                        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px] border-t border-slate-100 pt-3">
                          {d.specs.map(([k, v]) => (
                            <div key={k} className="contents">
                              <dt className="text-slate-500">{k}</dt>
                              <dd className="text-slate-800 font-medium">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {d.tip && (
                        <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 border border-amber-200/70 px-3 py-2 text-[12.5px] text-amber-900">
                          <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                          <span>{d.tip}</span>
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section id="more" className="mt-16 scroll-mt-28">
          <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-slate-900">More in the program</h2>
          <p className="mt-2 max-w-3xl text-[15px] text-slate-600 leading-relaxed">
            The tools every job uses, from the section list on the left of the program.
          </p>
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MORE.map((m) => (
              <li key={m.title} className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <m.icon className="w-5 h-5 text-[#0071e3]" aria-hidden />
                <h3 className="mt-3 text-[15px] font-bold text-slate-900">{m.title}</h3>
                <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">{m.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <NextSteps />
      </div>
    </PageShell>
  );
}
