"use client";

// Admin → an app's own tab, the same for every app (Excel to KML, Traverse & Level, Slope
// Calculator, RoadPro, Project Folder Manager, Survey Toolkit): for the chosen period against the
// period before it, its downloads, the people using it, what they did and what went wrong, the
// devices and versions it runs on (and on Toolkit PCs), what people keep from it, and its releases
// (app/api/admin/app-overview, lib/appOverview.ts). An app adds its own part with `children`.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  ExternalLink,
  FolderOpen,
  GitBranch,
  Loader2,
  Megaphone,
  Minus,
  Monitor,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";
import { actionName } from "@/components/admin/AdminActivity";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
interface Pair {
  cur: number;
  prev: number;
}
type Status = "current" | "behind" | "unknown";
export interface AppOverviewData {
  app: { id: string; name: string; latest: string; github: string | null; href: string | null };
  days: number;
  bucket: "day" | "week";
  totals: { downloads: Pair; downloaders: number; events: Pair; people: Pair; errors: Pair };
  series: { t: string; downloads: number; events: number; people: number }[];
  downloadVersions: { version: string; count: number; status: Status }[];
  downloadFiles: { assetType: string; fileName: string; count: number; installer: boolean }[];
  countries: [string, number][];
  actions: { action: string; count: number; errors: number; last: string }[];
  people: { userId: string; email: string | null; name: string | null; count: number; last: string }[];
  errors: { id: string; title: string; error: string | null; email: string | null; userId: string | null; version: string | null; platform: string | null; at: string }[];
  platforms: { platform: string; people: number; active: number; fresh: number; last: string }[];
  versions: { version: string | null; platform: string; people: number; last: string; status: Status }[];
  toolkit: { pcs: { version: string; count: number; status: Status }[]; events: Record<string, number> };
  kept: { total: number; bytes: number; people: number; week: number; kinds: Record<string, number> } | null;
  releases: { version: string; title: string; releasedAt: string }[];
  extras: unknown;
}

export const PERIODS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
];
const SERIES = [
  { key: "downloads", label: "Downloads", color: "bg-emerald-400" },
  { key: "people", label: "People active", color: "bg-violet-400" },
  { key: "events", label: "Things done", color: "bg-blue-400" },
] as const;
const KEPT: Record<string, string> = { opened: "opened files", saved: "saved files", job: "kept jobs", calculation: "calculations" };
const TOOLKIT_EVENTS: Record<string, string> = { installed: "installed", updated: "updated", uninstalled: "uninstalled", failed: "failed", opened: "opened" };

export const card = "rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)]";
export const fmtBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(1)} KB` : b < 1024 ** 3 ? `${(b / 1024 ** 2).toFixed(1)} MB` : `${(b / 1024 ** 3).toFixed(2)} GB`;
export const ago = (s: string) => {
  const m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  return new Date(s).toLocaleDateString([], { dateStyle: "medium" });
};

export function Delta({ p, bad = false }: { p: Pair; bad?: boolean }) {
  if (!p.prev && !p.cur) return <span className="text-[11.5px] text-slate-500 whitespace-nowrap">none either period</span>;
  if (!p.prev) return <span className={`text-[11.5px] font-bold ${bad ? "text-red-300" : "text-emerald-300"}`}>new this period</span>;
  const pct = Math.round(((p.cur - p.prev) / p.prev) * 100);
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const good = bad ? pct < 0 : pct > 0;
  const c = pct === 0 ? "text-slate-400" : good ? "text-emerald-300" : "text-red-300";
  return (
    <span className={`inline-flex items-center gap-0.5 whitespace-nowrap text-[11.5px] font-bold ${c}`} title={`Period before: ${p.prev.toLocaleString()}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden /> {pct > 0 ? "+" : ""}
      {pct}% <span className="font-normal text-slate-500">vs {p.prev.toLocaleString()}</span>
    </span>
  );
}

