"use client";

// Survey Toolkit (beta test): the five front-page options side by side, each live and scaled
// down, with a note on its animation; any one full size; a Pause button. The animations also
// pause while the tab is hidden, and are still for anyone who asks their system for reduced
// motion. Only for the owner to choose one (app/toolkit-beta/home-options).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Columns3, Pause, Play } from "lucide-react";
import { OPTIONS, OPTION_VIEWS, type OptionId, type OptionTool } from "./options";
import "./home-options.css";

/** The width each option is drawn at in the side-by-side view, then scaled down to fit */
const PREVIEW_WIDTH = 1280;

function Scaled({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 0.3, height: 230 });
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const scale = o.clientWidth / PREVIEW_WIDTH;
      setSize({ scale, height: Math.round(Math.min(i.offsetHeight, 760) * scale) });
    };
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    fit();
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer} className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white" style={{ height: size.height }}>
      {/* a picture of the page: not reachable with the keyboard or a screen reader */}
      <div
        ref={inner}
        inert
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{ width: PREVIEW_WIDTH, transform: `scale(${size.scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

export default function HomeOptions({ tools, toolkitVersion }: { tools: OptionTool[]; toolkitVersion: string | null }) {
  const root = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"all" | OptionId>("all");
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);

  // pause while the tab is hidden
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // sections fade and slide in as they come into view (straight away with reduced motion)
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.classList.add("ho-js");
    const items = Array.from(el.querySelectorAll<HTMLElement>(".ho-reveal:not(.ho-in)"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("ho-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("ho-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [view]);

  const show = (v: "all" | OptionId) => {
    setView(v);
    window.scrollTo({ top: 0 });
  };
  const index = OPTIONS.findIndex((o) => o.id === view);
  const current = index >= 0 ? OPTIONS[index] : null;
  const View = current ? OPTION_VIEWS[current.id] : null;

  return (
    <div ref={root} className="ho-root min-h-screen bg-[#f4f6fa] text-slate-900" data-paused={paused || hidden ? "true" : "false"}>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
            <p className="text-[15px] font-extrabold tracking-tight">Survey Toolkit · Front page options</p>
            <p className="text-[12px] text-slate-500">Private: only admins see this page.</p>
          </div>
          <nav aria-label="Options" className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => show("all")}
              aria-pressed={view === "all"}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold cursor-pointer ${view === "all" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Columns3 className="w-4 h-4" aria-hidden /> Side by side
            </button>
            {OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => show(o.id)}
                aria-pressed={view === o.id}
                title={o.name}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-bold cursor-pointer ${view === o.id ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
              >
                {o.id.toUpperCase()}
                <span className="sr-only">: {o.name}</span>
              </button>
            ))}
          </nav>
          <button
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
          >
            {paused ? <Play className="w-4 h-4" aria-hidden /> : <Pause className="w-4 h-4" aria-hidden />}
            {paused ? "Play" : "Pause"}
          </button>
        </div>
      </header>

      {view === "all" || !current || !View ? (
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight">Five ways to open the Toolkit&apos;s front page</h1>
          <p className="mt-2 max-w-3xl text-[15px] text-slate-600">
            Same words in each, with the tools&apos; real versions; only the look and the motion differ. Each one is live below; open any one full size to scroll
            through it, hover the buttons and cards, and see it on a phone. Then tell us which letter to take forward.
          </p>
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {OPTIONS.map((o) => {
              const V = OPTION_VIEWS[o.id];
              return (
                <li key={o.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <Scaled>
                    <V tools={tools} toolkitVersion={toolkitVersion} heroOnly />
                  </Scaled>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#071a44] text-[13px] font-extrabold text-[#ffd21f]">{o.id.toUpperCase()}</span>
                    <h2 className="text-[16px] font-bold">{o.name}</h2>
                  </div>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-800">Animation: </span>
                    {o.note}
                  </p>
                  <button
                    onClick={() => show(o.id)}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#071a44] px-4 py-2.5 text-[14px] font-bold text-white hover:bg-[#0b2560] cursor-pointer"
                  >
                    See {o.id.toUpperCase()} full size <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-8 text-[13px] text-slate-500">
            Every option: a short entrance, a graphic that keeps moving gently, buttons and cards that react to the mouse and keyboard, sections that slide in as
            you scroll, and a Download button that pulses three times then stops. CSS only (no libraries, no video). Paused here, while the tab is hidden, and
            still for anyone whose system asks for reduced motion.
          </p>
        </main>
      ) : (
        <main>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-[18px] font-extrabold tracking-tight">
                {current.id.toUpperCase()} · {current.name}
              </h1>
              <p className="mt-1 max-w-4xl text-[13.5px] text-slate-600">
                <span className="font-semibold text-slate-800">Animation: </span>
                {current.note}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => show(OPTIONS[(index + OPTIONS.length - 1) % OPTIONS.length].id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden /> {OPTIONS[(index + OPTIONS.length - 1) % OPTIONS.length].id.toUpperCase()}
              </button>
              <button
                onClick={() => show(OPTIONS[(index + 1) % OPTIONS.length].id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
              >
                {OPTIONS[(index + 1) % OPTIONS.length].id.toUpperCase()} <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>
          {/* the option itself, full width, as the front page would show it under the site's menu */}
          <div key={current.id} className="overflow-hidden">
            <View tools={tools} toolkitVersion={toolkitVersion} />
          </div>
        </main>
      )}
    </div>
  );
}
