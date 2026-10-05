import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Download,
  FileSpreadsheet,
  FileText,
  Keyboard,
  Layers,
  Package,
  PlayCircle,
  Ruler,
  Shield,
  Signpost,
  Spline,
  Sheet,
  SlidersHorizontal,
  SquareStack,
  TrendingUp,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import RoadProDownload from "../../components/RoadProDownload";
import {
  ROADPRO_COMMANDS,
  ROADPRO_DEFAULTS,
  ROADPRO_FEATURES,
  ROADPRO_FILES,
  ROADPRO_FIXES,
  ROADPRO_INSTALL,
  ROADPRO_KEYS,
  ROADPRO_LAYERS,
  ROADPRO_RELEASED,
  ROADPRO_REPORT,
  ROADPRO_REQUIREMENTS,
  ROADPRO_STEPS,
  ROADPRO_VERSION,
} from "@/lib/roadpro";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";

const TITLE = "RoadPro: Road Builder Plugin for AutoCAD";
const DESCRIPTION =
  "Build a complete road in AutoCAD from one centre line: edges, turning radius, barricades, signs, chainage, cross sections, widening and an Excel report. Free download.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/roadpro" },
  openGraph: {
    ...openGraphFor("/roadpro", `${TITLE} | Excel to KML`, DESCRIPTION),
    images: [{ url: "/roadpro/demo-cover.webp", width: 1280, height: 720, alt: "RoadPro road built in AutoCAD with barricades, lane arrows and chainage" }],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "RoadPro",
      description: DESCRIPTION,
      applicationCategory: "DesignApplication",
      applicationSubCategory: "AutoCAD plugin",
      operatingSystem: "Windows (AutoCAD, Civil 3D or Map 3D 2013 or newer)",
      softwareVersion: ROADPRO_VERSION,
      datePublished: ROADPRO_RELEASED,
      downloadUrl: `${SITE_URL}${ROADPRO_FILES.plugin.href}`,
      url: `${SITE_URL}/roadpro`,
      image: `${SITE_URL}/roadpro/road-plan.webp`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "VideoObject",
      name: "RoadPro demo: a complete road in AutoCAD from one command",
      description: "RoadPro builds a road from a centre line in AutoCAD: dialog, centre line, barricades, signs, report tables, Excel file and cross section.",
      thumbnailUrl: `${SITE_URL}${ROADPRO_FILES.video.poster}`,
      contentUrl: `${SITE_URL}${ROADPRO_FILES.video.href}`,
      uploadDate: ROADPRO_RELEASED,
      duration: ROADPRO_FILES.video.duration,
    },
  ],
};

const FEATURE_ICONS = [Ruler, Spline, Shield, TrendingUp, Signpost, CircleDot, SquareStack, FileSpreadsheet];

const SHOTS = [
  { src: "/roadpro/road-plan.webp", w: 1500, h: 560, title: "The road on the plan", alt: "Road plan in AutoCAD: red and white barricades, centre line, lane arrows and chainage marks every 20 m" },
  { src: "/roadpro/signs.webp", w: 1330, h: 600, title: "Signs and the S1 straight label", alt: "Sign legend next to the road: keep right, give way, road works ahead, speed limit, road closed board, chevron and lane arrows" },
  { src: "/roadpro/report.webp", w: 1330, h: 620, title: "The Excel report", alt: "RoadPro report open in Excel: geometry, barricade counts by side and colour, signs and markings" },
];

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

