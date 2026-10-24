import Link from "next/link";
import { AlertCircle, CheckCircle2, HelpCircle, Monitor, Globe, Smartphone, Download, AppWindow } from "lucide-react";
import type { ProgramVersions } from "@/lib/appUsage";

const DOWNLOAD_HREF: Record<string, string> = {
  "excel-to-kml": "/download",
  roadpro: "/roadpro#download",
  traverse: "/traverse#download",
  "folder-manager": "/project-folder-manager#download",
};
const PLATFORM_ICON: Record<string, React.ElementType> = { Windows: Monitor, Android: Smartphone, Web: Globe, "Installed app": AppWindow };

const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Which version of each program an account has: where it was last opened (for the programs that
 * talk to the site), the last download, and whether that is the newest version. Dark in the
 * admin's user profile, light on the user's own dashboard (with an update link).
 */
export default function AppVersions({ programs, dark = false }: { programs: ProgramVersions[]; dark?: boolean }) {
  const c = dark
    ? { card: "bg-slate-800/40 border-slate-800", name: "text-white", text: "text-slate-300", muted: "text-slate-500", chip: "bg-slate-900 border-slate-700 text-slate-200" }
    : { card: "bg-white border-slate-200", name: "text-slate-900", text: "text-slate-700", muted: "text-slate-500", chip: "bg-slate-50 border-slate-200 text-slate-700" };
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {programs.map((p) => {
        const badge =
          p.status === "current"
            ? { Icon: CheckCircle2, label: "Up to date", cls: dark ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200" }
            : p.status === "behind"
              ? { Icon: AlertCircle, label: `Update to ${p.latest}`, cls: dark ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-amber-50 text-amber-800 border-amber-200" }
              : { Icon: HelpCircle, label: "Version not known", cls: dark ? "bg-slate-500/15 text-slate-300 border-slate-500/30" : "bg-slate-100 text-slate-600 border-slate-200" };
        const installed = p.uses.filter((u) => u.platform !== "Web");
        const web = p.uses.find((u) => u.platform === "Web");
        return (
          <li key={p.id} className={`rounded-2xl border p-4 ${c.card}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-[14.5px] font-bold ${c.name}`}>{p.name}</p>
                <p className={`text-[12px] ${c.muted}`}>
                  {p.version ? (
                    <>
                      Has <span className={`font-mono font-semibold ${c.text}`}>v{p.version}</span>
                      {p.source === "download" ? " (last download)" : " (reported by the app)"}
                    </>
                  ) : (
                    "Not downloaded or opened yet"
                  )}
                  {" · "}newest <span className="font-mono">v{p.latest}</span>
                </p>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${badge.cls}`}>
                <badge.Icon className="w-3 h-3" aria-hidden /> {badge.label}
              </span>
            </div>

            {(installed.length > 0 || web || p.lastDownload) && (
              <ul className="mt-3 space-y-1.5">
                {installed.map((u) => {
                  const Icon = PLATFORM_ICON[u.platform] ?? Monitor;
                  return (
                    <li key={u.platform} className={`flex items-center gap-2 text-[12.5px] ${c.text}`}>
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${c.muted}`} aria-hidden />
                      <span className="font-semibold">{u.platform}</span>
                      <span className={`px-1.5 py-px rounded-md border font-mono text-[11.5px] ${c.chip}`}>{u.version ? `v${u.version}` : "version not reported"}</span>
                      <span className={c.muted} suppressHydrationWarning>used {ago(u.lastSeen)}</span>
                    </li>
                  );
                })}
                {web && (
                  <li className={`flex items-center gap-2 text-[12.5px] ${c.text}`}>
                    <Globe className={`w-3.5 h-3.5 shrink-0 ${c.muted}`} aria-hidden />
                    <span className="font-semibold">Web app</span>
                    <span className={c.muted} suppressHydrationWarning>always the newest · used {ago(web.lastSeen)}</span>
                  </li>
                )}
                {p.lastDownload && (
                  <li className={`flex items-center gap-2 text-[12.5px] ${c.text}`}>
                    <Download className={`w-3.5 h-3.5 shrink-0 ${c.muted}`} aria-hidden />
                    <span className="font-semibold">Downloaded</span>
                    <span className={`px-1.5 py-px rounded-md border font-mono text-[11.5px] ${c.chip}`}>v{p.lastDownload.version}</span>
                    <span className={c.muted}>{day(p.lastDownload.at)}</span>
                  </li>
                )}
              </ul>
            )}

            {!dark && p.status === "behind" && (
              <Link href={DOWNLOAD_HREF[p.id] ?? "/#download"} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0071e3] hover:underline">
                <Download className="w-3.5 h-3.5" aria-hidden /> Get version {p.latest}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
