import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageShell from "../../components/PageShell";
import GridSearch from "../../components/GridSearch";
import { GRID_PAGES, GRID_REGIONS } from "@/lib/gridPages";
import { countries } from "@/lib/epsgCatalog";
import { openGraphFor } from "@/lib/site";

const TITLE = "Survey Grid to KML Converters";
const DESCRIPTION =
  "Convert eastings and northings from popular national and UTM grids (Dubai DLTM, Qatar QNG, UTM zones, British National Grid and more) to Google Earth KML and KMZ.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/convert" },
  openGraph: openGraphFor("/convert", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default function ConvertIndex() {
  return (
    <PageShell>
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-tight text-slate-900">{TITLE}</h1>
        <p className="mt-3 max-w-2xl text-[16px] text-slate-600 leading-relaxed">
          Pick your grid to open the converter already set to it, with the grid&apos;s parameters and tips. Popular grids are
          below; every other EPSG system is listed by country further down.
        </p>
        <div className="mt-6 max-w-xl">
          <GridSearch id="grid-search" />
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {GRID_REGIONS.map((region) => {
            const grids = GRID_PAGES.filter((g) => g.region === region);
            if (!grids.length) return null;
            return (
              <section key={region} id={region.toLowerCase().replace(/[^a-z]+/g, "-")}>
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-3">{region}</h2>
                <ul className="space-y-1">
                  {grids.map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/convert/${g.slug}`}
                        className="group flex items-center justify-between gap-3 px-3 py-2 -mx-3 rounded-lg hover:bg-slate-50"
                      >
                        <span className="min-w-0">
                          <span className="block text-[14.5px] font-semibold text-slate-900 group-hover:text-[#0071e3]">{g.name}</span>
                          <span className="block text-[12px] font-mono text-slate-500">EPSG:{g.code}</span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0071e3] shrink-0" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        <section id="find" className="mt-14">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Every coordinate system</h2>
          <p className="mt-2 text-[15px] text-slate-600">
            All {countries().reduce((n, c) => n + c.count, 0).toLocaleString("en-US")} supported coordinate systems (EPSG and Esri
            codes) have their own page. Search by name, country or code, or browse by country.
          </p>
          <div className="mt-4 max-w-xl">
            <GridSearch id="grid-search-all" />
          </div>
          <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1.5 text-[13.5px]">
            {countries().map((c) => (
              <li key={c.slug}>
                <Link href={`/convert/country/${c.slug}`} className="text-slate-700 hover:text-[#0071e3]">
                  {c.name} <span className="text-slate-500">({c.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 rounded-2xl bg-slate-50 border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[15px] text-slate-700">
            <strong className="text-slate-900">Converting a whole sheet?</strong> Paste rows from Excel, pick any EPSG grid and save KML,
            KMZ or DXF.
          </p>
          <Link href="/app" className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-semibold">
            Open the web app <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
