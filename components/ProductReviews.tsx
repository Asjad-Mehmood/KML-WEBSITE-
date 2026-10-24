"use client";

import { useEffect, useState } from "react";
import { MessageSquareQuote, Star } from "lucide-react";
import type { PublicReview } from "@/lib/reviews";

// What people who downloaded a program say about it: the average and the latest published
// reviews (Admin → Reviews). Shows nothing until a review has been published.
export default function ProductReviews({ product, name }: { product: string; name: string }) {
  const [data, setData] = useState<{ count: number; average: number; reviews: PublicReview[] } | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/reviews?product=${encodeURIComponent(product)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d && setData(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [product]);

  if (!data || data.count === 0) return null;
  return (
    <section aria-labelledby={`reviews-${product}`} className="mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">
            <MessageSquareQuote className="w-4 h-4" aria-hidden /> Reviews
          </p>
          <h2 id={`reviews-${product}`} className="mt-2 text-2xl sm:text-[30px] font-extrabold tracking-tight text-slate-900 leading-tight">
            What surveyors say about {name}
          </h2>
        </div>
        <p className="flex items-center gap-2 text-slate-700">
          <span className="text-3xl font-extrabold tabular-nums">{data.average.toFixed(1)}</span>
          <Stars n={Math.round(data.average)} big />
          <span className="text-[13px] text-slate-500">
            {data.count} review{data.count === 1 ? "" : "s"}
          </span>
        </p>
      </div>
      <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-slate-200 bg-[#fafbfc] p-5 flex flex-col">
            <Stars n={r.rating} />
            {r.comment && <p className="mt-2 text-[14px] text-slate-700 leading-relaxed whitespace-pre-line break-words flex-1">&ldquo;{r.comment}&rdquo;</p>}
            <p className="mt-3 text-[12.5px] text-slate-500">
              <span className="font-semibold text-slate-700">{r.name}</span>
              {r.organization ? ` · ${r.organization}` : ""}
              {r.version ? ` · ${r.version}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stars({ n, big = false }: { n: number; big?: boolean }) {
  return (
    <span className="inline-flex" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${big ? "w-5 h-5" : "w-4 h-4"} ${i <= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />
      ))}
    </span>
  );
}
