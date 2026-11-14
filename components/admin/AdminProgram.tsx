"use client";

// Admin → Apps → RoadPro and Project Folder Manager: Windows programs that don't report to the site
// by themselves. The shared app tab (components/admin/AppTab.tsx) and their own part, from what
// the Survey Toolkit sees on each PC, the downloads, and the releases here and on GitHub:
// PCs with it and their versions, installs, updates and failures through the Toolkit, who
// downloads it, where the download comes from, and GitHub's newest release with an Import button.
import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Download, ExternalLink, Info, Loader2, Monitor, RefreshCw, UploadCloud, Wrench } from "lucide-react";
import AppTab, { BarRow, Delta, Empty, Panel, Stat, ago, type AppOverviewData } from "@/components/admin/AppTab";
import { ROADPRO_FILES, ROADPRO_RELEASE } from "@/lib/roadpro";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
type Status = "current" | "behind" | "unknown";
interface Pair {
  cur: number;
  prev: number;
}
interface ProgramExtras {
  latest: string;
  toolkit: {
    pcs: { id: string; name: string; version: string; status: Status; userId: string; email: string | null; userName: string | null; lastSeen: string; toolkitVersion: string }[];
    withIt: number;
    allPcs: number;
    current: number;
    behind: number;
    events: Record<string, Pair>;
    failures: { id: string; message: string; fromVersion: string; toVersion: string; at: string; pc: string | null; userId: string; email: string | null }[];
  };
  downloads: { signedIn: number; anonymous: number; first: number; again: number };
  newestRelease: { version: string; at: string } | null;
  github: { version: string; at: string; url: string; prerelease: boolean } | null;
}

const PROGRAMS: Record<string, { intro: string; sources: { label: string; href: string; detail: string; version?: string }[]; note: string }> = {
  roadpro: {
    intro: "The AutoCAD road builder: RoadPro Hub and the plugin, installed by RoadPro Setup or the Survey Toolkit. Needs full AutoCAD, Civil 3D or Map 3D 2013 or newer.",
    sources: [
      { label: "RoadPro Setup", href: ROADPRO_FILES.setup.href, detail: "The installer on GitHub, linked from /roadpro", version: ROADPRO_RELEASE },
      { label: "Plugin only (zip)", href: ROADPRO_FILES.plugin.href, detail: "For loading with APPLOAD; no automatic updates" },
    ],
    note: "RoadPro works inside AutoCAD and doesn't contact the site, so these numbers come from its downloads, its releases and the Survey Toolkit on each PC.",
  },
  toolkit: {
    intro: "Installs, updates and opens every app on the PC, in one window, and keeps them up to date by itself.",
    sources: [
      { label: "Survey Toolkit Setup", href: "/toolkit", detail: "Downloaded through the site (signed in when Settings say so), from GitHub" },
      { label: "GitHub releases", href: "https://github.com/Asjad-Mehmood/Survey-Toolkit/releases", detail: "Every version, with its notes" },
    ],
    note: "Every Survey Toolkit reports its PC, its version and the apps on it: the PCs below are all of them. Below the page are the accounts, every PC, every event and the testers.",
  },
  "folder-manager": {
    intro: "Sets up and keeps project folders in order on the PC: the Windows program (version 7 and later) with its installer, released on GitHub.",
    sources: [
      { label: "Project Folder Manager Setup", href: "https://github.com/Asjad-Mehmood/Project-manager/releases/latest", detail: "The installer on GitHub, linked from /project-folder-manager" },
      { label: "Its page", href: "/project-folder-manager", detail: "Where people download it from the site" },
    ],
    note: "Project Folder Manager works with folders on the PC and doesn't contact the site, so these numbers come from its downloads, its releases and the Survey Toolkit on each PC.",
  },
};

function VersionBadge({ status }: { status: Status }) {
  if (status === "current") return <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10.5px] font-bold">latest</span>;
  if (status === "behind") return <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10.5px] font-bold">older</span>;
  return <span className="px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-400 text-[10.5px] font-bold">unknown</span>;
}

