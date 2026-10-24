import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, HelpCircle, LifeBuoy, Mail, PlayCircle } from "lucide-react";
import ContactForm from "../../components/ContactForm";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { SUPPORT_EMAIL, openGraphFor } from "@/lib/site";

const TITLE = "Contact & Support";
const DESCRIPTION = "Send us a message about Excel to KML, RoadPro, Traverse & Level or Project Folder Manager: questions, problems, requests or ideas. We reply by email, usually within one to two working days.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: openGraphFor("/contact", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default function ContactPage() {
  const card =
    "group block rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-blue-200 hover:shadow-[0_12px_32px_-16px_rgba(0,113,227,0.3)] transition-all";
  return (
    <PageShell>
      <BreadcrumbStructuredData name="Contact" path="/contact" />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro eyebrow="Contact & support" title="How can we help?" lead={DESCRIPTION} />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
          <ContactForm />

          <aside className="space-y-3">
            <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Quick answers</p>
            <Link href="/faq" className={card}>
              <HelpCircle className="w-5 h-5 text-[#0071e3]" aria-hidden />
              <h2 className="mt-2 text-[15.5px] font-bold text-slate-900 group-hover:text-[#0071e3]">Common questions</h2>
              <p className="mt-1 text-[13.5px] text-slate-600 leading-relaxed">Excel to KML: grids, site calibration, total station files, levels and privacy.</p>
            </Link>
            <div className={card}>
              <LifeBuoy className="w-5 h-5 text-[#0071e3]" aria-hidden />
              <h2 className="mt-2 text-[15.5px] font-bold text-slate-900">Help with our other programs</h2>
              <p className="mt-1 text-[13.5px] text-slate-600 leading-relaxed">Each page has its install steps and quick fixes:</p>
              <ul className="mt-2 space-y-1 text-[13.5px] font-semibold">
                <li><Link href="/roadpro#install" className="text-[#0071e3] hover:underline">RoadPro</Link></li>
                <li><Link href="/traverse#download" className="text-[#0071e3] hover:underline">Traverse &amp; Level</Link></li>
                <li><Link href="/project-folder-manager#install" className="text-[#0071e3] hover:underline">Project Folder Manager</Link></li>
              </ul>
            </div>
            <Link href="/tutorial" className={card}>
              <PlayCircle className="w-5 h-5 text-[#0071e3]" aria-hidden />
              <h2 className="mt-2 text-[15.5px] font-bold text-slate-900 group-hover:text-[#0071e3]">Excel to KML tutorial</h2>
              <p className="mt-1 text-[13.5px] text-slate-600 leading-relaxed">Four steps from your sheet to Google Earth, with screenshots.</p>
            </Link>
            <Link href="/guides" className={card}>
              <BookOpen className="w-5 h-5 text-[#0071e3]" aria-hidden />
              <h2 className="mt-2 text-[15.5px] font-bold text-slate-900 group-hover:text-[#0071e3]">Guides</h2>
              <p className="mt-1 text-[13.5px] text-slate-600 leading-relaxed">Survey points to Google Earth, KML or KMZ, DXF for AutoCAD.</p>
            </Link>
            <p className="pt-2 text-[13.5px] text-slate-600">
              Prefer email? <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-1 text-[#0071e3] hover:underline break-all"><Mail className="w-3.5 h-3.5" aria-hidden />{SUPPORT_EMAIL}</a>
            </p>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
