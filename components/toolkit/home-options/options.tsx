// Survey Toolkit (beta test): the five front-page options. Each is a hero with a live graphic,
// then the five tools and three steps in the same style. Same words in all five; only the look and
// the motion differ.
//
// The motion is CSS only (home-options.css): transform and opacity, loops of 4 to 8 seconds. Every
// element's own style is its finished, still state, and the animation only plays over it, so with
// reduced motion (or paused) each graphic shows a clean, complete picture. All graphics are
// decorative (aria-hidden); the words beside them say the same thing.
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, Check, Compass, Download, FolderTree, Globe, RefreshCw, Route, TrendingUp, type LucideIcon } from "lucide-react";

export interface OptionTool {
  id: string;
  name: string;
  platform: string;
  /** null when the feed can't be read just now */
  version: string | null;
}

export interface OptionProps {
  tools: OptionTool[];
  /** The Toolkit's own version; null before its first release */
  toolkitVersion: string | null;
  /** Only the hero (the side-by-side thumbnails) */
  heroOnly?: boolean;
}

export const OPTIONS = [
  {
    id: "a",
    name: "Update Center",
    note: "Rows tick from Checking to Updating, with a moving progress bar, to Up to date with a check mark that draws itself, one tool after another in an 8-second loop. The \"Checked a moment ago\" label refreshes with each loop.",
  },
  {
    id: "b",
    name: "Dark Steps",
    note: "A glowing point travels along the line through Download, Install and Auto-update, lighting each step as it passes; step 3's bar fills and repeats every 6 seconds. The grid behind drifts very slowly.",
  },
  {
    id: "c",
    name: "Hub Diagram",
    note: "Pulses of light leave the Toolkit at the centre and travel along each line to the five tools, one after another (7.5 seconds); each tool glows as its update arrives. The dashed ring turns very slowly.",
  },
  {
    id: "d",
    name: "Bold Yellow",
    note: "A ticker of the five tools and their versions runs along the band; the check marks draw themselves one by one (8 seconds); the dot beside \"Automatic updates are on\" pulses gently.",
  },
  {
    id: "e",
    name: "App Window",
    note: "Inside the Toolkit's window an \"Update available\" toast slides in, RoadPro's dot turns to updating while its bar fills, then back to up to date, and the banner switches to \"Everything is up to date\". The cycle repeats every 8 seconds.",
  },
] as const;

export type OptionId = (typeof OPTIONS)[number]["id"];

const ICONS: Record<string, LucideIcon> = {
  "excel-to-kml": Globe,
  roadpro: Route,
  traverse: Compass,
  "folder-manager": FolderTree,
  slope: TrendingUp,
};
const iconOf = (id: string) => ICONS[id] ?? Globe;
const ver = (t: OptionTool) => (t.version ? `v${t.version}` : "[version]");

const COPY = {
  eyebrow: "Survey Toolkit",
  text: "One download installs Excel to KML, RoadPro, Traverse & Level, Project Folder Manager and Slope Calculator, and keeps every one of them up to date by itself.",
  primary: "Download for Windows",
  secondary: "See the tools",
};
const meta = (v: string | null) => `Free · Windows 10 and 11 · ${v ? `Version ${v}` : "[Version]"}`;

/** Download and See the tools: the first pulses for a few seconds, then stops */
function Buttons({ id, primary, secondary }: { id: OptionId; primary: string; secondary: string }) {
  return (
    <div className="ho-enter ho-enter-3 mt-7 flex flex-wrap items-center gap-3">
      <a href="/toolkit-beta" className={`ho-btn ho-pulse ${primary}`}>
        <Download className="w-5 h-5" aria-hidden /> {COPY.primary}
      </a>
      <a href={`#ho-${id}-tools`} className={`ho-btn ${secondary}`}>
        {COPY.secondary} <ArrowRight className="ho-arrow w-4 h-4" aria-hidden />
      </a>
    </div>
  );
}

