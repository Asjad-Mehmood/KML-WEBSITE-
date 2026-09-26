import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LegalShell from "./LegalShell";
import { GUIDES, guideBySlug } from "@/lib/guides";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

const fmt = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// A guide page: article text, a call to action, and links to the other guides
export default function GuideLayout({ slug, children }: { slug: string; children: React.ReactNode }) {
  const guide = guideBySlug(slug)!;
  const others = GUIDES.filter((g) => g.slug !== slug);
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.published,
    dateModified: guide.published,
    mainEntityOfPage: `${SITE_URL}/guides/${slug}`,
    image: `${SITE_URL}/assets/og-image.png`,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/icon-512.png` } },
  };
  return (
    <LegalShell title={guide.title} updated={fmt(guide.published)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(article) }} />
      <p className="!text-[17px] !text-slate-600">{guide.description}</p>
      {children}
      <div className="not-prose mt-12 rounded-2xl bg-slate-50 border border-slate-200 p-6">
        <p className="!mb-3 font-semibold text-slate-900">Try it with your own sheet</p>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/app" className="!no-underline inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] !text-white text-[14px] font-semibold">
            Open the web app <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          <Link href="/convert" className="!no-underline inline-flex items-center px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 !text-slate-700 text-[14px] font-semibold">
            Find your grid
          </Link>
        </div>
      </div>
      <h2>More guides</h2>
      <ul>
        {others.map((o) => (
          <li key={o.slug}>
            <Link href={`/guides/${o.slug}`}>{o.title}</Link>
          </li>
        ))}
      </ul>
    </LegalShell>
  );
}
