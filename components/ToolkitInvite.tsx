"use client";

// Shown once a new account is made (the sign-up, and Google's /welcome): the account is ready,
// and the Survey Toolkit is the way to get every program. A celebration on arrival (confetti,
// the Toolkit rising in), then Download starts the installer
// (/api/toolkit/download; on the sign-in address through the handover, so the main site is
// signed in for it) and turns into a step tracker: downloading, open it, install, signed in.
// Everything stays still for reduced motion.
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Download,
  FolderOpen,
  LayoutGrid,
  Loader2,
  MousePointerClick,
  PartyPopper,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import toolkitIcon from "@/components/toolkit/images/toolkit-icon.png";
import shot from "@/components/toolkit/images/shot-home.png";

const POINTS = [
  { Icon: LayoutGrid, text: "Excel to KML, Traverse & Level, Slope Calculator, Auto Drafting and more, in one app" },
  { Icon: ShieldCheck, text: "Sign in once: every program opens already signed in" },
  { Icon: RefreshCw, text: "New versions install themselves, checked before they run" },
];

const STEPS = [
  { Icon: Download, title: "Downloading", done: "Downloaded", text: "SurveyToolkit-Setup.exe" },
  { Icon: FolderOpen, title: "Open it", done: "Opened", text: "From your Downloads, or the bar at the bottom of your browser" },
  { Icon: MousePointerClick, title: "Install", done: "Installed", text: "If Windows warns you: More info, then Run anyway" },
  { Icon: UserCheck, title: "You're in", done: "You're in", text: "The Toolkit opens signed in to this account" },
];