export function Stat({ icon: Icon, label, value, sub, tone = "text-white" }: { icon: LucideIcon; label: string; value: string; sub?: ReactNode; tone?: string }) {
  return (
    <div className={`${card} p-4 min-w-0`}>
      <p className="flex items-start gap-1.5 text-[11px] leading-tight font-bold uppercase tracking-wider text-slate-500">
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden /> <span className="min-w-0 break-words">{label}</span>
      </p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${tone}`}>{value}</p>
      {sub && <div className="mt-0.5 text-[11.5px] text-slate-400">{sub}</div>}
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${card} min-w-0`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3">
        <h3 className="text-[15px] font-bold text-white whitespace-nowrap">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
export const Empty = ({ children }: { children: ReactNode }) => <p className="px-5 pb-5 text-sm text-slate-400">{children}</p>;

/** A bar beside a number, for the lists */
export function BarRow({ label, sub, value, max, color = "bg-blue-400", right }: { label: ReactNode; sub?: ReactNode; value: number; max: number; color?: string; right?: ReactNode }) {
  return (
    <li className="px-5 py-2 border-t border-[var(--adm-line)]">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate text-slate-200">{label}</span>
        <span className="shrink-0 flex items-center gap-2">
          {right}
          <span className="tabular-nums text-white font-semibold">{value.toLocaleString()}</span>
        </span>
      </div>
      {sub && <div className="text-[11px] text-slate-500 truncate">{sub}</div>}
      <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} />
      </div>
    </li>
  );
}

function VersionBadge({ status }: { status: Status }) {
  if (status === "current") return <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10.5px] font-bold">latest</span>;
  if (status === "behind") return <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10.5px] font-bold">older</span>;
  return null;
}

const linkBtn =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--adm-hover)] hover:bg-[var(--adm-hover-strong)] border border-[var(--adm-line)] text-xs font-semibold text-slate-200 cursor-pointer";

