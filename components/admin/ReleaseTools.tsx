"use client";

// Admin → Releases, the parts around each app's list (app/api/admin/releases/tools):
//   VersionBoard    every app's versions side by side (site, Releases, GitHub, Settings) and what's off
//   ReleaseTimeline every release of every app, newest first, searched and filtered
//   EmailHistory    every release email and review request, with Retry for the failed ones
//   OptOuts         who stopped release emails, with Allow again
//   Recipients      who an email would go to, in the Send window
//   NoteLines       "what's new" as the email shows it
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Info,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  UserCheck,
} from "lucide-react";

type Fetch = (url: string, options?: RequestInit) => Promise<Response>;
type Toast = (message: string, type?: "success" | "error") => void;

const card = "rounded-2xl border border-slate-800 bg-slate-900/50";
const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const day = (iso: string | Date) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const when = (iso: string | Date) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const errorOf = async (r: Response) => ((await r.json().catch(() => ({}))) as { error?: string }).error || `Request failed (${r.status})`;
const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

/** One "what's new" line as the email shows it: "Title: text" with the title in bold */
export function NoteLine({ text }: { text: string }) {
  const m = /^([^:]{2,60}):\s+(.+)$/.exec(text);
  return m ? (
    <>
      <b className="text-white">{m[1]}:</b> {m[2]}
    </>
  ) : (
    <>{text}</>
  );
}

export function NoteLines({ notes, limit }: { notes: string; limit?: number }) {
  const [all, setAll] = useState(false);
  const lines = notes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const shown = all || !limit ? lines : lines.slice(0, limit);
  return (
    <ul className="space-y-0.5 text-[13px] text-slate-300 list-disc pl-5">
      {shown.map((n, i) => (
        <li key={i} className="break-words">
          <NoteLine text={n} />
        </li>
      ))}
      {limit && lines.length > limit && (
        <li className="list-none -ml-5">
          <button onClick={() => setAll(!all)} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
            {all ? "Show less" : `Show all ${lines.length}`}
          </button>
        </li>
      )}
    </ul>
  );
}

// ---------------------------------------------------------------- the version board

interface BoardRow {
  app: { id: string; name: string; href: string; github: string | null };
  site: string;
  newest: { id: string; version: string; at: string; title: string; emailed: number; emailedAt: string | null } | null;
  github: { version: string; at: string; url: string; prerelease: boolean } | null;
  githubAnswered: boolean;
  settingsVersion: string | null;
  releases: number;
  issues: { tone: "warn" | "info"; text: string }[];
}

