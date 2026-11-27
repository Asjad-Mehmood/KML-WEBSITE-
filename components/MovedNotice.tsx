"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ArrowRight, X } from "lucide-react";

// Someone who came from the old address: exceltokml.com sends every page to the same page here
// with ?from=exceltokml (the Old-website-redirecting- repository). A short note says the site
// has moved, and the address bar loses the ?from= so a copied link is clean. Only until
// MOVED_NOTICE_UNTIL (five days); after that people arriving from the old address see the page only.
const listeners = new Set<() => void>();
let closed = false;

/** The note shows for five days after the move (27 November 2026), then never again */
export const MOVED_NOTICE_UNTIL = Date.parse("2026-12-02T23:59:59Z");

// read once, when the page opens: the ?from= is taken off the address straight after
let arrived: boolean | null = null;
const fromOldSite = () => {
  if (closed || Date.now() > MOVED_NOTICE_UNTIL) return false;
  if (arrived === null) {
    try {
      arrived = new URLSearchParams(window.location.search).get("from") === "exceltokml";
    } catch {
      arrived = false;
    }
  }
  return arrived;
};

export default function MovedNotice() {
  const show = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    fromOldSite,
    () => false
  );

  // the ?from= comes off the address in any case, also once the five days are over
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get("from") !== "exceltokml") return;
      u.searchParams.delete("from");
      window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
    } catch {
      // the note still shows; the address keeps ?from=
    }
  }, []);

  if (!show) return null;
  const close = () => {
    closed = true;
    listeners.forEach((l) => l());
  };
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] px-3 pt-3 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-[640px] flex items-start gap-3 rounded-2xl border border-[#ffd21f]/60 bg-[#071a44] text-white px-4 py-3 shadow-[0_18px_40px_-18px_rgba(7,26,68,0.6)]">
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold">Excel to KML is now SurveyX Digital</p>
          <p className="mt-0.5 text-[13px] text-white/80 leading-snug">
            exceltokml.com has moved to <b className="text-[#ffd21f]">surveyxdigital.com</b>. The same free programs and the same account:
            sign in as before.
          </p>
          <a href="/about" className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#ffd21f] hover:underline">
            About SurveyX Digital <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </a>
        </div>
        <button onClick={close} aria-label="Close" className="shrink-0 rounded-lg p-1 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer">
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
