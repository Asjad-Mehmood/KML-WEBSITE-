import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Ruler, Scale, Waypoints } from "lucide-react";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import NextSteps from "../../components/NextSteps";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { TOOLS, TOOL_GROUPS, type ToolGroup } from "@/lib/tools";
import { openGraphFor } from "@/lib/site";

const TITLE = "Free Survey and Coordinate Tools";
const DESCRIPTION =
  "Free calculators for surveyors, engineers and landowners: coordinates on a map, DMS and UTM converters, distance and bearing, plot area, slope, traverse and level adjustment, and land area and length units. They work in your browser, with no sign-up.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools" },
  openGraph: openGraphFor("/tools", `${TITLE} | Excel to KML`, DESCRIPTION),
};

const ICONS: Record<ToolGroup, React.ElementType> = {
  Coordinates: Compass,
  Measure: Ruler,
  "Survey calculations": Waypoints,
  "Convert units": Scale,
};

export default function ToolsIndex() {
  return (
    <PageShell>
      <BreadcrumbStructuredData name="Free tools" path="/tools" />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro eyebrow="Free tools" title={TITLE} lead={DESCRIPTION} />
        {TOOL_GROUPS.map((g) => {
          const Icon = ICONS[g];
          return (
            <section key={g} className="mt-10">
              <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-4">
                <Icon className="w-4 h-4" aria-hidden /> {g}
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TOOLS.filter((t) => t.group === g).map((t) => (
                  <li key={t.slug} className="h-full flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-blue-200 hover:shadow-[0_12px_32px_-16px_rgba(0,113,227,0.3)] transition-all">
                    <Link href={`/tools/${t.slug}`} className="group">
                      <span className="block text-[16px] font-bold text-slate-900 group-hover:text-[#0071e3]">{t.name}</span>
                      <span className="mt-2 block text-[13.5px] text-slate-600 leading-relaxed">{t.description}</span>
                    </Link>
                    <span className="mt-auto pt-4 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/tools/${t.slug}/use`}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-semibold"
                      >
                        Use the tool <ArrowRight className="w-4 h-4" aria-hidden />
                      </Link>
                      <Link href={`/tools/${t.slug}`} className="px-3 py-2 text-[13px] font-semibold text-slate-600 hover:text-[#0071e3]">
                        About it
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <NextSteps title="Got a whole sheet of points?" />
      </div>
    </PageShell>
  );
}
