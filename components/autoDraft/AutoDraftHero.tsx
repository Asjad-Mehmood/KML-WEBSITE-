import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, Mountain, Spline, FileOutput } from "lucide-react";
import AutoDraftDownload, { AutoDraftReleaseInfo } from "../AutoDraftDownload";
import { AUTO_DRAFT_CODES_PAGE, AUTO_DRAFT_FILES, AUTO_DRAFT_HIGHLIGHTS, AUTO_DRAFT_VERSION } from "@/lib/autoDraft";

const ICONS = [Spline, Layers, Mountain, FileOutput];

// What the surveyor typed, and what Auto Draft makes of it: the left side of the "before → after"
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

// The top of /auto-draft: what the program does on the left; on the right the field codes and the
// drawing they become
export default function AutoDraftHero() {
  return (
    <section
      aria-labelledby="ad-h"
      className="relative overflow-hidden rounded-[28px] border border-[#1d3b78] bg-[#071a44] text-white shadow-[0_24px_60px_rgba(7,26,68,0.35)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,#163c8f_0%,transparent_55%),radial-gradient(ellipse_at_5%_95%,#0f2f75_0%,transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(#9cb8ff_1px,transparent_1px),linear-gradient(90deg,#9cb8ff_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>
      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 px-5 sm:px-10 lg:px-14 py-8 sm:py-12">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-[#ffd21f] px-4 py-1.5 text-[13px] sm:text-[14px] font-extrabold uppercase tracking-wide text-[#071a44]">
              Free survey software
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-blue-100">
              Version {AUTO_DRAFT_VERSION} · Windows
            </span>
          </div>
          <h1 id="ad-h" className="mt-5 font-black tracking-tight leading-[0.98]">
            <span className="block text-[46px] sm:text-[64px] lg:text-[72px]">Auto</span>
            <span className="block text-[46px] sm:text-[64px] lg:text-[72px] text-[#ffd21f]">Draft</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[15.5px] sm:text-[17px] leading-relaxed text-blue-50/90">
            Survey points to a finished drawing. Open the day&apos;s survey and Auto Draft joins the lines by their field codes, places the symbols,
            writes the levels, draws the contours and puts it all on a sheet with your title block. Save a DXF for AutoCAD, a PDF to print and a KML
            for Google Earth.
          </p>
          <ul className="mt-6 space-y-3">
            {AUTO_DRAFT_HIGHLIGHTS.map((h, i) => {
              const Icon = ICONS[i];
              return (
                <li key={h} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#ffd21f]/90 bg-[#0b2459] text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-[16px] sm:text-[17px] font-medium">{h}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <AutoDraftDownload className="group inline-flex items-center gap-3 rounded-full bg-[#ffd21f] px-5 sm:px-7 py-3.5 text-[15px] sm:text-[19px] font-extrabold text-[#071a44] shadow-[0_10px_30px_rgba(255,210,31,0.35)] hover:bg-[#ffdc4d] cursor-pointer" />
            <Link
              href={AUTO_DRAFT_CODES_PAGE}
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-5 py-3 text-[15px] font-bold text-white hover:bg-white/10"
            >
              Code guide <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <AutoDraftReleaseInfo className="mt-3 text-blue-100/70" />
          <p className="mt-3 text-[12.5px] text-blue-100/70">Sign in with a free exceltokml.com account. Your surveys stay on your PC.</p>
        </div>

        <div className="self-center">
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] gap-3 items-center">
            <div className="rounded-2xl border border-white/15 bg-[#0a2257]/85 p-3">
              <p className="text-[10.5px] font-extrabold uppercase tracking-wide text-blue-200">In the field</p>
              <ul className="mt-2 grid grid-cols-2 sm:grid-cols-1 gap-x-3 gap-y-1 font-mono text-[12px] sm:text-[13px]">
                {FIELD.map((f) => (
                  <li key={f.p} className="flex gap-2 whitespace-nowrap">
                    <span className="w-6 text-right text-blue-200/70">{f.p}</span>
                    <span className="font-bold text-[#ffd21f]">{f.code}</span>
                  </li>
                ))}
              </ul>
            </div>
            <figure className="relative rounded-2xl border-2 border-[#2c5bd8]/70 bg-[#071a44] p-1.5 shadow-[0_0_40px_rgba(44,91,216,0.35)]">
              <span aria-hidden className="absolute -left-5 top-1/2 -translate-y-1/2 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd21f] text-[#071a44]">
                <ArrowRight className="h-4 w-4" />
              </span>
              <Image
                src={AUTO_DRAFT_FILES.shots.contours.src}
                width={AUTO_DRAFT_FILES.shots.contours.width}
                height={AUTO_DRAFT_FILES.shots.contours.height}
                alt="Auto Draft: a surveyed plot drawn from its codes, with road edges, buildings, trees, poles, contours, the legend and the title block on an A3 sheet"
                sizes="(min-width: 1024px) 600px, 100vw"
                className="w-full h-auto rounded-xl"
                priority
              />
            </figure>
          </div>
          <p className="mt-3 text-center text-[12.5px] text-blue-100/75">67 coded points → an A3 drawing at 1:500, with nothing drawn by hand</p>
        </div>
      </div>
    </section>
  );
}