function GitHubPanel({ app, x, adminFetch, onToast, onShow, onDone }: { app: string; x: ProgramExtras; adminFetch: Fetcher; onToast: (m: string, t?: "success" | "error") => void; onShow: (s: string) => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const site = x.newestRelease?.version ?? "";
  const gh = x.github;
  const missing = gh && (!site || gh.version.localeCompare(site, undefined, { numeric: true }) > 0);
  const importNow = async () => {
    setBusy(true);
    try {
      const r = await adminFetch("/api/admin/releases/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ app }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Import failed");
      onToast(j.added || j.filled ? `Imported from GitHub: ${j.added} added, ${j.filled} notes filled in` : "Nothing new on GitHub");
      onDone();
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel
      title="Releases on GitHub"
      action={
        <button onClick={() => onShow(`releases:${app}`)} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
          Releases
        </button>
      }
    >
      <ul className="pb-2">
        <li className="px-5 py-2.5 border-t border-[var(--adm-line)] flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-white">Newest on GitHub</span>
            <span className="block text-xs text-slate-400">
              {gh ? `v${gh.version}${gh.prerelease ? " (pre-release)" : ""} · ${new Date(gh.at).toLocaleDateString([], { dateStyle: "medium" })}` : "GitHub didn't answer just now"}
            </span>
          </span>
          {gh && (
            <a href={gh.url} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:underline">
              Open <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </li>
        <li className="px-5 py-2.5 border-t border-[var(--adm-line)]">
          <span className="block text-[13px] font-semibold text-white">Newest in Releases here</span>
          <span className="block text-xs text-slate-400">{x.newestRelease ? `v${x.newestRelease.version} · ${new Date(x.newestRelease.at).toLocaleDateString([], { dateStyle: "medium" })}` : "None yet"}</span>
        </li>
        <li className="px-5 py-3 border-t border-[var(--adm-line)] flex flex-wrap items-center justify-between gap-3">
          <span className={`flex items-center gap-1.5 text-xs font-semibold ${missing ? "text-amber-300" : "text-emerald-300"}`}>
            {missing ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {missing ? `v${gh!.version} is on GitHub but not in Releases here yet` : "Releases here are up to date with GitHub"}
          </span>
          <button
            onClick={importNow}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />} Import from GitHub
          </button>
        </li>
      </ul>
    </Panel>
  );
}

export default function AdminProgram({
  app,
  adminFetch,
  onToast,
  onShow,
  onOpenAccount,
  extra,
  footer,
}: {
  app: "roadpro" | "folder-manager" | "toolkit";
  /** more of the app's own, after its numbers (the Toolkit: who may use it) */
  extra?: ReactNode;
  /** at the end of the page, given a way to read the numbers again */
  footer?: (reload: () => void) => ReactNode;
  adminFetch: Fetcher;
  onToast: (m: string, t?: "success" | "error") => void;
  onShow: (section: string) => void;
  onOpenAccount: (userId: string) => void;
}) {
  const info = PROGRAMS[app];
  return (
    <AppTab app={app} adminFetch={adminFetch} onShow={onShow} onOpenAccount={onOpenAccount} intro={info.intro} footer={footer}>
      {(d: AppOverviewData, days, reload) => {
        const x = d.extras as ProgramExtras | null;
        if (!x) return null;
        const t = x.toolkit;
        const word = days === 365 ? "year" : `${days} days`;
        const ev = t.events;
        const dl = x.downloads;
        const sourceBehind = info.sources.find((s) => s.version && x.newestRelease && s.version !== x.newestRelease.version);
        const self = app === "toolkit";
        return (
          <>
            <p className="flex items-start gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 shrink-0 text-blue-400" /> {info.note}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat
                icon={Monitor}
                label={self ? "PCs with the Toolkit" : "On Toolkit PCs"}
                value={t.withIt.toLocaleString()}
                sub={
                  self
                    ? `${new Set(t.pcs.map((p) => p.userId)).size.toLocaleString()} accounts`
                    : t.allPcs
                      ? `of ${t.allPcs.toLocaleString()} PCs with the Toolkit (${Math.round((t.withIt / t.allPcs) * 100)}%)`
                      : "No PCs with the Toolkit yet"
                }
              />
              <Stat icon={CheckCircle2} label="On the latest" value={t.withIt ? `${t.current.toLocaleString()} of ${t.withIt.toLocaleString()}` : "—"} tone={t.behind ? "text-amber-300" : "text-white"} sub={t.behind ? `${t.behind.toLocaleString()} on an older version` : "Every PC is up to date"} />
              <Stat icon={RefreshCw} label={`Installed or updated, ${word}`} value={(ev.installed.cur + ev.updated.cur).toLocaleString()} sub={`${ev.installed.cur.toLocaleString()} installed · ${ev.updated.cur.toLocaleString()} updated · ${ev.uninstalled.cur.toLocaleString()} removed`} />
              <Stat icon={Wrench} label={self ? `Its own failures, ${word}` : `Toolkit failures, ${word}`} value={ev.failed.cur.toLocaleString()} tone={ev.failed.cur ? "text-red-300" : "text-white"} sub={<Delta p={ev.failed} bad />} />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Panel
                title={self ? "Every PC" : "PCs with it"}
                action={
                  <button onClick={() => onShow("toolkit")} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
                    Survey Toolkit
                  </button>
                }
              >
                {t.pcs.length ? (
                  <ul className="pb-2 max-h-[420px] overflow-y-auto">
                    {t.pcs.map((p) => (
                      <li key={p.id} className="px-5 py-2.5 border-t border-[var(--adm-line)] flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-white truncate">{p.name || "PC"}</span>
                          <span className="block text-[11px] text-slate-500 truncate">
                            <button onClick={() => onOpenAccount(p.userId)} className="hover:underline cursor-pointer">
                              {p.email || p.userName || "Account"}
                            </button>{" "}
                            {self ? "" : ` · Toolkit ${p.toolkitVersion || "?"}`} · seen {ago(p.lastSeen)}
                          </span>
                        </span>
                        <span className="shrink-0 flex items-center gap-2 text-[13px] tabular-nums text-slate-200">
                          {p.version ? `v${p.version}` : "?"} <VersionBadge status={p.status} />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>{self ? "No PC has reported a Survey Toolkit yet." : "No PC with the Survey Toolkit has it yet."}</Empty>
                )}
              </Panel>
              <Panel title={self ? "Its own update failures" : "Toolkit failures"}>
                {t.failures.length ? (
                  <ul className="pb-2">
                    {t.failures.map((f) => (
                      <li key={f.id} className="px-5 py-2.5 border-t border-[var(--adm-line)]">
                        <p className="text-[13px] font-semibold text-red-300">
                          {f.fromVersion && f.toVersion && f.fromVersion !== f.toVersion ? `Update v${f.fromVersion} → v${f.toVersion} failed` : `Install of v${f.toVersion || "?"} failed`}
                        </p>
                        {f.message && <p className="text-xs text-slate-300 break-words">{f.message}</p>}
                        <p className="text-[11px] text-slate-500">
                          {f.pc || "PC"} ·{" "}
                          <button onClick={() => onOpenAccount(f.userId)} className="hover:underline cursor-pointer">
                            {f.email || "Account"}
                          </button>{" "}
                          · {ago(f.at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>No failures in this period.</Empty>
                )}
              </Panel>
              <Panel title={`Who downloads it, ${word}`}>
                {dl.signedIn + dl.anonymous ? (
                  <ul className="pb-2">
                    <BarRow label="Signed in" value={dl.signedIn} max={dl.signedIn + dl.anonymous} color="bg-blue-400" right={<span className="text-[11px] text-slate-500">downloads</span>} />
                    <BarRow label="Not signed in" value={dl.anonymous} max={dl.signedIn + dl.anonymous} color="bg-slate-500" right={<span className="text-[11px] text-slate-500">downloads</span>} />
                    <BarRow label="First download" sub="people who never had it before" value={dl.first} max={Math.max(1, dl.first + dl.again)} color="bg-emerald-400" right={<span className="text-[11px] text-slate-500">people</span>} />
                    <BarRow label="Downloaded again" sub="people who had downloaded it before" value={dl.again} max={Math.max(1, dl.first + dl.again)} color="bg-violet-400" right={<span className="text-[11px] text-slate-500">people</span>} />
                  </ul>
                ) : (
                  <Empty>No downloads in this period.</Empty>
                )}
                <p className="px-5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Downloads come from</p>
                <ul className="pb-3">
                  {info.sources.map((s) => (
                    <li key={s.label} className="px-5 py-2 border-t border-[var(--adm-line)] flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-[13px] text-white">
                          {s.label}
                          {s.version ? ` · v${s.version}` : ""}
                        </span>
                        <span className="block text-[11px] text-slate-500 truncate">{s.detail}</span>
                      </span>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:underline">
                        <Download className="w-3 h-3" /> Link
                      </a>
                    </li>
                  ))}
                </ul>
                {sourceBehind && (
                  <p className="px-5 pb-4 flex items-start gap-1.5 text-xs font-semibold text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> The site&apos;s download is v{sourceBehind.version}, but the newest release is v{x.newestRelease!.version}.
                  </p>
                )}
              </Panel>
              <GitHubPanel app={app} x={x} adminFetch={adminFetch} onToast={onToast} onShow={onShow} onDone={reload} />
            </div>
            {extra}
          </>
        );
      }}
    </AppTab>
  );
}
