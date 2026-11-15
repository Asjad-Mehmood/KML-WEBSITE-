import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  FileInput,
  FileOutput,
  FileSpreadsheet,
  Frame,
  Layers,
  ListChecks,
  Monitor,
  Mountain,
  ScanSearch,
  Spline,
  Tags,
  Wand2,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import ProductReviews from "../../components/ProductReviews";
import AutoDraftHero from "../../components/autoDraft/AutoDraftHero";
import AutoDraftDownload, { AutoDraftReleaseInfo } from "../../components/AutoDraftDownload";
import {
  AUTO_DRAFT_CODES_PAGE,
  AUTO_DRAFT_FAQ,
  AUTO_DRAFT_FEATURES,
  AUTO_DRAFT_FILES,
  AUTO_DRAFT_NAME,
  AUTO_DRAFT_PAGE,
  AUTO_DRAFT_STEPS,
  AUTO_DRAFT_VERSION,
} from "@/lib/autoDraft";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";

const TITLE = "Auto Draft: survey points to a finished CAD drawing";
const DESCRIPTION =
  "Free Windows program for surveyors: open the day's survey (CSV, Excel, Leica GSI, Sokkia SDR, Nikon RAW) and Auto Draft joins the lines by their field codes, places the symbols, writes the levels, draws contours and saves a DXF for AutoCAD, a PDF on a sheet with your title block and a KML for Google Earth.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: AUTO_DRAFT_PAGE },
  openGraph: {
    ...openGraphFor(AUTO_DRAFT_PAGE, `${TITLE} | Excel to KML`, DESCRIPTION),
    images: [{ url: AUTO_DRAFT_FILES.shots.contours.src, width: 1360, height: 860, alt: "Auto Draft: a surveyed plot drawn from its field codes, with contours, on an A3 sheet" }],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: AUTO_DRAFT_NAME,
  description: DESCRIPTION,
  applicationCategory: "DesignApplication",
  operatingSystem: "Windows 10, Windows 11",
  softwareVersion: AUTO_DRAFT_VERSION,
  url: `${SITE_URL}${AUTO_DRAFT_PAGE}`,
  image: `${SITE_URL}${AUTO_DRAFT_FILES.shots.contours.src}`,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const FEATURE_ICONS = [FileInput, Spline, Tags, ScanSearch, Mountain, Frame, FileOutput, Wand2];

const SHOTS = [
  {
    ...AUTO_DRAFT_FILES.shots.problems,
    title: "Problems, before you save",
    alt: "Auto Draft's Problems list: a road edge that jumps 160 m, a fence with one point, an unknown code with its fixes and a point at level 0.000",
  },
  {
    ...AUTO_DRAFT_FILES.shots.codes,
    title: "Your own codes",
    alt: "Auto Draft's code editor: code, name, layer, colour, line type and symbol",
  },
  {
    ...AUTO_DRAFT_FILES.shots.instrument,
    title: "Total station files",
    alt: "Auto Draft opening a Leica GSI-16 file: 11 points worked out from the measurements and the station, with their codes",
  },
  {
    ...AUTO_DRAFT_FILES.shots.tin,
    title: "The ground surface (TIN)",
    alt: "Auto Draft showing the triangles of the ground surface the contours come from, bending at the road edges",
  },
  {
    ...AUTO_DRAFT_FILES.shots.kml,
    title: "KML for Google Earth",
    alt: "Auto Draft's KML dialog: the UTM zone and hemisphere for the coordinates",
  },
  {
    ...AUTO_DRAFT_FILES.shots.sheetPdf,
    title: "The PDF, ready to print",
    alt: "The PDF Auto Draft saves: the drawing at 1:500 on A3 with the grid, legend, north arrow, scale bar and title block",
  },
];

function SectionHead({ id, eyebrow, title, text, Icon }: { id: string; eyebrow: string; title: string; text?: string; Icon: React.ElementType }) {
  return (
    <div className="max-w-3xl">
      <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#1e4fd8]">
        <Icon className="w-4 h-4" aria-hidden /> {eyebrow}
      </p>
      <h2 id={id} className="mt-2 text-2xl sm:text-[30px] font-extrabold tracking-tight text-slate-900 leading-tight">
        {title}
      </h2>
      {text && <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">{text}</p>}
    </div>
  );
}

export default function AutoDraftPage() {
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-slate-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-[#1e4fd8]">Home</Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">Auto Draft</li>
          </ol>
        </nav>

        <AutoDraftHero />
      </div>

      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* The app */}
        <section aria-labelledby="app-h" className="mt-20">
          <SectionHead
            id="app-h"
            eyebrow="The app"
            title="A day of drafting, done in minutes"
            text="Drafting a topographic survey by hand means joining hundreds of points line by line, placing every symbol and typing every level. Auto Draft reads the codes you typed in the field and does it for you. This is the sample survey that comes with it."
            Icon={Monitor}
          />
          <figure className="mt-8 rounded-2xl border border-slate-200 bg-[#071a44] p-1.5 shadow-[0_16px_40px_rgba(7,26,68,0.22)]">
            <Image
              src={AUTO_DRAFT_FILES.shots.sheet.src}
              width={AUTO_DRAFT_FILES.shots.sheet.width}
              height={AUTO_DRAFT_FILES.shots.sheet.height}
              alt="Auto Draft: road edges with curves, a centre line, a drain, a fence, a walled plot with two buildings, trees, poles and spot levels, drawn from their codes on an A3 sheet with the legend and title block"
              sizes="(min-width: 1140px) 1080px, 100vw"
              className="w-full h-auto rounded-xl"
            />
          </figure>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {SHOTS.map((s) => (
              <figure key={s.src}>
                <a href={s.src} target="_blank" rel="noopener" className="block rounded-2xl border border-slate-200 bg-[#071a44] p-1.5 hover:shadow-[0_12px_32px_rgba(7,26,68,0.2)] transition-shadow">
                  <Image src={s.src} alt={s.alt} width={s.width} height={s.height} sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="w-full h-auto rounded-xl" />
                </a>
                <figcaption className="mt-2 text-[14px] font-semibold text-slate-800">{s.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-h" className="mt-20">
          <SectionHead id="features-h" eyebrow="What it does" title="From the total station to a signed-off drawing" Icon={ListChecks} />
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AUTO_DRAFT_FEATURES.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? CheckCircle2;
              return (
                <li key={f.title} className="rounded-2xl border border-slate-200 bg-[#fafbfc] p-5">
                  <div className="w-11 h-11 rounded-full border-2 border-[#ffd21f] bg-[#071a44] text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden />
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{f.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* How it works */}
        <section aria-labelledby="steps-h" className="mt-20">
          <SectionHead id="steps-h" eyebrow="How it works" title="Five steps from field to drawing" Icon={BookOpen} />
          <ol className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            {AUTO_DRAFT_STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-slate-200 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffd21f] text-[15px] font-extrabold text-[#071a44]">{i + 1}</span>
                <p className="mt-3 font-bold text-slate-900">{s.title}</p>
                <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Codes in short */}
        <section aria-labelledby="codes-h" className="mt-20 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 items-center">
          <div>
            <SectionHead
              id="codes-h"
              eyebrow="Field codes"
              title="The code is the drawing"
              text="A line code and a number join points into a line: RE1 is road edge 1, RE2 the other side, surveyed in any order. A few words steer the line: ST starts it, END ends it, CLS closes it, RECT finishes a rectangle from three corners, ARC and EARC make curves. A point code places a symbol."
              Icon={Layers}
            />
            <p className="mt-4 text-[15px] text-slate-600">21 line codes and 17 point codes are ready to use, and you can change every one.</p>
            <Link
              href={AUTO_DRAFT_CODES_PAGE}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#071a44] px-6 py-3 text-[15px] font-bold text-white hover:bg-[#0b2459]"
            >
              Read the code guide <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-[#fafbfc] p-5 font-mono text-[13.5px]">
            <p className="font-sans text-[12px] font-bold uppercase tracking-wider text-slate-500">Typed in the field</p>
            <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              {[
                ["RE1 ST", "road edge 1 starts"],
                ["RE1 ARC", "a curve starts"],
                ["RE1 EARC", "the curve ends"],
                ["BLD1 CLS", "the building is closed"],
                ["BLD2 RECT", "3 corners → a rectangle"],
                ["WL1 GT1", "on the wall and the gate"],
                ["TR NEEM", "a tree; NEEM is a remark"],
              ].map(([c, m]) => (
                <div key={c} className="contents">
                  <dt className="font-bold text-[#1e4fd8]">{c}</dt>
                  <dd className="font-sans text-slate-600">{m}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Download */}
        <section id="download" aria-labelledby="download-h" className="scroll-mt-28 mt-20 rounded-3xl bg-[#071a44] text-white p-6 sm:p-10 relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(#9cb8ff_1px,transparent_1px),linear-gradient(90deg,#9cb8ff_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#ffd21f]">
              <Download className="w-4 h-4" aria-hidden /> Get it
            </p>
            <h2 id="download-h" className="mt-2 text-2xl sm:text-[30px] font-extrabold tracking-tight leading-tight">
              Free for Windows
            </h2>
            <p className="mt-2 max-w-3xl text-[15px] text-blue-100/85">
              Sign in once with your free exceltokml.com account. Your surveys and drawings stay on your PC. Also in the Survey Toolkit, which installs it and keeps it up to date.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 flex flex-col">
                <Monitor className="w-7 h-7 text-[#ffd21f]" aria-hidden />
                <h3 className="mt-3 text-lg font-bold">{AUTO_DRAFT_FILES.setup.label}</h3>
                <p className="mt-2 text-[14px] text-blue-50/90 flex-1">{AUTO_DRAFT_FILES.setup.detail}.</p>
                <AutoDraftDownload className="mt-5 inline-flex justify-center items-center gap-2 rounded-full bg-[#ffd21f] px-6 py-3 text-[16px] font-extrabold text-[#071a44] hover:bg-[#ffdc4d] cursor-pointer" />
                <AutoDraftReleaseInfo className="mt-2 text-center text-blue-100/70" />
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 flex flex-col">
                <FileSpreadsheet className="w-7 h-7 text-[#ffd21f]" aria-hidden />
                <h3 className="mt-3 text-lg font-bold">Sample survey</h3>
                <p className="mt-2 text-[14px] text-blue-50/90 flex-1">{AUTO_DRAFT_FILES.sample.detail}. Open it in Auto Draft to see every code at work, or look at it to see how to code your own.</p>
                <a
                  href={AUTO_DRAFT_FILES.sample.href}
                  download={AUTO_DRAFT_FILES.sample.name}
                  className="mt-5 inline-flex justify-center items-center gap-2 rounded-full border-2 border-white/50 px-6 py-3 text-[16px] font-extrabold text-white hover:bg-white/10"
                >
                  <Download className="w-4 h-4" aria-hidden /> Sample survey (CSV)
                </a>
              </div>
            </div>
            <p className="mt-5 flex gap-2 text-[13px] text-blue-100/75">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
              The Windows program isn&apos;t code-signed yet, so Windows SmartScreen may warn the first time. Choose More info, then Run anyway.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-6">
              <Link href={AUTO_DRAFT_CODES_PAGE} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[14px] font-semibold hover:bg-white/15">
                <BookOpen className="w-4 h-4 text-[#ffd21f]" aria-hidden /> Code guide
              </Link>
              <Link href="/toolkit" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[14px] font-semibold hover:bg-white/15">
                <Layers className="w-4 h-4 text-[#ffd21f]" aria-hidden /> Survey Toolkit
              </Link>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section aria-labelledby="faq-h" className="mt-20">
          <SectionHead id="faq-h" eyebrow="Questions" title="Good to know" Icon={BookOpen} />
          <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {AUTO_DRAFT_FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-slate-900">
                  {f.q}
                  <ArrowRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-2 text-[14.5px] text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-5 text-[13px] text-slate-500">
            A file it doesn&apos;t read, or a feature you need?{" "}
            <Link href="/contact?topic=idea&program=auto-draft" className="text-[#1e4fd8] hover:underline">
              Write to us
            </Link>
            .
          </p>
        </section>

        <ProductReviews product="auto-draft" name="Auto Draft" />
      </div>
    </PageShell>
  );
}
