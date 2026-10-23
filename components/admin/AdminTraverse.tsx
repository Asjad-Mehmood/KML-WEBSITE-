"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Ban, ChevronDown, ChevronRight, Eye, FileJson, FileSpreadsheet, Loader2, RefreshCw, Search, Trash2, Users } from "lucide-react";
import TraverseUsage from "./TraverseUsage";
// The Traverse & Level app's own calculation engine, so the admin sees the same results as the surveyor
import { computeLevel, computeTraverse, fmt, ratioText } from "@/traverse-app/src/core.js";

interface Group {
  userId: string;
  email: string | null;
  name: string | null;
  organization: string | null;
  jobs: number;
  traverses: number;
  levels: number;
  accepted: number;
  rejected: number;
  lastSaved: string | null;
}
interface Totals { jobs: number; traverses: number; levels: number; accepted: number; rejected: number; surveyors: number }
interface Summary { status?: string; ratio?: number | null; linear?: number | null; mis?: number | null; allow?: number | null; points?: number; rows?: number; project?: string; method?: string | null }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JobData = { trav?: any; level?: any; info?: Record<string, string> };
interface Job {
  id: string;
  kind: "traverse" | "level";
  name: string;
  data: JobData | null;
  summary: Summary;
  owner_email: string;
  owner_name: string;
  size: number;
  created_at: string;
  saved_at: string;
  shared_with: string[];
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;

const STATUS: Record<string, { label: string; cls: string }> = {
  accepted: { label: "Accepted", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "Rejected", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  open: { label: "Open", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  incomplete: { label: "Incomplete", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
};
const statusOf = (s?: string) => STATUS[s || "incomplete"] ?? STATUS.incomplete;

/** The key result, as the app's dashboard shows it */
function resultText(j: Job): string {
  const s = j.summary || {};
  if (j.kind === "traverse") {
    if (s.status === "open") return "Open traverse, not checked";
    if (s.ratio == null && s.linear == null) return "—";
    return [s.ratio ? `1 : ${Math.round(s.ratio).toLocaleString("en-US")}` : "1 : ∞", s.linear != null ? `${s.linear} mm` : ""].filter(Boolean).join(" · ");
  }
  if (s.status === "open") return "Open run, not checked";
  if (s.mis == null) return "—";
  return `${s.mis} mm${s.allow != null ? ` (±${s.allow} mm allowed)` : ""}`;
}

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function saveFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const fileSafe = (s: string) => s.replace(/[^\w.@-]+/g, "_").slice(0, 60);

// What the engine returns once a job is complete (core.js is plain JavaScript)
type TravPoint = { name: string; remark: string; measE: number; measN: number; cE: number; cN: number; E: number; N: number };
type TravResult = { ok: boolean; type: string; misE: number; misN: number; linear: number; ratio: number; totalL: number; points: TravPoint[] };
type LevelRow = { station: string; remark?: string; bs?: number | null; is?: number | null; fs?: number | null; rl: number; corr: number; adjRL: number };
type LevelResult = { ok: boolean; type: string; mis: number; allowRule: string; n: number; rows: LevelRow[] };

/** Every point of a job with what was measured and the adjusted result, worked out by the app's engine */
function jobRows(j: Job): { head: string[]; rows: (string | number)[][]; note: string } {
  if (j.kind === "traverse" && j.data?.trav) {
    const r = computeTraverse(j.data.trav) as unknown as TravResult;
    const head = ["POINT", "REMARK", "MEASURED E", "MEASURED N", "CORR E MM", "CORR N MM", "ADJUSTED E", "ADJUSTED N"];
    if (!r.ok) return { head, rows: [], note: "Incomplete: the app is still waiting for data." };
    const note = r.type === "open"
      ? "Open traverse: coordinates as measured, no check."
      : `Misclosure E ${fmt(r.misE * 1000, 1)} mm · N ${fmt(r.misN * 1000, 1)} mm · linear ${fmt(r.linear * 1000, 1)} mm · precision ${ratioText(r.ratio)} · length ${fmt(r.totalL, 2)} m`;
    return {
      head,
      rows: r.points.map((p) => [
        p.name, p.remark, fmt(p.measE), fmt(p.measN), fmt(p.cE * 1000, 1), fmt(p.cN * 1000, 1), fmt(p.E), fmt(p.N),
      ]),
      note,
    };
  }
  if (j.kind === "level" && j.data?.level) {
    const r = computeLevel(j.data.level) as unknown as LevelResult;
    const head = ["STATION", "REMARK", "BS", "IS", "FS", "RL", "CORR MM", "ADJUSTED RL"];
    if (!r.ok) return { head, rows: [], note: "Incomplete: the app is still waiting for data." };
    const note = r.type === "open"
      ? "Open run: reduced levels, no closure check."
      : `Misclosure ${fmt(r.mis * 1000, 1)} mm · allowed ${r.allowRule} · ${r.n} set-ups`;
    return {
      head,
      rows: r.rows.map((o) => [
        o.station, o.remark ?? "", fmt(o.bs ?? NaN), fmt(o.is ?? NaN), fmt(o.fs ?? NaN), fmt(o.rl), fmt(o.corr * 1000, 1), fmt(o.adjRL),
      ]),
      note,
    };
  }
  return { head: [], rows: [], note: "No data saved with this job." };
}

const SUMMARY_HEAD = ["SAVED", "SURVEYOR", "NAME", "JOB", "TYPE", "STATUS", "RESULT", "PROJECT", "SHARED WITH"];
const summaryRow = (j: Job) => [
  j.saved_at, j.owner_email, j.owner_name, j.name, j.kind === "traverse" ? "Traverse" : "Level run",
  statusOf(j.summary?.status).label, resultText(j), j.summary?.project ?? "", j.shared_with.join("; "),
];

/** One CSV per surveyor: each job's points with the adjusted results, one block per job */
function jobsCsv(jobs: Job[]): string {
  const lines: string[] = [];
  for (const j of jobs) {
    const t = jobRows(j);
    lines.push([`${j.kind === "traverse" ? "Traverse" : "Level run"}: ${j.name}`, statusOf(j.summary?.status).label, j.saved_at].map(csvCell).join(","));
    lines.push(csvCell(t.note));
    if (t.head.length) lines.push(t.head.join(","));
    t.rows.forEach((r) => lines.push(r.map(csvCell).join(",")));
    lines.push("");
  }
  return "﻿" + lines.join("\r\n");
}

// Admin → Traverse & Level: the jobs saved in the Traverse & Level app, one row per surveyor;
// open a surveyor to see their jobs, view any job's points and adjusted results, export or delete
export default function AdminTraverse({ adminFetch, onToast }: { adminFetch: Fetcher; onToast: (m: string, t?: "success" | "error") => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [usageKey, setUsageKey] = useState(0);
  const toast = useRef(onToast);
  useEffect(() => {
    toast.current = onToast;
  });

  const loadGroups = useCallback(() => {
    adminFetch("/api/admin/traverse")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load Traverse & Level jobs"))))
      .then((d) => {
        setGroups(d.groups || []);
        setTotals(d.totals || null);
        setBlocked(d.blocked || []);
      })
      .catch((e) => toast.current(e.message, "error"))
      .finally(() => setLoading(false));
  }, [adminFetch]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const jobsFor = async (userId: string): Promise<Job[] | null> => {
    const list = await fetchJobs(adminFetch, userId);
    if (!list) toast.current("Couldn't load this person's jobs", "error");
    return list;
  };

  const toggle = (g: Group) => setOpen(open === g.userId ? null : g.userId);

  const label = (g: Group) => g.email || g.name || "Deleted account";

  const exportPerson = async (g: Group) => {
    const list = await jobsFor(g.userId);
    if (list) saveFile(`Traverse & Level - ${fileSafe(label(g))}.csv`, jobsCsv(list), "text/csv;charset=utf-8");
  };

  const exportAll = async () => {
    setBusy("all");
    try {
      const all: Job[] = [];
      for (const g of groups) {
        const list = await jobsFor(g.userId);
        if (list) all.push(...list);
      }
      const csv = "﻿" + [SUMMARY_HEAD.join(","), ...all.map((j) => summaryRow(j).map(csvCell).join(","))].join("\r\n") + "\r\n";
      saveFile("Traverse & Level jobs.csv", csv, "text/csv;charset=utf-8");
    } finally {
      setBusy(null);
    }
  };

  const setBlock = async (g: Group, block: boolean) => {
    if (block && !window.confirm(`Block ${label(g)} from Traverse & Level? They keep their jobs but can't open the app's tools, save or share until you unblock them.`)) return;
    setBusy(g.userId);
    try {
      const r = await adminFetch("/api/admin/traverse", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: g.userId, blocked: block }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't change access");
      setBlocked(d.blocked || []);
      setUsageKey((k) => k + 1);
      toast.current(block ? `${label(g)} is blocked from Traverse & Level` : `${label(g)} can use Traverse & Level again`);
    } catch (e) {
      toast.current((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  const f = filter.trim().toLowerCase();
  const shown = f ? groups.filter((g) => [g.email, g.name, g.organization].join(" ").toLowerCase().includes(f)) : groups;

  return (
    <div className="space-y-5">
      <TraverseUsage key={usageKey} adminFetch={adminFetch} onToast={onToast} onUnblocked={loadGroups} />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white">Traverse &amp; Level jobs</h3>
          <p className="text-xs text-slate-400">
            {totals
              ? `${totals.jobs.toLocaleString()} jobs (${totals.traverses.toLocaleString()} traverses, ${totals.levels.toLocaleString()} level runs) from ${totals.surveyors.toLocaleString()} ${totals.surveyors === 1 ? "surveyor" : "surveyors"} · ${totals.accepted.toLocaleString()} accepted, ${totals.rejected.toLocaleString()} rejected.`
              : "Jobs saved in the Traverse & Level app."}{" "}
            Open a surveyor to see their jobs, the points and the adjusted results.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Surveyor or company"
              className="w-56 max-w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setOpen(null);
              loadGroups();
            }}
            aria-label="Refresh"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportAll}
            disabled={!groups.length || busy === "all"}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 text-xs font-bold flex items-center gap-2 border border-emerald-500/30 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export all CSV
          </button>
        </div>
      </div>

      {!loading && shown.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400 text-sm">
          {groups.length ? "No one matches" : "No Traverse & Level jobs yet"}
        </div>
      )}

      <ul className="space-y-2">
        {shown.map((g) => {
          const isOpen = open === g.userId;
          return (
            <li key={g.userId} className={`rounded-2xl border ${isOpen ? "border-blue-500/40 bg-slate-900" : "border-slate-800 bg-slate-900/70"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <button onClick={() => toggle(g)} aria-expanded={isOpen} className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">{label(g)}</span>
                    <span className="block text-xs text-slate-400 truncate">
                      {g.name && g.email ? `${g.name} · ` : ""}
                      {g.organization ? `${g.organization} · ` : ""}
                      {g.traverses} {g.traverses === 1 ? "traverse" : "traverses"}, {g.levels} {g.levels === 1 ? "level run" : "level runs"}
                      {g.lastSaved ? ` · last saved ${new Date(g.lastSaved).toLocaleDateString()}` : ""}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 flex items-center gap-1.5">
                    {blocked.includes(g.userId) && <span className="px-2 py-0.5 rounded-full border text-[11px] font-bold bg-rose-500/15 text-rose-300 border-rose-500/30">Blocked</span>}
                    {g.accepted > 0 && <span className="px-2 py-0.5 rounded-full border text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30">{g.accepted} ✓</span>}
                    {g.rejected > 0 && <span className="px-2 py-0.5 rounded-full border text-[11px] font-bold bg-rose-500/15 text-rose-300 border-rose-500/30">{g.rejected} ✗</span>}
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold">
                      {g.jobs.toLocaleString()} {g.jobs === 1 ? "job" : "jobs"}
                    </span>
                  </span>
                </button>
                <div className="flex gap-2 sm:ml-2">
                  <button
                    onClick={() => setBlock(g, !blocked.includes(g.userId))}
                    disabled={busy === g.userId}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                      blocked.includes(g.userId)
                        ? "bg-emerald-600/15 hover:bg-emerald-600/25 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-600/10 hover:bg-rose-600/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" /> {blocked.includes(g.userId) ? "Unblock" : "Block"}
                  </button>
                  <button
                    onClick={() => exportPerson(g)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-800">
                  <TraverseUserJobs adminFetch={adminFetch} userId={g.userId} who={label(g)} onToast={onToast} onChanged={loadGroups} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

async function fetchJobs(adminFetch: Fetcher, userId: string): Promise<Job[] | null> {
  try {
    const r = await adminFetch(`/api/admin/traverse?userId=${encodeURIComponent(userId)}`);
    if (!r.ok) return null;
    const d = await r.json();
    return (d.jobs || []) as Job[];
  } catch {
    return null;
  }
}

/**
 * One surveyor's Traverse & Level jobs: status, result, project, sharing; View shows the points
 * and the adjusted results, worked out by the app's engine; CSV, JSON and Delete per job.
 * Used in Admin → Traverse & Level and in the surveyor's detail window.
 */
export function TraverseUserJobs({
  adminFetch,
  userId,
  who,
  onToast,
  onChanged,
}: {
  adminFetch: Fetcher;
  userId: string;
  who: string;
  onToast: (m: string, t?: "success" | "error") => void;
  onChanged?: () => void;
}) {
  const [list, setList] = useState<Job[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<string | null>(null);

  // the caller's fetch may be a new function on every render: load again only for another surveyor
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  const load = useCallback(() => {
    fetchJobs(fetcher.current, userId).then((l) => {
      setList(l);
      setFailed(!l);
    });
  }, [userId]);
  useEffect(() => {
    load();
  }, [load]);

  const remove = async (j: Job) => {
    if (!confirm(`Delete "${j.name}" from ${who}'s Traverse & Level jobs? It is also removed for anyone it was shared with. This cannot be undone.`)) return;
    const r = await adminFetch(`/api/admin/traverse?id=${encodeURIComponent(j.id)}`, { method: "DELETE" });
    if (!r.ok) return onToast("The job could not be deleted", "error");
    onToast(`Deleted "${j.name}"`);
    load();
    onChanged?.();
  };

  if (failed) return <p className="p-6 text-center text-rose-300 text-xs">Couldn&apos;t load the Traverse &amp; Level jobs.</p>;
  if (!list)
    return (
      <p className="p-6 text-center text-slate-400 text-xs">
        <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
        Loading jobs…
      </p>
    );
  if (!list.length) return <p className="p-6 text-center text-slate-400 text-xs">No Traverse &amp; Level jobs saved.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-2.5">Job</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Result</th>
            <th className="px-4 py-2.5 hidden md:table-cell">Project</th>
            <th className="px-4 py-2.5 hidden lg:table-cell">Shared with</th>
            <th className="px-4 py-2.5 hidden sm:table-cell">Saved</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {list.map((j) => {
            const st = statusOf(j.summary?.status);
            const viewing = view === j.id;
            const t = viewing ? jobRows(j) : null;
            return (
              <Fragment key={j.id}>
                <tr className="hover:bg-slate-800/30 align-top">
                  <td className="px-4 py-2.5">
                    <span className="block font-semibold text-white max-w-[220px] truncate" title={j.name}>{j.name}</span>
                    <span className="block text-slate-400">{j.kind === "traverse" ? "Traverse" : "Level run"}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-200 whitespace-nowrap">{resultText(j)}</td>
                  <td className="px-4 py-2.5 text-slate-300 hidden md:table-cell">
                    <span className="block max-w-[160px] truncate" title={j.summary?.project}>{j.summary?.project || "—"}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300 hidden lg:table-cell">
                    {j.shared_with.length ? (
                      <span className="inline-flex items-center gap-1" title={j.shared_with.join("\n")}>
                        <Users className="w-3.5 h-3.5 text-slate-500" /> {j.shared_with.length}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap hidden sm:table-cell" title={new Date(j.saved_at).toLocaleString()}>
                    {new Date(j.saved_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setView(viewing ? null : j.id)}
                        aria-expanded={viewing}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> {viewing ? "Hide" : "View"}
                      </button>
                      <button
                        onClick={() => saveFile(`${fileSafe(j.name)}.csv`, jobsCsv([j]), "text/csv;charset=utf-8")}
                        title="Points and adjusted results as CSV"
                        aria-label={`${j.name}: CSV`}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          saveFile(
                            `${fileSafe(j.name)}.json`,
                            JSON.stringify({ id: j.id, kind: j.kind, name: j.name, owner: j.owner_email, saved_at: j.saved_at, shared_with: j.shared_with, summary: j.summary, data: j.data }, null, 2),
                            "application/json"
                          )
                        }
                        title="The job exactly as saved (JSON)"
                        aria-label={`${j.name}: JSON`}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(j)}
                        title="Delete this job"
                        aria-label={`Delete ${j.name}`}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {viewing && t && (
                  <tr>
                    <td colSpan={7} className="px-4 pb-4 pt-1 bg-slate-950/40">
                      <p className="text-[11px] text-slate-400 mb-2">
                        {[j.data?.info?.surveyor && `Surveyor ${j.data.info.surveyor}`, j.data?.info?.location, j.data?.info?.instrument, t.note].filter(Boolean).join(" · ")}
                      </p>
                      {t.rows.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-slate-800">
                          <table className="w-full text-left text-[11.5px] font-mono">
                            <thead className="bg-slate-800/70 text-[10.5px] font-bold text-slate-400 font-sans">
                              <tr>
                                {t.head.map((h, i) => (
                                  <th key={h} className={`px-3 py-1.5 ${i > 1 ? "text-right" : ""}`}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {t.rows.map((r, ri) => (
                                <tr key={ri} className="whitespace-nowrap">
                                  {r.map((c, ci) => (
                                    <td
                                      key={ci}
                                      className={`px-3 py-1.5 ${ci === 0 ? "font-bold text-white" : ci === 1 ? "font-sans text-slate-400" : ci >= r.length - 2 ? "text-right text-amber-300" : "text-right text-slate-300"}`}
                                    >
                                      {c === "" ? "—" : c}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {j.shared_with.length > 0 && <p className="mt-2 text-[11px] text-slate-400">Shared with {j.shared_with.join(", ")}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
