import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Download, Info, MapPin } from "lucide-react";
import PageShell from "../../../../components/PageShell";
import GridConverter from "../../../../components/GridConverter";
import GridSearch from "../../../../components/GridSearch";
import { GRID_PAGES } from "@/lib/gridPages";
import { BIG_COUNTRY, codeLabel, countryBySlug, countryRegions, regionOf, systemByCode, toRow } from "@/lib/epsgCatalog";
import { epsgDescription, epsgLead, epsgNotes, epsgTitle, hasWestSouthAxes } from "@/lib/epsgPageText";
import { areaBox, gridParameterRows } from "@/lib/gridParams";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";

// One page per EPSG system (5,800+). Rendered on first visit, then cached;
// grids with a hand-written page redirect there.
export const dynamicParams = true;
export const revalidate = 604800; // a week
export function generateStaticParams() {
  return [];
}

const curatedSlug = (code: number) => GRID_PAGES.find((g) => g.code === code)?.slug;

async function load(params: Promise<{ code: string }>) {
  const raw = (await params).code;
  if (!/^\d{4,6}$/.test(raw)) return null;
  return systemByCode(Number(raw)) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const s = await load(params);
  if (!s || curatedSlug(s.code)) return {};
  const title = epsgTitle(s);
  const description = epsgDescription(s);
  const path = `/convert/epsg/${s.code}`;
  return {
    title: title.length > 42 ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: openGraphFor(path, title, description),
  };
}

export default async function EpsgPage({ params }: { params: Promise<{ code: string }> }) {
  const s = await load(params);
  if (!s) notFound();
  const curated = curatedSlug(s.code);
  if (curated) permanentRedirect(`/convert/${curated}`);

  // Neighbours: the same state/region in big countries, otherwise the same country
  const countrySystems = countryBySlug(s.countrySlug)?.systems ?? [];
  const region = countrySystems.length > BIG_COUNTRY ? countryRegions(s.countrySlug).find((r) => r.name === regionOf(s)) : undefined;
  const group = region
    ? { label: s.country === "World" ? region.name : `${region.name}, ${s.country}`, href: `/convert/country/${s.countrySlug}/${region.slug}`, systems: region.systems }
    : { label: s.country, href: `/convert/country/${s.countrySlug}`, systems: countrySystems };
  const others = group.systems.filter((o) => o.code !== s.code);
  const related = others.slice(0, 12);
  const axes = hasWestSouthAxes(s);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Grid converters", item: `${SITE_URL}/convert` },
      { "@type": "ListItem", position: 3, name: s.country, item: `${SITE_URL}/convert/country/${s.countrySlug}` },
      { "@type": "ListItem", position: 4, name: codeLabel(s.code), item: `${SITE_URL}/convert/epsg/${s.code}` },
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
            <li><Link href={`/convert/country/${s.countrySlug}`} className="hover:text-[#0071e3]">{s.country}</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">{codeLabel(s.code)}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] gap-8 lg:gap-12 items-start">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11.5px] font-semibold mb-4">
              <MapPin className="w-3.5 h-3.5" aria-hidden /> {codeLabel(s.code)} · {s.country}
            </p>
            <h1 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight leading-[1.12] text-slate-900 text-balance break-words">
              {s.name} to KML &amp; KMZ
            </h1>
            <p className="mt-4 text-[16px] text-slate-600 leading-relaxed">{epsgLead(s)}</p>
            <ul className="mt-5 space-y-2 text-[14px] text-slate-700">
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden /> Converter already set to {codeLabel(s.code)}</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden /> Latitude and longitude on WGS 84, as Google Earth uses</li>
              <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden /> Download the point as KML</li>
            </ul>
            {!axes && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link href="/app" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-semibold">
                  Convert a spreadsheet <ArrowRight className="w-4 h-4" aria-hidden />
                </Link>
                <Link href="/download" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-[14px] font-semibold">
                  <Download className="w-4 h-4" aria-hidden /> Windows app
                </Link>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <GridConverter row={toRow(s)} />
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10 lg:gap-12">
          <div className="min-w-0 text-[15px] text-slate-700 leading-relaxed">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-3">Good to know</h2>
            <ul className="space-y-2">
              {epsgNotes(s).map((n) => (
                <li key={n} className="flex gap-2.5">
                  <Info className="w-4 h-4 mt-1 text-slate-400 shrink-0" aria-hidden />
                  <span>{n}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-10 mb-3">Convert a whole spreadsheet</h2>
            {axes ? (
              <p>
                For now, convert points in this system one at a time with the converter above. Whole-sheet conversion for grids that
                count to the west and south is being added to the web and Windows apps.
              </p>
            ) : (
              <ol className="list-decimal pl-5 space-y-2">
                <li>Open the <Link href="/app" className="text-[#0071e3] font-medium hover:underline">web app</Link> or the Windows app, and paste your rows from Excel or open a CSV file.</li>
                <li>Under <strong className="text-slate-900">Coordinate system</strong>, search for &ldquo;{s.code}&rdquo; and pick <em>{s.name}</em>.</li>
                <li>Check one point you know on the map, then press <strong className="text-slate-900">Save KML</strong> or <strong className="text-slate-900">Save KMZ</strong> and open it in Google Earth.</li>
              </ol>
            )}
            <p className="mt-4 text-[14px] text-slate-600">
              New to this? Read <Link href="/guides/easting-northing-to-latitude-longitude" className="text-[#0071e3] font-medium hover:underline">how to convert easting and northing to latitude and longitude</Link>.
            </p>
          </div>

          <aside className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-slate-200 overflow-hidden">
              <h2 className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[14px] font-bold text-slate-900">Grid parameters</h2>
              <dl className="divide-y divide-slate-100 text-[13px]">
                {gridParameterRows(s.def).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] gap-3 px-4 py-2">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-800 break-words">{v}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] gap-3 px-4 py-2">
                  <dt className="text-slate-500">Area of use</dt>
                  <dd className="font-medium text-slate-800">{areaBox(s.bbox)}</dd>
                </div>
              </dl>
            </section>
            <section>
              <h2 className="text-[14px] font-bold text-slate-900 mb-2">Find another grid</h2>
              <GridSearch id="grid-search" placeholder="Name, country or code" />
            </section>
            {related.length > 0 && (
              <section>
                <h2 className="text-[14px] font-bold text-slate-900 mb-2">More coordinate systems: {group.label}</h2>
                <ul className="space-y-1.5">
                  {related.map((r) => (
                    <li key={r.code}>
                      <Link href={`/convert/epsg/${r.code}`} className="text-[13px] text-[#0071e3] hover:underline">
                        {r.name} <span className="text-slate-500">({r.code})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={group.href} className="inline-block mt-3 text-[13px] font-semibold text-slate-700 hover:text-[#0071e3]">
                  All {others.length + 1} systems for {group.label} →
                </Link>
              </section>
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
