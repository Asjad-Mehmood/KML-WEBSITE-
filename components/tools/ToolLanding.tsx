import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown, Users } from "lucide-react";
import PageShell from "../PageShell";
import NextSteps from "../NextSteps";
import { BreadcrumbStructuredData } from "../StructuredData";
import { TOOLS, toolBySlug } from "@/lib/tools";
import { TOOL_PAGES } from "@/lib/toolPages";
import { toolExample } from "@/lib/toolExamples";
import { SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

function UseButton({ href, big = false }: { href: string; big?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold shadow-[0_8px_24px_-8px_rgba(0,113,227,0.55)] transition-colors ${
        big ? "px-7 py-4 text-[16px]" : "px-5 py-3 text-[15px]"
      }`}
    >
      Use the tool <ArrowRight className="w-5 h-5" aria-hidden />
    </Link>
  );
}

/**
 * A tool's front page: what it does, how to use it, a worked example and questions, with
 * "Use the tool" buttons that open the tool itself at /tools/<slug>/use.
 */
export default function ToolLanding({ slug, notes }: { slug: string; notes?: React.ReactNode }) {
  const tool = toolBySlug(slug)!;
  const page = TOOL_PAGES[slug];
  const ex = toolExample(slug);
  const use = `/tools/${slug}/use`;
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
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <PageShell>
      <BreadcrumbStructuredData name={tool.name} path={`/tools/${slug}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(app) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faq) }} />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-slate-500">
          <Link href="/tools" className="hover:text-[#0071e3]">Free tools</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">{tool.name}</span>
        </nav>

        {/* hero: what it is, the button, and the worked example */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#0071e3] mb-3">Free tool · {tool.group}</p>
            <h1 className="text-[32px] sm:text-[46px] font-extrabold tracking-tight text-slate-900 leading-[1.08]">{tool.title}</h1>
            <p className="mt-5 text-[17px] sm:text-[18px] text-slate-600 leading-relaxed">{page.tagline}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <UseButton href={use} big />
              <a href="#how" className="inline-flex items-center gap-1.5 px-5 py-4 rounded-xl border border-slate-200 hover:border-slate-300 text-[15px] font-semibold text-slate-800">
                How it works <ChevronDown className="w-4 h-4" aria-hidden />
              </a>
            </div>
            <p className="mt-4 text-[13px] text-slate-500">Free · no sign-up · works in your browser, on phone and computer</p>
          </div>
          {ex && (
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/60 p-6 sm:p-7 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Example · {ex.title}</p>
              <dl className="mt-4 space-y-2.5">
                {ex.input.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[12px] text-slate-500">{k}</dt>
                    <dd className="font-mono text-[14px] text-slate-800 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="my-4 flex items-center gap-2 text-[#0071e3]">
                <span className="h-px flex-1 bg-blue-200" />
                <ArrowRight className="w-4 h-4 rotate-90" aria-hidden />
                <span className="h-px flex-1 bg-blue-200" />
              </div>
              <dl className="space-y-2.5">
                {ex.output.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[12px] text-slate-500">{k}</dt>
                    <dd className="font-mono text-[15px] font-semibold text-slate-900 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>

        {/* what it does */}
        <section className="mt-20">
          <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-tight text-slate-900">What it does</h2>
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {page.features.map((f) => (
              <li key={f.title} className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden />
                <h3 className="mt-3 text-[15.5px] font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* how to use it */}
        <section id="how" className="mt-20 scroll-mt-28 rounded-3xl bg-slate-50 border border-slate-200/80 p-7 sm:p-10">
          <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-tight text-slate-900">How to use it</h2>
          <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {page.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-9 h-9 rounded-full bg-[#0071e3] text-white font-bold flex items-center justify-center">{i + 1}</span>
                <p className="text-[15px] text-slate-700 leading-relaxed pt-1.5">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8"><UseButton href={use} /></div>
        </section>

        {/* who it's for */}
        <section className="mt-20 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8">
          <div>
            <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-tight text-slate-900">Who it&apos;s for</h2>
            <ul className="mt-5 space-y-3">
              {page.audience.map((a) => (
                <li key={a} className="flex gap-3 text-[15px] text-slate-700 leading-relaxed">
                  <Users className="w-5 h-5 mt-0.5 shrink-0 text-[#0071e3]" aria-hidden />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          {notes && (
            <div className="text-[15px] text-slate-700 leading-relaxed space-y-4 [&_h2]:text-[20px] [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-slate-900 [&_h2]:pt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_code]:text-[13px] [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_a]:text-[#0071e3] [&_a:hover]:underline">
              {notes}
            </div>
          )}
        </section>

        {/* questions */}
        <section className="mt-20">
          <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-tight text-slate-900">Questions</h2>
          <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {page.faqs.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-semibold text-slate-900">
                  {f.q}
                  <ChevronDown className="w-4 h-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-2.5 text-[14.5px] text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 text-center">
          <UseButton href={use} big />
        </section>

        <section className="mt-20">
          <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900">More free tools</h2>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {others.map((t) => (
              <li key={t.slug}>
                <Link href={`/tools/${t.slug}`} className="group flex h-full items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-blue-200">
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
