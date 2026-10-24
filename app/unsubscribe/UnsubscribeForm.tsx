"use client";

import { useState } from "react";
import { BellOff, BellRing, Loader2 } from "lucide-react";

// Stop or restart release emails for the address in the signed link
export default function UnsubscribeForm({ token, initiallyOut }: { token: string; initiallyOut: boolean }) {
  const [out, setOut] = useState(initiallyOut);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = async (action: "out" | "in") => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/unsubscribe?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setOut(action === "out");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8" aria-live="polite">
      {out ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="flex items-center gap-2 font-semibold text-emerald-900">
            <BellOff className="w-5 h-5" aria-hidden /> Emails about our programs are off.
          </p>
          <p className="mt-1 text-[14.5px] text-emerald-900/80">Changed your mind? You can turn them back on.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => change("in")}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-300 bg-white text-emerald-900 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-60 cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <BellRing className="w-4 h-4" aria-hidden />} Send me these emails again
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => change("out")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <BellOff className="w-4 h-4" aria-hidden />} Stop these emails
        </button>
      )}
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
