"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Share2 } from "lucide-react";

/*
 * Share links: a tool's values in its address, so a link opens the tool with the same answer.
 * Only the /use pages read them, and those are kept out of search, so long links never
 * become duplicate pages in Google.
 */

/** Links longer than this don't survive every chat app; say so instead of sharing a broken one. */
const MAX_URL = 6000;

/** The value of `key` in the address when it was opened in `mode` (or any mode), else `fallback`. */
export function useShared() {
  const sp = useSearchParams();
  return (key: string, fallback: string, mode?: { key: string; value: string; isDefault?: boolean }) => {
    if (mode) {
      const m = sp.get(mode.key);
      if (m ? m !== mode.value : !mode.isDefault) return fallback;
    }
    const v = sp.get(key);
    return v === null ? fallback : v.slice(0, 20000);
  };
}

/** Share (phone) or copy (computer) a link that opens this tool with these values. */
export function ShareButton({ params, title }: { params: Record<string, string>; title: string }) {
  const [state, setState] = useState<"idle" | "copied" | "long" | "failed">("idle");
  const click = async () => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== ""));
    const url = `${window.location.origin}${window.location.pathname}?${q.toString()}`;
    if (url.length > MAX_URL) return setState("long");
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      // the share sheet closed without sharing: nothing to say
      if ((e as Error)?.name === "AbortError") return;
      setState("failed");
    }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={click}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-200 hover:text-[#0071e3] text-[13px] font-semibold text-slate-700 cursor-pointer"
      >
        {state === "copied" ? <Check className="w-4 h-4 text-emerald-600" aria-hidden /> : <Share2 className="w-4 h-4" aria-hidden />}
        {state === "copied" ? "Link copied" : "Share link"}
      </button>
      {state === "long" && <span role="status" className="text-[12px] text-amber-700">Too much to fit in a link — copy the results instead.</span>}
      {state === "failed" && <span role="status" className="text-[12px] text-amber-700">Couldn&apos;t copy the link here.</span>}
    </span>
  );
}
