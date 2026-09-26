import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";
import PageShell from "../../components/PageShell";
import WebAppLink from "@/components/WebAppLink";
import { MAIN_STEPS, MORE_FEATURES } from "@/lib/tutorial";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";

const TITLE = "App Tutorial: Excel Survey Points to Google Earth";
const DESCRIPTION =
  "A step-by-step walkthrough of Excel to KML with screenshots: load your points, choose the grid, prove it with a known mark and save KMZ, KML, Excel, PDF or DXF.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tutorial" },
  openGraph: openGraphFor("/tutorial", `${TITLE} | Excel to KML`, DESCRIPTION),
};

const howTo = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Convert Excel survey points to Google Earth with Excel to KML",
  description: DESCRIPTION,
  step: MAIN_STEPS.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.title,
    text: s.body.join(" "),
    image: `${SITE_URL}${s.image}`,
    url: `${SITE_URL}/tutorial#${s.id}`,
  })),
};

function Shot({ src, alt, width, height, priority }: { src: string; alt: string; width: number; height: number; priority?: boolean }) {
  return (
    <figure className="rounded-2xl border border-slate-200 bg-slate-900 p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 1024px) 640px, 100vw"
        priority={priority}
        className="w-full h-auto rounded-xl"
      />
    </figure>
  );
}

export default function TutorialPage() {
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(howTo) }} />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-slate-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#0071e3]">Home</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">Tutorial</li>
          </ol>
        </nav>

        <header className="max-w-3xl">
          <h1 className="text-[30px] sm:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            How to use Excel to KML
          </h1>
          <p className="mt-4 text-[16px] sm:text-[17px] text-slate-600 leading-relaxed">
            From a survey spreadsheet to a file that opens in the right place in Google Earth, in four steps. The screenshots use the
            built-in sample job — click <strong>Try the sample</strong> in the app to follow along. The web app and the Windows app work the
            same way.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <WebAppLink className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold">
              Open the web app <ArrowRight className="w-4 h-4" aria-hidden />
            </WebAppLink>
            <Link href="/download" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
              Get the Windows app
            </Link>
          </div>
        </header>

        {/* Contents */}
        <nav aria-label="On this page" className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-3">On this page</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[14px]">
            {MAIN_STEPS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex gap-2 text-slate-700 hover:text-[#0071e3]">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#0071e3] text-white text-[12px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="pt-0.5 font-medium">{s.title}</span>
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] text-slate-500">
            Then: <a href="#more" className="text-[#0071e3] hover:underline">quality checks, symbols, photos, lines and calibration</a> ·{" "}
            <a href="#sheet" className="text-[#0071e3] hover:underline">how to lay out your sheet</a>
          </p>
        </nav>

        {/* Sheet layout */}
        <section id="sheet" className="mt-14 scroll-mt-28 max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Before you start: your sheet</h2>
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
            Any Excel or CSV sheet works if the first row names the columns. A typical total station or GNSS export looks like this:
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-[13px] font-mono">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{["STATION", "CODE", "EASTING", "NORTHING", "ELEVATION", "REMARKS"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="text-slate-800">
                <tr className="border-t border-slate-100"><td className="px-3 py-1.5">TBM-01</td><td className="px-3">TBM</td><td className="px-3">513556.612</td><td className="px-3">2787467.856</td><td className="px-3">44.416</td><td className="px-3 font-sans">Brass plug</td></tr>
                <tr className="border-t border-slate-100"><td className="px-3 py-1.5">TR-01</td><td className="px-3">TREE</td><td className="px-3">513343.365</td><td className="px-3">2787621.705</td><td className="px-3">44.239</td><td className="px-3 font-sans">Date palm</td></tr>
              </tbody>
            </table>
          </div>
          <ul className="mt-4 space-y-1.5 text-[14.5px] text-slate-600">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden /> The essentials are a point name and its position: Easting + Northing, or Latitude + Longitude.</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden /> Code sets the marker and colour; Elevation and Remarks show in the point&apos;s balloon.</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-hidden /> Column order doesn&apos;t matter, and extra columns are kept.</li>
          </ul>
        </section>

        {/* Main steps */}
        <div className="mt-6">
          {MAIN_STEPS.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 pt-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-8 lg:gap-12 items-start">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wider text-[#0071e3]">Step {i + 1}</p>
                <h2 className="mt-1 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">{s.title}</h2>
                <div className="mt-4 space-y-3 text-[15px] text-slate-600 leading-relaxed">
                  {s.body.map((p) => <p key={p}>{p}</p>)}
                </div>
                {s.tips && (
                  <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200/70 p-4 space-y-2">
                    {s.tips.map((t) => (
                      <p key={t} className="flex gap-2 text-[14px] text-amber-900 leading-relaxed">
                        <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /> {t}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <Shot src={s.image} alt={s.alt} width={s.width} height={s.height} priority={i === 0} />
            </section>
          ))}
        </div>

        {/* More features */}
        <section id="more" className="scroll-mt-28 mt-20">
          <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">Go further</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-slate-600">Optional tools in the left-hand menu, for when a plain set of points isn&apos;t enough.</p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {MORE_FEATURES.map((f) => (
              <article key={f.id} id={f.id} className="scroll-mt-28">
                <Shot src={f.image} alt={f.alt} width={f.width} height={f.height} />
                <h3 className="mt-4 text-lg font-bold text-slate-900">{f.title}</h3>
                <div className="mt-2 space-y-2 text-[14.5px] text-slate-600 leading-relaxed">
                  {f.body.map((p) => <p key={p}>{p}</p>)}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-16 rounded-2xl bg-slate-50 border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-slate-900">Ready to try it on your own sheet?</p>
            <p className="mt-1 text-[14.5px] text-slate-600">
              More help: <Link href="/guides" className="text-[#0071e3] hover:underline">guides</Link> for common jobs and{" "}
              <Link href="/convert" className="text-[#0071e3] hover:underline">grid pages</Link> for every coordinate system.
            </p>
          </div>
          <WebAppLink className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold">
            Open the web app <ArrowRight className="w-4 h-4" aria-hidden />
          </WebAppLink>
        </div>
      </div>
    </PageShell>
  );
}
