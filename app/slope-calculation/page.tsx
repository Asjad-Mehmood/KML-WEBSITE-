import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Cloud,
  Download,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  LineChart,
  ListChecks,
  Monitor,
  Ruler,
  SquareStack,
  SplitSquareHorizontal,
  Telescope,
  WifiOff,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import ProductReviews from "../../components/ProductReviews";
import SlopeHero from "../../components/slope/SlopeHero";
import SlopeDownload, { SlopeReleaseInfo } from "../../components/SlopeDownload";
import { SLOPE_APP, SLOPE_FAQ, SLOPE_FEATURES, SLOPE_FILES, SLOPE_NAME, SLOPE_PAGE, SLOPE_RELEASED, SLOPE_STEPS, SLOPE_VERSION } from "@/lib/slope";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";

const TITLE = "Slope Calculator: slope, gradient and chainage levels";
const DESCRIPTION =
  "Free slope calculator for surveyors and site engineers: slope %, slope per metre and 1 in N from two levels and chainages, the level at every chainage, a live profile, crossfall, a level book with checks, and Excel, PDF and CSV reports. In the browser, offline, and on Windows.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SLOPE_PAGE },
  openGraph: {
    ...openGraphFor(SLOPE_PAGE, `${TITLE} | Excel to KML`, DESCRIPTION),
    images: [{ url: SLOPE_FILES.shots.calculator.src, width: 1440, height: 900, alt: "Slope Calculator: a falling slope of −1.500 % from 1+000 to 1+250 with its profile" }],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SLOPE_NAME,
  description: DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Windows 10, Windows 11, Web browser",
  softwareVersion: SLOPE_VERSION,
  datePublished: SLOPE_RELEASED,
  url: `${SITE_URL}${SLOPE_PAGE}`,
  installUrl: `${SITE_URL}${SLOPE_APP}`,
  image: `${SITE_URL}${SLOPE_FILES.shots.calculator.src}`,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const FEATURE_ICONS = [Calculator, Ruler, LineChart, SplitSquareHorizontal, Telescope, GraduationCap, FileSpreadsheet, Cloud];

const SHOTS = [
  {
    ...SLOPE_FILES.shots.crossfall,
    title: "Crossfall",
    alt: "Slope Calculator crossfall: centreline 10.000 m, left 2 % and right 2.5 % falling away over 3.5 m, with the cross-section",
  },
  {
    ...SLOPE_FILES.shots.level,
    title: "Digital level run",
    alt: "Slope Calculator digital level: the second setup reading 0.8496 m on the barcode staff, with the level book below",
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

export default function SlopeCalculatorPage() {
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
            <li aria-current="page" className="text-slate-700 font-medium">Slope Calculator</li>
          </ol>
        </nav>

        <SlopeHero />
      </div>

      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* The app */}
        <section aria-labelledby="app-h" className="mt-20">
          <SectionHead
            id="app-h"
            eyebrow="The app"
            title="Everything about the line on one screen"
            text="Type the two levels and chainages: the slope, the gradient, the profile and every station follow as you type. The example is the one the app opens with."
            Icon={Calculator}
          />
          <figure className="mt-8 rounded-2xl border border-slate-200 bg-[#071a44] p-1.5 shadow-[0_16px_40px_rgba(7,26,68,0.22)]">
            <Image
              src={SLOPE_FILES.shots.calculator.src}
              width={SLOPE_FILES.shots.calculator.width}
              height={SLOPE_FILES.shots.calculator.height}
              alt="Slope Calculator: start level 102.500 at 1+000 and end level 98.750 at 1+250 give −1.500 %, 1 in 66.7, with the profile and a probe at 1+125"
              sizes="(min-width: 1140px) 1080px, 100vw"
              className="w-full h-auto rounded-xl"
              priority
            />
          </figure>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.42fr)] gap-5 items-start">
            {SHOTS.map((s) => (
              <figure key={s.src}>
                <a href={s.src} target="_blank" rel="noopener" className="block rounded-2xl border border-slate-200 bg-[#071a44] p-1.5 hover:shadow-[0_12px_32px_rgba(7,26,68,0.2)] transition-shadow">
                  <Image src={s.src} alt={s.alt} width={s.width} height={s.height} sizes="(min-width: 768px) 440px, 100vw" className="w-full h-auto rounded-xl" />
                </a>
                <figcaption className="mt-2 text-[14px] font-semibold text-slate-800">{s.title}</figcaption>
              </figure>
            ))}
            <figure className="hidden md:block">
              <div className="rounded-[22px] border border-slate-200 bg-[#071a44] p-1.5">
                <Image
                  src={SLOPE_FILES.shots.phone.src}
                  width={SLOPE_FILES.shots.phone.width}
                  height={SLOPE_FILES.shots.phone.height}
                  alt="Slope Calculator on a phone: the calculator with the menu along the bottom"
                  sizes="200px"
                  className="w-full h-auto rounded-[18px]"
                />
              </div>
              <figcaption className="mt-2 text-[14px] font-semibold text-slate-800">On a phone</figcaption>
            </figure>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-h" className="mt-20">
          <SectionHead id="features-h" eyebrow="What it does" title="From two levels to a signed-off report" Icon={ListChecks} />
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SLOPE_FEATURES.map((f, i) => {
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
          <SectionHead id="steps-h" eyebrow="How it works" title="Five steps, a minute or two" Icon={BookOpen} />
          <ol className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            {SLOPE_STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-slate-200 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffd21f] text-[15px] font-extrabold text-[#071a44]">{i + 1}</span>
                <p className="mt-3 font-bold text-slate-900">{s.title}</p>
                <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Web or Windows */}
        <section id="download" aria-labelledby="download-h" className="scroll-mt-28 mt-20 rounded-3xl bg-[#071a44] text-white p-6 sm:p-10 relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(#9cb8ff_1px,transparent_1px),linear-gradient(90deg,#9cb8ff_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#ffd21f]">
              <Download className="w-4 h-4" aria-hidden /> Get it
            </p>
            <h2 id="download-h" className="mt-2 text-2xl sm:text-[30px] font-extrabold tracking-tight leading-tight">
              In your browser or on Windows. Free.
            </h2>
            <p className="mt-2 max-w-3xl text-[15px] text-blue-100/85">
              The same app either way. A free exceltokml.com account keeps your calculations, ready to open on any device.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 flex flex-col">
                <Globe className="w-7 h-7 text-[#ffd21f]" aria-hidden />
                <h3 className="mt-3 text-lg font-bold">Web app</h3>
                <ul className="mt-2 space-y-1.5 text-[14px] text-blue-50/90 flex-1">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" aria-hidden /> Nothing to install: Chrome, Edge, Firefox or Safari, on a computer or a phone</li>
                  <li className="flex gap-2"><WifiOff className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" aria-hidden /> Works offline once opened</li>
                  <li className="flex gap-2"><SquareStack className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" aria-hidden /> Install it from the browser to open it like an app</li>
                </ul>
                <Link
                  href={SLOPE_APP}
                  prefetch={false}
                  className="mt-5 inline-flex justify-center items-center gap-2 rounded-full bg-[#ffd21f] px-6 py-3 text-[16px] font-extrabold text-[#071a44] hover:bg-[#ffdc4d]"
                >
                  Open application <ArrowRight className="w-4 h-4" aria-hidden />
                </Link>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 flex flex-col">
                <Monitor className="w-7 h-7 text-[#ffd21f]" aria-hidden />
                <h3 className="mt-3 text-lg font-bold">{SLOPE_FILES.setup.label}</h3>
                <p className="mt-2 text-[14px] text-blue-50/90 flex-1">{SLOPE_FILES.setup.detail}.</p>
                <SlopeDownload className="mt-5 inline-flex justify-center items-center gap-2 rounded-full border-2 border-white/50 px-6 py-3 text-[16px] font-extrabold text-white hover:bg-white/10 cursor-pointer" />
                <SlopeReleaseInfo className="mt-2 text-center text-blue-100/70" />
              </div>
            </div>
            <p className="mt-5 flex gap-2 text-[13px] text-blue-100/75">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
              The Windows program isn&apos;t code-signed yet, so Windows SmartScreen may warn the first time. Choose More info, then Run anyway.
            </p>
          </div>
        </section>

        {/* Questions */}
        <section aria-labelledby="faq-h" className="mt-20">
          <SectionHead id="faq-h" eyebrow="Questions" title="Good to know" Icon={BookOpen} />
          <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {SLOPE_FAQ.map((f) => (
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
            Questions or a feature request?{" "}
            <Link href="/contact?topic=idea&program=slope" className="text-[#1e4fd8] hover:underline">
              Write to us
            </Link>
            .
          </p>
        </section>

        <ProductReviews product="slope-calculator" name="Slope Calculator" />
      </div>
    </PageShell>
  );
}
