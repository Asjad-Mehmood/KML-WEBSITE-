// Survey Toolkit (beta test): the page testers download it from (/toolkit-beta), in the site's
// product page style. Only reached by testers and admins (app/toolkit-beta/page.tsx); everyone else
// signed in sees ToolkitBetaClosed.
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  AppWindow,
  ArrowRight,
  BellRing,
  BookOpen,
  CheckCircle2,
  Download,
  LayoutGrid,
  ListChecks,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import iconPng from "./images/toolkit-icon.png";
import toolsPng from "./images/3-tools.png";
import gridPng from "./images/9-app-grid.png";
import updatesPng from "./images/10-updates.png";
import updatingPng from "./images/6-updating.png";

export interface ToolkitRelease {
  version: string;
  url: string;
  size: number;
  published: string | null;
}

const TOOLS = ["Excel to KML", "RoadPro", "Traverse & Level", "Project Folder Manager", "Slope Calculator"];

const FEATURES = [
  {
    Icon: ShieldCheck,
    title: "Every tool, installed for you",
    text: "Install, update or remove any of the five tools with one button. Each comes from its official installer, checked by its SHA-256 before it runs.",
  },
  {
    Icon: LayoutGrid,
    title: "The web apps inside",
    text: "Excel to KML, Traverse & Level and Slope Calculator open inside the Toolkit, already signed in. Switch between them like the Microsoft 365 app, or with Ctrl+1 to Ctrl+4.",
  },
  {
    Icon: RefreshCw,
    title: "Updates by themselves",
    text: "When it opens and every 4 hours, new versions are installed for you, never while a tool is open. Choose Automatic or Ask me for each tool.",
  },
  {
    Icon: BellRing,
    title: "Quietly in the tray",
    text: "Turn on Start with Windows and the Toolkit keeps working in the tray. A Windows notification says what was updated.",
  },
];

const STEPS = [
  { title: "Download", text: "The installer below, for Windows 10 and 11. No administrator rights needed." },
  { title: "Run it", text: "Windows may warn that it doesn't know the program: choose More info, then Run anyway." },
  { title: "Sign in", text: "With your Excel to KML account, the one you use on this website." },
  { title: "Pick your tools", text: "Home shows what is on your PC. Install what you need; the rest is optional." },
];

const SENT = [
  "This PC's name and Windows version",
  "The Toolkit's version and the versions of the five tools on it",
  "Each install, update or uninstall, and why one failed",
];

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null);

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

