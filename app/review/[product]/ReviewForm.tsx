"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, LogIn, Star } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

// The review form: stars, an optional comment, and sign-in first for someone signed out.
// Saved with POST /api/reviews; it waits in Admin → Reviews until it is published.
export default function ReviewForm({
  product,
  name,
  href,
  initialRating,
  initialComment,
  hadReview,
}: {
  product: string;
  name: string;
  href: string;
  initialRating: number;
  initialComment: string;
  hadReview: boolean;
}) {
  const { user, isLoading, requireAuth } = useAuth();
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [state, setState] = useState<"edit" | "sending" | "done">("edit");
  const [error, setError] = useState("");
  const shown = hover || rating;

  const send = async () => {
    if (!rating) return setError("Choose 1 to 5 stars.");
    setError("");
    setState("sending");
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, rating, comment }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Your review couldn't be sent.");
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("edit");
    }
  };

  if (state === "done") {
    return (
      <div role="status" className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" aria-hidden />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Thank you!</h1>
        <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">
          Your review of {name} helps other surveyors and engineers choose, and tells us what to make better. It appears on the {name}{" "}
          page once we&apos;ve read it.
        </p>
        <Link href={href} className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0071e3] hover:underline">
          Back to {name} <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.25)]">
      <p className="text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">{hadReview ? "Your review" : "Rate it"}</p>
      <h1 className="mt-2 text-[26px] sm:text-[32px] font-extrabold tracking-tight text-slate-900 leading-tight">How is {name} working for you?</h1>
      <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">
        {hadReview ? "You can change your stars or what you wrote; the new version replaces the old one." : "Pick the stars, and add a sentence or two if you like."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}: ${LABELS[n]}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className="p-1 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Star className={`w-10 h-10 transition-colors ${n <= shown ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />
          </button>
        ))}
        <span className="ml-2 text-[15px] font-semibold text-slate-700 min-w-[90px]">{LABELS[shown]}</span>
      </div>

      <label className="mt-6 block">
        <span className="text-[13px] font-semibold text-slate-700">{rating && rating <= 3 ? "What should we improve?" : "What do you like about it?"} (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          className="mt-1.5 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-base sm:text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
        />
      </label>

      {error && <p role="alert" className="mt-3 text-[14px] text-rose-600">{error}</p>}

      <div className="mt-6">
        {isLoading ? (
          <span className="inline-flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Checking your account…</span>
        ) : user ? (
          <button
            type="button"
            onClick={send}
            disabled={!rating || state === "sending"}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
            {hadReview ? "Save my review" : "Send review"}
          </button>
        ) : (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-[14px] text-slate-600">Reviews come from accounts that downloaded or used {name}. Sign in to send yours; your stars are kept.</p>
            <button
              type="button"
              onClick={() => requireAuth(() => {}, `Sign in to review ${name}.`)}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer"
            >
              <LogIn className="w-4 h-4" aria-hidden /> Sign in to send
            </button>
          </div>
        )}
      </div>
      <p className="mt-5 text-[12.5px] text-slate-500">
        Published reviews show your first name, the first letter of your last name and your organization. Something not working?{" "}
        <Link href="/contact?topic=problem" className="text-[#0071e3] hover:underline">Tell us</Link> and we&apos;ll help.
      </p>
    </div>
  );
}
