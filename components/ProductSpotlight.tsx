import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from "lucide-react";
import { PRODUCTS, badgeLabel, type Product } from "@/lib/products";

// Home page, right after the hero: our other software (lib/products.ts).
// One product gets the full spotlight; several are shown as a grid of cards.
export default function ProductSpotlight() {
  if (PRODUCTS.length === 0) return null;
  const single = PRODUCTS.length === 1;
  return (
    <section id="more-software" aria-labelledby="spotlight-heading" className="relative py-16 lg:py-20 bg-slate-950 text-white overflow-hidden">
      <div className="absolute -top-24 right-0 w-[520px] h-[320px] bg-[#0071e3]/25 rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <div className="relative max-w-[1140px] mx-auto px-5 sm:px-8">
        <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-sky-300">
          <Sparkles className="w-4 h-4" aria-hidden /> {single ? "Spotlight" : "More from Excel to KML"}
        </p>
        {single ? (
          <Feature p={PRODUCTS[0]} />
        ) : (
          <>
            <h2 id="spotlight-heading" className="mt-2 text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight">
              More tools for surveyors and engineers
            </h2>
            <ul className={`mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 ${PRODUCTS.length > 2 ? "lg:grid-cols-3" : ""}`}>
              {PRODUCTS.map((p) => (
                <li key={p.id}>
                  <Card p={p} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

/** The product's picture, or its silent loop (with the picture as the poster) when it has one */
function Media({ p, sizes, className }: { p: Product; sizes: string; className: string }) {
  if (p.video) {
    return (
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={p.image.src}
        width={p.image.width}
        height={p.image.height}
        aria-label={p.image.alt}
        className={className}
      >
        <source src={p.video.src} type="video/mp4" />
        {p.video.webm && <source src={p.video.webm} type="video/webm" />}
      </video>
    );
  }
  return <Image src={p.image.src} alt={p.image.alt} width={p.image.width} height={p.image.height} sizes={sizes} className={className} />;
}

function Label({ p }: { p: Product }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/30 px-3 py-1 text-[12px] font-bold text-amber-300">
      {badgeLabel(p) && <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] uppercase tracking-wider">{badgeLabel(p)}</span>}
      {p.name} {p.version} · {p.platform}
    </span>
  );
}

function Feature({ p }: { p: Product }) {
  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 items-center">
      <div>
        <Label p={p} />
        <h2 id="spotlight-heading" className="mt-4 text-2xl sm:text-3xl lg:text-[38px] font-extrabold tracking-tight leading-[1.12]">
          {p.tagline}
        </h2>
        <p className="mt-3 text-[15px] sm:text-base text-slate-300 leading-relaxed">{p.description}</p>
        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
          {p.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2 text-[14px] text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden /> {h}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={p.href} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.35)]">
            Explore {p.name} <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          {p.demoHref && (
            <Link href={p.demoHref} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10">
              <PlayCircle className="w-4 h-4" aria-hidden /> Watch the demo
            </Link>
          )}
        </div>
      </div>
      <Link href={p.href} aria-label={`${p.name}: ${p.tagline}`} className="block rounded-2xl border border-white/10 bg-black p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] hover:border-white/25 transition-colors">
        <Media p={p} sizes="(min-width: 1024px) 600px, 100vw" className="w-full h-auto rounded-xl" />
      </Link>
    </div>
  );
}

function Card({ p }: { p: Product }) {
  return (
    <Link href={p.href} className="group flex flex-col h-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 hover:border-white/25 hover:bg-white/[0.06] transition-colors">
      <div className="rounded-xl overflow-hidden bg-black">
        <Media p={p} sizes="(min-width: 1024px) 360px, (min-width: 768px) 45vw, 100vw" className="w-full aspect-[16/9] object-cover" />
      </div>
      <div className="px-1.5 pt-4 pb-1 flex-1 flex flex-col">
        <Label p={p} />
        <h3 className="mt-3 text-lg font-bold">{p.tagline}</h3>
        <p className="mt-1.5 text-[14px] text-slate-300 leading-relaxed flex-1">{p.description}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 group-hover:text-sky-200">
          Explore {p.name} <ArrowRight className="w-4 h-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