function Title({ className, accent }: { className: string; accent: string }) {
  return (
    <h1 className={`ho-enter ho-enter-1 ${className}`}>
      Every survey tool.
      <br />
      One download. <span className={accent}>Always up to date.</span>
    </h1>
  );
}

const STEPS = [
  { title: "Download", text: "One installer for Windows 10 and 11. No administrator rights needed." },
  { title: "Pick your tools", text: "Install what you need from Home; tools already on your PC are found." },
  { title: "Updates arrive", text: "New versions install by themselves, never while a tool is open." },
];

type Theme = "light" | "dark" | "yellow";
const THEMES: Record<Theme, { section: string; card: string; muted: string; head: string; badge: string; icon: string }> = {
  light: {
    section: "bg-white text-slate-900",
    card: "bg-white border border-slate-200 hover:border-[#1e4fd8]/40 hover:shadow-[0_14px_30px_rgba(7,26,68,0.12)]",
    muted: "text-slate-600",
    head: "text-slate-900",
    badge: "bg-[#eef3ff] text-[#1e4fd8]",
    icon: "bg-[#071a44] text-white",
  },
  dark: {
    section: "bg-[#06122f] text-white",
    card: "bg-white/[0.04] border border-white/10 hover:border-[#ffd21f]/50 hover:shadow-[0_14px_30px_rgba(0,0,0,0.35)]",
    muted: "text-blue-100/70",
    head: "text-white",
    badge: "bg-white/10 text-[#ffd21f]",
    icon: "bg-[#ffd21f] text-[#071a44]",
  },
  yellow: {
    section: "bg-[#fff6c9] text-[#111]",
    card: "bg-white border-2 border-[#111] hover:shadow-[6px_6px_0_#111]",
    muted: "text-[#3a3a3a]",
    head: "text-[#111]",
    badge: "bg-[#111] text-[#ffd21f]",
    icon: "bg-[#ffd21f] text-[#111] border-2 border-[#111]",
  },
};

