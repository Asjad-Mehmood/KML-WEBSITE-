import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, FileOutput, ShieldCheck } from "lucide-react";
import PageShell from "../../components/PageShell";
import { GUIDES, GUIDE_CATEGORIES, type GuideCategory } from "@/lib/guides";
import { openGraphFor } from "@/lib/site";

const TITLE = "Guides: Survey Points in Google Earth";
const DESCRIPTION =
  "Short, practical guides to getting survey coordinates from Excel and total stations into Google Earth and AutoCAD, on the right grid.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  openGraph: openGraphFor("/guides", `${TITLE} | Excel to KML`, DESCRIPTION),
};

const ICONS: Record<GuideCategory, React.ElementType> = {
  "Getting started": BookOpen,
  Coordinates: Compass,
  "Checking the work": ShieldCheck,
  Deliverables: FileOutput,
};

export default function GuidesIndex() {
  return (
    <PageShell>
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-tight text-slate-900">Guides</h1>
        <p className="mt-3 max-w-2xl text-[16px] text-slate-600 leading-relaxed">{DESCRIPTION}</p>

        {GUIDE_CATEGORIES.map((cat) => {
          const Icon = ICONS[cat];
          return (
            <section key={cat} className="mt-10">
              <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                <Icon className="w-4 h-4" aria-hidden /> {cat}
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GUIDES.filter((g) => g.category === cat).map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guides/${g.slug}`}
                      className="group h-full flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-blue-200 hover:shadow-[0_12px_32px_-16px_rgba(0,113,227,0.3)] transition-all"
                    >
                      <span className="text-[16px] font-bold text-slate-900 leading-snug group-hover:text-[#0071e3]">{g.title}</span>
                      <span className="mt-2 text-[13.5px] text-slate-600 leading-relaxed">{g.description}</span>
                      <span className="mt-auto pt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0071e3]">
                        Read guide <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <div className="mt-12 rounded-2xl bg-slate-50 border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[15px] text-slate-700">
            <strong className="text-slate-900">Know your grid?</strong> Open a converter already set to it, with its parameters.
          </p>
          <Link href="/convert" className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-semibold">
            Find your grid <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
