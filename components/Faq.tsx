"use client";

import React, { useState } from "react";
import {
  Plus,
  HelpCircle,
  MessageSquare,
  FileSpreadsheet,
  ExternalLink,
  ArrowRight,
  Compass,
  Globe,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";
import { FAQS } from "@/lib/faqs";

type FaqCategory = "all" | "grids" | "import" | "earth" | "security";

const CATEGORIES: { id: FaqCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All questions", icon: HelpCircle },
  { id: "grids", label: "Coordinates & grids", icon: Compass },
  { id: "import", label: "Excel & CSV import", icon: FileSpreadsheet },
  { id: "earth", label: "Google Earth 3D", icon: Globe },
  { id: "security", label: "Privacy & local PC", icon: ShieldCheck },
];

// headingLevel: "h1" when the FAQ is the page itself (/faq), "h2" inside the home page
export default function Faq({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  const SubHeading = headingLevel === "h1" ? "h2" : "h3";
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>("all");
  const [openId, setOpenId] = useState<number | null>(1);

  const filteredFaqs = selectedCategory === "all"
    ? FAQS
    : FAQS.filter(f => f.category === selectedCategory);

  const countFor = (id: FaqCategory) =>
    id === "all" ? FAQS.length : FAQS.filter(f => f.category === id).length;

  return (
    <section id="faq" className="py-20 lg:py-28 bg-[#fafbfc] border-b border-slate-100" aria-labelledby="faq-heading">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">

        {/* Section Header */}
        <div className="text-center max-w-[640px] mx-auto mb-10 lg:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-[11px] font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>Help &amp; Answers</span>
          </div>
          <Heading id="faq-heading" className="tracking-tight text-slate-900 mb-4">
            <span className="block text-2xl sm:text-3xl lg:text-[36px] font-extrabold leading-[1.15]">
              Frequently Asked Questions
            </span>
            <span className="sr-only"> — </span>
            <span className="block mt-2 text-base sm:text-lg font-semibold text-slate-500">
              Coordinate Conversion &amp; Google Earth KML
            </span>
          </Heading>
          <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed max-w-[500px] mx-auto">
            Coordinate systems, spreadsheet imports, 3D exports, and data privacy — answered.
          </p>
        </div>

        {/* Category Filter */}
        <div
          role="tablist"
          aria-label="Filter questions by topic"
          className="flex gap-2 mb-8 lg:mb-10 overflow-x-auto sm:flex-wrap sm:justify-center -mx-5 px-5 sm:mx-0 sm:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white/80" : "text-slate-400"}`} />
                <span>{cat.label}</span>
                <span
                  className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {countFor(cat.id)}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Accordion List */}
          <div className="lg:col-span-8 lg:order-2 space-y-2.5">
            {filteredFaqs.map((item) => {
              const isOpen = openId === item.id;
              const panelId = `faq-panel-${item.id}`;
              const buttonId = `faq-button-${item.id}`;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 ${
                    isOpen
                      ? "border-blue-200/90 shadow-[0_8px_24px_-12px_rgba(0,113,227,0.2)]"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <SubHeading>
                    <button
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="w-full flex items-start justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {/* Category label drawn with CSS so the heading text is only the question */}
                      <span
                        data-category={item.categoryLabel}
                        className="block pr-1 text-[14px] sm:text-[15px] font-semibold text-slate-900 leading-snug before:content-[attr(data-category)] before:block before:mb-1 before:text-[10px] before:font-bold before:uppercase before:tracking-wider before:text-blue-600"
                      >
                        {item.q}
                      </span>
                      <span
                        aria-hidden
                        className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isOpen ? "bg-[#0071e3] text-white rotate-45" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </SubHeading>

                  {/* Kept in the DOM when closed so answers stay crawlable */}
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="mx-4 sm:mx-5 pb-5 pt-3.5 border-t border-slate-100 text-[13px] sm:text-sm text-slate-600 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Support Card */}
          <aside className="lg:col-span-4 lg:order-1 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] lg:sticky lg:top-24">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <SubHeading className="text-[15px] font-bold text-slate-900 leading-tight">
                Have a project-specific question?
              </SubHeading>
            </div>
            <p className="text-[13px] text-slate-600 leading-relaxed mb-5">
              Working with an unusual local site datum or encountering an AutoCAD coordinate mismatch? Our community can help.
            </p>

            <div className="space-y-2">
              <a
                href="https://github.com/chaudaryyabdullah03-collab/kml-convertor/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-[13px] font-semibold text-white transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-slate-300" />
                  Ask on GitHub Discussions
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <a
                href="#download"
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-[13px] font-semibold text-slate-800 border border-slate-200 transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Download sample CSV
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            <div className="mt-5 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-[12px] text-amber-900 leading-relaxed">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Instant check:</strong> test single coordinates in the{" "}
                <a href="#showcase" className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-800">
                  Interactive Studio
                </a>{" "}
                before processing bulk files.
              </span>
            </div>
          </aside>

        </div>

      </div>
    </section>
  );
}
