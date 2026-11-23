// The dashboard's "Your programs": every program of the account in one place, with the version
// they have and whether it is the newest, what they have done in it, when they last used it, and
// the way in (the web app, or the Survey Toolkit). The Toolkit itself leads, as the way to get
// and update the rest.
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowRight, CheckCircle2, Compass, DraftingCompass, FolderTree, Globe, Route, TrendingUp, type LucideIcon } from "lucide-react";
import type { ProgramVersions } from "@/lib/appUsage";
import toolkitIcon from "@/components/toolkit/images/toolkit-icon.png";

const INFO: Record<string, { Icon: LucideIcon; page: string; webApp?: string; where: string }> = {
  "excel-to-kml": { Icon: Globe, page: "/excel-to-kml", webApp: "/app", where: "Web app and Windows" },
  traverse: { Icon: Compass, page: "/traverse", webApp: "/traverse/app", where: "Web app and Windows" },
  slope: { Icon: TrendingUp, page: "/slope-calculation", webApp: "/slope-calculation/app", where: "Web app and Windows" },
  "auto-draft": { Icon: DraftingCompass, page: "/auto-draft", where: "Windows" },
  roadpro: { Icon: Route, page: "/roadpro", where: "AutoCAD plugin" },
  "folder-manager": { Icon: FolderTree, page: "/project-folder-manager", where: "Windows" },
};
const ORDER = ["excel-to-kml", "traverse", "slope", "auto-draft", "roadpro", "folder-manager"];

const num = (n: number) => n.toLocaleString("en-US");
const plural = (n: number, one: string, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;

export interface ProgramStats {
  conversions: number;
  points: number;
  exports: number;
  traverses: number;
  levelRuns: number;
  traverseJobs: number;
  slopeCalcs: number;
  usage: Record<string, { count: number; last: string }>;
}

/** What they have done in a program, in a few words; null when it has nothing to count */
function doneIn(id: string, s: ProgramStats): string | null {
  switch (id) {
    case "excel-to-kml":
      return s.conversions || s.exports ? `${plural(s.conversions, "conversion")} · ${plural(s.points, "point")}` : null;
    case "traverse":
      return s.traverses || s.levelRuns || s.traverseJobs ? `${plural(s.traverses, "traverse")} · ${plural(s.levelRuns, "level run")}` : null;
    case "slope":
      return s.slopeCalcs ? `${plural(s.slopeCalcs, "saved calculation")}` : null;
    case "auto-draft":
      return s.usage["auto-draft"]?.count ? plural(s.usage["auto-draft"].count, "thing done", "things done") : null;
    default:
      return null;
  }
}

function Badge({ p }: { p: ProgramVersions }) {
  if (p.status === "current")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-semibold text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Up to date
      </span>
    );
  if (p.status === "behind")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-semibold text-amber-800">
        <AlertCircle className="w-3.5 h-3.5" aria-hidden /> Update to {p.latest}
      </span>
    );
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-semibold text-slate-600">v{p.latest}</span>;
}

export default function ProgramsHub({
  programs,
  stats,
  When,
}: {
  programs: ProgramVersions[];
  stats: ProgramStats;
  /** the dashboard's date, "2 d ago" after hydration */
  When: ComponentType<{ iso: string }>;
}) {
  const byId = new Map(programs.map((p) => [p.id, p]));
  const toolkit = byId.get("toolkit");
  const lastUsed = (id: string): string | null => {
    const p = byId.get(id);
    const seen = [p?.uses[0]?.lastSeen, stats.usage[id]?.last].filter(Boolean) as string[];
    return seen.sort().pop() ?? null;
  };

  return (
    <section aria-labelledby="programs-h" className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="programs-h" className="text-[18px] font-bold tracking-tight text-slate-900">
            Your programs
          </h2>
          <p className="text-[13px] text-slate-500">One account for all of them. Signed in here, signed in everywhere.</p>
        </div>
      </div>

      {/* the Survey Toolkit: the way to get them all, and keep them up to date */}
      <div className="mt-4 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <Image src={toolkitIcon} alt="" width={48} height={48} className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-auto">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900">Survey Toolkit</p>
            {toolkit && <Badge p={toolkit} />}
          </div>
          <p className="text-[13px] text-slate-600">Installs every program below and keeps each one up to date by itself. Free, for Windows 10 and 11.</p>
        </div>
        <div className="flex w-full sm:w-auto shrink-0 gap-2">
          <Link href="/toolkit" className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-xl bg-[#071a44] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0b2560]">
            Get the Toolkit <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ORDER.map((id) => {
          const p = byId.get(id);
          const info = INFO[id];
          if (!p || !info) return null;
          const done = doneIn(id, stats);
          const last = lastUsed(id);
          const mine: ReactNode = p.version ? (
            <>
              You have <span className="font-semibold text-slate-800">{p.version}</span>
            </>
          ) : (
            info.where
          );
          return (
            <li key={id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 transition-shadow hover:shadow-[0_12px_30px_rgba(7,26,68,0.08)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071a44] text-[#ffd21f]">
                  <info.Icon className="w-5 h-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">{mine}</p>
                </div>
                <Badge p={p} />
              </div>
              <div className="mt-4 flex-1 space-y-1 text-[13px]">
                <p className={done ? "font-semibold text-slate-800" : "text-slate-500"}>{done ?? "Nothing recorded yet"}</p>
                <p className="text-[12px] text-slate-500">{last ? <>Last used <When iso={last} /></> : "Not used with this account yet"}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[13px] font-semibold">
                {info.webApp ? (
                  // the web apps are pages of their own: a plain link
                  <a href={info.webApp} className="inline-flex items-center gap-1 rounded-lg bg-[#0071e3] px-3 py-1.5 text-white hover:bg-[#0077ed]">
                    Open web app <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </a>
                ) : (
                  <Link href="/toolkit" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-slate-800 hover:bg-slate-200">
                    Install with the Toolkit
                  </Link>
                )}
                <Link href={info.page} className="rounded-lg px-2 py-1.5 text-slate-600 hover:text-[#0071e3]">
                  About
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