export default function AppTab({
  app,
  adminFetch,
  onShow,
  onOpenAccount,
  intro,
  children,
  footer,
}: {
  app: string;
  adminFetch: Fetcher;
  /** show another part of Admin: "activities:<app>", "files:<app>", "releases", "downloads" … */
  onShow: (section: string) => void;
  onOpenAccount: (userId: string) => void;
  /** a line under the name: what the app is */
  intro?: string;
  /** the app's own part, given the numbers, the period and a way to read them again */
  children?: (d: AppOverviewData, days: number, reload: () => void) => ReactNode;
  /** more of the app's own, at the end of the page */
  footer?: (reload: () => void) => ReactNode;
}) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AppOverviewData | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [series, setSeries] = useState<(typeof SERIES)[number]["key"]>("people");
  const [reload, setReload] = useState(0);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });

  useEffect(() => {
    let live = true;
    fetcher
      .current(`/api/admin/app-overview?app=${encodeURIComponent(app)}&days=${days}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        if (j.success) {
          setData(j as AppOverviewData);
          setFailed(false);
        } else setFailed(true);
      })
      .catch(() => live && setFailed(true))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
  }, [app, days, reload]);

  const top = useMemo(() => Math.max(1, ...(data?.series ?? []).map((s) => s[series])), [data, series]);
  const periodWord = PERIODS.find((p) => p.days === days)?.label ?? `${days} days`;
  const unit = data?.bucket === "week" ? "week" : "day";
  const s = SERIES.find((x) => x.key === series)!;

  if (!data) {
    return (
      <div className={`${card} p-10 text-center text-sm text-slate-400`}>
        {failed ? (
          <>
            Couldn&apos;t load this app&apos;s numbers.{" "}
            <button onClick={() => setReload((x) => x + 1)} className="text-blue-400 hover:underline cursor-pointer">
              Try again
            </button>
          </>
        ) : (
          <>
            <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> Loading…
          </>
        )}
      </div>
    );
  }

  const t = data.totals;
  function again() {
    setBusy(true);
    setReload((x) => x + 1);
  }
  const keptTotal = data.kept?.total ?? 0;
  const maxAction = Math.max(1, ...data.actions.map((a) => a.count));
  const maxPerson = Math.max(1, ...data.people.map((p) => p.count));
  const maxFile = Math.max(1, ...data.downloadFiles.map((f) => f.count));
  const maxCountry = Math.max(1, ...data.countries.map((c) => c[1]));
  const installed = data.versions.filter((v) => v.platform !== "Web");
  const maxVersion = Math.max(1, ...installed.map((v) => v.people), ...data.toolkit.pcs.map((p) => p.count), ...data.downloadVersions.map((v) => v.count));
  const tkEvents = Object.entries(data.toolkit.events).filter(([, v]) => v > 0);

  return (
    <div className="space-y-4">
      {/* the app, its version and where to go from here */}
      <div className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-white flex flex-wrap items-center gap-2">
              {data.app.name}
              {data.app.latest && <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs font-bold">v{data.app.latest} latest</span>}
            </h2>
            {intro && <p className="text-[13px] text-slate-400">{intro}</p>}
            {data.releases[0] && (
              <p className="text-xs text-slate-500">
                Last release: v{data.releases[0].version}, {new Date(data.releases[0].releasedAt).toLocaleDateString([], { dateStyle: "medium" })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onShow(`activities:${data.app.id}`)} className={linkBtn}>
              <Activity className="w-3.5 h-3.5" /> Activity
            </button>
            {data.kept && (
              <button onClick={() => onShow(`files:${data.app.id}`)} className={linkBtn}>
                <FolderOpen className="w-3.5 h-3.5" /> Files
              </button>
            )}
            <button onClick={() => onShow("releases")} className={linkBtn}>
              <Megaphone className="w-3.5 h-3.5" /> Releases
            </button>
            {data.app.href && (
              <a href={data.app.href} target="_blank" rel="noopener noreferrer" className={linkBtn}>
                <ExternalLink className="w-3.5 h-3.5" /> Its page
              </a>
            )}
            {data.app.github && (
              <a href={`https://github.com/${data.app.github}/releases`} target="_blank" rel="noopener noreferrer" className={linkBtn}>
                <GitBranch className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
          </div>
        </div>
      </div>

      {/* the period */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-300 mr-1">The last</span>
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => {
              setBusy(true);
              setDays(p.days);
            }}
            aria-pressed={days === p.days}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              days === p.days ? "bg-blue-600 text-white" : "bg-[var(--adm-hover)] border border-[var(--adm-line)] text-slate-400 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-xs text-slate-500">against the {periodWord} before</span>
        <button
          onClick={() => {
            setBusy(true);
            setReload((x) => x + 1);
          }}
          aria-label="Refresh"
          className="ml-auto p-2 rounded-xl bg-[var(--adm-hover)] border border-[var(--adm-line)] text-slate-400 hover:text-white cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* the numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat icon={Download} label="Downloads" value={t.downloads.cur.toLocaleString()} sub={<Delta p={t.downloads} />} />
        <Stat icon={Users} label="People active" value={t.people.cur.toLocaleString()} sub={<Delta p={t.people} />} />
        <Stat icon={Activity} label="Things done" value={t.events.cur.toLocaleString()} sub={<Delta p={t.events} />} />
        <Stat icon={AlertTriangle} label="Problems" value={t.errors.cur.toLocaleString()} tone={t.errors.cur ? "text-red-300" : "text-white"} sub={<Delta p={t.errors} bad />} />
        <Stat
          icon={FolderOpen}
          label="Kept in accounts"
          value={data.kept ? keptTotal.toLocaleString() : "—"}
          sub={data.kept ? `${fmtBytes(data.kept.bytes)} · ${data.kept.people.toLocaleString()} people` : "This app keeps nothing in accounts"}
        />
      </div>

      {/* each day */}
      <Panel
        title={`Each ${unit}`}
        action={
          <div className="flex flex-wrap gap-1">
            {SERIES.map((x) => (
              <button
                key={x.key}
                onClick={() => setSeries(x.key)}
                aria-pressed={series === x.key}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  series === x.key ? "bg-[var(--adm-hover-strong)] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-sm ${x.color}`} /> {x.label}
              </button>
            ))}
          </div>
        }
      >
        {data.series.some((x) => x[series] > 0) ? (
          <div className="px-5 pb-4">
            <div className="flex items-end gap-[3px] h-36">
              {data.series.map((x) => (
                <div key={x.t} className="flex-1 h-full flex flex-col justify-end" title={`${x.t}: ${x[series]} ${s.label.toLowerCase()}`}>
                  <div className={`${s.color} rounded-t-sm min-h-[2px]`} style={{ height: `${(x[series] / top) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10.5px] text-slate-500">
              <span>{data.series[0]?.t}</span>
              <span>{data.series[data.series.length - 1]?.t}</span>
            </div>
          </div>
        ) : (
          <Empty>Nothing in this period.</Empty>
        )}
      </Panel>

      {children?.(data, days, again)}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* devices */}
        <Panel title="Where it's used">
          {data.platforms.length ? (
            <ul className="pb-2">
              {data.platforms.map((p) => (
                <BarRow
                  key={p.platform}
                  label={p.platform}
                  sub={`${p.active.toLocaleString()} active in the ${periodWord} · ${p.fresh.toLocaleString()} new · last ${ago(p.last)}`}
                  value={p.people}
                  max={Math.max(...data.platforms.map((x) => x.people))}
                  color="bg-violet-400"
                  right={<span className="text-[11px] text-slate-500">people</span>}
                />
              ))}
            </ul>
          ) : (
            <Empty>This app hasn&apos;t told the site where it&apos;s opened yet. Its downloads and the Toolkit PCs below show where it&apos;s installed.</Empty>
          )}
        </Panel>

        {/* versions */}
        <Panel title="Versions">
          {installed.length || data.toolkit.pcs.length || data.downloadVersions.length ? (
            <div className="pb-2">
              {installed.length > 0 && (
                <>
                  <p className="px-5 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Opened, by people</p>
                  <ul>
                    {installed.map((v) => (
                      <BarRow
                        key={`${v.platform}-${v.version}`}
                        label={
                          <>
                            {v.version ? `v${v.version}` : "Version not reported"} <span className="text-slate-500">· {v.platform}</span>
                          </>
                        }
                        sub={`last ${ago(v.last)}`}
                        value={v.people}
                        max={maxVersion}
                        right={<VersionBadge status={v.status} />}
                      />
                    ))}
                  </ul>
                </>
              )}
              {data.toolkit.pcs.length > 0 && (
                <>
                  <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">On Survey Toolkit PCs</p>
                  <ul>
                    {data.toolkit.pcs.map((v) => (
                      <BarRow key={`tk-${v.version}`} label={v.version ? `v${v.version}` : "Version unknown"} value={v.count} max={maxVersion} color="bg-cyan-400" right={<VersionBadge status={v.status} />} />
                    ))}
                  </ul>
                </>
              )}
              {data.downloadVersions.length > 0 && (
                <>
                  <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Downloaded in the {periodWord}</p>
                  <ul>
                    {data.downloadVersions.map((v) => (
                      <BarRow key={`dl-${v.version}`} label={`v${v.version}`} value={v.count} max={maxVersion} color="bg-emerald-400" right={<VersionBadge status={v.status} />} />
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <Empty>No versions reported or downloaded yet.</Empty>
          )}
          {tkEvents.length > 0 && (
            <p className="px-5 pb-4 text-xs text-slate-400">
              Survey Toolkit in the {periodWord}: {tkEvents.map(([k, v]) => `${v.toLocaleString()} ${TOOLKIT_EVENTS[k] ?? k}`).join(" · ")}
            </p>
          )}
        </Panel>

        {/* what people do */}
        <Panel
          title="What people do"
          action={
            <button onClick={() => onShow(`activities:${data.app.id}`)} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
              All activity
            </button>
          }
        >
          {data.actions.length ? (
            <ul className="pb-2">
              {data.actions.map((a) => (
                <BarRow
                  key={a.action}
                  label={actionName(a.action)}
                  sub={`last ${ago(a.last)}${a.errors ? ` · ${a.errors.toLocaleString()} with a problem` : ""}`}
                  value={a.count}
                  max={maxAction}
                  color={a.errors ? "bg-red-400" : "bg-blue-400"}
                />
              ))}
            </ul>
          ) : (
            <Empty>Nothing done in this period.</Empty>
          )}
        </Panel>

        {/* who */}
        <Panel title="Most active people">
          {data.people.length ? (
            <ul className="pb-2">
              {data.people.map((p) => (
                <BarRow
                  key={p.userId}
                  label={
                    <button onClick={() => onOpenAccount(p.userId)} className="hover:underline cursor-pointer text-left">
                      {p.email || p.name || "Account"}
                    </button>
                  }
                  sub={`${p.name && p.email ? `${p.name} · ` : ""}last ${ago(p.last)}`}
                  value={p.count}
                  max={maxPerson}
                  color="bg-violet-400"
                />
              ))}
            </ul>
          ) : (
            <Empty>No one signed in used it in this period.</Empty>
          )}
        </Panel>

        {/* downloads */}
        <Panel
          title={`Downloads in the ${periodWord}`}
          action={
            <button onClick={() => onShow("downloads")} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
              All downloads
            </button>
          }
        >
          {data.downloadFiles.length ? (
            <div className="pb-2">
              <p className="px-5 pb-1 text-xs text-slate-400">
                {t.downloads.cur.toLocaleString()} of the installer by {t.downloaders.toLocaleString()} {t.downloaders === 1 ? "person" : "people"}
              </p>
              <ul>
                {data.downloadFiles.map((f) => (
                  <BarRow
                    key={`${f.assetType}-${f.fileName}`}
                    label={f.fileName}
                    sub={f.installer ? "Installer" : "Other file"}
                    value={f.count}
                    max={maxFile}
                    color={f.installer ? "bg-emerald-400" : "bg-slate-500"}
                  />
                ))}
              </ul>
              {data.countries.length > 0 && (
                <>
                  <p className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">By country</p>
                  <ul>
                    {data.countries.map(([c, k]) => (
                      <BarRow key={c} label={c} value={k} max={maxCountry} />
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <Empty>No downloads in this period.</Empty>
          )}
        </Panel>

        {/* what went wrong */}
        <Panel
          title="Recent problems"
          action={
            data.errors.length ? (
              <button onClick={() => onShow(`activities:${data.app.id}`)} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
                See in Activity
              </button>
            ) : undefined
          }
        >
          {data.errors.length ? (
            <ul className="pb-2">
              {data.errors.map((e) => (
                <li key={e.id} className="px-5 py-2.5 border-t border-[var(--adm-line)]">
                  <p className="text-[13px] font-semibold text-red-300">{e.title}</p>
                  {e.error && <p className="text-xs text-slate-300 break-words">{e.error}</p>}
                  <p className="text-[11px] text-slate-500">
                    {[
                      e.userId ? (
                        <button key="u" onClick={() => onOpenAccount(e.userId!)} className="hover:underline cursor-pointer">
                          {e.email || "Account"}
                        </button>
                      ) : (
                        e.email
                      ),
                      e.platform,
                      e.version && `v${e.version}`,
                      ago(e.at),
                    ]
                      .filter(Boolean)
                      .map((x, i) => (
                        <span key={i}>
                          {i > 0 && " · "}
                          {x}
                        </span>
                      ))}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No problems in this period.</Empty>
          )}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* kept */}
        <Panel
          title="Kept in accounts"
          action={
            data.kept ? (
              <button onClick={() => onShow(`files:${data.app.id}`)} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
                Open in Files
              </button>
            ) : undefined
          }
        >
          {data.kept ? (
            <div className="px-5 pb-5 grid grid-cols-2 gap-3">
              {Object.entries(data.kept.kinds).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[var(--adm-hover)] border border-[var(--adm-line)] p-3">
                  <p className="text-xl font-extrabold tabular-nums text-white">{v.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{KEPT[k] ?? k}</p>
                </div>
              ))}
              <p className="col-span-2 text-xs text-slate-400">
                {fmtBytes(data.kept.bytes)} from {data.kept.people.toLocaleString()} {data.kept.people === 1 ? "person" : "people"} · {data.kept.week.toLocaleString()} new in the last 7 days
              </p>
            </div>
          ) : (
            <Empty>This app keeps nothing in people&apos;s accounts.</Empty>
          )}
        </Panel>

        {/* releases */}
        <Panel
          title="Releases"
          action={
            <button onClick={() => onShow("releases")} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
              Manage
            </button>
          }
        >
          {data.releases.length ? (
            <ul className="pb-2">
              {data.releases.map((r) => (
                <li key={r.version} className="px-5 py-2.5 border-t border-[var(--adm-line)] flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-white truncate">
                      v{r.version} · {r.title}
                    </span>
                    <span className="block text-[11px] text-slate-500">{new Date(r.releasedAt).toLocaleDateString([], { dateStyle: "medium" })}</span>
                  </span>
                  {r.version === data.app.latest && <VersionBadge status="current" />}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No releases written yet. Add one in Releases.</Empty>
          )}
        </Panel>
      </div>

      {(installed.some((v) => v.status === "behind") || data.toolkit.pcs.some((v) => v.status === "behind")) && (
        <p className="flex items-center gap-2 text-xs text-amber-300">
          <Monitor className="w-4 h-4" /> Some people or PCs are on an older version than v{data.app.latest}.
        </p>
      )}

      {footer?.(again)}
    </div>
  );
}

// ---------------------------------------------------------------- an app's settings

export function Toggle({ on, busy, onClick, label }: { on: boolean; busy: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onClick}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-60 ${on ? "bg-blue-600" : "bg-slate-700"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

export type SettingField =
  | { key: string; kind: "switch"; label: string; on: string; off: string }
  | { key: string; kind: "number"; label: string; hint: string; min: number; max: number }
  | { key: string; kind: "text"; label: string; hint: string; max: number; placeholder?: string };
type SettingsMap = Record<string, unknown>;

/**
 * The switches and values of one app, saved to Admin → Settings (app/api/admin/settings) as they're
 * changed: a switch at once, a number or text with its Save button. Each change goes in the Admin log.
 */
export function AppSettings({
  adminFetch,
  onToast,
  onShow,
  fields,
  footer,
  onSaved,
}: {
  adminFetch: Fetcher;
  onToast: (m: string, t?: "success" | "error") => void;
  onShow: (section: string) => void;
  fields: SettingField[];
  footer?: (s: SettingsMap) => ReactNode;
  onSaved?: () => void;
}) {
  const [s, setS] = useState<SettingsMap | null>(null);
  const [draft, setDraft] = useState<SettingsMap>({});
  const [busy, setBusy] = useState<string | null>(null);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  useEffect(() => {
    fetcher
      .current("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.success && setS(j.settings))
      .catch(() => onToast("Couldn't load the settings", "error"));
    // onToast only reports a failure; loading once is enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (f: SettingField, value: unknown) => {
    setBusy(f.key);
    try {
      const r = await fetcher.current("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [f.key]: value }) });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "Couldn't save");
      setS(j.settings);
      setDraft((d) => {
        const n = { ...d };
        delete n[f.key];
        return n;
      });
      onToast(f.kind === "switch" ? `${f.label}: ${value ? "on" : "off"}` : `${f.label} saved`);
      onSaved?.();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Couldn't save", "error");
    } finally {
      setBusy(null);
    }
  };

  const input = "w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <Panel
      title="Settings"
      action={
        <button onClick={() => onShow("settings")} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
          All settings
        </button>
      }
    >
      {!s ? (
        <Empty>
          <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> Loading…
        </Empty>
      ) : (
        <ul className="pb-2">
          {fields.map((f) => {
            if (f.kind === "switch") {
              const on = Boolean(s[f.key]);
              return (
                <li key={f.key} className="px-5 py-3 border-t border-[var(--adm-line)] flex items-center justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-white">{f.label}</span>
                    <span className="block text-xs text-slate-400">{on ? f.on : f.off}</span>
                  </span>
                  <Toggle on={on} busy={busy === f.key} onClick={() => save(f, !on)} label={f.label} />
                </li>
              );
            }
            const value = f.key in draft ? draft[f.key] : s[f.key];
            const changed = f.key in draft && draft[f.key] !== s[f.key];
            return (
              <li key={f.key} className="px-5 py-3 border-t border-[var(--adm-line)]">
                <label className="block text-[13px] font-semibold text-white" htmlFor={`set-${f.key}`}>
                  {f.label}
                </label>
                <span className="block text-xs text-slate-400 mb-1.5">{f.hint}</span>
                <span className="flex gap-2">
                  <input
                    id={`set-${f.key}`}
                    type={f.kind === "number" ? "number" : "text"}
                    min={f.kind === "number" ? f.min : undefined}
                    max={f.kind === "number" ? f.max : undefined}
                    maxLength={f.kind === "text" ? f.max : undefined}
                    placeholder={f.kind === "text" ? f.placeholder : undefined}
                    value={String(value ?? "")}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: f.kind === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value }))}
                    className={`${input} ${f.kind === "number" ? "max-w-[160px]" : ""}`}
                  />
                  {changed && (
                    <button
                      onClick={() => save(f, draft[f.key])}
                      disabled={busy === f.key}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
                    >
                      {busy === f.key && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
                    </button>
                  )}
                </span>
              </li>
            );
          })}
          {footer?.(s)}
        </ul>
      )}
    </Panel>
  );
}