export default function RoadProPage() {
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-slate-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#0071e3]">Home</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">RoadPro</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[12px] font-bold text-amber-800">
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] uppercase tracking-wider">New</span>
              AutoCAD plugin · version {ROADPRO_VERSION}
            </p>
            <h1 className="mt-4 text-[32px] sm:text-[44px] font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              RoadPro: a complete road in AutoCAD from <span className="text-[#0071e3]">one command</span>
            </h1>
            <p className="mt-4 text-[16px] sm:text-[17px] text-slate-600 leading-relaxed">
              Type <kbd className="px-1.5 py-0.5 rounded-md border border-slate-300 bg-slate-50 font-mono text-[14px] text-slate-800">RDP</kbd>, draw the
              centre line, and RoadPro draws the edges, turning radius, barricades, signs, chainage, cross section and a report with an Excel file.
              Free, for AutoCAD, Civil 3D and Map 3D.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <RoadProDownload />
              <a href="#demo" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                <PlayCircle className="w-4 h-4" aria-hidden /> Watch the demo
              </a>
            </div>
            <p className="mt-3 text-[12.5px] text-slate-500">
              {ROADPRO_FILES.plugin.detail} · Full AutoCAD 2013 or newer (not LT) · Free account needed
            </p>
          </div>
          <figure className="rounded-2xl border border-slate-200 bg-slate-900 p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <Image
              src="/roadpro/road-plan.webp"
              alt="A road built by RoadPro in AutoCAD: red and white barricades, lane arrows, centre line and chainage"
              width={1500}
              height={560}
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
              className="w-full h-auto rounded-xl"
            />
          </figure>
        </header>

        {/* Demo video */}
        <section id="demo" aria-labelledby="demo-h" className="scroll-mt-28 mt-20">
          <SectionHead id="demo-h" eyebrow="Demo" title="Watch RoadPro build a road" text="Three minutes in AutoCAD Civil 3D: the dialog, the centre line, the finished road, the report and the Excel file, the sign legend and the cross section." Icon={PlayCircle} />
          <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <video
              controls
              preload="none"
              playsInline
              poster={ROADPRO_FILES.video.poster}
              className="w-full h-auto aspect-video bg-black"
              aria-label="RoadPro demo video (no sound)"
            >
              <source src={ROADPRO_FILES.video.href} type="video/mp4" />
              Your browser can&apos;t play this video. <a href={ROADPRO_FILES.video.href}>Download it</a> instead.
            </video>
          </div>
          <p className="mt-2 text-[12.5px] text-slate-500">No sound. Tip: switch to full screen to read the drawing.</p>
        </section>

        {/* What it draws */}
        <section aria-labelledby="features-h" className="mt-20">
          <SectionHead id="features-h" eyebrow="What it draws" title="One command builds the complete road" Icon={Package} />
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROADPRO_FEATURES.map((f, i) => {
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

        {/* Screenshots */}
        <section aria-labelledby="shots-h" className="mt-20">
          <SectionHead id="shots-h" eyebrow="Screenshots" title="From the demo drawing" Icon={SquareStack} />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {SHOTS.map((s) => (
              <figure key={s.src}>
                <a href={s.src} target="_blank" rel="noopener" className="block rounded-2xl border border-slate-200 bg-slate-900 p-1.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.18)] transition-shadow">
                  <Image src={s.src} alt={s.alt} width={s.w} height={s.h} sizes="(min-width: 768px) 360px, 100vw" className="w-full aspect-[16/9] object-cover object-left-top rounded-xl" />
                </a>
                <figcaption className="mt-2 text-[14px] font-semibold text-slate-800">{s.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Install */}
        <section id="install" aria-labelledby="install-h" className="scroll-mt-28 mt-20 grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8">
          <div>
            <SectionHead id="install-h" eyebrow="Install" title="Install and load in under a minute" text="Unzip RoadPro.zip, then in AutoCAD:" Icon={Download} />
            <ol className="mt-6 space-y-4">
              {ROADPRO_INSTALL.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[#0071e3] text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="font-mono font-bold text-slate-900">{s.title}</p>
                    <p className="text-[14.5px] text-slate-600">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <aside className="rounded-2xl bg-amber-50 border border-amber-200/80 p-5 self-start">
            <h3 className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4" aria-hidden /> Before you start
            </h3>
            <ul className="mt-3 space-y-2">
              {ROADPRO_REQUIREMENTS.map((r) => (
                <li key={r} className="flex gap-2 text-[14px] text-amber-900 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /> {r}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {/* Workflow */}
        <section aria-labelledby="steps-h" className="mt-20">
          <SectionHead
            id="steps-h"
            eyebrow="Workflow"
            title="From centre line to finished drawing in six steps"
            text="The whole sequence runs from one command. Steps 5 and 6 ask for a placement point; press Enter to skip the tables or the section. The Excel file is saved either way."
            Icon={SlidersHorizontal}
          />
          <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROADPRO_STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 p-5">
                <p className="text-[12px] font-bold text-[#0071e3]">Step {i + 1}</p>
                <h3 className="mt-0.5 font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Commands */}
        <section id="commands" aria-labelledby="commands-h" className="scroll-mt-28 mt-20">
          <SectionHead id="commands-h" eyebrow="Commands" title="All commands and shortcuts" text="Every command except RDP starts by asking you to select the road's centre line (layer ROAD-CL)." Icon={Keyboard} />
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-[14px]">
              <thead className="bg-slate-50 text-left text-[12px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">Shortcut</th>
                  <th scope="col" className="px-4 py-3 font-bold">Full command</th>
                  <th scope="col" className="px-4 py-3 font-bold">What it does</th>
                </tr>
              </thead>
              <tbody>
                {ROADPRO_COMMANDS.map((c) => (
                  <tr key={c.full} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 font-mono font-bold text-[#0071e3] whitespace-nowrap">{c.short}</td>
                    <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">{c.full}</td>
                    <td className="px-4 py-3 text-slate-600 min-w-[260px]">{c.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-8 font-bold text-slate-900">Useful AutoCAD keys while using RoadPro</h3>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROADPRO_KEYS.map((k) => (
              <li key={k.key} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                <kbd className="shrink-0 min-w-[44px] text-center px-2 py-1 rounded-md border border-slate-300 bg-slate-50 font-mono text-[13px] font-bold text-slate-800">{k.key}</kbd>
                <span className="text-[13.5px] text-slate-600 leading-snug">{k.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px] text-slate-600">
            <strong className="text-slate-800">Widening vs taper:</strong> RDW adds an extra lane that comes back (W1, W2 …); RDT changes the width
            from one chainage onwards. Keep them on different chainage ranges of the same side.
          </p>
        </section>

        {/* Defaults and layers */}
        <section aria-labelledby="defaults-h" className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SectionHead id="defaults-h" eyebrow="Settings" title="Ready-made defaults" text="Press OK in the dialog to use them, or change any value. ROADPRORESET brings them all back." Icon={SlidersHorizontal} />
            <dl className="mt-6 rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {ROADPRO_DEFAULTS.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-[14px]">
                  <dt className="text-slate-600">{k}</dt>
                  <dd className="font-semibold text-slate-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <SectionHead id="layers-h" eyebrow="Layers" title="Everything on its own layer" text="Easy to freeze, colour or plot separately." Icon={Layers} />
            <dl className="mt-6 rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {ROADPRO_LAYERS.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-2 text-[13.5px]">
                  <dt className="font-mono text-slate-800">{k}</dt>
                  <dd className="text-slate-600 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Report */}
        <section aria-labelledby="report-h" className="mt-20">
          <SectionHead
            id="report-h"
            eyebrow="Report"
            title="Report tables and an Excel file"
            text="Placed in the drawing and saved as a CSV next to the DWG (e.g. ROAD-01_RoadPro_Report.csv). Run RDR any time to make it again."
            Icon={Sheet}
          />
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROADPRO_REPORT.map((r) => (
              <li key={r} className="flex gap-2 text-[14.5px] text-slate-700">
                <CheckCircle2 className="w-4 h-4 mt-1 text-emerald-600 shrink-0" aria-hidden /> {r}
              </li>
            ))}
          </ul>
        </section>

        {/* Fixes */}
        <section aria-labelledby="fixes-h" className="mt-20">
          <SectionHead id="fixes-h" eyebrow="Help" title="Quick fixes for common questions" Icon={AlertTriangle} />
          <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {ROADPRO_FIXES.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-slate-900">
                  {f.q}
                  <ArrowRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-2 text-[14.5px] text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Downloads */}
        <section id="download" aria-labelledby="download-h" className="scroll-mt-28 mt-20 rounded-3xl border border-slate-200 bg-gradient-to-b from-blue-50/70 to-white p-6 sm:p-10">
          <SectionHead id="download-h" eyebrow="Download" title={`Get RoadPro ${ROADPRO_VERSION}`} text="Free. Sign in or create a free account, then the download starts." Icon={Download} />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-blue-200 bg-white p-5 flex flex-col">
              <Package className="w-6 h-6 text-[#0071e3]" aria-hidden />
              <h3 className="mt-2 font-bold text-slate-900">{ROADPRO_FILES.plugin.label}</h3>
              <p className="text-[13.5px] text-slate-500 flex-1">{ROADPRO_FILES.plugin.detail}</p>
              <RoadProDownload className="mt-4 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer" label="Download plugin" />
            </div>
            {[
              { f: ROADPRO_FILES.guide, Icon: FileText, text: "Every command, setting, layer and sign, with pictures" },
              { f: ROADPRO_FILES.shortcuts, Icon: FileSpreadsheet, text: "One page of shortcut keys to print or keep open" },
            ].map(({ f, Icon, text }) => (
              <div key={f.href} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
                <Icon className="w-6 h-6 text-slate-500" aria-hidden />
                <h3 className="mt-2 font-bold text-slate-900">{f.label}</h3>
                <p className="text-[13.5px] text-slate-500 flex-1">{text}. {f.detail}.</p>
                <a href={f.href} download={f.name} className="mt-4 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                  <Download className="w-4 h-4" aria-hidden /> Download
                </a>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[13px] text-slate-500">
            Questions or a feature request? <Link href="/contact?topic=idea" className="text-[#0071e3] hover:underline">Write to us</Link>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
