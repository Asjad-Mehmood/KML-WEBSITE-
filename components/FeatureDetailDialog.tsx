"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { X, ArrowRight, Lightbulb, CheckCircle2 } from "lucide-react";
import { FEATURE_DETAILS } from "@/lib/featureDetails";

export interface DialogTheme {
  icon: React.ElementType;
  badge: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
}

interface Props {
  /** Key into FEATURE_DETAILS; null keeps the dialog closed */
  item: string | null;
  /** Other tags on the same card, offered as quick links */
  siblings: string[];
  theme: DialogTheme | null;
  onSelect: (item: string) => void;
  onClose: () => void;
}

// Native <dialog>: showModal() gives focus trapping, Esc to close and a
// backdrop for free, and the browser returns focus to the tag afterwards.
export default function FeatureDetailDialog({ item, siblings, theme, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const detail = item ? FEATURE_DETAILS[item] : null;

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (detail && !dlg.open) dlg.showModal();
    if (!detail && dlg.open) dlg.close();
  }, [detail]);

  // Switching between tags inside the dialog starts the content from the top
  useEffect(() => {
    ref.current?.querySelector("[data-scroll]")?.scrollTo({ top: 0 });
  }, [item]);

  const Icon = theme?.icon;

  return (
    <dialog
      ref={ref}
      aria-labelledby="feature-detail-title"
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> element itself
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[560px] max-h-[min(88vh,760px)] p-0 rounded-2xl bg-white text-slate-900 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.45)] backdrop:bg-slate-900/55 backdrop:backdrop-blur-[2px] open:flex flex-col overflow-hidden"
    >
      {detail && theme && Icon && (
        <>
          {/* Header */}
          <div className="flex items-start gap-3.5 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-slate-100">
            <div
              className={`w-10 h-10 rounded-xl ${theme.accentLight} ${theme.accent} ${theme.accentBorder} border flex items-center justify-center shrink-0`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[10.5px] font-bold uppercase tracking-wider ${theme.accent}`}>{theme.badge}</p>
              <h3 id="feature-detail-title" className="text-[17px] sm:text-lg font-bold tracking-tight leading-snug mt-0.5">
                {detail.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1.5 -mt-1 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Body */}
          <div data-scroll className="overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
            <p className="text-[14px] text-slate-600 leading-relaxed">{detail.summary}</p>

            {detail.specs && (
              <dl className="rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
                {detail.specs.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] gap-3 px-3.5 py-2 text-[12.5px]">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                How it works in Excel to KML
              </h4>
              <ul className="space-y-2.5">
                {detail.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[13.5px] text-slate-700 leading-relaxed">
                    <CheckCircle2 className={`w-4 h-4 mt-[3px] shrink-0 ${theme.accent}`} aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {detail.tip && (
              <p className="flex gap-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 px-3.5 py-3 text-[12.5px] text-amber-900 leading-relaxed">
                <Lightbulb className="w-4 h-4 mt-px shrink-0 text-amber-600" aria-hidden />
                <span>{detail.tip}</span>
              </p>
            )}

            {siblings.length > 1 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Also on this card</h4>
                <div className="flex flex-wrap gap-1.5">
                  {siblings.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSelect(s)}
                      aria-current={s === item ? "true" : undefined}
                      className={`text-[11.5px] font-medium px-2.5 py-1 rounded-lg border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        s === item
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-slate-50 border-slate-200/80 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Close
            </button>
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Try it in the web app
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </dialog>
  );
}
