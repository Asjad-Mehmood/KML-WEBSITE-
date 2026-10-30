"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Calculator, FileSpreadsheet, LineChart, Ruler } from "lucide-react";
import SlopeDownload from "../SlopeDownload";
import { SLOPE_APP, SLOPE_HIGHLIGHTS, SLOPE_VERSION } from "@/lib/slope";

const ICONS = [Calculator, Ruler, LineChart, FileSpreadsheet];

/** 379.29 → 0+379.290, as the app writes chainages */
export function chainage(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const mm = Math.round(Math.abs(v) * 1000);
  return `${v < 0 ? "-" : ""}${Math.floor(mm / 1e6)}+${((mm % 1e6) / 1000).toFixed(3).padStart(7, "0")}`;
}
/** 1+250.5 or 1250.5 → 1250.5 */
function parseChainage(s: string): number {
  const t = s.trim().replace(/\s/g, "");
  const m = /^(-?)(\d+)\+(\d+(?:\.\d*)?)$/.exec(t);
  if (m) return (m[1] ? -1 : 1) * (Number(m[2]) * 1000 + Number(m[3]));
  return t === "" ? NaN : Number(t);
}
const signed = (v: number, d: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}`;

// The hero of /slope-calculation: what the app does on the left, and on the right a slope profile
// that works like the app (type the levels and chainages; a probe reads the level along the line)
export default function SlopeHero() {
  return (
    <section
      aria-labelledby="slope-h"
      className="relative overflow-hidden rounded-[28px] border border-[#1d3b78] bg-[#071a44] text-white shadow-[0_24px_60px_rgba(7,26,68,0.35)]"
    >
      <Backdrop />
      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] gap-10 px-5 sm:px-10 lg:px-14 pt-8 sm:pt-12 pb-28 sm:pb-36">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-[#ffd21f] px-4 py-1.5 text-[13px] sm:text-[14px] font-extrabold uppercase tracking-wide text-[#071a44]">
              Free survey software
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-blue-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              Version {SLOPE_VERSION} · Web and Windows
            </span>
          </div>
          <h1 id="slope-h" className="mt-5 font-black tracking-tight leading-[0.98]">
            <span className="block text-[46px] sm:text-[64px] lg:text-[72px]">Slope</span>
            <span className="block text-[40px] sm:text-[58px] lg:text-[64px] text-[#ffd21f]">Calculator</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[15.5px] sm:text-[17px] leading-relaxed text-blue-50/90">
            Enter the start and end level and chainage. Get the slope, the gradient and the level at every station, with a clear profile, a project
            drawing plate and professional Excel, PDF and CSV reports.
          </p>
          <ul className="mt-6 space-y-3">
            {SLOPE_HIGHLIGHTS.map((h, i) => {
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
            <Link
              href={SLOPE_APP}
              prefetch={false}
              className="group inline-flex items-center gap-3 rounded-full bg-[#ffd21f] px-7 py-3.5 text-[17px] sm:text-[19px] font-extrabold text-[#071a44] shadow-[0_10px_30px_rgba(255,210,31,0.35)] hover:bg-[#ffdc4d]"
            >
              Open application <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <SlopeDownload className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-5 py-3 text-[15px] font-bold text-white hover:bg-white/10 cursor-pointer" />
          </div>
          <p className="mt-3 text-[12.5px] text-blue-100/70">Sign in with a free exceltokml.com account. Runs in your browser and on a phone, offline too.</p>
        </div>

        <ProfileCard />
      </div>

      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[12.5px] sm:text-[13px] font-extrabold uppercase tracking-wide text-[#071a44] shadow-lg">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-[3px] border-emerald-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Free · Runs in your browser
      </p>
    </section>
  );
}

/** A slope profile like the app's: the line, its levels and chainages, ΔH, the slope and a moving probe */
function ProfileCard() {
  const [y1, setY1] = useState("1.900");
  const [y2, setY2] = useState("0.600");
  const [x1, setX1] = useState("0+000");
  const [x2, setX2] = useState("0+379.290");
  const [t, setT] = useState(0.42);
  const raf = useRef(0);

  // the probe walks along the line, unless the visitor prefers no motion
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      setT(0.5 - 0.42 * Math.cos(((now - t0) / 7000) * 2 * Math.PI));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const r = useMemo(() => {
    const a = Number(y1), b = Number(y2), c = parseChainage(x1), d = parseChainage(x2);
    if (![a, b, c, d].every(Number.isFinite)) return { problem: "Type numbers in all four boxes." };
    if (d === c) return { problem: "The start and end chainage must differ." };
    const dh = b - a, len = d - c, m = dh / len;
    return { a, b, c, d, dh, len, m, pct: m * 100 };
  }, [y1, y2, x1, x2]);

  // the drawing: chainage left to right, level bottom to top
  const W = 480, L = 70, R = 440, TOP = 52, BOT = 190;
  const ok = !("problem" in r);
  const hi = ok ? Math.max(r.a, r.b) : 1, lo = ok ? Math.min(r.a, r.b) : 0;
  const yOf = (v: number) => (hi === lo ? (TOP + BOT) / 2 : BOT - ((v - lo) / (hi - lo)) * (BOT - TOP));
  const ya = ok ? yOf(r.a) : TOP, yb = ok ? yOf(r.b) : BOT;
  const px = L + (R - L) * t, py = ya + (yb - ya) * t;
  const probeCh = ok ? r.c + (r.d - r.c) * t : 0, probeLevel = ok ? r.a + (r.b - r.a) * t : 0;

  return (
    <div className="self-center rounded-[22px] border-2 border-[#2c5bd8]/70 bg-[#0a2257]/85 p-5 sm:p-6 shadow-[0_0_40px_rgba(44,91,216,0.35)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-wide">
          <span className="h-3 w-3 rounded-full bg-[#3b82f6] shadow-[0_0_10px_#3b82f6]" /> Live slope profile
        </p>
        <div className="rounded-xl border border-white/15 bg-[#071a44] px-3 py-1.5 text-center">
          <p className="text-[10.5px] font-extrabold uppercase tracking-wide text-blue-100">Slope / gradient</p>
          <p className="font-mono text-[17px] font-extrabold text-[#ffd21f]" aria-live="polite">
            {ok ? `${signed(r.pct, 3)}%` : "—"}
          </p>
        </div>
      </div>

      <div className="relative mt-2">
        <svg viewBox={`0 0 ${W} 250`} className="w-full h-auto" role="img" aria-label={ok ? `Profile from level ${r.a} at chainage ${chainage(r.c)} to level ${r.b} at chainage ${chainage(r.d)}` : "Profile"}>
        <defs>
          <linearGradient id="slope-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f6bff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#1a3f9e" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {/* grid */}
        <rect x={L} y={TOP - 14} width={R - L} height={BOT - TOP + 22} fill="#0b2a6e" opacity="0.45" />
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={L + (R - L) * f} x2={L + (R - L) * f} y1={TOP - 14} y2={BOT + 8} stroke="#5b8cff" strokeOpacity="0.18" />
        ))}
        <line x1={L} x2={R} y1={Math.min(ya, yb)} y2={Math.min(ya, yb)} stroke="#8fb0ff" strokeOpacity="0.5" strokeDasharray="4 4" />
        {ok && (
          <>
            <polygon points={`${L},${ya} ${R},${yb} ${R},${BOT + 8} ${L},${BOT + 8}`} fill="url(#slope-fill)" />
            <line x1={L} y1={ya} x2={R} y2={yb} stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
            {/* ΔH bracket */}
            <line x1={L - 22} x2={L - 22} y1={Math.min(ya, yb)} y2={Math.max(ya, yb)} stroke="#8fb0ff" strokeWidth="1.5" />
            <path d={`M${L - 27} ${Math.min(ya, yb) + 7} l5 -7 l5 7 M${L - 27} ${Math.max(ya, yb) - 7} l5 7 l5 -7`} stroke="#8fb0ff" strokeWidth="1.5" fill="none" />
            {/* probe */}
            <line x1={px} x2={px} y1={py} y2={BOT + 8} stroke="#ffd21f" strokeOpacity="0.7" strokeDasharray="3 3" />
            <circle cx={px} cy={py} r="6" fill="#ffd21f" stroke="#071a44" strokeWidth="2" />
            {/* the two ends */}
            <circle cx={L} cy={ya} r="8" fill="#071a44" stroke="#ffd21f" strokeWidth="3.5" />
            <circle cx={R} cy={yb} r="8" fill="#071a44" stroke="#ffd21f" strokeWidth="3.5" />
          </>
        )}
        <text x={L} y={BOT + 26} fill="#dbe6ff" fontSize="11" textAnchor="start">CH {ok ? chainage(r.c) : "—"}</text>
        <text x={R} y={BOT + 26} fill="#dbe6ff" fontSize="11" textAnchor="end">CH {ok ? chainage(r.d) : "—"}</text>
        <path d={`M${L + 4} ${BOT + 42} H${R - 4} M${L + 12} ${BOT + 37} l-8 5 l8 5 M${R - 12} ${BOT + 37} l8 5 l-8 5`} stroke="#5b8cff" strokeWidth="1.8" fill="none" />
      </svg>

        {/* labels over the drawing, as HTML so they stay sharp and readable */}
        {ok && (
          <div className="pointer-events-none select-none" aria-hidden>
            <Label style={{ left: `${(L / W) * 100 + 4}%`, top: `${(ya / 250) * 100 - (ya < 120 ? 12 : 22)}%` }} title="Start level · Y1" value={`${r.a.toFixed(3)} m`} />
            <Label style={{ right: `${((W - R) / W) * 100 + 4}%`, top: `${(yb / 250) * 100 - (yb < 120 ? 12 : 22)}%` }} title="End level · Y2" value={`${r.b.toFixed(3)} m`} />
            <Label style={{ left: "0%", top: `${((ya + yb) / 2 / 250) * 100 - 9}%` }} title="ΔH / height" value={`${signed(r.dh, 3)} m`} small />
          </div>
        )}
      </div>
      {!ok && <p className="mt-2 rounded-lg bg-rose-500/15 border border-rose-400/30 px-3 py-2 text-[13px] text-rose-100">{r.problem}</p>}

      {ok && (
        <p className="text-center text-[12.5px] font-bold text-blue-50">
          ΔH = {signed(r.dh, 3)} m · length {Math.abs(r.len).toFixed(3)} m · 1 in {r.m === 0 ? "∞" : (1 / Math.abs(r.m)).toFixed(1)}
        </p>
      )}
      {ok && (
        <p className="mt-1 text-center font-mono text-[12px] text-[#ffd21f]" aria-hidden>
          Probe at {chainage(probeCh)} · {probeLevel.toFixed(3)} m
        </p>
      )}

      <fieldset className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <legend className="sr-only">Try it: levels and chainages</legend>
        <Box id="y1" label="Y1 level" value={y1} onChange={setY1} />
        <Box id="y2" label="Y2 level" value={y2} onChange={setY2} />
        <Box id="x1" label="X1 chainage" value={x1} onChange={setX1} />
        <Box id="x2" label="X2 chainage" value={x2} onChange={setX2} />
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-[14px]">
        <span className="text-blue-100">Slope formula</span>
        <span className="font-mono font-bold tracking-tight">M = (Y2 − Y1) ÷ (X2 − X1)</span>
      </div>
    </div>
  );
}

function Label({ title, value, style, small }: { title: string; value: string; style: React.CSSProperties; small?: boolean }) {
  return (
    <div
      className={`absolute rounded-md sm:rounded-lg border-2 ${small ? "border-[#3b82f6] bg-[#0a2257]" : "border-[#ffd21f] bg-[#071a44]"} px-1.5 sm:px-2.5 py-0.5 sm:py-1 shadow-lg`}
      style={style}
    >
      <p className="text-[7.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wide text-blue-100">{title}</p>
      <p className={`font-extrabold ${small ? "text-[11px] sm:text-[13px]" : "text-[12.5px] sm:text-[17px]"} leading-tight`}>{value}</p>
    </div>
  );
}

function Box({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label htmlFor={`slope-try-${id}`} className="rounded-xl border border-white/15 bg-[#071a44] px-3 py-2 focus-within:border-[#ffd21f]">
      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-blue-200">{label}</span>
      <input
        id={`slope-try-${id}`}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent font-mono text-base sm:text-[14px] font-bold text-white outline-none"
      />
    </label>
  );
}

/** The night-blue scene behind the hero: a faint grid, a city and port skyline, a total station on its tripod and the yellow sweep */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,#163c8f_0%,transparent_55%),radial-gradient(ellipse_at_10%_90%,#0f2f75_0%,transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(#9cb8ff_1px,transparent_1px),linear-gradient(90deg,#9cb8ff_1px,transparent_1px)] bg-[size:48px_48px]" />
      <svg className="absolute bottom-0 left-0 w-full h-[220px] sm:h-[260px]" viewBox="0 0 1600 260" preserveAspectRatio="xMidYMax slice">
        {/* skyline */}
        <g fill="#0d2a66" opacity="0.95">
          <rect x="150" y="150" width="90" height="70" />
          <rect x="250" y="170" width="60" height="50" />
          <rect x="380" y="160" width="60" height="60" />
          <rect x="530" y="160" width="90" height="60" />
          <rect x="600" y="100" width="160" height="120" />
          <rect x="760" y="140" width="60" height="80" />
          <rect x="890" y="150" width="80" height="70" />
          <rect x="1180" y="130" width="110" height="90" />
          <rect x="1300" y="160" width="70" height="60" />
        </g>
        {/* cranes */}
        <g stroke="#123579" strokeWidth="5" fill="none">
          <path d="M40 220 V60 M10 70 H170 M40 70 L120 120" />
          <path d="M470 220 V110 M430 115 H540" />
          <path d="M1100 220 V80 M1040 88 H1210 M1100 88 L1170 130" />
        </g>
        {/* total station on its tripod */}
        <g transform="translate(70 40)">
          <path d="M60 120 L20 215 M60 120 L100 215 M60 120 L60 210" stroke="#f4c20d" strokeWidth="7" strokeLinecap="round" />
          <rect x="35" y="100" width="50" height="22" rx="4" fill="#1b2a44" />
          <rect x="30" y="38" width="60" height="64" rx="8" fill="#f4c20d" />
          <rect x="38" y="70" width="22" height="12" rx="2" fill="#0d2a66" />
          <circle cx="72" cy="58" r="13" fill="#1b2a44" />
          <circle cx="72" cy="58" r="6" fill="#4a6fb5" />
          <path d="M45 38 V22 a15 15 0 0 1 30 0 V38" stroke="#f4c20d" strokeWidth="7" fill="none" />
        </g>
        {/* the sweep */}
        <path d="M0 238 C 420 250, 760 230, 1050 170 S 1450 110, 1600 100 L1600 260 L0 260 Z" fill="#ffd21f" />
        <path d="M0 246 C 420 258, 780 242, 1080 190 S 1460 140, 1600 135 L1600 260 L0 260 Z" fill="#2f6bff" />
        <path d="M0 254 C 420 262, 800 254, 1110 214 S 1470 172, 1600 172 L1600 260 L0 260 Z" fill="#071a44" />
      </svg>
    </div>
  );
}