function BetaTag({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${
        light ? "bg-[#ffd21f] text-[#071a44]" : "bg-[#071a44] text-[#ffd21f]"
      }`}
    >
      Private beta
    </span>
  );
}

function DownloadButton({ latest, big = false }: { latest: ToolkitRelease | null; big?: boolean }) {
  if (!latest) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-6 py-3 text-[15px] font-bold text-white/90">
        The first beta isn&apos;t out yet. We&apos;ll email you when it is.
      </p>
    );
  }
  return (
    <div>
      <a
        href="/api/toolkit/download"
        className={`inline-flex items-center gap-2 rounded-full bg-[#ffd21f] font-extrabold text-[#071a44] hover:bg-[#ffdc4d] ${
          big ? "px-7 py-3.5 text-[17px]" : "px-6 py-3 text-[16px]"
        }`}
      >
        <Download className="w-5 h-5" aria-hidden /> Download for Windows
      </a>
      <p className="mt-2 text-[13px] text-blue-100/75">
        Version {latest.version}
        {latest.size > 0 && ` · ${mb(latest.size)}`}
        {day(latest.published) && ` · ${day(latest.published)}`} · Windows 10 and 11
      </p>
    </div>
  );
}

export default function ToolkitBeta({ latest, name, problem }: { latest: ToolkitRelease | null; name: string; problem: "none" | "error" | null }) {
  const first = name.trim().split(/\s+/)[0];
  return (
    <PageShell>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        {/* Hero */}
        <section aria-labelledby="hero-h" className="rounded-3xl bg-[#071a44] text-white p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(#9cb8ff_1px,transparent_1px),linear-gradient(90deg,#9cb8ff_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 items-center">
            <div>
              <div className="flex items-center gap-3">
                <Image src={iconPng} alt="" width={52} height={52} className="rounded-xl" priority />
                <BetaTag light />
              </div>
              <h1 id="hero-h" className="mt-5 text-3xl sm:text-[44px] font-extrabold tracking-tight leading-[1.08]">
                All your survey tools.
                <br />
                <span className="text-[#ffd21f]">One program.</span> Always up to date.
              </h1>
              <p className="mt-4 text-[16px] text-blue-50/90 leading-relaxed max-w-xl">
                {first ? `Thanks for testing, ${first}. ` : "Thanks for testing. "}
                The Survey Toolkit installs and updates {TOOLS.slice(0, -1).join(", ")} and {TOOLS[TOOLS.length - 1]} for you, and opens the web apps
                in one window.
              </p>
              <div className="mt-7">
                <DownloadButton latest={latest} big />
              </div>
              {problem && (
                <p role="alert" className="mt-4 flex gap-2 text-[13.5px] text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  {problem === "none" ? "There is no download yet." : "The download couldn't be started just now. Please try again in a minute."}
                </p>
              )}
            </div>
            <figure className="rounded-2xl border border-white/15 bg-white/5 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <Image
                src={toolsPng}
                alt="The Survey Toolkit's Home: each tool with what is installed, the latest version and Update, Open and Install buttons"
                sizes="(min-width: 1024px) 640px, 100vw"
                className="w-full h-auto rounded-xl"
                priority
              />
            </figure>
          </div>
        </section>
      </div>

      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* Features */}
        <section aria-labelledby="features-h" className="mt-20">
          <SectionHead id="features-h" eyebrow="What it does" title="Less time on installers, more on site" Icon={ListChecks} />
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl border border-slate-200 bg-[#fafbfc] p-5">
                <div className="w-11 h-11 rounded-full border-2 border-[#ffd21f] bg-[#071a44] text-white flex items-center justify-center">
                  <f.Icon className="w-5 h-5" aria-hidden />
                </div>
                <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Screens */}
        <section aria-labelledby="screens-h" className="mt-20">
          <SectionHead
            id="screens-h"
            eyebrow="A look inside"
            title="Switch apps, watch updates, choose how"
            text="The app grid jumps to any tool; an update shows its progress on the tool's card; the Updates section sets each tool to Automatic or Ask me."
            Icon={AppWindow}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { img: gridPng, title: "The app grid", alt: "The Survey Toolkit's app grid, like Google's, with Home, Excel to KML, Traverse and Slope" },
              { img: updatingPng, title: "An update in progress", alt: "Excel to KML updating: downloading 42 % on its card" },
              { img: updatesPng, title: "Automatic or Ask me", alt: "The Updates section: Start with Windows and keep running in the tray, and Automatic or Ask me for each installed tool" },
            ].map((s) => (
              <figure key={s.title}>
                <div className="rounded-2xl border border-slate-200 bg-[#071a44] p-1.5">
                  <Image src={s.img} alt={s.alt} sizes="(min-width: 768px) 360px, 100vw" className="w-full h-auto rounded-xl" />
                </div>
                <figcaption className="mt-2 text-[14px] font-semibold text-slate-800">{s.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Install */}
        <section aria-labelledby="steps-h" className="mt-20">
          <SectionHead id="steps-h" eyebrow="Getting started" title="Four steps, two minutes" Icon={BookOpen} />
          <ol className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffd21f] text-[15px] font-extrabold text-[#071a44]">{i + 1}</span>
                <p className="mt-3 font-bold text-slate-900">{s.title}</p>
                <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 flex gap-2 text-[13px] text-slate-500">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" aria-hidden />
            The Toolkit isn&apos;t code-signed yet, which is why Windows SmartScreen warns the first time. Every tool it installs is checked against its published
            SHA-256 before it runs.
          </p>
        </section>

        {/* The beta */}
        <section aria-labelledby="beta-h" className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 p-6">
            <h2 id="beta-h" className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#1e4fd8]" aria-hidden /> What the beta tells us
            </h2>
            <p className="mt-2 text-[14px] text-slate-600">So we can see that updates reach every PC, the Toolkit sends:</p>
            <ul className="mt-3 space-y-1.5 text-[14px] text-slate-700">
              {SENT.map((s) => (
                <li key={s} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden /> {s}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13.5px] text-slate-500">Nothing else: none of your files, drawings or projects.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1e4fd8]" aria-hidden /> Tell us how it goes
            </h2>
            <p className="mt-2 text-[14px] text-slate-600 flex-1">
              Something didn&apos;t install, an update didn&apos;t arrive, or a screen is confusing? A line or a screenshot helps a lot.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/contact?topic=problem" className="inline-flex items-center gap-2 rounded-full bg-[#071a44] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#0b2560]">
                Report a problem <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link href="/contact?topic=idea" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-[14px] font-bold text-slate-800 hover:bg-slate-50">
                Suggest an idea
              </Link>
            </div>
            <p className="mt-4 flex gap-2 text-[13px] text-slate-500">
              <Trash2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
              To remove it: Windows Settings → Apps → Survey Toolkit. Your tools stay installed.
            </p>
          </div>
        </section>

        {/* Download again */}
        <section aria-label="Download" className="mt-20 rounded-3xl bg-[#071a44] text-white p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <BetaTag light />
            <p className="mt-3 text-2xl font-extrabold tracking-tight">Ready to try it?</p>
            <p className="mt-1 text-[15px] text-blue-100/85">One download, five tools, always up to date.</p>
          </div>
          <DownloadButton latest={latest} />
        </section>
      </div>
    </PageShell>
  );
}

/** Signed in, but not on the beta list */
export function ToolkitBetaClosed({ email }: { email: string }) {
  return (
    <PageShell>
      <div className="max-w-[720px] mx-auto px-5 sm:px-8">
        <section className="rounded-3xl border border-slate-200 p-8 sm:p-10 text-center">
          <Image src={iconPng} alt="" width={64} height={64} className="mx-auto rounded-2xl" />
          <div className="mt-4">
            <BetaTag />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">The Survey Toolkit is in a private beta</h1>
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
            It opens to everyone when the test is over. You&apos;re signed in as <strong className="text-slate-800">{email}</strong>, which isn&apos;t on the beta list.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact?topic=question" className="inline-flex items-center gap-2 rounded-full bg-[#071a44] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#0b2560]">
              <UserRound className="w-4 h-4" aria-hidden /> Ask to join
            </Link>
            <Link href="/download" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-[14px] font-bold text-slate-800 hover:bg-slate-50">
              <Download className="w-4 h-4" aria-hidden /> Our programs
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
