import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageShell from "../../components/PageShell";
import { GUIDES } from "@/lib/guides";
import { openGraphFor } from "@/lib/site";

const TITLE = "Guides: Survey Points in Google Earth";
const DESCRIPTION = "Short, practical guides to getting survey coordinates from Excel and total stations into Google Earth, with photos, on the right grid.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  openGraph: openGraphFor("/guides", `${TITLE} | Excel to KML Pro`, DESCRIPTION),
};

export default function GuidesIndex() {
  return (
    <PageShell>
      <div className="max-w-[760px] mx-auto px-5 sm:px-8">
        <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-tight text-slate-900">Guides</h1>
        <p className="mt-3 text-[16px] text-slate-600 leading-relaxed">{DESCRIPTION}</p>
        <ul className="mt-8 divide-y divide-slate-100 border-y border-slate-100">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="group block py-5">
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block text-[17px] font-bold text-slate-900 group-hover:text-[#0071e3]">{g.title}</span>
                    <span className="block mt-1 text-[14px] text-slate-600 leading-relaxed">{g.description}</span>
                  </span>
                  <ArrowRight className="w-5 h-5 mt-1 text-slate-300 group-hover:text-[#0071e3] shrink-0" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
