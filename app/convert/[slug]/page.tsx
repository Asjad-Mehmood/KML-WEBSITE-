import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Download, Lightbulb, MapPin } from "lucide-react";
import PageShell from "../../../components/PageShell";
import GridConverter from "../../../components/GridConverter";
import { GRID_PAGES, gridBySlug } from "@/lib/gridPages";
import { epsgRow } from "@/lib/epsgIndex";
import { areaBox, gridParameterRows, unitLabel } from "@/lib/gridParams";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";

// Only the grids listed in lib/gridPages.ts exist; anything else is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return GRID_PAGES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = gridBySlug((await params).slug);
  if (!g) return {};
  const title = `${g.name} to KML (EPSG:${g.code})`;
  const description = `Convert ${g.name} (EPSG:${g.code}) eastings and northings to latitude, longitude and Google Earth KML or KMZ. Free, with the grid's parameters.`;
  const path = `/convert/${g.slug}`;
  return {
    // Long grid names: drop the site-name suffix so the title fits in search results
    title: title.length > 42 ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: openGraphFor(path, title, description),
  };
}

export default async function GridPage({ params }: { params: Promise<{ slug: string }> }) {
  const g = gridBySlug((await params).slug);
  if (!g) notFound();
  const row = epsgRow(g.code);
  if (!row) notFound();
  const [, epsgName, def, bbox] = row;
  const related = GRID_PAGES.filter((o) => o.region === g.region && o.slug !== g.slug).slice(0, 6);
  const feet = unitLabel(def) !== "metres";

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Grid converters", item: `${SITE_URL}/convert` },
      { "@type": "ListItem", position: 3, name: g.name, item: `${SITE_URL}/convert/${g.slug}` },
    ],
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-slate-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#0071e3]">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/convert" className="hover:text-[#0071e3]">Grid converters</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">{g.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] gap-8 lg:gap-12 items-start">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11.5px] font-semibold mb-4">
              <MapPin className="w-3.5 h-3.5" aria-hidden /> EPSG:{g.code} · {g.region}
            </p>
            <h1 className="text-[30px] sm:text-[38px] font-extrabold tracking-tight leading-[1.12] text-slate-900 text-balance">
              {g.name} to KML &amp; KMZ
            </h1>
            <p className="mt-4 text-[16px] text-slate-600 leading-relaxed">
              Convert {g.name} eastings and northings to latitude and longitude, and save them as a Google Earth KML or KMZ.
              Try a single point here, or convert a whole spreadsheet in the web app.
            </p>
            <ul className="mt-5 space-y-2 text-[14px] text-slate-700">
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden /> Converter already set to EPSG:{g.code}</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden /> Datum shift to WGS 84 applied automatically</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden /> Whole sheets with photos and boundaries in the web or Windows app</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/app" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-semibold">
                Convert a spreadsheet <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link href="/#download" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-[14px] font-semibold">
                <Download className="w-4 h-4" aria-hidden /> Windows app
              </Link>
            </div>
          </div>
          <div className="min-w-0">
            <GridConverter presetId={g.presetId} />
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10 lg:gap-12">
          <div className="min-w-0 text-[15px] text-slate-700 leading-relaxed">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-3">About {g.name}</h2>
            <p>{g.about}</p>
            <p className="mt-3">
              <strong className="text-slate-900">Where it&apos;s used:</strong> {g.usedFor}
            </p>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-10 mb-3">Convert a whole spreadsheet</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Open the <Link href="/app" className="text-[#0071e3] font-medium hover:underline">web app</Link> or the Windows app, and paste your rows from Excel or open a CSV file.</li>
              <li>Under <strong className="text-slate-900">Coordinate system</strong>, search for &ldquo;{g.code}&rdquo; and pick <em>{epsgName}</em>.</li>
              <li>Check one point you know on the map, then press <strong className="text-slate-900">Save KML</strong> or <strong className="text-slate-900">Save KMZ</strong> (with photos) and open it in Google Earth.</li>
            </ol>
            {feet && (
              <p className="mt-4 text-[14px] rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-900">
                This grid is in <strong>{unitLabel(def)}</strong>. Enter coordinates in those units, not metres.
              </p>
            )}

            {g.tip && (
              <>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-10 mb-3">Before you rely on it</h2>
                <p className="flex gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-[14px]">
                  <Lightbulb className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" aria-hidden />
                  <span>{g.tip} Always check one known control point before sending a file out.</span>
                </p>
              </>
            )}
          </div>

          <aside className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200 overflow-hidden">
              <h2 className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[14px] font-bold text-slate-900">Grid parameters</h2>
              <dl className="divide-y divide-slate-100 text-[13px]">
                <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] gap-3 px-4 py-2">
                  <dt className="text-slate-500">EPSG name</dt>
                  <dd className="font-medium text-slate-800">{epsgName}</dd>
                </div>
                {gridParameterRows(def).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] gap-3 px-4 py-2">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-800">{v}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] gap-3 px-4 py-2">
                  <dt className="text-slate-500">Area of use</dt>
                  <dd className="font-medium text-slate-800">{areaBox(bbox)}</dd>
                </div>
              </dl>
            </section>
            {g.aka.length > 0 && (
              <p className="text-[12.5px] text-slate-500">
                Also known as: {g.aka.join(" · ")}
              </p>
            )}
            {related.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-slate-900 mb-2">More {g.region} grids</h2>
                <ul className="space-y-1.5">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/convert/${r.slug}`} className="text-[13.5px] text-[#0071e3] hover:underline">
                        {r.name} to KML
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/convert" className="inline-block mt-3 text-[13px] font-semibold text-slate-700 hover:text-[#0071e3]">
                  All grid converters →
                </Link>
              </section>
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
