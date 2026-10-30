"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type { PublicReview, ReviewProduct } from "@/lib/reviews";

type Data = {
  count: number;
  products: { product: ReviewProduct; count: number; average: number }[];
  reviews: (PublicReview & { product: ReviewProduct })[];
};

// Names here so this client component doesn't pull lib/reviews (and the database) into the page
const NAMES: Record<ReviewProduct, string> = {
  "excel-to-kml": "Excel to KML",
  roadpro: "RoadPro",
  traverse: "Traverse & Level",
  "project-folder-manager": "Project Folder Manager",
  "slope-calculator": "Slope Calculator",
};

// Home page: what people who downloaded our programs say (reviews published in Admin → Reviews).
// Shows nothing until at least one review with a comment is published.
export default function HomeReviews() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/reviews?product=all")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d && setData(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!data || data.reviews.length === 0) return null;
  return (
    <section aria-labelledby="home-reviews-heading" className="py-20 lg:py-24 bg-white border-b border-slate-100">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
        <p className="text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">Reviews</p>
        <h2 id="home-reviews-heading" className="mt-2 text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          What surveyors and engineers say
        </h2>

        <ul className="mt-6 flex flex-wrap gap-2.5">
          {data.products.map((p) => (
            <li key={p.product} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[13px]">
              <span className="font-semibold text-slate-800">{NAMES[p.product]}</span>
              <Stars n={Math.round(p.average)} />
              <span className="font-bold tabular-nums text-slate-900">{p.average.toFixed(1)}</span>
              <span className="text-slate-500">({p.count})</span>
            </li>
          ))}
        </ul>

        <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.reviews.map((r) => (
            <li key={r.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <Stars n={r.rating} />
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">{NAMES[r.product]}</span>
              </div>
              <p className="mt-3 text-[14px] text-slate-700 leading-relaxed whitespace-pre-line break-words flex-1">&ldquo;{r.comment}&rdquo;</p>
              <p className="mt-4 text-[12.5px] text-slate-500">
                <span className="font-semibold text-slate-700">{r.name}</span>
                {r.organization ? ` · ${r.organization}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />
      ))}
    </span>
  );
}