/** The five tools and three steps, under each hero */
function Below({ id, tools, theme }: { id: OptionId; tools: OptionTool[]; theme: Theme }) {
  const t = THEMES[theme];
  return (
    <div className={t.section}>
      <section id={`ho-${id}-tools`} aria-label="The tools" className="max-w-[1180px] mx-auto px-5 sm:px-8 py-16 scroll-mt-24">
        <h2 className={`ho-reveal text-2xl sm:text-[30px] font-extrabold tracking-tight ${t.head}`}>Five tools, one place</h2>
        <p className={`ho-reveal mt-2 text-[15px] ${t.muted}`}>Each installed with its own official installer, checked before it runs.</p>
        <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tools.map((tool, i) => {
            const Icon = iconOf(tool.id);
            return (
              <li key={tool.id} className={`ho-reveal ho-card rounded-2xl p-5 ${t.card}`} style={{ "--i": i } as CSSProperties}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.icon}`}>
                  <Icon className="w-5 h-5" aria-hidden />
                </span>
                <p className={`mt-3 font-bold ${t.head}`}>{tool.name}</p>
                <p className={`mt-0.5 text-[13px] ${t.muted}`}>{tool.platform}</p>
                <span className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-[12px] font-bold tabular-nums ${t.badge}`}>{ver(tool)}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-label="How it works" className="max-w-[1180px] mx-auto px-5 sm:px-8 pb-20">
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className={`ho-reveal ho-card rounded-2xl p-6 ${t.card}`} style={{ "--i": i } as CSSProperties}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-extrabold ${t.icon}`}>{i + 1}</span>
              <p className={`mt-3 font-bold ${t.head}`}>{s.title}</p>
              <p className={`mt-1 text-[14px] ${t.muted}`}>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Shell({ id, children, below }: { id: OptionId; children: ReactNode; below: ReactNode }) {
  return (
    <div className={`ho-opt ho-${id}`}>
      {children}
      {below}
    </div>
  );
}

/** A check mark that draws itself (its finished state is drawn) */
function DrawnCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
    </svg>
  );
}

// ------------------------------------------------------------------ A: Update Center

export function OptionA({ tools, toolkitVersion, heroOnly }: OptionProps) {
  return (
    <Shell id="a" below={!heroOnly && <Below id="a" tools={tools} theme="light" />}>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f3f6fd] to-white">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-12 items-center">
          <div>
            <p className="ho-enter ho-enter-0 inline-flex items-center gap-2 rounded-full bg-[#e6edff] px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-[#1e4fd8]">
              {COPY.eyebrow}
            </p>
            <Title className="mt-4 text-[38px] sm:text-[50px] font-extrabold leading-[1.04] tracking-tight text-[#071a44]" accent="text-[#1e4fd8]" />
            <p className="ho-enter ho-enter-2 mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">{COPY.text}</p>
            <Buttons id="a" primary="bg-[#1e4fd8] text-white hover:bg-[#1843bd]" secondary="border border-slate-300 text-slate-800 hover:bg-slate-50" />
            <p className="ho-enter ho-enter-3 mt-4 text-[13px] text-slate-500">{meta(toolkitVersion)}</p>
          </div>
          {/* the live update centre */}
          <div className="ho-enter ho-enter-graphic rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(7,26,68,0.16)]" aria-hidden>
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#071a44] text-[#ffd21f]">
                <RefreshCw className="ho-a-spin w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-slate-900">Update centre</p>
                <p className="relative h-4 text-[12px] text-slate-500">
                  <span className="ho-a-checked absolute inset-0">Checked a moment ago</span>
                  <span className="ho-a-checking-now absolute inset-0">Checking now…</span>
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-700">Automatic</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {tools.map((t, i) => {
                const Icon = iconOf(t.id);
                return (
                  <li key={t.id} className="ho-a-row relative px-5 py-3.5" style={{ "--i": i } as CSSProperties}>
                    <span className="ho-a-glow absolute inset-0 bg-[#f1f5ff]" />
                    <div className="relative flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f4fa] text-[#071a44]">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-slate-900">{t.name}</p>
                        <p className="text-[12px] text-slate-500 tabular-nums">{ver(t)}</p>
                      </div>
                      <span className="relative h-6 w-[118px] text-right text-[12.5px] font-semibold">
                        <span className="ho-a-s1 absolute inset-0 flex items-center justify-end gap-1.5 text-slate-500">Checking</span>
                        <span className="ho-a-s2 absolute inset-0 flex items-center justify-end gap-1.5 text-[#1e4fd8]">Updating</span>
                        <span className="ho-a-s3 absolute inset-0 flex items-center justify-end gap-1.5 text-emerald-700">
                          <DrawnCheck className="ho-draw ho-a-check h-4 w-4" /> Up to date
                        </span>
                      </span>
                    </div>
                    <span className="ho-a-track absolute left-5 right-5 bottom-1 h-1 overflow-hidden rounded-full bg-[#e6edff]">
                      <span className="ho-a-bar block h-full w-full rounded-full bg-[#1e4fd8]" />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </Shell>
  );
}

// ------------------------------------------------------------------ B: Dark Steps

export function OptionB({ tools, toolkitVersion, heroOnly }: OptionProps) {
  const steps = [
    { title: "Download", text: "One installer", Icon: Download },
    { title: "Install", text: "Pick your tools", Icon: Check },
    { title: "Auto-update", text: "Always current", Icon: RefreshCw },
  ];
  return (
    <Shell id="b" below={!heroOnly && <Below id="b" tools={tools} theme="dark" />}>
      <section className="relative overflow-hidden bg-[#06122f] text-white">
        <div className="ho-b-grid absolute -inset-[48px]" aria-hidden />
        <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(30,79,216,0.35),transparent)]" />
        <div className="relative max-w-[1100px] mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
          <p className="ho-enter ho-enter-0 text-[12px] font-bold uppercase tracking-[0.18em] text-[#ffd21f]">{COPY.eyebrow}</p>
          <Title className="mt-4 text-[38px] sm:text-[56px] font-extrabold leading-[1.04] tracking-tight" accent="text-[#ffd21f]" />
          <p className="ho-enter ho-enter-2 mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-blue-100/80">{COPY.text}</p>
          <div className="flex justify-center">
            <Buttons id="b" primary="bg-[#ffd21f] text-[#071a44] hover:bg-[#ffdc4d]" secondary="border border-white/30 text-white hover:bg-white/10" />
          </div>
          <p className="ho-enter ho-enter-3 mt-4 text-[13px] text-blue-100/60">{meta(toolkitVersion)}</p>

          {/* the three steps, and the light travelling through them */}
          <div className="ho-enter ho-enter-graphic relative mt-16 md:pt-9" aria-hidden>
            <div className="ho-b-track absolute left-[16.6%] right-[16.6%] top-0 hidden md:block h-[2px] bg-white/15">
              {[0, 50, 100].map((x) => (
                <span key={x} className="absolute -top-[5px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[#ffd21f]/60 bg-[#06122f]" style={{ left: `${x}%` }} />
              ))}
              <span className="ho-b-runner absolute inset-0">
                <span className="ho-b-dot absolute -left-[7px] -top-[6px] h-[14px] w-[14px] rounded-full bg-[#ffd21f]" />
              </span>
            </div>
            <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
              {steps.map((s, i) => (
                <li key={s.title} className="ho-b-step relative rounded-2xl border border-white/10 bg-[#0b1d47]/80 p-5 backdrop-blur" style={{ "--i": i } as CSSProperties}>
                  <span className="ho-b-light absolute inset-0 rounded-2xl border border-[#ffd21f]/70 shadow-[0_0_40px_rgba(255,210,31,0.25)]" />
                  <div className="relative flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#ffd21f] bg-[#071a44] text-[#ffd21f]">
                      <s.Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200/60">Step {i + 1}</p>
                      <p className="font-bold">{s.title}</p>
                    </div>
                  </div>
                  <p className="relative mt-3 text-[13.5px] text-blue-100/70">{s.text}</p>
                  {i === 2 && (
                    <div className="relative mt-3">
                      <div className="flex justify-between text-[11.5px] text-blue-100/60">
                        <span>{tools[tools.length - 1]?.name}</span>
                        <span className="tabular-nums">{ver(tools[tools.length - 1])}</span>
                      </div>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/10">
                        <span className="ho-b-bar block h-full w-full rounded-full bg-[#ffd21f]" />
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </Shell>
  );
}

// ------------------------------------------------------------------ C: Hub Diagram

const HUB = { cx: 230, cy: 230, r: 150 };
const nodeAt = (i: number, n: number) => {
  const a = (-90 + (360 / n) * i) * (Math.PI / 180);
  return { x: HUB.cx + HUB.r * Math.cos(a), y: HUB.cy + HUB.r * Math.sin(a), left: Math.cos(a) < -0.2, right: Math.cos(a) > 0.2 };
};

export function OptionC({ tools, toolkitVersion, heroOnly }: OptionProps) {
  return (
    <Shell id="c" below={!heroOnly && <Below id="c" tools={tools} theme="light" />}>
      <section className="relative overflow-hidden bg-[radial-gradient(70%_80%_at_80%_40%,#e9f0ff,#ffffff_70%)]">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-10 items-center">
          <div>
            <p className="ho-enter ho-enter-0 text-[12px] font-bold uppercase tracking-[0.16em] text-[#1e4fd8]">{COPY.eyebrow}</p>
            <Title className="mt-4 text-[38px] sm:text-[50px] font-extrabold leading-[1.05] tracking-tight text-[#071a44]" accent="text-[#1e4fd8]" />
            <p className="ho-enter ho-enter-2 mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">{COPY.text}</p>
            <Buttons id="c" primary="bg-[#071a44] text-white hover:bg-[#0b2560]" secondary="border border-slate-300 text-slate-800 hover:bg-white" />
            <p className="ho-enter ho-enter-3 mt-4 text-[13px] text-slate-500">{meta(toolkitVersion)}</p>
          </div>
          <div className="ho-enter ho-enter-graphic mx-auto w-full max-w-[520px]" aria-hidden>
            <svg viewBox="-40 0 540 460" className="w-full h-auto overflow-visible">
              <circle className="ho-c-ring" cx={HUB.cx} cy={HUB.cy} r={HUB.r + 32} fill="none" stroke="#1e4fd8" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 9" />
              {tools.map((t, i) => {
                const p = nodeAt(i, tools.length);
                return <line key={t.id} x1={HUB.cx} y1={HUB.cy} x2={p.x} y2={p.y} stroke="#1e4fd8" strokeOpacity="0.22" strokeWidth="2" />;
              })}
              {tools.map((t, i) => {
                const p = nodeAt(i, tools.length);
                return (
                  <circle
                    key={t.id}
                    className="ho-c-pulse"
                    cx={HUB.cx}
                    cy={HUB.cy}
                    r="6"
                    fill="#ffd21f"
                    style={{ "--i": i, "--dx": `${p.x - HUB.cx}px`, "--dy": `${p.y - HUB.cy}px` } as CSSProperties}
                  />
                );
              })}
              {/* the hub */}
              <circle cx={HUB.cx} cy={HUB.cy} r="52" fill="#071a44" />
              <circle cx={HUB.cx} cy={HUB.cy} r="52" fill="none" stroke="#ffd21f" strokeWidth="3" />
              <g transform={`translate(${HUB.cx - 17} ${HUB.cy - 17})`} fill="none" stroke="#ffd21f" strokeWidth="3">
                <rect x="0" y="0" width="14" height="14" rx="3" />
                <rect x="20" y="0" width="14" height="14" rx="3" />
                <rect x="0" y="20" width="14" height="14" rx="3" />
                <circle cx="27" cy="27" r="7" fill="#ffd21f" />
              </g>
              {tools.map((t, i) => {
                const p = nodeAt(i, tools.length);
                const anchor = p.left ? "end" : p.right ? "start" : "middle";
                const dx = p.left ? -36 : p.right ? 36 : 0;
                const dy = !p.left && !p.right ? -54 : 0;
                const Icon = iconOf(t.id);
                return (
                  <g key={t.id}>
                    <circle className="ho-c-glow" cx={p.x} cy={p.y} r="28" fill="#ffd21f" style={{ "--i": i } as CSSProperties} />
                    <circle cx={p.x} cy={p.y} r="26" fill="#ffffff" stroke="#071a44" strokeWidth="2" />
                    <Icon x={p.x - 11} y={p.y - 11} width={22} height={22} color="#071a44" strokeWidth={2.2} />
                    <text className="ho-c-label" x={p.x + dx} y={p.y + dy - 2} textAnchor={anchor} fontSize="14" fontWeight="700" fill="#0f172a">
                      {t.name}
                    </text>
                    <text className="ho-c-label" x={p.x + dx} y={p.y + dy + 15} textAnchor={anchor} fontSize="12.5" fill="#475569">
                      {ver(t)}
                    </text>
                  </g>
                );
              })}
            </svg>
            {/* on a phone the diagram's labels would be too small: the tools are listed under it */}
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:hidden">
              {tools.map((t) => (
                <li key={t.id} className="flex items-baseline justify-between gap-2 border-b border-slate-200 pb-1.5 text-[13.5px]">
                  <span className="font-semibold text-slate-900">{t.name}</span>
                  <span className="tabular-nums text-slate-500">{ver(t)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Shell>
  );
}

// ------------------------------------------------------------------ D: Bold Yellow

export function OptionD({ tools, toolkitVersion, heroOnly }: OptionProps) {
  const ticker = tools.map((t) => `${t.name} ${ver(t)}`);
  return (
    <Shell id="d" below={!heroOnly && <Below id="d" tools={tools} theme="yellow" />}>
      <section className="relative overflow-hidden bg-[#ffd21f] text-[#111]">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-10 items-center">
          <div>
            <p className="ho-enter ho-enter-0 inline-block border-2 border-[#111] px-3 py-1 text-[12px] font-black uppercase tracking-[0.16em]">{COPY.eyebrow}</p>
            <Title className="mt-5 text-[42px] sm:text-[64px] font-black uppercase leading-[0.95] tracking-tight" accent="bg-[#111] text-[#ffd21f] px-2 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] leading-[1.12]" />
            <p className="ho-enter ho-enter-2 mt-6 max-w-xl text-[17px] font-medium leading-relaxed">{COPY.text}</p>
            <Buttons id="d" primary="bg-[#111] text-[#ffd21f] hover:bg-black" secondary="border-2 border-[#111] text-[#111] hover:bg-[#111]/5" />
            <p className="ho-enter ho-enter-3 mt-5 inline-flex items-center gap-2.5 text-[14px] font-bold">
              <span className="ho-d-dot relative inline-block h-3 w-3 rounded-full bg-[#0a7a3c]" aria-hidden />
              Automatic updates are on
            </p>
            <p className="ho-enter ho-enter-3 mt-1 text-[13px] font-medium text-[#3a3a3a]">{meta(toolkitVersion)}</p>
          </div>
          <ul className="ho-enter ho-enter-graphic space-y-2.5" aria-hidden>
            {tools.map((t, i) => (
              <li key={t.id} className="flex items-center gap-4 border-2 border-[#111] bg-[#fff8d6] px-4 py-3 shadow-[5px_5px_0_#111]" style={{ "--i": i } as CSSProperties}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#111] text-[#ffd21f]">
                  <DrawnCheck className="ho-draw ho-d-check h-6 w-6" />
                </span>
                <span className="flex-1 text-[16px] font-black uppercase leading-tight">{t.name}</span>
                <span className="text-[14px] font-bold tabular-nums">{ver(t)}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* the ticker: the list twice, moved by half its length */}
        <div className="border-y-2 border-[#111] bg-[#111] py-3 text-[#ffd21f] overflow-hidden" aria-hidden>
          <div className="ho-d-ticker flex w-max">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0">
                {ticker.map((x) => (
                  <span key={x} className="flex items-center gap-6 pr-6 text-[18px] font-black uppercase tracking-wide whitespace-nowrap">
                    {x} <span className="h-2 w-2 rotate-45 bg-[#ffd21f]" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}

// ------------------------------------------------------------------ E: App Window

export function OptionE({ tools, toolkitVersion, heroOnly }: OptionProps) {
  const updating = tools.find((t) => t.id === "roadpro") ?? tools[0];
  return (
    <Shell id="e" below={!heroOnly && <Below id="e" tools={tools} theme="light" />}>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071a44] via-[#0d2a6b] to-[#1e4fd8] text-white">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-12 items-center">
          <div>
            <p className="ho-enter ho-enter-0 text-[12px] font-bold uppercase tracking-[0.16em] text-[#ffd21f]">{COPY.eyebrow}</p>
            <Title className="mt-4 text-[38px] sm:text-[50px] font-extrabold leading-[1.05] tracking-tight" accent="text-[#ffd21f]" />
            <p className="ho-enter ho-enter-2 mt-5 max-w-xl text-[17px] leading-relaxed text-blue-50/85">{COPY.text}</p>
            <Buttons id="e" primary="bg-[#ffd21f] text-[#071a44] hover:bg-[#ffdc4d]" secondary="border border-white/35 text-white hover:bg-white/10" />
            <p className="ho-enter ho-enter-3 mt-4 text-[13px] text-blue-100/65">{meta(toolkitVersion)}</p>
          </div>
          {/* the Toolkit's window */}
          <div className="ho-enter ho-enter-graphic relative" aria-hidden>
            <div className="overflow-hidden rounded-xl bg-[#f4f6fb] text-slate-900 shadow-[0_40px_90px_rgba(0,0,0,0.45)] ring-1 ring-white/20">
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 border-b border-slate-200">
                <span className="h-4 w-4 rounded bg-[#071a44]" />
                <span className="text-[12.5px] font-semibold text-slate-700">Survey Toolkit</span>
                <span className="ml-auto flex gap-4 text-slate-400 text-[13px] leading-none">
                  <span>–</span>
                  <span>□</span>
                  <span>×</span>
                </span>
              </div>
              <div className="flex">
                <ul className="w-[38%] sm:w-[34%] shrink-0 space-y-0.5 border-r border-slate-200 bg-white p-2.5">
                  {tools.map((t) => {
                    const Icon = iconOf(t.id);
                    const it = t.id === updating.id;
                    return (
                      <li key={t.id} className={`relative flex items-center gap-2 rounded-lg px-2 py-2 ${it ? "bg-[#eef3ff]" : ""}`}>
                        <Icon className="w-4 h-4 shrink-0 text-[#071a44]" />
                        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{t.name}</span>
                        <span className="relative h-2.5 w-2.5 shrink-0">
                          <span className="absolute inset-0 rounded-full bg-emerald-500" />
                          {it && <span className="ho-e-busy absolute -inset-[3px] rounded-full border-2 border-amber-400 border-t-transparent" />}
                          {it && <span className="ho-e-amber absolute inset-0 rounded-full bg-amber-400" />}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="min-w-0 flex-1 p-3 sm:p-4">
                  <div className="relative h-[58px] overflow-hidden rounded-lg">
                    <div className="ho-e-ok absolute inset-0 flex items-center gap-3 rounded-lg bg-emerald-600 px-4 text-white">
                      <Check className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="text-[13px] font-bold">Everything is up to date</p>
                        <p className="text-[11px] text-white/80">Checked a moment ago</p>
                      </div>
                    </div>
                    <div className="ho-e-avail absolute inset-0 flex items-center gap-3 rounded-lg bg-[#071a44] px-4 text-white">
                      <RefreshCw className="w-5 h-5 shrink-0 text-[#ffd21f]" />
                      <div>
                        <p className="text-[13px] font-bold">1 update available</p>
                        <p className="text-[11px] text-white/75">Installing it now</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f1f4fa] text-[#071a44]">
                        <Route className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-bold">{updating.name}</p>
                        <p className="text-[11px] text-slate-500">{updating.platform}</p>
                      </div>
                      <span className="text-[11.5px] font-bold tabular-nums text-slate-700">{ver(updating)}</span>
                    </div>
                    <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <span className="ho-e-bar block h-full w-full rounded-full bg-[#1e4fd8]" />
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {tools
                      .filter((t) => t.id !== updating.id)
                      .slice(0, 4)
                      .map((t) => (
                        <div key={t.id} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                          <p className="truncate text-[11.5px] font-semibold">{t.name}</p>
                          <p className="text-[10.5px] text-emerald-700 font-semibold">Up to date</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
            {/* the toast */}
            <div className="ho-e-toast absolute -bottom-5 right-3 sm:-right-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-900 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffd21f] text-[#071a44]">
                <Download className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-bold">Update available</p>
                <p className="text-[11.5px] text-slate-500">
                  {updating.name} {ver(updating)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}

export const OPTION_VIEWS: Record<OptionId, (p: OptionProps) => React.JSX.Element> = {
  a: OptionA,
  b: OptionB,
  c: OptionC,
  d: OptionD,
  e: OptionE,
};
