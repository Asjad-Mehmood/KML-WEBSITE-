"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type FlipStep = { src: string; alt: string; title: string; text: string };

/**
 * How to use the app, step by step: each screen flips over to the next one every few seconds,
 * with the numbered steps in a row underneath (the current one fills as its time runs).
 * Pauses while pointed at or focused; tap a number to jump. People who prefer less motion get a
 * plain fade and no automatic turning.
 */
export default function StepFlipGallery({ steps, interval = 4000 }: { steps: FlipStep[]; interval?: number }) {
  const [cur, setCur] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const [cycle, setCycle] = useState(0); // restarts the progress bar
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const curRef = useRef(0);
  const go = useCallback((n: number) => {
    const c = curRef.current;
    setCycle((k) => k + 1);
    if (n === c) return;
    curRef.current = n;
    setPrev(c);
    setCur(n);
    if (flipTimer.current) clearTimeout(flipTimer.current);
    flipTimer.current = setTimeout(() => setPrev(null), 750);
  }, []);

  useEffect(() => {
    if (paused || still || steps.length < 2) return;
    const t = setTimeout(() => go((cur + 1) % steps.length), interval);
    return () => clearTimeout(t);
  }, [cur, paused, still, steps.length, interval, go, cycle]);

  useEffect(() => () => { if (flipTimer.current) clearTimeout(flipTimer.current); }, []);

  const s = steps[cur];

  return (
    <figure
      className="step-flip relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="How to use the app, step by step"
    >
      {/* the screen */}
      <div className="relative rounded-2xl border border-slate-200 bg-slate-900 p-1.5 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        {/* window bar */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5" aria-hidden>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-[11px] text-slate-400 truncate">Traverse &amp; Level</span>
        </div>
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-800 [perspective:1600px]">
          {steps.map((st, i) => {
            const isCur = i === cur, isPrev = i === prev;
            const anim = still
              ? isCur ? "step-fade-in" : ""
              : isCur && prev !== null ? "step-flip-in" : isPrev ? "step-flip-out" : "";
            return (
              <div
                key={st.src}
                className={`absolute inset-0 [backface-visibility:hidden] ${anim}`}
                style={{ opacity: isCur || isPrev ? 1 : 0, zIndex: isPrev ? 2 : isCur ? 1 : 0 }}
                aria-hidden={!isCur}
              >
                <Image
                  src={st.src}
                  alt={st.alt}
                  width={1440}
                  height={900}
                  priority={i === 0}
                  sizes="(min-width: 1024px) 600px, 100vw"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            );
          })}
          {/* step caption */}
          <div className="hidden sm:block absolute inset-x-0 bottom-0 z-10 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent">
            <Caption key={cur} n={cur + 1} step={s} dark />
          </div>
        </div>
      </div>
      {/* on a phone the words go under the screen, so the screen stays clear */}
      <div className="sm:hidden mt-3 px-1">
        <Caption key={cur} n={cur + 1} step={s} />
      </div>

      {/* the steps in a row */}
      <ol className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((st, i) => {
          const active = i === cur, done = i < cur;
          return (
            <li key={st.src}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${i + 1}: ${st.title}`}
                aria-current={active ? "step" : undefined}
                className="group w-full text-left cursor-pointer focus-visible:outline-none"
              >
                <span className="block h-1 rounded-full bg-slate-200 overflow-hidden">
                  <span
                    key={active ? `a${cycle}` : "x"}
                    className={`block h-full rounded-full ${active ? (paused || still ? "bg-amber-500 w-full" : "bg-amber-500 step-progress") : done ? "bg-amber-300 w-full" : "w-0"}`}
                    style={active && !paused && !still ? { animationDuration: `${interval}ms` } : undefined}
                  />
                </span>
                <span className="mt-1.5 flex justify-center rounded-md py-0.5 group-focus-visible:ring-2 group-focus-visible:ring-blue-500">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold transition-colors ${
                      active ? "bg-slate-900 text-white" : done ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500 group-hover:text-slate-800"
                    }`}
                  >
                    {i + 1}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <figcaption className="sr-only" aria-live="polite">
        Step {cur + 1} of {steps.length}: {s.title}
      </figcaption>
    </figure>
  );
}

function Caption({ n, step, dark = false }: { n: number; step: FlipStep; dark?: boolean }) {
  return (
    <p className={`step-caption ${dark ? "text-white" : "text-slate-900"}`}>
      <span className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-amber-400 text-slate-950 text-[12px] font-extrabold align-middle">{n}</span>
      <span className="font-bold text-[15px] align-middle">{step.title}</span>
      <span className={`block mt-1 text-[13px] leading-snug ${dark ? "text-slate-300" : "text-slate-600"}`}>{step.text}</span>
    </p>
  );
}
