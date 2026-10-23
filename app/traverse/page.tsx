import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AppWindow,
  BookOpen,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  Info,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  MapPinned,
  Monitor,
  Mountain,
  Package,
  PlayCircle,
  Share2,
  Sigma,
  Telescope,
  Workflow,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import TraverseDownload, { TraverseReleaseInfo } from "../../components/TraverseDownload";
import TrackedLink from "../../components/TrackedLink";
import StepFlipGallery, { type FlipStep } from "../../components/StepFlipGallery";
import {
  TRAVERSE_APP,
  TRAVERSE_FEATURES,
  TRAVERSE_FILES,
  TRAVERSE_NAME,
  TRAVERSE_NOTES,
  TRAVERSE_RELEASED,
  TRAVERSE_SAMPLES,
  TRAVERSE_SCREENS,
  TRAVERSE_STEPS,
  TRAVERSE_VERSION,
} from "@/lib/traverse";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";

const TITLE = "Traverse & Level Adjustment Software for Surveyors";
const DESCRIPTION =
  "Traverse and levelling for surveyors, in the browser or on Windows: site coordinates or an angles-and-distances field book with side shots and levels, Bowditch, Transit, Equal or least squares adjustment, Qatar National Grid with latitude and longitude, Rise & Fall or HI, PDF reports, Google Earth export, a dashboard of saved jobs, sharing, a traverse simulator, offline use and dark mode.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/traverse" },
  openGraph: {
    ...openGraphFor("/traverse", `${TITLE} | Excel to KML`, DESCRIPTION),
    images: [{ url: TRAVERSE_FILES.video.poster, width: 1024, height: 576, alt: "Professional Traverse and Level Adjustment Software: precision in every point" }],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: TRAVERSE_NAME,
      description: DESCRIPTION,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Surveying software",
      operatingSystem: "Web browser, Windows 10, Windows 11",
      softwareVersion: TRAVERSE_VERSION,
      datePublished: TRAVERSE_RELEASED,
      ...(TRAVERSE_FILES.setup.href
        ? { downloadUrl: TRAVERSE_FILES.setup.href.startsWith("http") ? TRAVERSE_FILES.setup.href : `${SITE_URL}${TRAVERSE_FILES.setup.href}` }
        : {}),
      url: `${SITE_URL}/traverse`,
      image: `${SITE_URL}/traverse/screens/v2-traverse.webp`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "VideoObject",
      name: "Professional Traverse and Level Adjustment Software: intro",
      description: "Intro to the Professional Traverse and Level Adjustment Software. Precision in every point.",
      thumbnailUrl: `${SITE_URL}${TRAVERSE_FILES.video.poster}`,
      contentUrl: `${SITE_URL}${TRAVERSE_FILES.video.href}`,
      uploadDate: TRAVERSE_RELEASED,
      duration: TRAVERSE_FILES.video.duration,
    },
  ],
};

// The hero: how the app is used, step by step (each screen flips over to the next)
const HERO_STEPS: FlipStep[] = [
  { src: "/traverse/screens/v2-register.webp", title: "Create your free account", text: "Register, or log in with your Excel to KML account.", alt: "Register screen of Traverse & Level" },
  { src: "/traverse/screens/v2-dashboard.webp", title: "Open your dashboard", text: "Saved traverses and level runs, their status and the week's activity.", alt: "Dashboard: saved traverses and level runs with their status, a job shared by a colleague and the week's activity" },
  { src: "/traverse/screens/v2-traverse.webp", title: "Enter the traverse", text: "Known points and the coordinates you measured on site.", alt: "Traverse screen: known points, site coordinates and an Accepted result with precision 1 : 62,105 after a Bowditch adjustment" },
  { src: "/traverse/screens/v2-fieldbook.webp", title: "Or type the field book", text: "Angles and distances, with side shots and levels.", alt: "Field book with angles, distances, side shots and levels, accepted with the angular and level checks" },
  { src: "/traverse/screens/v2-lsq.webp", title: "Adjust and check", text: "Bowditch, Transit, Equal or least squares, with residuals and error ellipses.", alt: "Least squares residuals for every angle and distance, and the error ellipses of the stations" },
  { src: "/traverse/screens/v2-traverse-plan.webp", title: "See it on the plan", text: "The adjusted and the measured traverse, drawn to scale.", alt: "Site coordinates, the adjustment methods and a plan of the adjusted and measured traverse" },
  { src: "/traverse/screens/v2-level-result.webp", title: "Level the run", text: "Rise & Fall or HI, misclosure against your allowable, adjusted RLs.", alt: "Level run accepted: misclosure against the allowable, reduced levels, adjusted RLs and the arithmetic checks" },
  { src: "/traverse/screens/v2-reports.webp", title: "Report and share", text: "Signed PDF reports, CSV and Google Earth, and share jobs with your team.", alt: "Traverse adjustment report and levelling report, with closure checks and adjusted coordinates" },
];

