import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, Globe2, HeartHandshake, Lock, MapPinned, Wallet } from "lucide-react";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import NextSteps from "../../components/NextSteps";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { SHOW_ANDROID, openGraphFor } from "@/lib/site";
import { PRODUCTS } from "@/lib/products";

const TITLE = "About";
const DESCRIPTION =
  "Free software for surveyors and site engineers: Excel to KML puts survey coordinates on any grid into Google Earth, RoadPro draws roads in AutoCAD, Traverse & Level adjusts traverses and level runs, and Project Folder Manager keeps project files in order.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: openGraphFor("/about", `${TITLE} | Excel to KML`, DESCRIPTION),
};

const POINTS: { icon: React.ElementType; title: string; text: string }[] = [
  {
    icon: MapPinned,
    title: "Made for survey work",
    text: "Benchmarks, traverses, level runs, roads and as-builts: the programs speak eastings, northings, chainages, levels and codes, and check results against known marks before you rely on them.",
  },
  {
    icon: Globe2,
    title: "Any grid",
    text: "Excel to KML reads 5,800+ coordinate systems from the EPSG dataset, from the Qatar National Grid and Dubai DLTM to UTM, State Plane and the British National Grid, with the shift to WGS 84 applied.",
  },
  {
    icon: Cpu,
    title: "Runs on your computer",
    text: "Excel to KML, RoadPro and Project Folder Manager do their work on your own computer and keep working with no internet connection.",
  },
  {
    icon: Lock,
    title: "Your data stays yours",
    text: "Your survey data is never sold or used for ads. Files and Traverse & Level jobs you keep in your account can be downloaded or deleted at any time.",
  },
  {
    icon: Wallet,
    title: "Free to use",
    text: `Every program is free: Excel to KML for Windows${SHOW_ANDROID ? ", Android" : ""} and the web, RoadPro, Traverse & Level and Project Folder Manager. A free account is all you need.`,
  },
  {
    icon: HeartHandshake,
    title: "Built with users",
    text: "Many features started as a question from someone in the field. Tell us what would help your work.",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <BreadcrumbStructuredData name="About" path="/about" />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro eyebrow="About" title="Software for survey and site engineering work" lead={DESCRIPTION} />

        <ul className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POINTS.map((p) => (
            <li key={p.title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
              <p.icon className="w-5 h-5 text-[#0071e3]" aria-hidden />
              <h2 className="mt-3 text-[16px] font-bold text-slate-900">{p.title}</h2>
              <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">{p.text}</p>
            </li>
          ))}
        </ul>

        <section aria-labelledby="programs-h" className="mt-14">
          <h2 id="programs-h" className="text-[22px] font-extrabold tracking-tight text-slate-900">Our programs</h2>
          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "Excel to KML", platform: SHOW_ANDROID ? "Windows, Android and web" : "Windows and web", tagline: "Survey coordinates on any grid into Google Earth, GIS and CAD", href: "/features" },
              ...PRODUCTS.map((p) => ({ name: p.name, platform: p.platform, tagline: p.tagline, href: p.href })),
            ].map((p) => (
              <li key={p.name}>
                <Link href={p.href} className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-blue-200 transition-colors">
                  <span>
                    <span className="block text-[15.5px] font-bold text-slate-900 group-hover:text-[#0071e3]">{p.name}</span>
                    <span className="block text-[12.5px] text-slate-500">{p.platform}</span>
                    <span className="mt-1.5 block text-[14px] text-slate-600 leading-relaxed">{p.tagline}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 mt-1 shrink-0 text-slate-400 group-hover:text-[#0071e3]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 max-w-3xl">
          <h2 className="text-[22px] font-extrabold tracking-tight text-slate-900">Who makes it</h2>
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
            Excel to KML is developed by <strong className="text-slate-900">Asjad Mehmood</strong>, who owns it and keeps all rights in
            it. RoadPro, Traverse &amp; Level and Project Folder Manager are published here alongside it. Everything here is free to use under the{" "}
            <Link href="/terms" className="text-[#0071e3] hover:underline">terms</Link>; how your information is handled is set out in
            the <Link href="/privacy" className="text-[#0071e3] hover:underline">privacy policy</Link>.
          </p>
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
            Questions, ideas or a problem? <Link href="/contact" className="text-[#0071e3] hover:underline">Get in touch</Link>.
          </p>
        </section>

        <NextSteps everyProgram />
      </div>
    </PageShell>
  );
}
