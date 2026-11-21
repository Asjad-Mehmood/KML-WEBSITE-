"use client";

// The home page of the website: what Excel to KML (the company) makes, for whom, and where to go
// next. Each program has its own page (lib/products.ts, components/SuiteIcon.tsx); this page
// introduces the suite: the hero, every product, the Survey Toolkit, why people use it and the
// counts. HomeClient adds how the programs follow one job, reviews, guides and questions after it.
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Earth,
  Gift,
  Layers,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { SUITE, SuiteIcon } from "../SuiteIcon";
import { badgeLabel, PRODUCTS } from "@/lib/products";
import { roundedCount, type PublicStats } from "@/lib/publicCounts";

const TOOLKIT = PRODUCTS.find((p) => p.id === "toolkit");
const CARDS = SUITE.filter((p) => p.id !== "toolkit");

const container = "max-w-7xl mx-auto px-5 sm:px-8";

export function CompanyHero({ stats }: { stats: PublicStats | null }) {
  const figures = [
    stats && stats.accounts >= 50 ? { value: roundedCount(stats.accounts), label: "engineers signed up" } : null,
    stats && stats.downloads >= 50 ? { value: roundedCount(stats.downloads), label: "downloads" } : null,
    stats && stats.countries >= 5 ? { value: String(stats.countries), label: "countries" } : null,
    { value: String(CARDS.length), label: "free programs" },
  ].filter((f): f is { value: string; label: string } => f !== null);

  return (
    <section className="relative overflow-hidden pt-32 sm:pt-40 pb-16 sm:pb-24 bg-[#f5f7fc]">
      {/* soft colour and a survey grid behind */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-32 w-[42rem] h-[42rem] rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute top-20 -right-40 w-[38rem] h-[38rem] rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />
      </div>

      <div className={`${container} relative grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-14 lg:gap-10 items-center`}>
        <div>
          {TOOLKIT && (
            <Link
              href={TOOLKIT.href}
              className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-slate-200 pl-1.5 pr-3.5 py-1.5 text-[13px] text-slate-600 shadow-sm hover:border-blue-300 transition-colors"
            >
              <span className="rounded-full bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5">New</span>
              <span>
                <b className="text-slate-900 font-semibold">Survey Toolkit {TOOLKIT.version}</b> · every program in one download
              </span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </Link>
          )}
          <h1 className="mt-6 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.1rem] font-extrabold tracking-[-0.035em] text-slate-950">
            Survey software,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              from site to sign&#8209;off
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl">
            A suite of free programs for surveyors and site engineers: coordinates into Google Earth, roads drawn in
            AutoCAD, traverses adjusted and reported, drawings made from the field codes, and every project folder in
            its place.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <a
              href="#products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 text-white px-7 py-3.5 text-[15px] font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
            >
              Explore the products <ArrowRight className="w-4 h-4" aria-hidden />
            </a>
            <Link
              href="/toolkit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 border border-slate-200 px-7 py-3.5 text-[15px] font-semibold shadow-sm hover:border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden /> Get the Survey Toolkit
            </Link>
          </div>
          <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 max-w-xl">
            {figures.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">{f.value}</dd>
                <dd className="text-[13px] text-slate-500 mt-0.5">{f.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* the suite, like an app launcher */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-violet-500/10 blur-2xl" aria-hidden />
          <div className="relative rounded-[1.75rem] bg-white/80 backdrop-blur-xl border border-white shadow-[0_30px_80px_-20px_rgba(30,58,138,0.25)] p-3 sm:p-4">
            <div className="flex items-center gap-2 px-2 pb-3 pt-1">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-[13px] font-semibold text-slate-500">Excel to KML suite</span>
            </div>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
              {CARDS.map((p) => (
                <li key={p.id} className="min-w-0">
                  <Link
                    href={p.href}
                    className="group flex min-w-0 items-center gap-3.5 rounded-2xl bg-white border border-slate-100 px-3.5 py-3 hover:border-blue-200 hover:shadow-md transition-all"
                  >
                    <SuiteIcon id={p.id} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-[15px] truncate">{p.name}</span>
                        {badgeLabel(p) && (
                          <span className="shrink-0 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-bold px-2 py-0.5">
                            {badgeLabel(p)}
                          </span>
                        )}
                      </span>
                      <span className="block text-[13px] text-slate-500 truncate">{p.tagline}</span>
                    </span>
                    <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 text-[12.5px] font-semibold px-3 py-1.5 transition-colors">
                      Open <ArrowRight className="w-3 h-3" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Every program, with its picture, what it does, where it runs and its page */
export function ProductGrid({ excelVersion }: { excelVersion?: string }) {
  return (
    <section id="products" className="py-20 sm:py-28 bg-white scroll-mt-24">
      <div className={container}>
        <div className="max-w-2xl">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-blue-600">Products</p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-slate-950">
            One suite for every step of the survey
          </h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            Each program does one part of the job well, and they share the same files and the same free account.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {CARDS.map((p) => {
            const version = p.id === "excel-to-kml" ? (excelVersion ?? "").replace(/^v/, "") : p.version;
            // the program's own screen where there is one (a poster or banner otherwise)
            const pic = p.shot ?? p.image;
            return (
              <Link
                key={p.id}
                href={p.href}
                className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_24px_60px_-24px_rgba(30,58,138,0.35)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100">
                  <Image
                    src={pic.src}
                    alt={pic.alt}
                    width={pic.width}
                    height={pic.height}
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                    className="w-full h-full object-cover object-left-top group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  {badgeLabel(p) && (
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur text-amber-700 text-[11px] font-bold px-2.5 py-1 shadow-sm">
                      {badgeLabel(p)}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3">
                    <SuiteIcon id={p.id} size={42} />
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-950 truncate">{p.name}</h3>
                      <p className="text-[13px] text-slate-500">
                        {p.platform}
                        {version ? ` · ${version}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-[15px] text-slate-700 leading-relaxed">{p.tagline}.</p>
                  <ul className="mt-4 grid gap-1.5">
                    {p.highlights.slice(0, 3).map((h) => (
                      <li key={h} className="flex items-center gap-2 text-[13.5px] text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden /> {h}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue-600">
                    Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** The Survey Toolkit: one download that installs and updates every program */
export function ToolkitBand() {
  if (!TOOLKIT) return null;
  return (
    <section className="py-6 sm:py-10 bg-white">
      <div className={container}>
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0b1530] text-white">
          <div aria-hidden className="absolute -top-32 -right-24 w-[34rem] h-[34rem] rounded-full bg-blue-600/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-40 left-10 w-[28rem] h-[28rem] rounded-full bg-violet-600/20 blur-3xl" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center p-8 sm:p-12 lg:p-16">
            <div>
              <div className="flex items-center gap-3">
                <SuiteIcon id="toolkit" size={44} />
                <span className="text-[13px] font-bold tracking-[0.14em] uppercase text-blue-300">Survey Toolkit</span>
              </div>
              <h2 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-tight">
                Every program. One download. Always up to date.
              </h2>
              <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-lg">{TOOLKIT.description}</p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-2.5">
                {TOOLKIT.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-[14.5px] text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden /> {h}
                  </li>
                ))}
              </ul>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/toolkit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-950 px-7 py-3.5 text-[15px] font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-4 h-4" aria-hidden /> Get the Survey Toolkit
                </Link>
                <Link
                  href="/download"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 text-white px-7 py-3.5 text-[15px] font-semibold hover:bg-white/10 transition-colors"
                >
                  All downloads <ArrowRight className="w-4 h-4" aria-hidden />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 bg-white">
                <Image
                  src={TOOLKIT.image.src}
                  alt={TOOLKIT.image.alt}
                  width={TOOLKIT.image.width}
                  height={TOOLKIT.image.height}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const REASONS = [
  { icon: Gift, title: "Free, every one of them", text: "Every program is free with one account: no trial, no seat licence, no watermark." },
  { icon: Earth, title: "Your grid, wherever you work", text: "5,800+ EPSG systems, national grids and site calibration, proved on a known mark." },
  { icon: MonitorSmartphone, title: "Windows, AutoCAD and the web", text: "Desktop programs that work offline, an AutoCAD plugin, and web apps on any computer or phone." },
  { icon: RefreshCw, title: "Always up to date", text: "The Survey Toolkit installs each program and keeps it current, checked against its SHA-256." },
  { icon: ShieldCheck, title: "Your files stay yours", text: "Work stays on your computer; signed in, your jobs and files are kept in your own account." },
  { icon: Users, title: "Made with engineers on site", text: "Built from real site work, and changed by what the people using it ask for." },
];

/** Why people use the suite */
export function WhyUs() {
  return (
    <section className="py-20 sm:py-28 bg-[#f5f7fc]">
      <div className={container}>
        <div className="max-w-2xl">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-blue-600">Why Excel to KML</p>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-slate-950">
            Made for the way site work really happens
          </h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REASONS.map((r) => (
            <div key={r.title} className="rounded-3xl bg-white border border-slate-200/70 p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <span className="inline-flex w-11 h-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <r.icon className="w-5 h-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-950">{r.title}</h3>
              <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The last word: an account, the products and the downloads */
export function CompanyCta() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className={container}>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-8 py-14 sm:px-14 sm:py-16 text-white text-center">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
          <div className="relative">
            <Sparkles className="w-8 h-8 mx-auto text-white/80" aria-hidden />
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-[-0.03em]">Start with one program. Keep them all.</h2>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              One free account opens every program, keeps your files and tells you when there is something new.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-950 px-7 py-3.5 text-[15px] font-semibold hover:bg-blue-50 transition-colors"
              >
                Create a free account
              </Link>
              <Link
                href="/download"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 text-white px-7 py-3.5 text-[15px] font-semibold hover:bg-white/10 transition-colors"
              >
                <Layers className="w-4 h-4" aria-hidden /> See every download
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
