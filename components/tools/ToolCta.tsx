import Link from "next/link";
import { ArrowRight, Compass, FileSpreadsheet, Route, type LucideIcon } from "lucide-react";

// Which of our programs takes a tool's job further: the traverse tool leads to Traverse & Level,
// the curve tool to RoadPro, and every coordinate, area and distance tool to Excel to KML
const NEXT: Record<string, { Icon: LucideIcon; title: string; text: string; href: string; cta: string }> = {
  "traverse-adjustment": {
    Icon: Compass,
    title: "Whole traverses and level books, with a signed report",
    text: "Traverse & Level adjusts closed and open traverses, reduces level books and keeps every job in your account. Free in the browser and on Windows.",
    href: "/traverse",
    cta: "See Traverse & Level",
  },
  "horizontal-curve": {
    Icon: Route,
    title: "Draw the whole road in AutoCAD",
    text: "RoadPro draws the edges, curves, signs, markings and chainage from one centre line, and writes the quantities to Excel. Free.",
    href: "/roadpro",
    cta: "See RoadPro",
  },
};
const DEFAULT = {
  Icon: FileSpreadsheet,
  title: "Got a whole spreadsheet of points?",
  text: "Excel to KML converts every row at once, on any of 5,800+ grids, into Google Earth KML or KMZ, DXF for CAD and a PDF report. Free.",
  href: "/features",
  cta: "See Excel to KML",
};

/** Beside a free tool: the program that does the same job for a whole survey */
export default function ToolCta({ slug, className = "" }: { slug: string; className?: string }) {
  const n = NEXT[slug] ?? DEFAULT;
  return (
    <aside className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 ${className}`}>
      <span className="w-11 h-11 shrink-0 rounded-xl bg-white border border-blue-100 text-[#0071e3] flex items-center justify-center">
        <n.Icon className="w-5 h-5" aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-slate-900">{n.title}</p>
        <p className="mt-0.5 text-[13.5px] text-slate-600 leading-relaxed">{n.text}</p>
      </div>
      <Link href={n.href} className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13.5px] font-semibold">
        {n.cta} <ArrowRight className="w-4 h-4" aria-hidden />
      </Link>
    </aside>
  );
}
