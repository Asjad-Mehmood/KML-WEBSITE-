"use client";

// Survey Toolkit's page: the Toolkit itself, a screen at a time. Real screens of the Toolkit
// (from its screenshot test, test/shots_test.dart in the Survey-Toolkit repository), in a
// Windows window. It moves on to the next screen by itself until a tab is picked; it stays
// still for reduced motion and while the tab is hidden.
import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { DraftingCompass, Moon, RefreshCw, Route, type LucideIcon } from "lucide-react";
import updatingPng from "@/assets/toolkit/shot-updating.webp";
import draftingPng from "@/assets/toolkit/shot-drafting.webp";
import roadproPng from "@/assets/toolkit/shot-roadpro.webp";
import darkPng from "@/assets/toolkit/shot-home-dark.webp";

type Tab = { id: string; label: string; Icon: LucideIcon; title: string; text: string; img: StaticImageData; alt: string };

const TABS: Tab[] = [
  {
    id: "updates",
    label: "Updates",
    Icon: RefreshCw,
    title: "Updates that install themselves",
    text: "The official installer is downloaded and checked by its SHA-256, then installed, never while the tool is open.",
    img: updatingPng,
    alt: "The Survey Toolkit downloading an update of Excel to KML, 42 % done",
  },
  {
    id: "drafting",
    label: "Apps inside",
    Icon: DraftingCompass,
    title: "Your programs, inside the Toolkit",
    text: "Auto Drafting, Excel to KML, Traverse & Level and Slope Calculator open in the same window, already signed in.",
    img: draftingPng,
    alt: "Auto Drafting open inside the Survey Toolkit, with the sidebar of apps",
  },
  {
    id: "roadpro",
    label: "RoadPro",
    Icon: Route,
    title: "AutoCAD, one click away",
    text: "Start the AutoCAD on your PC with RoadPro loaded, and find any RoadPro command in a second.",
    img: roadproPng,
    alt: "RoadPro in the Survey Toolkit: start AutoCAD and the RoadPro commands",
  },
  {
    id: "dark",
    label: "Dark mode",
    Icon: Moon,
    title: "Light, dark, or as Windows",
    text: "The Toolkit follows your Windows theme, or the one you choose in Settings.",
    img: darkPng,
    alt: "The Survey Toolkit's Home in dark mode",
  },
];

const STEP_MS = 6500;

export default function ProductTabs() {
  const [at, setAt] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setAt((i) => (i + 1) % TABS.length);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [auto]);

  const tab = TABS[at];
  return (
    <div>
      <div role="tablist" aria-label="Screens of the Survey Toolkit" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        {TABS.map((t, i) => {
          const on = i === at;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`pt-tab-${t.id}`}
              aria-selected={on}
              aria-controls="pt-panel"
              onClick={() => {
                setAt(i);
                setAuto(false);
              }}
              className={`relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-[14px] font-semibold transition-colors ${
                on ? "border-[#071a44] bg-[#071a44] text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-[#071a44]"
              }`}
            >
              <t.Icon className="w-4 h-4" aria-hidden />
              {t.label}
              {/* how long until the next screen */}
              {on && auto && <span key={at} aria-hidden className="pt-progress absolute bottom-0 left-0 h-[2px] w-full origin-left bg-[#ffd21f]" style={{ animationDuration: `${STEP_MS}ms` }} />}
            </button>
          );
        })}
      </div>

      <div id="pt-panel" role="tabpanel" aria-labelledby={`pt-tab-${tab.id}`} className="mt-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[20px] font-bold text-[#071a44]">{tab.title}</p>
          <p className="mt-1.5 text-[15px] text-slate-600">{tab.text}</p>
        </div>
        <Window className="mt-8">
          {/* every screen is there, one shown: no wait when switching */}
          <div className="relative aspect-[16/10]">
            {TABS.map((t, i) => (
              <Image
                key={t.id}
                src={t.img}
                alt={i === at ? t.alt : ""}
                aria-hidden={i !== at}
                sizes="(min-width: 1180px) 1100px, 100vw"
                className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${i === at ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
        </Window>
      </div>
      <style>{`
        .pt-progress { animation: pt-progress linear forwards; transform: scaleX(0); }
        @keyframes pt-progress { to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) { .pt-progress { display: none; } }
      `}</style>
    </div>
  );
}

/** A Windows window around a screen of the Toolkit */
export function Window({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_40px_90px_-20px_rgba(7,26,68,0.30),0_0_0_1px_rgba(7,26,68,0.03)] ${className}`}>
      <div aria-hidden className="flex h-9 items-center justify-between border-b border-slate-200 bg-[#f3f4f6] pl-3">
        <span className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
          <span className="grid h-4 w-4 grid-cols-2 gap-[2px] rounded-[4px] bg-[#071a44] p-[3px]">
            <i className="rounded-[1px] bg-white/80" />
            <i className="rounded-[1px] bg-white/80" />
            <i className="rounded-[1px] bg-white/80" />
            <i className="rounded-[1px] bg-[#ffd21f]" />
          </span>
          Survey Toolkit
        </span>
        <span className="flex h-full text-slate-500">
          <span className="flex w-11 items-center justify-center">
            <i className="block h-px w-2.5 bg-current" />
          </span>
          <span className="flex w-11 items-center justify-center">
            <i className="block h-2.5 w-2.5 border border-current" />
          </span>
          <span className="flex w-11 items-center justify-center text-[15px] leading-none">×</span>
        </span>
      </div>
      {children}
    </div>
  );
}
