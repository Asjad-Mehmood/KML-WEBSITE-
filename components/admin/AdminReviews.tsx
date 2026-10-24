"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, EyeOff, Loader2, RefreshCw, Star, Trash2, Undo2 } from "lucide-react";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
type Review = {
  id: string; userId: string; email: string | null; name: string | null; product: string; rating: number; comment: string;
  version: string; status: "pending" | "published" | "hidden"; createdAt: string; updatedAt: string;
};
type Summary = { product: string; status: string; count: number; average: number };

const PRODUCTS: Record<string, string> = {
  "excel-to-kml": "Excel to KML",
  roadpro: "RoadPro",
  traverse: "Traverse & Level",
  "project-folder-manager": "Project Folder Manager",
};
const STATUS_TAG: Record<Review["status"], string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  published: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  hidden: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const Stars = ({ n }: { n: number }) => (
  <span className="inline-flex" aria-label={`${n} of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} aria-hidden />
    ))}
  </span>
);

/** Admin → Reviews: what people said after downloading, to publish on the program pages or hide. */
export default function AdminReviews({ adminFetch, onToast, onCounts }: { adminFetch: Fetcher; onToast: (m: string, t?: "success" | "error") => void; onCounts?: (pending: number) => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [status, setStatus] = useState<"" | Review["status"]>("pending");
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch(`/api/admin/reviews?${new URLSearchParams({ status, product })}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load the reviews"))))
      .then((d) => {
        setReviews(d.reviews || []);
        setSummary(d.summary || []);
        onCounts?.((d.summary || []).filter((s: Summary) => s.status === "pending").reduce((t: number, s: Summary) => t + s.count, 0));
      })
      .catch((e) => onToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [adminFetch, status, product, onToast, onCounts]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const act = async (r: Review, next: Review["status"] | "delete") => {
    if (next === "delete" && !window.confirm(`Delete this review by ${r.email || "this account"}? This can't be undone.`)) return;
    setBusy(r.id);
    try {
      const res = next === "delete"
        ? await adminFetch(`/api/admin/reviews?id=${encodeURIComponent(r.id)}`, { method: "DELETE" })
        : await adminFetch("/api/admin/reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, status: next }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't change the review");
      onToast(next === "delete" ? "Review deleted" : next === "published" ? "Published on the program's page" : next === "hidden" ? "Review hidden" : "Back to pending");
      load();
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  const per = (p: string) => {
    const rows = summary.filter((s) => s.product === p);
    const all = rows.reduce((t, s) => t + s.count, 0);
    const avg = all ? rows.reduce((t, s) => t + s.average * s.count, 0) / all : 0;
    return { all, avg, pending: rows.find((s) => s.status === "pending")?.count ?? 0, published: rows.find((s) => s.status === "published")?.count ?? 0 };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Reviews</h3>
          <p className="text-xs text-slate-400">Ratings people gave after downloading. New and changed reviews wait here; published ones show on the program&apos;s page.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Status" className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(["pending", "published", "hidden", ""] as const).map((s) => (
              <button
                key={s || "all"}
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${status === s ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {s === "" ? "All" : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <select value={product} onChange={(e) => setProduct(e.target.value)} aria-label="Program" className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white">
            <option value="">Every program</option>
            {Object.entries(PRODUCTS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button onClick={load} aria-label="Refresh" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(PRODUCTS).map(([k, v]) => {
          const s = per(k);
          return (
            <div key={k} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{v}</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-white tabular-nums">
                {s.all ? s.avg.toFixed(1) : "–"} <Stars n={Math.round(s.avg)} />
              </p>
              <p className="text-[11px] text-slate-400">
                {s.all} review{s.all === 1 ? "" : "s"} · {s.published} published{s.pending ? ` · ${s.pending} waiting` : ""}
              </p>
            </div>
          );
        })}
      </div>

      {loading && !reviews.length ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 p-6"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400 text-sm">
          {status === "pending" ? "No reviews waiting." : "No reviews here yet."}
        </div>
      ) : (
        <ul className="space-y-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <Stars n={r.rating} />
                    <span className="font-semibold text-white">{PRODUCTS[r.product] || r.product}</span>
                    {r.version && <span className="text-xs text-slate-500">{r.version}</span>}
                    <span className={`px-2 py-0.5 rounded-full border text-[10.5px] font-bold ${STATUS_TAG[r.status]}`}>{r.status}</span>
                  </p>
                  <p className="mt-1.5 text-[13.5px] text-slate-200 whitespace-pre-line break-words">{r.comment || <span className="text-slate-500 italic">No comment, stars only</span>}</p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {r.name || "Deleted account"}{r.email ? ` · ${r.email}` : ""} · {new Date(r.updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status !== "published" && (
                    <button onClick={() => act(r, "published")} disabled={busy === r.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 cursor-pointer disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Publish
                    </button>
                  )}
                  {r.status !== "hidden" && (
                    <button onClick={() => act(r, "hidden")} disabled={busy === r.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700/70 border border-slate-600/50 text-xs font-semibold text-slate-200 cursor-pointer disabled:opacity-50">
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </button>
                  )}
                  {r.status !== "pending" && (
                    <button onClick={() => act(r, "pending")} disabled={busy === r.id} aria-label="Back to pending" className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white cursor-pointer disabled:opacity-50">
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => act(r, "delete")} disabled={busy === r.id} aria-label="Delete review" className="p-1.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
