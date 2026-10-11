"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type HeroSlide = { src: string; alt: string; caption: string };

/**
 * Screens of the app that fade one into the next, with a caption and dots to jump to any of them.
 * Pauses while pointed at or focused, and stays on the first screen for people who prefer less
 * motion (the dots still work).
 */
export default function HeroSlides({ slides, interval = 4500 }: { slides: HeroSlide[]; interval?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || still || slides.length < 2) return;
    timer.current = setInterval(() => setI((n) => (n + 1) % slides.length), interval);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, still, slides.length, interval]);

  return (
    <figure
      className="relative rounded-2xl border border-slate-200 bg-slate-900 p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Screens of the Traverse & Level app"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-900">
        {slides.map((s, n) => (
          <Image
            key={s.src}
            src={s.src}
            alt={s.alt}
            fill
            priority={n === 0}
            sizes="(min-width: 1024px) 600px, 100vw"
            aria-hidden={n !== i}
            className={`object-cover object-top transition-opacity duration-700 ease-in-out ${n === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <figcaption
          aria-live={paused ? "polite" : "off"}
          className="absolute left-3 bottom-3 max-w-[80%] rounded-full bg-slate-900/80 backdrop-blur px-3 py-1 text-[12px] font-semibold text-white shadow"
        >
          {slides[i]?.caption}
        </figcaption>
      </div>
      <div className="flex justify-center gap-1.5 pt-2.5 pb-1">
        {slides.map((s, n) => (
          <button
            key={s.src}
            type="button"
            onClick={() => setI(n)}
            aria-label={`Show ${s.caption}`}
            aria-current={n === i}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${n === i ? "w-6 bg-amber-400" : "w-1.5 bg-slate-600 hover:bg-slate-400"}`}
          />
        ))}
      </div>
    </figure>
  );
}
