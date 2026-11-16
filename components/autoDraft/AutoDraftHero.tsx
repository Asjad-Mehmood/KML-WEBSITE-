import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, Mountain, Spline, FileOutput } from "lucide-react";
import AutoDraftDownload, { AutoDraftReleaseInfo } from "../AutoDraftDownload";
import { AUTO_DRAFT_CODES_PAGE, AUTO_DRAFT_FILES, AUTO_DRAFT_HIGHLIGHTS, AUTO_DRAFT_VERSION } from "@/lib/autoDraft";

const ICONS = [Spline, Layers, Mountain, FileOutput];

// What the surveyor typed, and what Auto Drafting makes of it: the left side of the "before → after"
const FIELD = [
  { p: "2", code: "RE1 ST" },
  { p: "6", code: "RE1 ARC" },
  { p: "8", code: "RE1 EARC" },
  { p: "35", code: "EPL" },
  { p: "38", code: "WL1 ST GT1" },
  { p: "47", code: "BLD1 CLS" },
  { p: "50", code: "BLD2 RECT" },
  { p: "52", code: "TR" },
];

// The top of /auto-draft, on the page's white like the home page: what the program does on the
// left; on the right the field codes and the drawing they become
export default function AutoDraftHero() {
  return (
    <section aria-labelledby="ad-h" className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 py-2 sm:py-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-[#0071e3]/10 px-3 py-1 text-[12.5px] font-bold uppercase tracking-wide text-[#0071e3]">
            Free survey software
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[12px] font-semibold text-slate-600">
            Version {AUTO_DRAFT_VERSION} · Windows
          </span>
        </div>
        <h1 id="ad-h" className="mt-5 text-[44px] sm:text-[60px] font-black tracking-tight leading-[1.02] text-slate-900">
          Auto Drafting
        </h1>
        <p className="mt-2 text-[20px] sm:text-[24px] font-bold tracking-tight text-[#0071e3]">Survey points to a finished drawing</p>
        <p className="mt-4 max-w-[560px] text-[15.5px] sm:text-[17px] leading-relaxed text-slate-600">
          Open the day&apos;s survey and Auto Drafting joins the lines by their field codes, places the symbols, writes the levels, draws the contours and
          puts it all on a sheet with your title block. Save a DXF for AutoCAD, a PDF to print and a KML for Google Earth.
        </p>
        <ul className="mt-6 space-y-3">
          {AUTO_DRAFT_HIGHLIGHTS.map((h, i) => {
            const Icon = ICONS[i];
            return (
              <li key={h} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-[16px] font-medium text-slate-800">{h}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <AutoDraftDownload className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-[15px] font-semibold shadow-[0_6px_20px_rgba(0,113,227,0.3)] cursor-pointer" />
          <Link
            href={AUTO_DRAFT_CODES_PAGE}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 text-[15px] font-semibold text-slate-800 hover:bg-slate-50"
          >
            Code guide <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <AutoDraftReleaseInfo className="mt-3 text-slate-500" />
        <p className="mt-3 text-[12.5px] text-slate-500">
          Sign in with a free exceltokml.com account. Your surveys stay on your PC ·{" "}
          <a href="#video" className="text-[#0071e3] hover:underline">Watch the video</a>
        </p>
      </div>

      <div className="self-center">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] gap-3 items-center">
          <div className="rounded-2xl border border-slate-200 bg-[#fafbfc] p-3">
            <p className="text-[10.5px] font-extrabold uppercase tracking-wide text-slate-500">In the field</p>
            <ul className="mt-2 grid grid-cols-2 sm:grid-cols-1 gap-x-3 gap-y-1 font-mono text-[12px] sm:text-[13px]">
              {FIELD.map((f) => (
                <li key={f.p} className="flex gap-2 whitespace-nowrap">
                  <span className="w-6 text-right text-slate-400">{f.p}</span>
                  <span className="font-bold text-[#0071e3]">{f.code}</span>
                </li>
              ))}
            </ul>
          </div>
          <figure className="relative rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
            <span aria-hidden className="absolute -left-5 top-1/2 -translate-y-1/2 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3] text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
            <Image
              src={AUTO_DRAFT_FILES.shots.contours.src}
              width={AUTO_DRAFT_FILES.shots.contours.width}
              height={AUTO_DRAFT_FILES.shots.contours.height}
              alt="Auto Drafting: a surveyed plot drawn from its codes, with road edges, buildings, trees, poles, contours, the legend and the title block on an A3 sheet"
              sizes="(min-width: 1024px) 600px, 100vw"
              className="w-full h-auto rounded-xl"
              priority
            />
          </figure>
        </div>
        <p className="mt-3 text-center text-[12.5px] text-slate-500">67 coded points → an A3 drawing at 1:500, with nothing drawn by hand</p>
      </div>
    </section>
  );
}
