"use client";

// Survey Toolkit's page: an update, start to finish, in three real screens of the Toolkit. It plays
// by itself (a bar fills under the step), a step can be picked by hand, it pauses while the pointer
// or the keyboard is on it and while it is off screen, and with reduced motion it stays on the step
// that is picked (no autoplay). The screens cross-fade; the step text slides in.
import { useEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { BellRing, CheckCircle2, Download, type LucideIcon } from "lucide-react";
import toolsPng from "@/components/toolkit/images/tour-1-notices.png";
import updatingPng from "@/components/toolkit/images/tour-2-updating.png";
import updatedPng from "@/components/toolkit/images/tour-3-done.png";

interface TourStep {
  Icon: LucideIcon;
  title: string;
  text: string;
  src: StaticImageData;
  alt: string;
}

// real screens of the Toolkit (its screenshot test, test/shots_test.dart in its repository)
const STEPS: TourStep[] = [
  {
    Icon: BellRing,
    title: "It notices",
    text: "On start and every 4 hours the Toolkit checks each tool. A new version shows at once: here, Excel to KML 4.4.3 → 4.4.4.",
    src: toolsPng,
    alt: "The Toolkit's home: 1 update available, Excel to KML installed 4.4.3, latest 4.4.4",
  },
  {
    Icon: Download,
    title: "It downloads and checks",
    text: "The official installer comes down and its SHA-256 must match before anything runs. A tool that is open waits until you close it.",
    src: updatingPng,
    alt: "Excel to KML's card while it updates: downloading, 42 %",
  },
  {
    Icon: CheckCircle2,
    title: "It's done",
    text: "Up to date, with nobody pressing anything. A Windows notification says what was updated.",
    src: updatedPng,
    alt: "After the update: everything installed is up to date, Excel to KML 4.4.4",
  },
];

const STEP_MS = 4500;

export default function UpdateTour({ steps = STEPS }: { steps?: TourStep[] }) {
  const [at, setAt] = useState(0);
  const [hold, setHold] = useState(false);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setStill(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // play only while it is on screen
  useEffect(() => {
    const el = box.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = seen && !hold && !still;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setAt((i) => (i + 1) % steps.length), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, at, steps.length]);

  return (
    <div
      ref={box}
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-8 items-center"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <ol className="space-y-3" aria-label="An update, step by step">
        {steps.map((s, i) => {
          const on = i === at;
          return (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => setAt(i)}
                aria-current={on ? "step" : undefined}
                className={`ho-tour-step group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-colors cursor-pointer ${
                  on ? "border-[#1e4fd8]/40 bg-white shadow-[0_18px_40px_rgba(7,26,68,0.10)]" : "border-transparent bg-transparent hover:bg-white/60"
                }`}
              >
                <span className="flex items-start gap-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      on ? "bg-[#071a44] text-[#ffd21f]" : "bg-[#eef3ff] text-[#1e4fd8]"
                    }`}
                  >
                    <s.Icon className="w-5 h-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold uppercase tracking-wider text-slate-400">Step {i + 1}</span>
                    <span className="block text-[17px] font-bold text-[#071a44]">{s.title}</span>
                    <span className={`block text-[14.5px] text-slate-600 ${on ? "ho-tour-text" : "hidden sm:block sm:opacity-70"}`}>{s.text}</span>
                  </span>
                </span>
                {/* the time left on this step */}
                {on && (
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-[#eef3ff]">
                    <span
                      key={`${at}-${playing}`}
                      className="ho-tour-bar block h-full bg-[#1e4fd8]"
                      style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: playing ? "running" : "paused" }}
                    />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <figure className="relative rounded-2xl border border-slate-200 bg-[#071a44] p-1.5 shadow-[0_24px_60px_rgba(7,26,68,0.18)]">
        <div className="relative overflow-hidden rounded-xl">
          {/* the first screen sets the size; the others lie on top of it */}
          {steps.map((s, i) => (
            <Image
              key={s.title}
              src={s.src}
              alt={s.alt}
              sizes="(min-width: 1024px) 640px, 100vw"
              aria-hidden={i !== at}
              className={`w-full h-auto transition-[opacity,transform] duration-700 ease-out ${i === 0 ? "relative" : "absolute inset-0"} ${
                i === at ? "opacity-100 scale-100" : "opacity-0 scale-[1.015]"
              }`}
            />
          ))}
        </div>
        <figcaption className="sr-only">{steps[at].alt}</figcaption>
      </figure>
    </div>
  );
}
