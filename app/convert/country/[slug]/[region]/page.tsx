import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "../../../../../components/PageShell";
import SystemList from "../../../../../components/SystemList";
import GridSearch from "../../../../../components/GridSearch";
import { BIG_COUNTRY, countries, countryBySlug, countryRegions } from "@/lib/epsgCatalog";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";

// Region pages exist only for big countries (their country page lists regions instead of systems)
export const dynamicParams = false;
export function generateStaticParams() {
  return countries()
    .filter((c) => c.count > BIG_COUNTRY)
    .flatMap((c) => countryRegions(c.slug).map((r) => ({ slug: c.slug, region: r.slug })));
}

async function load(params: Promise<{ slug: string; region: string }>) {
  const { slug, region } = await params;
  const c = countryBySlug(slug);
  const r = countryRegions(slug).find((x) => x.slug === region);
  return c && r ? { slug, country: c.name, region: r } : null;
}

const label = (country: string, region: string) => (country === "World" ? `${region} (world-wide)` : `${region}, ${country}`);

export async function generateMetadata({ params }: { params: Promise<{ slug: string; region: string }> }): Promise<Metadata> {
  const d = await load(params);
  if (!d) return {};
  const title = `${label(d.country, d.region.name)} Coordinate Systems`;
  const description = `${d.region.systems.length} EPSG coordinate systems for ${label(d.country, d.region.name)}, each with a free converter to latitude, longitude and Google Earth KML.`;
  const path = `/convert/country/${d.slug}/${d.region.slug}`;
  return {
    title: title.length > 42 ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: openGraphFor(path, title, description),
  };
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string; region: string }> }) {
  const d = await load(params);
  if (!d) notFound();
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Grid converters", item: `${SITE_URL}/convert` },
      { "@type": "ListItem", position: 3, name: d.country, item: `${SITE_URL}/convert/country/${d.slug}` },
      { "@type": "ListItem", position: 4, name: d.region.name, item: `${SITE_URL}/convert/country/${d.slug}/${d.region.slug}` },
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
            <li><Link href={`/convert/country/${d.slug}`} className="hover:text-[#0071e3]">{d.country}</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">{d.region.name}</li>
          </ol>
        </nav>
        <h1 className="text-[28px] sm:text-[38px] font-extrabold tracking-tight text-slate-900 break-words">
          {label(d.country, d.region.name)} coordinate systems
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] text-slate-600 leading-relaxed">
          {d.region.systems.length} EPSG coordinate {d.region.systems.length === 1 ? "system" : "systems"}. Pick one to open a
          converter already set to it, with its parameters and area of use.
        </p>
        <div className="mt-6 max-w-xl">
          <GridSearch id="grid-search" />
        </div>

        <div className="mt-8">
          <SystemList systems={d.region.systems} />
        </div>
        <p className="mt-10 text-[14px]">
          <Link href={`/convert/country/${d.slug}`} className="font-semibold text-[#0071e3] hover:underline">← All of {d.country}</Link>
        </p>
      </div>
    </PageShell>
  );
}
