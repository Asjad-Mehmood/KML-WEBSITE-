// Survey Toolkit: the front page, in the style the owner chose (option C, the hub). The public page
// /toolkit, and the home page when Admin → Settings → Home page is "Survey Toolkit"; also the
// admins' draft at /toolkit-beta/home while the Toolkit is closed. Same motion rules as the options (home-options.css): CSS only, still for reduced motion,
// paused while the tab is hidden; the graphics are decorative.
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  AppWindow,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Compass,
  Download,
  FolderTree,
  Globe,
  HardDrive,
  Keyboard,
  Layers,
  ListChecks,
  PlayCircle,
  Lock,
  MousePointerClick,
  Package,
  RefreshCw,
  Route,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import MotionRoot from "@/components/toolkit/home-options/MotionRoot";
import { HubGraphic, type OptionTool } from "@/components/toolkit/home-options/options";
import StartDownload from "@/components/toolkit/home/StartDownload";
import { TOOLKIT_FAQS } from "@/lib/toolkit/homeFaq";
import gridPng from "@/components/toolkit/images/9-app-grid.png";
import updatesPng from "@/components/toolkit/images/10-updates.png";
import UpdateTour from "@/components/toolkit/home/UpdateTour";
import { Reviews, WhatsNew } from "@/components/toolkit/home/HomeSections";
import type { HomeReviewsData, NewsItem } from "@/lib/toolkit/homeNews";

/** Download: the newest installer for anyone who may have it (app/api/toolkit/download) */
const DOWNLOAD = "/api/toolkit/download";

/** Why a download didn't start, from /api/toolkit/download */
const PROBLEMS: Record<string, string> = {
  none: "The Toolkit's installer isn't available just now. Please try again in a few minutes.",
  error: "The download couldn't start. Please try again in a moment.",
  closed: "The Survey Toolkit isn't open to your account just now.",
};

const ICONS: Record<string, LucideIcon> = {
  "excel-to-kml": Globe,
  roadpro: Route,
  traverse: Compass,
  "folder-manager": FolderTree,
  slope: TrendingUp,
};

/** Each tool, as its own product page describes it */
const ABOUT: Record<string, { text: string; points: string[]; page: string; webApp?: string }> = {
  "excel-to-kml": {
    text: "Survey coordinates from Excel or CSV, on 5,800+ EPSG grids, into Google Earth KML, KMZ and DXF.",
    points: ["Site photos and PDF reports", "Quality checks on every point", "On Windows and in the browser"],
    page: "/download",
    webApp: "/app",
  },
  roadpro: {
    text: "A complete road in AutoCAD from one centre line.",
    points: ["Edges, turning radius, barricades and signs", "Chainage, cross sections and widening", "An Excel report of the road"],
    page: "/roadpro",
  },
  traverse: {
    text: "Traverse and levelling, in the browser or on Windows.",
    points: ["Bowditch, Transit, Equal or least squares", "Rise & Fall or HI level books", "PDF reports and Google Earth export"],
    page: "/traverse",
    webApp: "/traverse/app",
  },
  "folder-manager": {
    text: "One screen for your project's master folder.",
    points: ["Every module from Admin to Archive", "Instant search, copy, move and bulk rename", "Drive space at a glance"],
    page: "/project-folder-manager",
  },
  slope: {
    text: "Slope, gradient and the level at every chainage, from two levels and chainages.",
    points: ["A live profile and crossfall", "A level book with checks", "Excel, PDF and CSV reports"],
    page: "/slope-calculation",
    webApp: "/slope-calculation/app",
  },
};

const ver = (t: OptionTool) => (t.version ? `v${t.version}` : "Latest");

function Eyebrow({ Icon, children, light = false }: { Icon: LucideIcon; children: ReactNode; light?: boolean }) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em] ${light ? "text-[#ffd21f]" : "text-[#1e4fd8]"}`}>
      <Icon className="w-4 h-4" aria-hidden /> {children}
    </p>
  );
}

function H2({ id, children, light = false }: { id: string; children: ReactNode; light?: boolean }) {
  return (
    <h2 id={id} className={`mt-2 text-[28px] sm:text-[36px] font-extrabold tracking-tight leading-[1.1] ${light ? "text-white" : "text-[#071a44]"}`}>
      {children}
    </h2>
  );
}

function Point({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <li className="flex gap-3">
      <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 ${light ? "text-[#ffd21f]" : "text-[#1e4fd8]"}`} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function DownloadButton({ dark = false, pulse = false }: { dark?: boolean; pulse?: boolean }) {
  return (
    <a
      href={DOWNLOAD}
      className={`ho-btn ${pulse ? "ho-pulse" : ""} ${dark ? "bg-[#ffd21f] text-[#071a44] hover:bg-[#ffdc4d]" : "bg-[#071a44] text-white hover:bg-[#0b2560]"}`}
    >
      <Download className="w-5 h-5" aria-hidden /> Download for Windows
    </a>
  );
}