export function VersionBoard({
  adminFetch,
  onToast,
  onShow,
  onImported,
}: {
  adminFetch: Fetch;
  onToast: Toast;
  onShow: (s: string) => void;
  onImported: () => void;
}) {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  useEffect(() => {
    let live = true;
    fetcher
      .current("/api/admin/releases/tools?board=1", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await errorOf(r));
        const j = await r.json();
        if (live) setRows(j.board);
      })
      .catch((e) => live && onToast((e as Error).message, "error"));
    return () => {
      live = false;
    };
    // onToast only reports a failure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  const importApps = async (ids: string[]) => {
    setBusy(ids.length > 1 ? "all" : ids[0]);
    let added = 0;
    let filled = 0;
    const failed: string[] = [];
    for (const id of ids) {
      const r = await adminFetch("/api/admin/releases/import", json({ app: id }));
      if (!r.ok) {
        failed.push(rows?.find((x) => x.app.id === id)?.app.name ?? id);
        continue;
      }
      const j = await r.json();
      added += j.added || 0;
      filled += j.filled || 0;
    }
    setBusy(null);
    onToast(
      failed.length
        ? `Couldn't import ${failed.join(", ")}${added || filled ? `; ${added} added, ${filled} filled in` : ""}`
        : added || filled
          ? `Imported from GitHub: ${added} added, ${filled} notes filled in`
          : "Nothing new on GitHub",
      failed.length ? "error" : "success"
    );
    setReload((x) => x + 1);
    onImported();
  };

  const needImport = (rows ?? []).filter((r) => r.issues.some((i) => i.text.includes("not in Releases")));
  const warnings = (rows ?? []).reduce((n, r) => n + r.issues.filter((i) => i.tone === "warn").length, 0);

  return (
    <section className={card}>
      <header className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="mr-auto">
          <h4 className="text-sm font-bold text-white">Versions</h4>
          <p className="text-xs text-slate-400">
            Each app&apos;s version on the site, in Releases here and on GitHub.{" "}
            {rows &&
              (warnings ? (
                <span className="text-amber-300 font-semibold">{warnings} to look at</span>
              ) : (
                <span className="text-emerald-300 font-semibold">All in step</span>
              ))}
          </p>
        </div>
        <button onClick={() => setReload((x) => x + 1)} aria-label="Check again" className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
          <RefreshCw className="w-3.5 h-3.5" /> Check again
        </button>
        <button
          onClick={() => importApps((rows ?? []).filter((r) => r.app.github).map((r) => r.app.id))}
          disabled={!rows || busy !== null}
          className={`${btn} ${needImport.length ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"}`}
        >
          {busy === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Import everything new from GitHub
        </button>
      </header>
      {!rows ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">
          <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> Asking GitHub…
        </p>
      ) : (
        <div>
          {/* a phone: one card per app */}
          <ul className="md:hidden divide-y divide-slate-800/70">
            {rows.map((r) => (
              <li key={r.app.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => onShow(`releases:${r.app.id}`)} className="text-[14px] font-bold text-white hover:underline cursor-pointer text-left">
                    {r.app.name}
                  </button>
                  {r.app.github && (
                    <button onClick={() => importApps([r.app.id])} disabled={busy !== null} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                      {busy === r.app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Import
                    </button>
                  )}
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  {(
                    [
                      ["Site", `v${r.site}`],
                      ["Releases", r.newest ? `v${r.newest.version}` : "None"],
                      ["GitHub", r.github ? `v${r.github.version}` : !r.app.github ? "—" : r.githubAnswered ? "None" : "No answer"],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-slate-950/60 border border-slate-800 px-2 py-1.5">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="text-[13px] font-semibold text-white tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                {r.issues.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {r.issues.map((i) => (
                      <li key={i.text} className={`flex items-start gap-1 text-[12px] ${i.tone === "warn" ? "text-amber-300" : "text-slate-400"}`}>
                        {i.tone === "warn" ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" /> : <Info className="w-3.5 h-3.5 shrink-0 mt-px" />}{" "}
                        {i.text}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-2.5">App</th>
                  <th className="px-3 py-2.5">The site offers</th>
                  <th className="px-3 py-2.5">Newest in Releases</th>
                  <th className="px-3 py-2.5">Newest on GitHub</th>
                  <th className="px-3 py-2.5 hidden lg:table-cell">Emailed</th>
                  <th className="px-3 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {rows.map((r) => (
                  <tr key={r.app.id} className="align-top">
                    <td className="px-5 py-3">
                      <button
                        onClick={() => onShow(`releases:${r.app.id}`)}
                        className="text-[13px] font-bold text-white hover:underline cursor-pointer text-left"
                      >
                        {r.app.name}
                      </button>
                      <span className="block text-[11px] text-slate-500">
                        {r.releases} {r.releases === 1 ? "release" : "releases"}
                      </span>
                      {r.issues.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {r.issues.map((i) => (
                            <li key={i.text} className={`flex items-start gap-1 text-[11.5px] ${i.tone === "warn" ? "text-amber-300" : "text-slate-400"}`}>
                              {i.tone === "warn" ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" /> : <Info className="w-3.5 h-3.5 shrink-0 mt-px" />}{" "}
                              {i.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-[13px] font-semibold text-white tabular-nums">v{r.site}</span>
                      {r.settingsVersion && <span className="block text-[11px] text-slate-500">Settings: v{r.settingsVersion}</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {r.newest ? (
                        <>
                          <span className="text-[13px] font-semibold text-white tabular-nums">v{r.newest.version}</span>
                          <span className="block text-[11px] text-slate-500">{day(r.newest.at)}</span>
                        </>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {r.github ? (
                        <a href={r.github.url} target="_blank" rel="noopener noreferrer" className="group">
                          <span className="text-[13px] font-semibold text-white tabular-nums group-hover:underline">v{r.github.version}</span>
                          <ExternalLink className="inline w-3 h-3 ml-1 text-slate-500" />
                          <span className="block text-[11px] text-slate-500">
                            {day(r.github.at)}
                            {r.github.prerelease ? " · pre-release" : ""}
                          </span>
                        </a>
                      ) : (
                        <span className="text-slate-500">{!r.app.github ? "Not on GitHub" : r.githubAnswered ? "None" : "No answer"}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap hidden lg:table-cell">
                      {r.newest?.emailed ? (
                        <span className="text-emerald-300">
                          <CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />
                          {r.newest.emailed.toLocaleString()}
                          <span className="block text-[11px] text-slate-500">{r.newest.emailedAt ? day(r.newest.emailedAt) : ""}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Not yet</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {r.app.github && (
                        <button
                          onClick={() => importApps([r.app.id])}
                          disabled={busy !== null}
                          className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}
                        >
                          {busy === r.app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Import
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-[11px] text-slate-500 border-t border-slate-800">
            &ldquo;The site offers&rdquo; is the version on the download pages, set in the site&apos;s code; a new one goes live with the next update of the
            site. Excel to KML&apos;s download page also shows the version in Admin → Settings until GitHub answers.
          </p>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- every release, newest first

export interface TimelineRelease {
  id: string;
  app: string;
  appName: string;
  version: string;
  releasedAt: string;
  title: string;
  notes: string;
  sent: number;
  sending: boolean;
}

export function ReleaseTimeline({ releases, onShow, onEdit }: { releases: TimelineRelease[]; onShow: (s: string) => void; onEdit: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unsent" | "nonotes">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [many, setMany] = useState(20);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return releases
      .filter((r) => (filter === "unsent" ? !r.sent : filter === "nonotes" ? !r.notes.trim() : true))
      .filter((r) => !t || `${r.appName} ${r.version} ${r.title} ${r.notes}`.toLowerCase().includes(t))
      .sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime());
  }, [releases, q, filter]);
  const counts = { all: releases.length, unsent: releases.filter((r) => !r.sent).length, nonotes: releases.filter((r) => !r.notes.trim()).length };
  // a month's name above its first release
  const heads = useMemo(() => {
    const out = new Map<string, string>();
    let last = "";
    for (const r of list) {
      const month = new Date(r.releasedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });
      if (month !== last) out.set(r.id, month);
      last = month;
    }
    return out;
  }, [list]);
  return (
    <section className={card}>
      <header className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-slate-800">
        <h4 className="mr-auto text-sm font-bold text-white">Every release</h4>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="App, version or words"
            aria-label="Search releases"
            className="w-56 max-w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div role="group" aria-label="Show" className="flex gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
          {(
            [
              ["all", "All"],
              ["unsent", "Not emailed"],
              ["nonotes", "No notes"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer ${filter === k ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {l} <span className="opacity-70">{counts[k]}</span>
            </button>
          ))}
        </div>
      </header>
      {list.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400">No release matches.</p>
      ) : (
        <ul className="pb-2">
          {list.slice(0, many).map((r) => {
            const head = heads.get(r.id);
            const isOpen = open === r.id;
            return (
              <li key={r.id}>
                {head && <p className="px-5 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{head}</p>}
                <div className="px-5 py-2.5 border-t border-slate-800/70">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setOpen(isOpen ? null : r.id)}
                      aria-expanded={isOpen}
                      className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
                    >
                      {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-200 text-[11.5px] font-bold whitespace-nowrap">
                        {r.appName} {r.version}
                      </span>
                      <span className="text-[13px] text-white truncate">{r.title}</span>
                    </button>
                    <span className="ml-auto flex items-center gap-2 text-[11px] text-slate-500 whitespace-nowrap">
                      {!r.notes.trim() && <span className="text-amber-300">no notes</span>}
                      {r.sending ? (
                        <span className="text-blue-300">sending</span>
                      ) : r.sent ? (
                        <span className="text-emerald-300">emailed to {r.sent.toLocaleString()}</span>
                      ) : (
                        <span>not emailed</span>
                      )}
                      <span>{day(r.releasedAt)}</span>
                    </span>
                  </div>
                  {isOpen && (
                    <div className="mt-2 ml-6">
                      {r.notes.trim() ? <NoteLines notes={r.notes} /> : <p className="text-[13px] text-amber-300/90">No &ldquo;what&apos;s new&rdquo; yet.</p>}
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => onEdit(r.id)} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                          Edit
                        </button>
                        <button onClick={() => onShow(`releases:${r.app}`)} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                          Open {r.appName}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > many && (
        <div className="px-5 pb-4">
          <button onClick={() => setMany((n) => n + 30)} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
            Show more ({list.length - many} left)
          </button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- every email sent

interface HistoryRow {
  id: string;
  kind: "release" | "review";
  audience: "app" | "all";
  status: "sending" | "paused" | "done";
  subject: string;
  total: number;
  sent: number;
  failed: number;
  lastError: string | null;
  createdBy: string;
  createdAt: string;
  finishedAt: string | null;
  app: string;
  appName: string;
  version: string;
}

export function EmailHistory({
  adminFetch,
  onToast,
  onRun,
  reloadKey,
}: {
  adminFetch: Fetch;
  onToast: Toast;
  onRun: (broadcastId: string) => void;
  reloadKey: number;
}) {
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ id: string; list: { email: string; error: string | null }[] } | null>(null);
  const [kind, setKind] = useState<"all" | "release" | "review">("all");
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    fetcher
      .current("/api/admin/releases/tools?history=1", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await errorOf(r));
        const j = await r.json();
        if (live) setRows(j.history);
      })
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [reload, reloadKey]);

  const showFailed = async (b: HistoryRow) => {
    const r = await adminFetch(`/api/admin/broadcasts/${b.id}`);
    if (!r.ok) return onToast(await errorOf(r), "error");
    setFailed({ id: b.id, list: (await r.json()).failed });
  };
  const retry = async (id: string) => {
    setBusy(id);
    const r = await adminFetch("/api/admin/releases/tools", json({ action: "retry", broadcastId: id }));
    setBusy(null);
    if (!r.ok) return onToast(await errorOf(r), "error");
    const { broadcastId } = await r.json();
    setFailed(null);
    onToast("Sending again to the people it failed for");
    setReload((x) => x + 1);
    onRun(broadcastId);
  };

  const shown = (rows ?? []).filter((b) => kind === "all" || b.kind === kind);
  const totals = (rows ?? []).reduce((t, b) => ({ sent: t.sent + b.sent, failed: t.failed + b.failed }), { sent: 0, failed: 0 });
  return (
    <section className={card}>
      <header className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-slate-800">
        <div className="mr-auto">
          <h4 className="text-sm font-bold text-white">Emails sent</h4>
          {rows && (
            <p className="text-xs text-slate-400">
              {rows.length.toLocaleString()} {rows.length === 1 ? "email" : "emails"} · {totals.sent.toLocaleString()} delivered
              {totals.failed ? <span className="text-rose-300"> · {totals.failed.toLocaleString()} failed</span> : ""}
            </p>
          )}
        </div>
        <div role="group" aria-label="Kind" className="flex gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
          {(
            [
              ["all", "All"],
              ["release", "Releases"],
              ["review", "Review requests"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer ${kind === k ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>
      {!rows ? (
        <p className="px-5 py-6 text-center text-sm text-slate-400">
          <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> Loading…
        </p>
      ) : shown.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400">Nothing sent yet.</p>
      ) : (
        <ul className="pb-2 max-h-[520px] overflow-y-auto">
          {shown.map((b) => (
            <li key={b.id} className="px-5 py-2.5 border-t border-slate-800/70 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {b.status === "done" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : b.status === "paused" ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-white truncate">{b.subject}</span>
                <span className="block text-[11px] text-slate-500">
                  {b.kind === "review" ? "Review request" : "Release"} · {b.appName} {b.version} · {b.audience === "app" ? `${b.appName} users` : "everyone"} ·{" "}
                  {when(b.createdAt)} by {b.createdBy}
                </span>
              </span>
              <span className="tabular-nums text-slate-300 whitespace-nowrap">
                {b.sent.toLocaleString()} / {b.total.toLocaleString()} sent
              </span>
              {b.failed > 0 && (
                <button onClick={() => showFailed(b)} className="text-rose-300 hover:underline cursor-pointer whitespace-nowrap">
                  {b.failed} failed
                </button>
              )}
              {b.failed > 0 && b.status === "done" && (
                <button onClick={() => retry(b.id)} disabled={busy !== null} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                  {busy === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Retry failed
                </button>
              )}
              {b.status !== "done" && b.lastError && <span className="basis-full text-amber-300/90 break-words">{b.lastError}</span>}
            </li>
          ))}
        </ul>
      )}
      {failed && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFailed(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white">Couldn&apos;t be reached ({failed.list.length})</h3>
            <ul className="mt-3 space-y-2 max-h-[50vh] overflow-y-auto text-xs">
              {failed.list.map((f) => (
                <li key={f.email} className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                  <p className="font-semibold text-slate-200 break-all">{f.email}</p>
                  {f.error && <p className="text-slate-400 break-words">{f.error}</p>}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setFailed(null)} className={`${btn} px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                Close
              </button>
              <button
                onClick={() => retry(failed.id)}
                disabled={busy !== null || !failed.list.length}
                className={`${btn} px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white`}
              >
                {busy === failed.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Send again to these{" "}
                {failed.list.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- unsubscribed

export function OptOuts({
  adminFetch,
  onToast,
  onOpenAccount,
  onChanged,
}: {
  adminFetch: Fetch;
  onToast: Toast;
  onOpenAccount: (id: string) => void;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<{ email: string; at: string; userId: string | null; name: string | null }[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    fetcher
      .current("/api/admin/releases/tools?optouts=1", { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (live) setRows(j.optOuts || []);
      })
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [reload]);
  const allow = async (email: string) => {
    if (!confirm(`Send release emails to ${email} again? Only do this if they asked for it.`)) return;
    setBusy(email);
    const r = await adminFetch("/api/admin/releases/tools", json({ action: "optin", email }));
    setBusy(null);
    if (!r.ok) return onToast(await errorOf(r), "error");
    onToast(`${email} gets release emails again`);
    setReload((x) => x + 1);
    onChanged();
  };
  const t = q.trim().toLowerCase();
  const shown = (rows ?? []).filter((r) => !t || `${r.email} ${r.name ?? ""}`.toLowerCase().includes(t));
  return (
    <section className={card}>
      <header className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-slate-800">
        <div className="mr-auto">
          <h4 className="text-sm font-bold text-white">Stopped release emails</h4>
          <p className="text-xs text-slate-400">People who pressed &ldquo;Stop these emails&rdquo;. Every email leaves them out.</p>
        </div>
        {rows && rows.length > 5 && (
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find an email"
            aria-label="Find an email"
            className="w-48 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        )}
      </header>
      {!rows ? (
        <p className="px-5 py-6 text-center text-sm text-slate-400">
          <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> Loading…
        </p>
      ) : shown.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400">{rows.length ? "No one matches." : "No one has stopped release emails."}</p>
      ) : (
        <ul className="pb-2 max-h-[360px] overflow-y-auto">
          {shown.map((r) => (
            <li key={r.email} className="px-5 py-2 border-t border-slate-800/70 flex items-center gap-3 text-xs">
              <span className="min-w-0 flex-1">
                {r.userId ? (
                  <button onClick={() => onOpenAccount(r.userId!)} className="block text-[13px] text-white hover:underline cursor-pointer truncate text-left">
                    {r.email}
                  </button>
                ) : (
                  <span className="block text-[13px] text-white truncate">{r.email}</span>
                )}
                <span className="block text-[11px] text-slate-500">
                  {r.name ? `${r.name} · ` : ""}since {day(r.at)}
                  {r.userId ? "" : " · no account now"}
                </span>
              </span>
              <button onClick={() => allow(r.email)} disabled={busy !== null} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                {busy === r.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />} Allow again
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- who an email goes to

export function Recipients({ adminFetch, releaseId, who, onlyNew }: { adminFetch: Fetch; releaseId: string; who: "app" | "all"; onlyNew: boolean }) {
  const [r, setR] = useState<{ count: number; sample: { email: string; name: string }[] } | null>(null);
  const [open, setOpen] = useState(false);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  useEffect(() => {
    let live = true;
    fetcher
      .current(`/api/admin/releases/tools?recipients=${encodeURIComponent(releaseId)}&audience=${who}&onlyNew=${onlyNew ? 1 : 0}`, { cache: "no-store" })
      .then((x) => x.json())
      .then((j) => live && j.success && setR({ count: j.count, sample: j.sample }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [releaseId, who, onlyNew]);
  if (!r)
    return (
      <p className="mt-2 text-xs text-slate-500">
        <Loader2 className="inline w-3.5 h-3.5 animate-spin mr-1" /> Finding who gets it…
      </p>
    );
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:underline cursor-pointer"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />} <Mail className="w-3.5 h-3.5" /> See who gets it (
        {r.count.toLocaleString()})
      </button>
      {open && (
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 divide-y divide-slate-800 text-xs">
          {r.sample.map((p) => (
            <li key={p.email} className="px-3 py-1.5 flex justify-between gap-3">
              <span className="text-slate-200 truncate">{p.email}</span>
              <span className="text-slate-500 truncate">{p.name}</span>
            </li>
          ))}
          {r.count > r.sample.length && <li className="px-3 py-1.5 text-slate-500">and {(r.count - r.sample.length).toLocaleString()} more</li>}
        </ul>
      )}
    </div>
  );
}
