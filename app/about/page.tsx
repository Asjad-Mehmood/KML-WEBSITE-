import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, Globe2, HeartHandshake, Lock, MapPinned, Wallet } from "lucide-react";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import NextSteps from "../../components/NextSteps";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { openGraphFor } from "@/lib/site";

const TITLE = "About";
const DESCRIPTION =
  "Excel to KML turns survey coordinates on any national or site grid into files that open in Google Earth, GIS and CAD. Built by Asjad Mehmood for surveyors and engineers.";

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
    text: "Benchmarks, setting out, as-builts and boundaries: the program speaks eastings, northings, levels and codes, and checks a grid against a known mark before you rely on it.",
  },
  {
    icon: Globe2,
    title: "Any grid",
    text: "5,800+ coordinate systems from the EPSG dataset, from the Qatar National Grid and Dubai DLTM to UTM, State Plane and the British National Grid, with the shift to WGS 84 applied.",
  },
  {
    icon: Cpu,
    title: "Runs on your computer",
    text: "The conversion happens on your machine and works with no internet connection. Signing in is optional.",
  },
  {
    icon: Lock,
    title: "Your data stays yours",
    text: "Signed out, your coordinates never leave your computer. Signed in, your files and jobs are kept in your account, where you can download or delete them at any time.",
  },
  {
    icon: Wallet,
    title: "Free to use",
    text: "The Windows app, the Android app and the web app are free, with no point limit.",
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
        <PageIntro eyebrow="About" title="Survey points to Google Earth, on your own computer" lead={DESCRIPTION} />

        <ul className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POINTS.map((p) => (
            <li key={p.title} className="rounded-2xl border border-slate-200/80 bg-white p-6">
              <p.icon className="w-5 h-5 text-[#0071e3]" aria-hidden />
              <h2 className="mt-3 text-[16px] font-bold text-slate-900">{p.title}</h2>
              <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">{p.text}</p>
            </li>
          ))}
        </ul>

        <section className="mt-14 max-w-3xl">
          <h2 className="text-[22px] font-extrabold tracking-tight text-slate-900">Who makes it</h2>
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
            Excel to KML is developed by <strong className="text-slate-900">Asjad Mehmood</strong>, who owns it and keeps all rights in
            it, and the website is managed by Abdullah. It is free to use under the{" "}
            <Link href="/terms" className="text-[#0071e3] hover:underline">terms</Link>; how your information is handled is set out in
            the <Link href="/privacy" className="text-[#0071e3] hover:underline">privacy policy</Link>.
          </p>
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
            Questions, ideas or a problem? <Link href="/contact" className="text-[#0071e3] hover:underline">Get in touch</Link>.
          </p>
        </section>

        <NextSteps />
      </div>
    </PageShell>
  );
}
