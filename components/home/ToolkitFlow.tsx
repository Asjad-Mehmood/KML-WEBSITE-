import { ArrowRight, Compass, FileSpreadsheet, FolderTree, Route, type LucideIcon } from "lucide-react";

// Home page, after the hero: how the four programs follow one job from the field book to the
// archive. Each step jumps to that program's section further down.
const STEPS: { id: string; verb: string; name: string; text: string; Icon: LucideIcon }[] = [
  { id: "traverse", verb: "Adjust", name: "Traverse & Level", text: "Close the traverse and the level runs from your field book, and sign the report.", Icon: Compass },
  { id: "excel-to-kml", verb: "Map", name: "Excel to KML", text: "Put the points in Google Earth on the right grid, with photos, for the client and the team.", Icon: FileSpreadsheet },
  { id: "roadpro", verb: "Design", name: "RoadPro", text: "Draw the road in AutoCAD with its signs, markings and a quantity report.", Icon: Route },
  { id: "folder-manager", verb: "Organise", name: "Project Folder Manager", text: "File every drawing, report and photo in the project's folders and find it again.", Icon: FolderTree },
];

export default function ToolkitFlow() {
  return (
    <section aria-labelledby="flow-heading" className="py-16 lg:py-20 bg-slate-50 border-b border-slate-100">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
        <div className="max-w-[680px]">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">One toolkit</p>
          <h2 id="flow-heading" className="mt-2 text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            From the field book to the archive
          </h2>
          <p className="mt-3 text-[15px] sm:text-base text-slate-600 leading-relaxed">
            Each program does one part of the job well, and they work with the same files: coordinates in Excel or CSV, drawings in AutoCAD, reports in PDF.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <li key={s.id} className="relative">
              <a
                href={`#tool-${s.id}`}
                className="group flex flex-col h-full rounded-2xl bg-white border border-slate-200 p-5 hover:border-[#0071e3]/40 hover:shadow-[0_12px_30px_-12px_rgba(15,23,42,0.18)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0071e3] flex items-center justify-center">
                    <s.Icon className="w-5 h-5" aria-hidden />
                  </span>
                  <span className="text-[12px] font-bold tabular-nums text-slate-300">0{i + 1}</span>
                </span>
                <span className="mt-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">{s.verb}</span>
                <span className="mt-0.5 text-[16px] font-bold text-slate-900">{s.name}</span>
                <span className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed flex-1">{s.text}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0071e3]">
                  See how <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden />
                </span>
              </a>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute top-1/2 -right-[14px] -translate-y-1/2 w-4 h-4 text-slate-300 z-10" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
