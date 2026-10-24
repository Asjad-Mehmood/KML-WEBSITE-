import React from "react";
import Link from "next/link";
import { ArrowRight, Download, Globe } from "lucide-react";
import WebAppLink from "./WebAppLink";

/** The closing card on a content page: try the web app or get the Windows app. */
// everyProgram: for pages about all of our software (About), point to every download instead
export default function NextSteps({ title = "Try it on your own points", everyProgram = false }: { title?: string; everyProgram?: boolean }) {
  if (everyProgram) {
    return (
      <section className="mt-16 rounded-3xl bg-slate-900 text-white p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight">Download any of our programs</h2>
          <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
            Excel to KML, RoadPro, Traverse &amp; Level and Project Folder Manager are all free with one account.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/#download" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-[14px] font-semibold">
            <Download className="w-4 h-4" aria-hidden /> Every download
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[14px] font-semibold">
            Contact us <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }
  return (
    <section className="mt-16 rounded-3xl bg-slate-900 text-white p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div className="max-w-xl">
        <h2 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight">{title}</h2>
        <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
          Open the web app in your browser, or install the Windows app to work offline. Both are free, with no point limit.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/download"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-[14px] font-semibold"
        >
          <Download className="w-4 h-4" aria-hidden /> Download for Windows
        </Link>
        <WebAppLink className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[14px] font-semibold">
          <Globe className="w-4 h-4" aria-hidden /> Open the web app <ArrowRight className="w-4 h-4" aria-hidden />
        </WebAppLink>
      </div>
    </section>
  );
}
