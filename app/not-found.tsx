import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Download, Globe, HelpCircle, Layers, Mail, Wrench } from "lucide-react";
import PageShell from "../components/PageShell";
import PageIntro from "../components/PageIntro";
import WebAppLink from "../components/WebAppLink";

// Shown for any address with no page, and wherever a page calls notFound().
// It reads the same for everyone, so it gives nothing away about pages that
// exist only for some visitors.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const card =
  "group block h-full rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-blue-200 hover:shadow-[0_12px_32px_-16px_rgba(0,113,227,0.3)] transition-all";

const PLACES = [
  { href: "/convert", icon: Layers, title: "Find your grid", text: "UTM, DLTM, Qatar National Grid and 5,800+ coordinate systems." },
  { href: "/download", icon: Download, title: "Download", text: "Excel to KML for Windows 10 and 11, or the Android app. Free." },
  { href: "/guides", icon: BookOpen, title: "Guides", text: "Survey points to Google Earth, KML or KMZ, DXF for AutoCAD." },
  { href: "/tools", icon: Wrench, title: "Tools", text: "Free calculators: DMS and UTM, distance and bearing, plot area and more." },
  { href: "/faq", icon: HelpCircle, title: "Common questions", text: "Grids, site calibration, total station files and levels." },
];

export default function NotFound() {
  return (
    <PageShell>
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro
          eyebrow="Error 404"
          title="We couldn't find that page"
          lead="The link may be old, or the address may have a typo. These are the places most people are looking for."
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.28)]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden /> Back to the home page
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold"
          >
            <Mail className="w-4 h-4" aria-hidden /> Tell us about a broken link
          </Link>
        </PageIntro>

        <ul className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <li>
            <WebAppLink className={card}>
              <Globe className="w-5 h-5 text-[#0071e3]" aria-hidden />
              <h2 className="mt-2 text-[15.5px] font-bold text-slate-900 group-hover:text-[#0071e3]">Open the web app</h2>
              <p className="mt-1 text-[13.5px] text-slate-600 leading-relaxed">Paste your rows from Excel and save KML, KMZ or DXF.</p>
            </WebAppLink>
          </li>
          {PLACES.map(({ href, icon: Icon, title, text }) => (
            <li key={href}>
              <Link href={href} className={card}>
                <Icon className="w-5 h-5 text-[#0071e3]" aria-hidden />
                <h2 className="mt-2 text-[15.5px] font-bold text-slate-900 group-hover:text-[#0071e3]">{title}</h2>
                <p className="mt-1 text-[13.5px] text-slate-600 leading-relaxed">{text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
