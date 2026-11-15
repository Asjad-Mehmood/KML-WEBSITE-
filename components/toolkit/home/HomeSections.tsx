// Survey Toolkit's page: What's new (each tool's newest version) and Reviews (what people say).
// Server components; their motion is CSS in home-options.css (.ho-reveal, .ho-new, .ho-marquee,
// .ho-star), still for reduced motion.
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Compass, FolderTree, Globe, MessageSquareQuote, Route, Sparkles, Star, TrendingUp, type LucideIcon } from "lucide-react";
import type { HomeReviewsData, NewsItem } from "@/lib/toolkit/homeNews";

const ICONS: Record<string, LucideIcon> = {
  "excel-to-kml": Globe,
  roadpro: Route,
  traverse: Compass,
  "folder-manager": FolderTree,
  slope: TrendingUp,
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function Eyebrow({ Icon, children }: { Icon: LucideIcon; children: string }) {
  return (
    <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1e4fd8]">
      <Icon className="w-4 h-4" aria-hidden /> {children}
    </p>
  );
}

// ---------------------------------------------------------------- what's new

export function WhatsNew({ news }: { news: NewsItem[] }) {
  if (!news.length) return null;
  return (
    <section aria-labelledby="new-h" className="bg-white">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-20">
        <div className="ho-reveal flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <Eyebrow Icon={Sparkles}>What&apos;s new</Eyebrow>
            <h2 id="new-h" className="mt-2 text-[28px] sm:text-[36px] font-extrabold tracking-tight leading-[1.1] text-[#071a44]">
              The latest of every tool, installed for you
            </h2>
            <p className="mt-3 text-[16px] text-slate-600">Each new version arrives through the Toolkit by itself. Here is what came out most recently.</p>
          </div>
          <Link href="/whats-new" className="ho-btn !px-4 !py-2 !text-[14px] border border-slate-300 text-slate-800 hover:bg-slate-50">
            All release notes <ArrowRight className="ho-arrow w-4 h-4" aria-hidden />
          </Link>
        </div>
        {/* a timeline, newest first */}
        <ol className="relative mt-10 space-y-5 before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200 sm:before:left-[27px]">
          {news.map((n, i) => {
            const Icon = ICONS[n.id] ?? Globe;
            return (
              <li key={n.id} className="ho-reveal relative flex gap-4 sm:gap-6" style={{ "--i": i } as CSSProperties}>
                <span className="relative z-[1] flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#071a44] text-[#ffd21f] ring-4 ring-white">
                  <Icon className="w-6 h-6" aria-hidden />
                </span>
                <div className="ho-card min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#1e4fd8]/40 hover:shadow-[0_18px_40px_rgba(7,26,68,0.10)]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="text-[17px] font-bold text-[#071a44]">{n.name}</h3>
                    <span className="rounded-full bg-[#eef3ff] px-2.5 py-0.5 text-[12px] font-bold tabular-nums text-[#1e4fd8]">v{n.version}</span>
                    {n.fresh && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-bold text-emerald-700">
                        <span className="ho-new h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> New
                      </span>
                    )}
                    {n.released && (
                      <time dateTime={n.released} title={fmt(n.released)} className="ml-auto text-[13px] text-slate-500">
                        Released {n.ago}
                      </time>
                    )}
                  </div>
                  {n.title && <p className="mt-2 text-[15px] font-semibold text-slate-800">{n.title}</p>}
                  {n.points.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[14px] text-slate-600">
                      {n.points.map((p) => {
                        // "Title: text" puts the title in bold, as in the release emails
                        const m = p.match(/^([^:]{2,40}):\s+(.+)$/);
                        return (
                          <li key={p} className="flex gap-2">
                            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e4fd8]/60" />
                            <span>
                              {m ? (
                                <>
                                  <strong className="font-semibold text-slate-800">{m[1]}:</strong> {m[2]}
                                </>
                              ) : (
                                p
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <Link href={n.href} className="mt-3 inline-flex items-center gap-1 py-1 text-[14px] font-semibold text-[#1e4fd8] hover:underline">
                    What&apos;s new in {n.version} <ArrowRight className="w-4 h-4" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- reviews

function Stars({ n, size = "w-4 h-4" }: { n: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`ho-star ${size} ${i <= Math.round(n) ? "fill-[#ffb800] text-[#ffb800]" : "text-slate-300"}`}
          style={{ "--s": i } as CSSProperties}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function Reviews({ data }: { data: HomeReviewsData | null }) {
  if (!data) return null;
  const all = data.products.reduce((t, p) => t + p.count, 0);
  const avg = all ? data.products.reduce((t, p) => t + p.average * p.count, 0) / all : 0;
  // enough cards to fill a wide row; the row is shown twice so it can move without a jump
  const cards = data.reviews.length < 4 ? [...data.reviews, ...data.reviews] : data.reviews;
  const moving = data.reviews.length >= 3;
  return (
    <section aria-labelledby="rev-h" className="bg-[#f6f8fc] overflow-hidden">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 pt-20">
        <div className="ho-reveal grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-6 items-end">
          <div className="max-w-3xl">
            <Eyebrow Icon={MessageSquareQuote}>Reviews</Eyebrow>
            <h2 id="rev-h" className="mt-2 text-[28px] sm:text-[36px] font-extrabold tracking-tight leading-[1.1] text-[#071a44]">
              What surveyors say
            </h2>
            <p className="mt-3 text-[16px] text-slate-600">Real reviews from people with an account, after using our programs.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3">
            <span className="text-[32px] font-extrabold tabular-nums text-[#071a44]">{avg.toFixed(1)}</span>
            <span>
              <Stars n={avg} />
              <span className="block text-[13px] text-slate-500">
                {all} {all === 1 ? "review" : "reviews"}
              </span>
            </span>
          </div>
        </div>
        {/* each program's average */}
        <ul className="ho-reveal mt-6 flex flex-wrap gap-2">
          {data.products
            .filter((p) => p.count > 0)
            .map((p) => (
              <li key={p.product}>
                <Link
                  href={p.href}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13.5px] hover:border-[#1e4fd8]/40"
                >
                  <span className="font-semibold text-slate-800">{p.name}</span>
                  <span className="inline-flex items-center gap-1 tabular-nums text-slate-600">
                    <Star className="w-3.5 h-3.5 fill-[#ffb800] text-[#ffb800]" aria-hidden /> {p.average.toFixed(1)}
                    <span className="text-slate-400">({p.count})</span>
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </div>
      <div className={`ho-reveal ho-marquee-wrap mt-8 pb-20 ${moving ? "" : "max-w-[1180px] mx-auto px-5 sm:px-8"}`}>
        <ul className={moving ? "ho-marquee pl-5" : "grid grid-cols-1 md:grid-cols-2 gap-5"}>
          {(moving ? [...cards, ...cards] : data.reviews).map((r, i) => (
            <li
              key={`${r.id}-${i}`}
              aria-hidden={moving && i >= cards.length ? true : undefined}
              className={`ho-card flex flex-col rounded-2xl border border-slate-200 bg-white p-6 ${moving ? "mr-5 w-[300px] sm:w-[380px] shrink-0" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <Stars n={r.rating} />
                <span className="text-[12px] font-semibold text-[#1e4fd8]">{r.productName}</span>
              </div>
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-700">“{r.comment}”</blockquote>
              <p className="mt-4 text-[13.5px]">
                <span className="font-bold text-slate-900">{r.name}</span>
                {r.organization && <span className="text-slate-500"> · {r.organization}</span>}
                <span className="block text-[12px] text-slate-400">
                  {r.version ? `v${r.version.replace(/^v/i, "")} · ` : ""}
                  {fmt(r.date)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