/** A short burst of confetti in the brand's colours, drawn on a canvas over the card */
function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const colors = ["#0071e3", "#ffd21f", "#10b981", "#071a44", "#f43f5e", "#a855f7"];
    const bits = Array.from({ length: 140 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 140 + Math.random() * 0.3;
      const speed = 4 + Math.random() * 6;
      return {
        x: w / 2,
        y: 90,
        vx: Math.cos(a) * speed * 0.9,
        vy: Math.sin(a) * speed - 4,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        s: 5 + Math.random() * 5,
        c: colors[i % colors.length],
        round: Math.random() < 0.35,
      };
    });
    let frame = 0;
    let id = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);
      const fade = Math.max(0, 1 - frame / 150);
      for (const b of bits) {
        b.vy += 0.18;
        b.vx *= 0.985;
        b.x += b.vx;
        b.y += b.vy;
        b.r += b.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.fillStyle = b.c;
        if (b.round) {
          ctx.beginPath();
          ctx.arc(0, 0, b.s / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        ctx.restore();
      }
      if (frame < 150) id = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-20 h-full w-full" />;
}

export default function ToolkitInvite({
  firstName,
  downloadHref,
  onContinue,
  continueLabel,
}: {
  firstName: string;
  downloadHref: string;
  onContinue: () => void;
  continueLabel: string;
}) {
  // -1 before Download; then the step the tracker is on
  const [at, setAt] = useState(-1);
  useEffect(() => {
    if (at < 0 || at >= 1) return;
    // the browser doesn't tell a page how its download goes: a few seconds, then "open it"
    const t = window.setTimeout(() => setAt(1), 3200);
    return () => window.clearTimeout(t);
  }, [at]);
  const started = at >= 0;

  return (
    <div className="ti relative">
      <Confetti />
      <div className="text-center">
        <span className="ti-badge relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_10px_30px_-8px_rgba(16,185,129,0.7)]">
          <span aria-hidden className="ti-ring absolute inset-0 rounded-full border-2 border-emerald-400" />
          <PartyPopper className="w-7 h-7" aria-hidden />
        </span>
        <h1 className="ti-up mt-4 text-[24px] font-bold tracking-tight text-[#1d1d1f]" style={{ animationDelay: "120ms" }}>
          Welcome{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="ti-up mt-1 text-[14px] text-slate-500" style={{ animationDelay: "220ms" }}>
          Your account is ready. One more step gets you <span className="ti-shine font-semibold">everything</span>:
        </p>
      </div>

      {/* the Toolkit rising in */}
      <div className="relative mt-6">
        <div className="ti-rise overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-[#eef3ff] to-[#f5f7fb]" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-3 px-4 pt-4">
            <Image src={toolkitIcon} alt="" width={40} height={40} className="h-10 w-10 rounded-xl shadow-md" />
            <div className="min-w-0 text-left">
              <p className="font-semibold leading-tight text-[#071a44]">Survey Toolkit</p>
              <p className="text-[12.5px] text-slate-500">Free · Windows 10 and 11</p>
            </div>
          </div>
          <div className="ti-float mx-4 mt-4 overflow-hidden rounded-t-lg border border-b-0 border-slate-200 bg-white shadow-[0_-10px_30px_-12px_rgba(7,26,68,0.3)]">
            <div aria-hidden className="flex h-5 items-center gap-1 border-b border-slate-100 bg-slate-50 px-2">
              <i className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              <i className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <Image src={shot} alt="The Survey Toolkit's home, with every program and its updates" sizes="400px" className="block h-auto w-full" />
          </div>
        </div>
      </div>

      {!started ? (
        <>
          <ul className="mt-5 space-y-2.5">
            {POINTS.map(({ Icon, text }, i) => (
              <li key={text} className="ti-up flex gap-3 text-[13.5px] text-slate-700" style={{ animationDelay: `${900 + i * 120}ms` }}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#071a44] text-[#ffd21f]">
                  <Icon className="w-3.5 h-3.5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <a
            href={downloadHref}
            onClick={() => setAt(0)}
            className="ti-cta ti-up relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#0071e3] to-[#2b8cff] py-3.5 text-[15px] font-semibold text-white"
            style={{ animationDelay: "1300ms" }}
          >
            <span aria-hidden className="ti-sweep absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/30" />
            <Download className="ti-bob w-4 h-4" aria-hidden /> Download the Survey Toolkit
          </a>
          <button
            type="button"
            onClick={onContinue}
            className="ti-up mt-3 flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-[14px] font-semibold text-[#0071e3] hover:bg-blue-50"
            style={{ animationDelay: "1400ms" }}
          >
            Maybe later <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
        </>
      ) : (
        <>
          {/* after Download: where they are, step by step */}
          <ol className="mt-6 space-y-0" aria-label="Getting the Survey Toolkit">
            {STEPS.map((s, i) => {
              const done = i < at;
              const now = i === at;
              return (
                <li key={s.title} className="ti-up relative flex gap-3 pb-4 last:pb-0" style={{ animationDelay: `${i * 90}ms` }}>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-0.5 overflow-hidden rounded bg-slate-200">
                      <span className={`block w-full bg-emerald-500 transition-all duration-700 ${done ? "h-full" : "h-0"}`} />
                    </span>
                  )}
                  <span
                    className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                      done ? "bg-emerald-500 text-white" : now ? "bg-[#0071e3] text-white shadow-[0_0_0_6px_rgba(0,113,227,0.15)]" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" aria-hidden /> : now && i === 0 ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <s.Icon className="w-4 h-4" aria-hidden />}
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className={`text-[14px] font-semibold ${done ? "text-emerald-700" : now ? "text-[#1d1d1f]" : "text-slate-400"}`}>{done ? s.done : s.title}</p>
                    <p className={`text-[12.5px] ${now || done ? "text-slate-600" : "text-slate-400"}`}>{s.text}</p>
                    {now && i === 0 && (
                      <span aria-hidden className="mt-2 block h-1 w-44 overflow-hidden rounded-full bg-slate-100">
                        <span className="ti-indet block h-full w-1/3 rounded-full bg-[#0071e3]" />
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            onClick={onContinue}
            className="ti-up mt-6 flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 py-3.5 text-[14px] font-semibold text-white hover:bg-slate-800"
          >
            {continueLabel} <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
          <a href={downloadHref} onClick={() => setAt(0)} className="mt-2 block text-center text-[12.5px] font-medium text-slate-500 hover:text-[#0071e3]">
            Download didn&apos;t start? Try again
          </a>
        </>
      )}

      <style>{`
        .ti-up { animation: ti-up .5s cubic-bezier(.2,.7,.2,1) both; }
        .ti-badge { animation: ti-badge .6s cubic-bezier(.2,1.5,.4,1) both; }
        .ti-ring { animation: ti-ring 1.4s ease-out .3s 2 both; }
        .ti-rise { animation: ti-rise .8s cubic-bezier(.2,.8,.2,1) both; }
        .ti-float { animation: ti-float 5s ease-in-out 1.2s infinite; }
        .ti-cta { box-shadow: 0 12px 28px -10px rgba(0,113,227,.7); animation: ti-up .5s cubic-bezier(.2,.7,.2,1) both, ti-glow 2.4s ease-in-out 2s infinite; }
        .ti-sweep { animation: ti-sweep 2.8s ease-in-out 1.8s infinite; }
        .ti-bob { animation: ti-bob 1.6s ease-in-out 2s infinite; }
        .ti-indet { animation: ti-indet 1.1s ease-in-out infinite; }
        .ti-shine { background: linear-gradient(90deg,#0071e3,#a855f7,#0071e3); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: ti-shine 3s linear infinite; }
        @keyframes ti-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes ti-badge { from { opacity: 0; transform: scale(.3) rotate(-30deg); } to { opacity: 1; transform: none; } }
        @keyframes ti-ring { from { opacity: .8; transform: scale(1); } to { opacity: 0; transform: scale(1.9); } }
        @keyframes ti-rise { from { opacity: 0; transform: translateY(40px) scale(.94) rotateX(18deg); } to { opacity: 1; transform: none; } }
        @keyframes ti-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes ti-glow { 0%,100% { box-shadow: 0 12px 28px -10px rgba(0,113,227,.7); } 50% { box-shadow: 0 12px 36px -6px rgba(0,113,227,.95); } }
        @keyframes ti-sweep { 0% { left: -40%; } 60%,100% { left: 120%; } }
        @keyframes ti-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2px); } }
        @keyframes ti-indet { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        @keyframes ti-shine { to { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) {
          .ti-up, .ti-badge, .ti-ring, .ti-rise, .ti-float, .ti-cta, .ti-sweep, .ti-bob, .ti-indet, .ti-shine { animation: none !important; }
          .ti-shine { color: #0071e3; }
        }
      `}</style>
    </div>
  );
}
