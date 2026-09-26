import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { MAIN_STEPS } from "@/lib/tutorial";

// Home page: the four steps of the app, each with a screenshot, leading to
// the full tutorial
export default function TutorialTeaser() {
  return (
    <section id="tutorial" aria-labelledby="tutorial-heading" className="py-20 lg:py-24 bg-white border-b border-slate-100">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
          <div className="max-w-[620px]">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">
              <PlayCircle className="w-4 h-4" aria-hidden /> App tutorial
            </p>
            <h2 id="tutorial-heading" className="mt-2 text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              See How the App Works
            </h2>
            <p className="mt-3 text-sm sm:text-[15px] text-slate-500 leading-relaxed">
              Four steps from your survey sheet to Google Earth — with screenshots of the real app.
            </p>
          </div>
          <Link
            href="/tutorial"
            className="shrink-0 self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold"
          >
            Full tutorial <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MAIN_STEPS.map((s, i) => (
            <li key={s.id}>
              <Link href={`/tutorial#${s.id}`} className="group block h-full rounded-2xl border border-slate-200/80 bg-[#fafbfc] p-3 hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all">
                <div className="rounded-xl overflow-hidden bg-slate-900">
                  <Image src={s.image} alt={s.alt} width={s.width} height={s.height} sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 90vw" className="w-full aspect-[16/10] object-cover object-left-top group-hover:scale-[1.02] transition-transform duration-300" />
                </div>
                <div className="px-1.5 pt-3 pb-1">
                  <p className="text-[12px] font-bold text-[#0071e3]">Step {i + 1}</p>
                  <h3 className="mt-0.5 text-[15.5px] font-bold text-slate-900 group-hover:text-[#0071e3]">{s.title}</h3>
                  <p className="mt-1 text-[13.5px] text-slate-500 leading-relaxed">{s.short}</p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
