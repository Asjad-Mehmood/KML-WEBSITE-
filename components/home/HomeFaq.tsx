import Link from "next/link";
import { ArrowRight, ChevronDown, Mail } from "lucide-react";
import { HOME_FAQS } from "@/lib/faqs";

// Home page: a question or two about every program. Its FAQPage data (FaqStructuredData home)
// reads the same list, so the two always match.
export default function HomeFaq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24 py-20 lg:py-24 bg-slate-50 border-b border-slate-100">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 lg:gap-12">
        <div className="lg:col-span-4">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">Questions</p>
          <h2 id="faq-heading" className="mt-2 text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Asked before you download
          </h2>
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
            The short answers. Each program&apos;s page has its own troubleshooting, and the FAQ has every Excel to KML question.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link href="/faq" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0071e3] hover:underline">
              All Excel to KML questions <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate-600 hover:text-[#0071e3]">
              <Mail className="w-4 h-4" aria-hidden /> Ask us something else
            </Link>
          </div>
        </div>

        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
          {HOME_FAQS.map((f, i) => (
            <details key={f.q} open={i === 0} className="group px-5 sm:px-6">
              <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h3 className="text-[15px] font-semibold text-slate-900">{f.q}</h3>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="pb-5 -mt-1 text-[14px] text-slate-600 leading-relaxed">
                <p>{f.a}</p>
                {f.href && (
                  <Link href={f.href} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0071e3] hover:underline">
                    Read more <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
