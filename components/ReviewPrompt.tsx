"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Star, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePublicSettings } from "@/lib/publicSettings";

// Asks for a review of a program the signed-in person downloaded: a few seconds after the
// download ("Thanks for downloading…"), and again on a later visit, from a day after the
// download, if they haven't answered ("How is … working for you?"). "Later" asks again in 3 days;
// "Don't ask again" stops it for that program. Admin → Settings switches it off.

type Due = { product: string; name: string; downloadedAt: string; version: string };

const QUIET = ["/login", "/register", "/forgot-password", "/reset-password", "/admin", "/app", "/link", "/app-signin", "/unsubscribe"];
const key = (p: string) => `kml.review.snooze.${p}`;
const snoozed = (p: string) => {
  try { return Number(localStorage.getItem(key(p)) || 0) > Date.now(); } catch { return false; }
};
const snooze = (p: string, days: number) => {
  try { localStorage.setItem(key(p), String(Date.now() + days * 864e5)); } catch { /* private mode */ }
};
const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function ReviewPrompt() {
  const { user, authModalOpen } = useAuth();
  const settings = usePublicSettings();
  const path = usePathname() || "/";
  const [item, setItem] = useState<(Due & { fresh: boolean }) | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"ask" | "sending" | "done" | "error">("ask");
  const [error, setError] = useState("");

  const quiet = QUIET.some((p) => path === p || path.startsWith(`${p}/`));
  const on = Boolean(user) && settings !== null && settings?.reviewPrompt !== false && !quiet;

  const check = useCallback(async (afterDownload: boolean) => {
    try {
      const r = await fetch("/api/reviews/due", { cache: "no-store" });
      const { due } = (await r.json()) as { due: Due[] };
      const now = Date.now();
      for (const d of due ?? []) {
        const age = now - Date.parse(d.downloadedAt);
        const fresh = age < 15 * 60000;
        // just downloaded: thank and ask; otherwise only from a day after the download
        if ((fresh && afterDownload) || (!snoozed(d.product) && (fresh || age > 864e5))) {
          setItem({ ...d, fresh });
          setRating(0);
          setComment("");
          setState("ask");
          return;
        }
      }
    } catch {
      // no prompt this time
    }
  }, []);

  // on a visit: anything downloaded a while ago and not reviewed yet?
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => check(false), 4000);
    return () => clearTimeout(t);
  }, [on, check]);

  // right after a download, once the file has started
  useEffect(() => {
    if (!on) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const onDownload = () => {
      clearTimeout(t);
      t = setTimeout(() => check(true), 3500);
    };
    window.addEventListener("kml:downloaded", onDownload);
    return () => {
      clearTimeout(t);
      window.removeEventListener("kml:downloaded", onDownload);
    };
  }, [on, check]);

  if (!item || !on || authModalOpen) return null;

  const close = (days: number) => {
    snooze(item.product, days);
    setItem(null);
  };
  const send = async () => {
    if (!rating) return;
    setState("sending");
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: item.product, rating, comment, version: item.version }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Your review couldn't be sent.");
      setState("done");
      setTimeout(() => setItem(null), 3500);
    } catch (e) {
      setError((e as Error).message);
      setState("error");
    }
  };

  const shown = hover || rating;
  return (
    <aside
      role="dialog"
      aria-labelledby="review-prompt-title"
      className="signup-prompt fixed z-40 bottom-3 inset-x-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[380px] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] p-4"
    >
      <button type="button" onClick={() => close(3)} aria-label="Later" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
        <X className="w-4 h-4" aria-hidden />
      </button>
      {state === "done" ? (
        <div className="py-2 pr-6" role="status">
          <p className="font-bold text-slate-900 text-[15px]">Thank you!</p>
          <p className="mt-0.5 text-[13px] text-slate-600">Your review helps other surveyors, and helps us make {item.name} better.</p>
        </div>
      ) : (
        <>
          <p id="review-prompt-title" className="font-bold text-slate-900 text-[15px] pr-8">
            {item.fresh ? `Thanks for downloading ${item.name}!` : `How is ${item.name} working for you?`}
          </p>
          <p className="mt-0.5 text-[13px] text-slate-600 leading-relaxed">
            {item.fresh ? "Once you've tried it, rate it here. It takes ten seconds." : "Your rating helps other surveyors choose, and tells us what to improve."}
          </p>
          <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n === 1 ? "" : "s"}: ${LABELS[n]}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="p-0.5 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Star className={`w-7 h-7 transition-colors ${n <= shown ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />
              </button>
            ))}
            <span className="ml-2 text-[12.5px] font-semibold text-slate-600">{LABELS[shown]}</span>
          </div>
          {rating > 0 && (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={rating <= 3 ? "What should we improve? (optional)" : "What do you like about it? (optional)"}
              aria-label="Your review"
              className="mt-3 w-full px-3 py-2 rounded-xl border border-slate-200 text-base sm:text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          )}
          {state === "error" && <p role="alert" className="mt-2 text-[12.5px] text-rose-600">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={send}
              disabled={!rating || state === "sending"}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              {state === "sending" ? "Sending…" : "Send review"}
            </button>
            <button type="button" onClick={() => close(3)} className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[13.5px] font-semibold hover:bg-slate-50 cursor-pointer">
              Later
            </button>
          </div>
          <button type="button" onClick={() => close(3650)} className="mt-2 w-full text-center text-[12px] text-slate-500 hover:text-slate-700 cursor-pointer">
            Don&apos;t ask again
          </button>
        </>
      )}
    </aside>
  );
}
