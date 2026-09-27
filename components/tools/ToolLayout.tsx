import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageShell from "../PageShell";
import PageIntro from "../PageIntro";
import NextSteps from "../NextSteps";
import { BreadcrumbStructuredData } from "../StructuredData";
import { TOOLS, toolBySlug } from "@/lib/tools";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

/**
 * A tool page: heading, the tool itself, notes on how it works, other tools and the way into the
 * app. Everything the tool computes stays in the visitor's browser.
 */
export default function ToolLayout({
  slug,
  lead,
  children,
  notes,
}: {
  slug: string;
  lead: React.ReactNode;
  children: React.ReactNode;
  notes?: React.ReactNode;
}) {
  const tool = toolBySlug(slug)!;
  const others = [
    ...TOOLS.filter((t) => t.slug !== slug && t.group === tool.group),
    ...TOOLS.filter((t) => t.group !== tool.group),
  ].slice(0, 6);
  const app = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}/tools/${slug}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
  return (
    <PageShell>
      <BreadcrumbStructuredData name={tool.name} path={`/tools/${slug}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(app) }} />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-slate-500">
          <Link href="/tools" className="hover:text-[#0071e3]">Free tools</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">{tool.name}</span>
        </nav>
        <PageIntro eyebrow={`Free tool · ${tool.group}`} title={tool.title} lead={lead} />

        <section className="mt-8">{children}</section>

        <p className="mt-4 text-[12.5px] text-slate-500">
          Worked out in your browser: nothing you type here is sent anywhere or kept.
        </p>

        {notes && (
          <section className="mt-12 max-w-3xl text-[15px] text-slate-700 leading-relaxed space-y-4 [&_h2]:text-[20px] [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-slate-900 [&_h2]:pt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_code]:text-[13px] [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_a]:text-[#0071e3] [&_a:hover]:underline">{notes}</section>
        )}

        <section className="mt-14">
          <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900">More free tools</h2>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {others.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/tools/${t.slug}`}
                  className="group flex h-full items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-blue-200"
                >
                  <span>
                    <span className="block text-[15px] font-bold text-slate-900 group-hover:text-[#0071e3]">{t.name}</span>
                    <span className="mt-1 block text-[13px] text-slate-600 leading-snug">{t.description}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 mt-1 shrink-0 text-slate-400 group-hover:text-[#0071e3]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <NextSteps title="Got a whole sheet of points?" />
      </div>
    </PageShell>
  );
}