// A screen of the Toolkit; a whole window drawn at half the page is small, so a click opens it full size
function Shot({ src, alt }: { src: typeof gridPng; alt: string }) {
  return (
    <figure className="ho-reveal group relative rounded-2xl border border-slate-200 bg-[#071a44] p-1.5 shadow-[0_24px_60px_rgba(7,26,68,0.18)]">
      <a href={src.src} target="_blank" rel="noopener" aria-label={`${alt} (opens full size)`} className="block cursor-zoom-in">
        <Image src={src} alt={alt} sizes="(min-width: 1024px) 600px, 100vw" className="w-full h-auto rounded-xl" />
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-[#071a44]/85 px-2.5 py-1 text-[11.5px] font-semibold text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          Full size
        </span>
      </a>
    </figure>
  );
}

export default function ToolkitHome({
  tools,
  toolkitVersion,
  draft = false,
  download = null,
  news = [],
  reviews = null,
}: {
  tools: OptionTool[];
  toolkitVersion: string | null;
  /** Each tool's newest version, for What's new (lib/toolkit/homeNews.ts) */
  news?: NewsItem[];
  /** Published reviews; the section is left out when there are none */
  reviews?: HomeReviewsData | null;
  /** The admins' preview while the Toolkit is closed to the public */
  draft?: boolean;
  /** ?download= on the page: "start" after signing in to download, or why a download didn't start */
  download?: string | null;
}) {
  const meta = `Free · Windows 10 and 11${toolkitVersion ? ` · Version ${toolkitVersion}` : ""}`;
  const problem = download ? PROBLEMS[download] : undefined;
  return (
    <PageShell>
      <MotionRoot>
        {download === "start" && <StartDownload href={DOWNLOAD} />}
        {draft && (
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
              <span>
                <strong>Preview of the Survey Toolkit&apos;s page.</strong> The Toolkit is closed to the public (Admin → Settings → Survey Toolkit), so only
                admins see this page and Download works for admins and testers.
              </span>
              <Link href="/toolkit-beta/home-options" className="font-bold underline underline-offset-2">
                All five options
              </Link>
            </p>
          </div>
        )}
        {problem && (
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8 mt-4">
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[14px] text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
              {problem}
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------- hero */}
        <section aria-labelledby="hero-h" className="relative isolate overflow-hidden bg-[radial-gradient(70%_80%_at_80%_40%,#e9f0ff,#ffffff_70%)]">
          {/* two soft lights drifting behind the hero */}
          <span aria-hidden className="ho-h-blob ho-h-blob-1 -z-10 right-[8%] top-[10%] h-[340px] w-[340px] bg-[#c9d8ff]/70" />
          <span aria-hidden className="ho-h-blob ho-h-blob-2 -z-10 right-[30%] bottom-[-60px] h-[260px] w-[260px] bg-[#fff1b8]/70" />
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-10 items-center">
            <div>
              <p className="ho-enter ho-enter-0 text-[12px] font-bold uppercase tracking-[0.16em] text-[#1e4fd8]">Survey Toolkit</p>
              <h1 id="hero-h" className="ho-enter ho-enter-1 mt-4 text-[38px] sm:text-[54px] font-extrabold leading-[1.04] tracking-tight text-[#071a44]">
                Every survey tool.
                <br />
                One download. <span className="ho-h-mark relative z-0 text-[#1e4fd8]">Always up to date.</span>
              </h1>
              <p className="ho-enter ho-enter-2 mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">
                One download installs Excel to KML, RoadPro, Traverse &amp; Level, Project Folder Manager and Slope Calculator, and keeps every one of them up to
                date by itself.
              </p>
              <div className="ho-enter ho-enter-3 mt-7 flex flex-wrap items-center gap-3">
                <DownloadButton pulse />
                <a href="#tools" className="ho-btn border border-slate-300 text-slate-800 hover:bg-white">
                  See the tools <ArrowRight className="ho-arrow w-4 h-4" aria-hidden />
                </a>
              </div>
              <p className="ho-enter ho-enter-3 mt-4 text-[13px] text-slate-500">{meta}</p>
            </div>
            <HubGraphic tools={tools} className="ho-enter ho-enter-graphic mx-auto w-full max-w-[540px]" />
          </div>
        </section>

        {/* ---------------------------------------------------------- four facts */}
        <section aria-label="In short" className="border-y border-slate-200 bg-white">
          <ul className="max-w-[1180px] mx-auto px-5 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { Icon: Package, title: "Five tools, one download", text: "Install only the ones you need." },
              { Icon: ShieldCheck, title: "Official installers only", text: "Each checked by its SHA-256 first." },
              { Icon: UserCheck, title: "No administrator rights", text: "Installs for you alone, like an app." },
              { Icon: RefreshCw, title: "Updates by themselves", text: "Checked when it opens and every 4 hours." },
            ].map((f, i) => (
              <li key={f.title} className="ho-reveal flex items-start gap-3" style={{ "--i": i } as CSSProperties}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#1e4fd8]">
                  <f.Icon className="w-5 h-5" aria-hidden />
                </span>
                <div>
                  <p className="font-bold text-[#071a44]">{f.title}</p>
                  <p className="text-[13.5px] text-slate-600">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------- the tools */}
        <section id="tools" aria-labelledby="tools-h" className="relative scroll-mt-28 bg-[#f6f8fc]">
          {/* "/#download" (the footer's "Every download in one place") lands here: every program, with its download */}
          <span id="download" aria-hidden className="absolute -top-28" />
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20">
            <div className="ho-reveal max-w-3xl">
              <Eyebrow Icon={Layers}>The tools</Eyebrow>
              <H2 id="tools-h">Everything you use on site and in the office, in one place</H2>
              <p className="mt-3 text-[16px] text-slate-600">
                The Toolkit installs each one with its own official installer and keeps it current. Already have some of them? It finds them.
              </p>
            </div>
            <ul className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tools.map((t, i) => {
                const Icon = ICONS[t.id] ?? Globe;
                const about = ABOUT[t.id];
                return (
                  <li
                    key={t.id}
                    className="ho-reveal ho-card flex flex-col rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#1e4fd8]/40 hover:shadow-[0_18px_40px_rgba(7,26,68,0.12)]"
                    style={{ "--i": i } as CSSProperties}
                  >
                    <div className="flex items-start gap-3">
                      <span className="ho-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#071a44] text-[#ffd21f]">
                        <Icon className="w-6 h-6" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[18px] font-bold text-[#071a44]">{t.name}</h3>
                        <p className="text-[13px] text-slate-500">{t.platform}</p>
                      </div>
                      <span className="rounded-full bg-[#eef3ff] px-2.5 py-0.5 text-[12px] font-bold tabular-nums text-[#1e4fd8]">{ver(t)}</span>
                    </div>
                    {about && (
                      <>
                        <p className="mt-4 text-[14.5px] text-slate-700">{about.text}</p>
                        <ul className="mt-3 space-y-1.5 text-[14px] text-slate-600 flex-1">
                          {about.points.map((p) => (
                            <li key={p} className="flex gap-2">
                              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden /> {p}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold">
                          <Link href={about.page} className="inline-flex items-center gap-1 py-1 text-[#1e4fd8] hover:underline">
                            About {t.name} <ArrowRight className="w-4 h-4" aria-hidden />
                          </Link>
                          {about.webApp && (
                            // the web apps are pages of their own (the Traverse & Level app is a static app): a plain link
                            <a href={about.webApp} className="inline-flex items-center gap-1 py-1 text-slate-700 hover:text-[#1e4fd8]">
                              Open the web app
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
              {/* the sixth place: what the Toolkit itself is */}
              <li className="ho-reveal flex flex-col justify-center rounded-2xl bg-[#071a44] p-6 text-white" style={{ "--i": 5 } as CSSProperties}>
                <p className="text-[18px] font-bold">All five, kept up to date</p>
                <p className="mt-2 text-[14.5px] text-blue-100/80">
                  One program looks after them: what is installed, what is new, and the update, with nobody pressing anything.
                </p>
                <div className="mt-5">
                  <DownloadButton dark />
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ---------------------------------------------------------- what's new */}
        <WhatsNew news={news} />

        {/* ---------------------------------------------------------- how it works */}
        <section aria-labelledby="how-h" className="bg-white">
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20">
            <div className="ho-reveal max-w-3xl">
              <Eyebrow Icon={ListChecks}>How it works</Eyebrow>
              <H2 id="how-h">Three steps, then you can forget about updates</H2>
            </div>
            <ol className="relative mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
              <span aria-hidden className="ho-reveal ho-line absolute left-[16%] right-[16%] top-7 hidden md:block border-t-2 border-dashed border-[#1e4fd8]/25" />
              {[
                { Icon: Download, title: "Download the Toolkit", text: "One installer for Windows 10 and 11. No administrator rights needed." },
                { Icon: MousePointerClick, title: "Pick your tools", text: "Home shows what is already on your PC and what is new. Install the rest with one click." },
                { Icon: BellRing, title: "Updates arrive", text: "New versions install by themselves, never while a tool is open, and a notification says so." },
              ].map((s, i) => (
                <li key={s.title} className="ho-reveal relative text-center" style={{ "--i": i } as CSSProperties}>
                  <span className="ho-step-icon relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#ffd21f] bg-[#071a44] text-[#ffd21f]">
                    <s.Icon className="w-6 h-6" aria-hidden />
                  </span>
                  <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-slate-400">Step {i + 1}</p>
                  <p className="mt-1 text-[18px] font-bold text-[#071a44]">{s.title}</p>
                  <p className="mx-auto mt-2 max-w-xs text-[14.5px] text-slate-600">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------- the workspace */}
        <section aria-labelledby="work-h" className="bg-[#f6f8fc]">
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Shot src={gridPng} alt="The Survey Toolkit with its app grid open: Home, Excel to KML, Traverse and Slope" />
            <div className="ho-reveal">
              <Eyebrow Icon={AppWindow}>One window</Eyebrow>
              <H2 id="work-h">Your web apps, side by side, already signed in</H2>
              <ul className="mt-6 space-y-3 text-[15.5px] text-slate-700">
                <Point>Excel to KML, Traverse &amp; Level and Slope Calculator open inside the Toolkit, like the apps in Microsoft 365.</Point>
                <Point>Signed in once with your Excel to KML account: every app is ready, with your saved files.</Point>
                <Point>
                  Switch with the sidebar, the app grid or <Keyboard className="inline w-4 h-4 -mt-0.5" aria-hidden /> Ctrl+1 to Ctrl+4. Each app stays where you left
                  it.
                </Point>
                <Point>The Windows program of a tool is one click away, when you have it installed.</Point>
              </ul>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- updates */}
        <section aria-labelledby="upd-h" className="bg-white">
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="ho-reveal lg:order-1">
              <Eyebrow Icon={RefreshCw}>Updates</Eyebrow>
              <H2 id="upd-h">Updates that look after themselves</H2>
              <ul className="mt-6 space-y-3 text-[15.5px] text-slate-700">
                <Point>The Toolkit checks when it opens and every 4 hours, and installs what is new.</Point>
                <Point>
                  <strong>Automatic</strong> or <strong>Ask me</strong>, for each tool. Nothing you haven&apos;t installed is ever installed by itself.
                </Point>
                <Point>Never while you work: a tool that is open is updated once you close it.</Point>
                <Point>Start with Windows and keep running quietly in the tray, if you like. A notification says what was updated.</Point>
                <Point>The Toolkit updates itself the same way.</Point>
              </ul>
            </div>
            <div className="lg:order-2">
              <Shot src={updatesPng} alt="The Updates section: start with Windows and keep running in the tray, and Automatic or Ask me for each installed tool" />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- an update, step by step */}
        <section aria-labelledby="tour-h" className="bg-[#f6f8fc]">
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20">
            <div className="ho-reveal max-w-3xl">
              <Eyebrow Icon={PlayCircle}>See it work</Eyebrow>
              <H2 id="tour-h">An update, from start to finish</H2>
              <p className="mt-3 text-[16px] text-slate-600">Three real screens of the Toolkit while it updates Excel to KML. Pick a step, or let it play.</p>
            </div>
            <div className="ho-reveal mt-10">
              <UpdateTour />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- safe by design */}
        <section aria-labelledby="safe-h" className="relative overflow-hidden bg-[#071a44] text-white">
          <div aria-hidden className="ho-grid-drift absolute -inset-12 opacity-[0.07] bg-[linear-gradient(#9cb8ff_1px,transparent_1px),linear-gradient(90deg,#9cb8ff_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative max-w-[1180px] mx-auto px-5 sm:px-8 py-20">
            <div className="ho-reveal max-w-3xl">
              <Eyebrow Icon={ShieldCheck} light>
                Safe by design
              </Eyebrow>
              <H2 id="safe-h" light>
                It installs only what it should, and tells you what it does
              </H2>
            </div>
            <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { Icon: Package, title: "Official installers", text: "Every download comes from exceltokml.com or our own GitHub releases, over HTTPS." },
                { Icon: ShieldCheck, title: "Checked before it runs", text: "Its SHA-256 must match the published one. If it doesn't, nothing is installed." },
                { Icon: HardDrive, title: "Your PC, your choice", text: "Installed for you alone, no administrator rights. Removing the Toolkit keeps your tools." },
                { Icon: Lock, title: "Nothing of your files", text: "It tells us only this PC's name, Windows version and tool versions, so we can see updates arrive." },
              ].map((c, i) => (
                <li key={c.title} className="ho-reveal ho-card rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#ffd21f]/50" style={{ "--i": i } as CSSProperties}>
                  <c.Icon className="w-7 h-7 text-[#ffd21f]" aria-hidden />
                  <p className="mt-3 font-bold">{c.title}</p>
                  <p className="mt-1 text-[14px] text-blue-100/75">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------------------------------------------------- what people say */}
        <Reviews data={reviews} />

        {/* ---------------------------------------------------------- requirements and questions */}
        <section aria-labelledby="faq-h" className="bg-white">
          <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20 grid grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10">
            <div className="ho-reveal">
              <Eyebrow Icon={HardDrive}>What you need</Eyebrow>
              <h2 className="mt-2 text-[24px] font-extrabold tracking-tight text-[#071a44]">Requirements</h2>
              <ul className="mt-5 space-y-3 text-[15px] text-slate-700">
                <Point>Windows 10 or 11, 64-bit</Point>
                <Point>Microsoft Edge WebView2, built into Windows 11 and an up-to-date Windows 10</Point>
                <Point>An internet connection to install and update (the tools work offline as usual)</Point>
                <Point>Your free Excel to KML account</Point>
                <Point>For RoadPro: full AutoCAD, Civil 3D or Map 3D 2013 or newer (not AutoCAD LT)</Point>
              </ul>
            </div>
            <div className="ho-reveal">
              <Eyebrow Icon={ListChecks}>Questions</Eyebrow>
              <h2 id="faq-h" className="mt-2 text-[24px] font-extrabold tracking-tight text-[#071a44]">
                Good to know
              </h2>
              <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {TOOLKIT_FAQS.map((f) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-slate-900">
                      {f.q}
                      <ArrowRight className="w-4 h-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" aria-hidden />
                    </summary>
                    <p className="mt-2 text-[14.5px] text-slate-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- the last word */}
        <section aria-label="Download" className="bg-white pb-20">
          <div className="ho-reveal max-w-[1180px] mx-auto px-5 sm:px-8">
            <div className="relative isolate overflow-hidden rounded-3xl bg-[radial-gradient(60%_90%_at_85%_50%,#1e4fd8,#071a44_70%)] p-8 sm:p-12 text-white grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-8 items-center">
              <span aria-hidden className="ho-cta-glow absolute -z-10 right-[-80px] top-[-80px] h-[300px] w-[300px] rounded-full bg-[#ffd21f]/15 blur-[70px]" />
              <div>
                <p className="text-[28px] sm:text-[36px] font-extrabold tracking-tight leading-tight">
                  Every survey tool. One download.
                  <br />
                  <span className="text-[#ffd21f]">Always up to date.</span>
                </p>
                <p className="mt-3 text-[15px] text-blue-100/85">{meta}</p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-3">
                <DownloadButton dark />
                <Link href="/contact?topic=question" className="py-1 text-[14px] font-semibold text-blue-100/85 hover:text-white">
                  Questions? Write to us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </MotionRoot>
    </PageShell>
  );
}
