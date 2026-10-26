import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import PageShell from "../PageShell";
import { TOOLS, toolBySlug } from "@/lib/tools";
import ToolCta from "./ToolCta";

/** The tool itself, full width and ready to use; its front page is one click away. */
export default function ToolWorkspace({ slug, children }: { slug: string; children: React.ReactNode }) {
  const tool = toolBySlug(slug)!;
  const others = TOOLS.filter((t) => t.slug !== slug);
  return (
    <PageShell>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <nav aria-label="Breadcrumb" className="text-[13px] text-slate-500">
              <Link href="/tools" className="hover:text-[#0071e3]">Free tools</Link>
              <span className="mx-1.5">/</span>
              <Link href={`/tools/${slug}`} className="hover:text-[#0071e3]">{tool.name}</Link>
            </nav>
            <h1 className="mt-1 text-[24px] sm:text-[30px] font-extrabold tracking-tight text-slate-900">{tool.name}</h1>
          </div>
          <Link href={`/tools/${slug}`} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate-600 hover:text-[#0071e3]">
            <Info className="w-4 h-4" aria-hidden /> How it works
          </Link>
        </div>

        {/* the tools read shared values from the address, which needs a Suspense boundary */}
        <section className="mt-6">
          <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>{children}</Suspense>
        </section>

        <p className="mt-4 text-[12.5px] text-slate-500">Worked out in your browser: nothing you type here is sent anywhere or kept.</p>

        {/* the program that does this for a whole survey */}
        <ToolCta slug={slug} className="mt-6" />

        <nav aria-label="Other tools" className="mt-10 flex flex-wrap items-center gap-2">
          <Link href="/tools" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-slate-600 hover:text-[#0071e3]">
            <ArrowLeft className="w-4 h-4" aria-hidden /> All tools
          </Link>
          {others.map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}/use`} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-[#0071e3]">
              {t.name}
            </Link>
          ))}
        </nav>
      </div>
    </PageShell>
  );
}
