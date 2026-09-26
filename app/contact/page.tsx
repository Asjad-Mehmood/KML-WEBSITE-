import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Bug, HelpCircle, Mail } from "lucide-react";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { GITHUB_REPO_URL, SUPPORT_EMAIL, openGraphFor } from "@/lib/site";

const TITLE = "Contact & Support";
const DESCRIPTION = "Get help with Excel to KML: answers to common questions, guides, reporting a problem, and email.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: openGraphFor("/contact", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default function ContactPage() {
  const card =
    "group rounded-2xl border border-slate-200/80 bg-white p-6 hover:border-blue-200 hover:shadow-[0_12px_32px_-16px_rgba(0,113,227,0.3)] transition-all";
  return (
    <PageShell>
      <BreadcrumbStructuredData name="Contact" path="/contact" />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro eyebrow="Contact & support" title="How can we help?" lead={DESCRIPTION} />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/faq" className={card}>
            <HelpCircle className="w-5 h-5 text-[#0071e3]" aria-hidden />
            <h2 className="mt-3 text-[16px] font-bold text-slate-900 group-hover:text-[#0071e3]">Common questions</h2>
            <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">Grids, site calibration, total station files, levels and privacy.</p>
          </Link>
          <Link href="/guides" className={card}>
            <BookOpen className="w-5 h-5 text-[#0071e3]" aria-hidden />
            <h2 className="mt-3 text-[16px] font-bold text-slate-900 group-hover:text-[#0071e3]">Guides</h2>
            <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">Step-by-step: survey points to Google Earth, KML or KMZ, DXF for AutoCAD.</p>
          </Link>
          <a href={`${GITHUB_REPO_URL}/issues`} target="_blank" rel="noopener noreferrer" className={card}>
            <Bug className="w-5 h-5 text-[#0071e3]" aria-hidden />
            <h2 className="mt-3 text-[16px] font-bold text-slate-900 group-hover:text-[#0071e3] inline-flex items-center gap-1">
              Report a problem <ArrowUpRight className="w-4 h-4" aria-hidden />
            </h2>
            <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">Something not working as it should? Tell us on GitHub.</p>
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className={card}>
            <Mail className="w-5 h-5 text-[#0071e3]" aria-hidden />
            <h2 className="mt-3 text-[16px] font-bold text-slate-900 group-hover:text-[#0071e3]">Email</h2>
            <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed break-all">{SUPPORT_EMAIL}</p>
          </a>
        </div>

        <section className="mt-14 max-w-3xl rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
          <h2 className="text-[18px] font-bold text-slate-900">Reporting a problem? These help us fix it fast</h2>
          <ul className="mt-3 space-y-2 list-disc pl-5 text-[14.5px] text-slate-700 leading-relaxed">
            <li>The version, shown at the bottom of the program&apos;s window.</li>
            <li>Windows, Android or the web app, and which browser.</li>
            <li>The grid you chose, and a few rows of your points if you can share them.</li>
            <li>What you expected, what happened instead, and any message the program showed.</li>
          </ul>
          <p className="mt-4 text-[13.5px] text-slate-500">
            Please don&apos;t send passwords. Points you share are used only to look into your problem.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
