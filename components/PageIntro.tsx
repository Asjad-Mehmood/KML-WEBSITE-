import React from "react";

/** The heading block at the top of a content page: a small label, the title and a lead paragraph. */
export default function PageIntro({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="max-w-3xl">
      {eyebrow && <p className="text-[12px] font-bold uppercase tracking-wider text-[#0071e3] mb-3">{eyebrow}</p>}
      <h1 className="text-[30px] sm:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.1]">{title}</h1>
      <div className="mt-4 text-[16px] sm:text-[17px] text-slate-600 leading-relaxed">{lead}</div>
      {children && <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}
