import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { ROADPRO_VERSION } from "@/lib/roadpro";

// Home page: the RoadPro AutoCAD plugin, leading to /roadpro
export default function RoadProTeaser() {
  return (
    <section aria-labelledby="roadpro-heading" className="py-16 lg:py-20 bg-slate-950 text-white">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/30 px-3 py-1 text-[12px] font-bold text-amber-300">
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] uppercase tracking-wider">New</span>
            RoadPro {ROADPRO_VERSION} for AutoCAD
          </p>
          <h2 id="roadpro-heading" className="mt-4 text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight leading-[1.15]">
            A complete road in AutoCAD from one command
          </h2>
          <p className="mt-3 text-[15px] text-slate-300 leading-relaxed">
            Draw the centre line and RoadPro adds the edges, turning radius, barricades, signs, chainage, cross section and an Excel
            report. Free plugin for AutoCAD, Civil 3D and Map 3D.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/roadpro" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold">
              See RoadPro <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link href="/roadpro#demo" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10">
              <PlayCircle className="w-4 h-4" aria-hidden /> Watch the demo
            </Link>
          </div>
        </div>
        <Link href="/roadpro" className="block rounded-2xl border border-white/10 bg-black p-1.5 hover:border-white/25 transition-colors">
          <Image
            src="/roadpro/road-plan.webp"
            alt="RoadPro road in AutoCAD with red and white barricades, lane arrows and chainage"
            width={1500}
            height={560}
            sizes="(min-width: 1024px) 600px, 100vw"
            className="w-full h-auto rounded-xl"
          />
        </Link>
      </div>
    </section>
  );
}