const FEATURE_ICONS = [MapPinned, Sigma, Mountain, FileText, LayoutDashboard, Share2, Telescope, Globe];

function SectionHead({ id, eyebrow, title, text, Icon }: { id: string; eyebrow: string; title: string; text?: string; Icon: React.ElementType }) {
  return (
    <div className="max-w-3xl">
      <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">
        <Icon className="w-4 h-4" aria-hidden /> {eyebrow}
      </p>
      <h2 id={id} className="mt-2 text-2xl sm:text-[30px] font-extrabold tracking-tight text-slate-900 leading-tight">
        {title}
      </h2>
      {text && <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">{text}</p>}
    </div>
  );
}

export default function TraversePage() {
  const comingSoon = !TRAVERSE_FILES.setup.href;
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-slate-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#0071e3]">Home</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">Traverse &amp; Level</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-10 items-center">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/traverse/logo.webp" alt="" width={448} height={448} priority className="w-12 h-12 rounded-xl border border-amber-300/60" />
              <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[12px] font-bold text-amber-800">
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] uppercase tracking-wider whitespace-nowrap">{comingSoon ? "Coming soon" : "New"}</span>
                Web app and Windows · version {TRAVERSE_VERSION}
              </p>
            </div>
            <h1 className="mt-4 text-[30px] sm:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Professional Traverse &amp; Level Adjustment: <span className="text-[#0071e3]">precision in every point</span>
            </h1>
            <p className="mt-4 text-[16px] sm:text-[17px] text-slate-600 leading-relaxed">
              Enter the coordinates you measure on site, close on a known point and get an adjusted, checked result with a signed PDF report.
              Level books are reduced, checked and adjusted the same way. Every job is saved to your account, ready to open, copy or share.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={TRAVERSE_APP} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold">
                <Globe className="w-4 h-4" aria-hidden /> Open the web app
              </a>
              <TraverseDownload className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer" />
              <TrackedLink href={TRAVERSE_FILES.manualPdf.href} assetType="traverse_manual" fileName={TRAVERSE_FILES.manualPdf.name} version={`v${TRAVERSE_VERSION}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                <FileText className="w-4 h-4" aria-hidden /> User manual (PDF)
              </TrackedLink>
            </div>
            <p className="mt-3 text-[12.5px] text-slate-500">
              Free with your Excel to KML account · Works offline after your first login ·{" "}
              <a href="#video" className="text-[#0071e3] hover:underline">Watch the intro</a>
            </p>
          </div>
          <StepFlipGallery steps={HERO_STEPS} interval={4000} />
        </header>

        {/* Video */}
        <section id="video" aria-labelledby="video-h" className="scroll-mt-28 mt-20">
          <SectionHead id="video-h" eyebrow="Video" title="Watch the intro" Icon={PlayCircle} />
          <div className="mt-6 max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <video
              controls
              preload="none"
              playsInline
              poster={TRAVERSE_FILES.video.poster}
              className="w-full h-auto aspect-video bg-black"
              aria-label="Professional Traverse and Level Adjustment Software intro video"
            >
              <source src={TRAVERSE_FILES.video.href} type="video/mp4" />
              <source src={TRAVERSE_FILES.video.webm} type="video/webm" />
              Your browser can&apos;t play this video. <a href={TRAVERSE_FILES.video.href}>Download it</a> instead.
            </video>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features-h" className="mt-20">
          <SectionHead id="features-h" eyebrow="What it does" title="From the field book to the signed report" Icon={Package} />
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRAVERSE_FEATURES.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? CheckCircle2;
              return (
                <li key={f.title} className="rounded-2xl border border-slate-200 bg-[#fafbfc] p-5">
                  <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden />
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{f.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Every screen */}
        <section id="screens" aria-labelledby="screens-h" className="scroll-mt-28 mt-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <SectionHead
              id="screens-h"
              eyebrow="Inside the app"
              title={`${TRAVERSE_SCREENS.reduce((n, g) => n + g.items.length, 0)} screens, in the order you work`}
              text="Account, traverse, levelling, simulator and sharing. Tap a screen to read its page in the user manual."
              Icon={LayoutGrid}
            />
            <TrackedLink
              href={TRAVERSE_FILES.manualPdf.href}
              assetType="traverse_manual"
              fileName={TRAVERSE_FILES.manualPdf.name}
              version={`v${TRAVERSE_VERSION}`}
              target="_blank"
              rel="noopener"
              className="shrink-0 self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold"
            >
              <BookOpen className="w-4 h-4" aria-hidden /> Read the manual
            </TrackedLink>
          </div>
          {TRAVERSE_SCREENS.map((g) => (
            <div key={g.group} className="mt-8">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-amber-700">{g.group}</h3>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {g.items.map((s) => (
                  <li key={s.no}>
                    <a
                      href={`${TRAVERSE_FILES.manualPdf.href}#page=${s.page}`}
                      target="_blank"
                      rel="noopener"
                      className="group block h-full rounded-2xl border border-slate-200 bg-white p-2.5 hover:border-blue-200 hover:shadow-[0_10px_28px_rgba(15,23,42,0.10)] transition-all"
                    >
                      <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                        <Image
                          src={`/traverse/screens/${s.img}.webp`}
                          alt={`${s.no} ${s.title} screen of the Traverse and Level Adjustment Software`}
                          width={1440}
                          height={900}
                          sizes="(min-width: 1024px) 350px, (min-width: 640px) 45vw, 100vw"
                          className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      </div>
                      <div className="px-1.5 pt-3 pb-1">
                        <h4 className="text-[15px] font-bold text-slate-900 group-hover:text-[#0071e3]">
                          <span className="font-mono text-[#0071e3] mr-1.5">{s.no}</span>
                          {s.title}
                        </h4>
                        <p className="mt-1 text-[13.5px] text-slate-500 leading-relaxed">{s.text}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Steps */}
        <section aria-labelledby="steps-h" className="mt-20">
          <SectionHead id="steps-h" eyebrow="How it works" title="Six steps from login to report" Icon={Workflow} />
          <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRAVERSE_STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 p-5">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[#0071e3] text-white text-sm font-bold">{i + 1}</span>
                <h3 className="mt-3 font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Good to know */}
        <section aria-labelledby="notes-h" className="mt-20 rounded-3xl border border-amber-200/80 bg-amber-50/60 p-6 sm:p-8">
          <h2 id="notes-h" className="flex items-center gap-2 text-lg sm:text-xl font-extrabold text-slate-900">
            <Info className="w-5 h-5 text-amber-600" aria-hidden /> Good to know
          </h2>
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
            {TRAVERSE_NOTES.map((n) => (
              <li key={n} className="flex items-start gap-2 text-[14px] text-slate-700 leading-relaxed">
                <ListChecks className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" aria-hidden /> {n}
              </li>
            ))}
          </ul>
        </section>

        {/* Get it */}
        <section id="download" aria-labelledby="download-h" className="scroll-mt-28 mt-20 mb-6">
          <SectionHead
            id="download-h"
            eyebrow="Get it"
            title={`Use Traverse & Level ${TRAVERSE_VERSION}`}
            text="Free. Open it in the browser with your Excel to KML account, or download the Windows program."
            Icon={Download}
          />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 flex flex-col">
              <Globe className="w-6 h-6 text-[#0071e3]" aria-hidden />
              <h3 className="mt-2 font-bold text-slate-900">Web app</h3>
              <p className="text-[13.5px] text-slate-500 flex-1">
                Chrome, Edge, Safari or Firefox, on a computer or a phone. Jobs are saved to your account, shared with your team, and the app keeps
                working offline after your first login.
              </p>
              <a href={TRAVERSE_APP} className="mt-4 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold">
                <AppWindow className="w-4 h-4" aria-hidden /> Open the web app
              </a>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
              <Monitor className="w-6 h-6 text-slate-500" aria-hidden />
              <h3 className="mt-2 font-bold text-slate-900">{TRAVERSE_FILES.setup.label}</h3>
              <p className="text-[13.5px] text-slate-500 flex-1">
                {comingSoon ? "Coming soon for Windows." : `${TRAVERSE_FILES.setup.detail}.`} Log in with your Excel to KML account: the same jobs as
                the web app.
              </p>
              <TraverseDownload className="mt-4 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer" label="Download for Windows" />
              <TraverseReleaseInfo />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
              <FileText className="w-6 h-6 text-slate-500" aria-hidden />
              <h3 className="mt-2 font-bold text-slate-900">{TRAVERSE_FILES.manualPdf.label}</h3>
              <p className="text-[13.5px] text-slate-500 flex-1">
                Every step with a screenshot. {TRAVERSE_FILES.manualPdf.detail}; also as {TRAVERSE_FILES.manual.detail.split(",")[0]}.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <TrackedLink href={TRAVERSE_FILES.manualPdf.href} assetType="traverse_manual" fileName={TRAVERSE_FILES.manualPdf.name} version={`v${TRAVERSE_VERSION}`} target="_blank" rel="noopener" className="inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                  <FileText className="w-4 h-4" aria-hidden /> PDF
                </TrackedLink>
                <TrackedLink href={TRAVERSE_FILES.manual.href} download={TRAVERSE_FILES.manual.name} assetType="traverse_manual" fileName={TRAVERSE_FILES.manual.name} version={`v${TRAVERSE_VERSION}`} className="inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                  <Download className="w-4 h-4" aria-hidden /> PowerPoint
                </TrackedLink>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-[#fafbfc] p-5">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <FileSpreadsheet className="w-5 h-5 text-[#0071e3]" aria-hidden /> Sample files
            </h3>
            <p className="mt-1 text-[13.5px] text-slate-500">
              Practise before your own job. The manual&apos;s{" "}
              <a href={`${TRAVERSE_FILES.manualPdf.href}#page=28`} target="_blank" rel="noopener" className="text-[#0071e3] hover:underline">Sample files</a>{" "}
              page shows how to use them.
            </p>
            <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {TRAVERSE_SAMPLES.map((f) => (
                <li key={f.href} className="text-[13.5px] leading-relaxed min-w-0">
                  <TrackedLink href={f.href} download={f.name} assetType="traverse_sample" fileName={f.name} version={`v${TRAVERSE_VERSION}`} className="font-mono text-[12.5px] text-[#0071e3] hover:underline break-all">
                    {f.name}
                  </TrackedLink>
                  <span className="text-slate-500"> · {f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-5 text-[13px] text-slate-500">
            Need a quick check in the browser? Try the free{" "}
            <Link href="/tools/traverse-adjustment" className="text-[#0071e3] hover:underline">online traverse adjustment</Link>. Questions or a feature
            request? <Link href="/contact?topic=idea" className="text-[#0071e3] hover:underline">Write to us</Link>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
