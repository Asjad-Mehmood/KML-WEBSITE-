"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, MapPin } from "lucide-react";
import GridSearch from "./GridSearch";
import { GRID_PAGES } from "@/lib/gridPages";
import { GUIDES } from "@/lib/guides";

const POPULAR = ["dubai-dltm", "qatar-national-grid", "utm-zone-40n", "utm-zone-39n", "utm-zone-42n", "utm-zone-43n", "british-national-grid", "australia-mga-zone-56"];
const FEATURED = ["survey-points-to-google-earth", "find-your-utm-zone", "total-station-csv-to-kmz-with-photos", "kml-vs-kmz"];

// Home page: jump to a grid's converter page, or read a guide
export default function GridsAndGuides() {
  const grids = POPULAR.map((slug) => GRID_PAGES.find((g) => g.slug === slug)).filter((g) => g !== undefined);
  const guides = FEATURED.map((slug) => GUIDES.find((g) => g.slug === slug)).filter((g) => g !== undefined);
  return (
    <section id="grids" aria-labelledby="grids-heading" className="py-20 lg:py-24 bg-white border-b border-slate-100">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <div className="text-center max-w-[620px] mx-auto mb-10 lg:mb-12">
          <h2 id="grids-heading" className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-4">
            Find Your Grid, Learn the Workflow
          </h2>
          <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed">
            Every one of the 5,800+ coordinate systems has its own converter page, and short guides cover the jobs surveyors do most.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Grids */}
          <div className="rounded-2xl border border-slate-200/80 bg-[#fafbfc] p-5 sm:p-7">
            <h3 className="flex items-center gap-2 text-[17px] font-bold text-slate-900">
              <MapPin className="w-5 h-5 text-[#0071e3]" aria-hidden /> Coordinate system converters
            </h3>
            <p className="mt-1.5 text-[13.5px] text-slate-500">Search by name, country or EPSG code, or pick a popular grid.</p>
            <div className="mt-4">
              <GridSearch id="home-epsg" tone="white" placeholder="Grid name, country or EPSG code" />
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {grids.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/convert/${g.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-[#0071e3] transition-colors"
                  >
                    {g.name.replace(/ \(.*\)$/, "")}
                    <span className="font-mono text-[11px] text-slate-500">{g.code}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/convert" className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0071e3] hover:underline">
              Browse all 5,800+ by country <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>

          {/* Guides */}
          <div className="rounded-2xl border border-slate-200/80 bg-[#fafbfc] p-5 sm:p-7">
            <h3 className="flex items-center gap-2 text-[17px] font-bold text-slate-900">
              <BookOpen className="w-5 h-5 text-[#0071e3]" aria-hidden /> Guides
            </h3>
            <p className="mt-1.5 text-[13.5px] text-slate-500">Step by step, using the real buttons in the app.</p>
            <ul className="mt-4 divide-y divide-slate-200/70">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="group flex items-start justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold text-slate-900 group-hover:text-[#0071e3]">{g.title}</span>
                      <span className="text-[12.5px] text-slate-500 mt-0.5 line-clamp-2">{g.description}</span>
                    </span>
                    <ArrowRight className="w-4 h-4 mt-1 shrink-0 text-slate-300 group-hover:text-[#0071e3]" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/guides" className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0071e3] hover:underline">
              All {GUIDES.length} guides <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
