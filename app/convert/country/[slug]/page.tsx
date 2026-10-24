import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "../../../../components/PageShell";
import SystemList from "../../../../components/SystemList";
import GridSearch from "../../../../components/GridSearch";
import { BIG_COUNTRY, countries, countryBySlug, countryRegions } from "@/lib/epsgCatalog";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";
import { factsFaq, factsOf, factsSummary } from "@/lib/countryFacts";

export const dynamicParams = false;
export function generateStaticParams() {
  return countries().map((c) => ({ slug: c.slug }));
}

const heading = (name: string) => (name === "World" ? "World-wide coordinate systems" : `${name} coordinate systems`);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const c = countryBySlug(slug);
  if (!c) return {};
  const title = c.name === "World" ? "World-wide Coordinate Systems to KML" : `${c.name} Coordinate Systems to KML`;
  const description = `${c.systems.length} EPSG coordinate systems ${
    c.name === "World" ? "used world-wide, such as UTM zones" : `used in ${c.name}`
  }, each with a free converter to latitude, longitude and Google Earth KML.`;
  const path = `/convert/country/${slug}`;
  return { title, description, alternates: { canonical: path }, openGraph: openGraphFor(path, `${title} | Excel to KML`, description) };
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const c = countryBySlug(slug);
  if (!c) notFound();
  const big = c.systems.length > BIG_COUNTRY;
  const regions = countryRegions(slug);
  const place = c.name === "World" ? "world-wide use" : c.name;
  const facts = factsOf(c.systems, slug);
  const faq = factsFaq(place, facts);
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Grid converters", item: `${SITE_URL}/convert` },
      { "@type": "ListItem", position: 3, name: c.name, item: `${SITE_URL}/convert/country/${slug}` },
    ],
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd) }} />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-slate-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#0071e3]">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/convert" className="hover:text-[#0071e3]">Grid converters</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">{c.name}</li>
          </ol>
        </nav>
        <h1 className="text-[28px] sm:text-[38px] font-extrabold tracking-tight text-slate-900">{heading(c.name)}</h1>
        <p className="mt-3 max-w-2xl text-[16px] text-slate-600 leading-relaxed">
          {c.systems.length.toLocaleString("en-US")} EPSG coordinate {c.systems.length === 1 ? "system" : "systems"}
          {c.name === "World" ? " that cover large parts of the world, such as UTM zones" : ` used in ${c.name}`}.{" "}
          {big
            ? `Choose a ${c.name === "World" ? "datum" : "state or region"} to see its systems.`
            : "Pick one to open a converter already set to it, with its parameters and area of use."}
        </p>

        <p className="mt-3 max-w-3xl text-[15px] text-slate-600 leading-relaxed">{factsSummary(place, facts)}</p>
        {facts.popular.length > 0 && (
          <p className="mt-3 text-[14.5px] text-slate-700">
            Most used:{" "}
            {facts.popular.map((g, i) => (
              <span key={g.slug}>
                {i > 0 && ", "}
                <Link href={`/convert/${g.slug}`} className="font-semibold text-[#0071e3] hover:underline">{g.name}</Link>
              </span>
            ))}
          </p>
        )}

        <div className="mt-6 max-w-xl">
          <GridSearch id="grid-search" />
        </div>

        <div className="mt-8">
          {big ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1 text-[14px]">
              {regions.map((r) => (
                <li key={r.slug}>
                  <Link href={`/convert/country/${slug}/${r.slug}`} className="flex justify-between gap-3 py-1.5 border-b border-slate-100 text-slate-800 hover:text-[#0071e3]">
                    <span className="min-w-0 break-words">{r.name}</span>
                    <span className="shrink-0 text-slate-500">{r.systems.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : regions.length > 1 && c.systems.length > 40 ? (
            <div className="space-y-8">
              {regions.map((r) => (
                <section key={r.slug}>
                  <h2 className="text-[15px] font-bold text-slate-900 mb-2">{r.name}</h2>
                  <SystemList systems={r.systems} />
                </section>
              ))}
            </div>
          ) : (
            <SystemList systems={[...c.systems].sort((a, b) => a.name.localeCompare(b.name))} />
          )}
        </div>

        <section aria-labelledby="faq-h" className="mt-12 max-w-3xl">
          <h2 id="faq-h" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Questions about {place === "world-wide use" ? "world-wide" : place} coordinates</h2>
          <dl className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
            {faq.map((x) => (
              <div key={x.q} className="py-4">
                <dt className="font-semibold text-slate-900">{x.q}</dt>
                <dd className="mt-1.5 text-[14.5px] text-slate-600 leading-relaxed">{x.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-10 text-[14px]">
          <Link href="/convert#find" className="font-semibold text-[#0071e3] hover:underline">← All countries and popular grids</Link>
        </p>
      </div>
    </PageShell>
  );
}
