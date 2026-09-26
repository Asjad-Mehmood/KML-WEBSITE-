import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import NextSteps from "../../components/NextSteps";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import HowItWorksClient from "./HowItWorksClient";
import { openGraphFor } from "@/lib/site";

const TITLE = "How It Works";
const DESCRIPTION =
  "From a spreadsheet of eastings and northings to a file that opens in Google Earth: bring in your points, choose the grid, prove it against a known mark, and save.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/how-it-works" },
  openGraph: openGraphFor("/how-it-works", `${TITLE} | Excel to KML`, DESCRIPTION),
};

/* The four steps along the top of the program, in the order the progress strip shows them */
const STEPS: { n: number; title: string; text: string }[] = [
  {
    n: 1,
    title: "Bring in your points",
    text: "Open an Excel, CSV, KML or DXF file, paste rows straight from Excel, or type points by hand. Columns such as Point, Easting, Northing, Level and Code are found for you; rows that can't be read are listed with the reason.",
  },
  {
    n: 2,
    title: "Choose the grid",
    text: "Search 5,800+ grids by name, country or EPSG code — DLTM, UTM 40N, OSGB, 3997 — or type a rough position to list only the grids that cover it.",
  },
  {
    n: 3,
    title: "Prove it",
    text: "Enter one mark whose position you know. The program tells you how far off the converted point is; a few centimetres means the grid is right. For a local site grid, fit it to three or more marks with site calibration.",
  },
  {
    n: 4,
    title: "Look, then save",
    text: "Check the points as a table, on a map, or both, with quality checks alongside. Save a KMZ for Google Earth — with photos, symbols, lines and areas — or any of the other formats.",
  },
];

export default function HowItWorksPage() {
  return (
    <PageShell>
      <BreadcrumbStructuredData name="How it works" path="/how-it-works" />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro eyebrow="How it works" title="Survey points to Google Earth in four steps" lead={DESCRIPTION} />

        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <span className="w-8 h-8 rounded-full bg-[#0071e3] text-white text-[14px] font-bold flex items-center justify-center">{s.n}</span>
              <h2 className="mt-3 text-[16px] font-bold text-slate-900">{s.title}</h2>
              <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-[14px] text-slate-600">
          The progress strip across the top of the program shows which of these steps are done.{" "}
          <Link href="/features" className="font-semibold text-[#0071e3] hover:underline inline-flex items-center gap-1">
            Every feature in detail <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </p>
      </div>

      <div className="mt-12">
        <HowItWorksClient />
      </div>

      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <NextSteps />
      </div>
    </PageShell>
  );
}
