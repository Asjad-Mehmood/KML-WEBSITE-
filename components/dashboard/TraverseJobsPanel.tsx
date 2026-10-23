"use client";

import { useMemo, useState } from "react";
import { Compass, Download, ExternalLink, Loader2, Search, Share2, Trash2, Users } from "lucide-react";
import type { TraverseJobCard } from "@/lib/traverseJobs";

// Dashboard → Traverse & Level: the jobs kept in the account by the Traverse & Level app
// (web app and Windows program), and the jobs colleagues shared with this account.

const STATUS: Record<string, [string, string]> = {
  accepted: ["Accepted", "bg-emerald-50 text-emerald-700 border-emerald-200"],
  rejected: ["Rejected", "bg-rose-50 text-rose-700 border-rose-200"],
  open: ["Open", "bg-sky-50 text-sky-700 border-sky-200"],
  incomplete: ["Incomplete", "bg-slate-50 text-slate-600 border-slate-200"],
};

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const kb = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);
const date = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** The result in a few words: "1 : 18,401 · 25 mm · 4 points" or "misclosure 3.2 mm (± 8 mm)" */
export function traverseResult(j: Pick<TraverseJobCard, "kind" | "summary">): string {
  const s = j.summary;
  const parts: string[] = [];
  if (j.kind === "traverse") {
    const ratio = n(s.ratio), linear = n(s.linear), pts = n(s.points), len = n(s.length);
    if (ratio) parts.push(`1 : ${ratio.toLocaleString("en-US")}`);
    if (linear != null) parts.push(`${linear} mm`);
    if (pts) parts.push(`${pts} point${pts === 1 ? "" : "s"}`);
    if (len) parts.push(`${len.toLocaleString("en-US")} m`);
    if (typeof s.method === "string" && s.method) parts.push(s.method);
  } else {
    const mis = n(s.mis), allow = n(s.allow), rows = n(s.rows);
    if (mis != null) parts.push(`misclosure ${mis} mm${allow != null ? ` (± ${allow} mm)` : ""}`);
    if (rows) parts.push(`${rows} row${rows === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

export default function TraverseJobsPanel({ own, shared }: { own: TraverseJobCard[]; shared: TraverseJobCard[] }) {
  const [jobs, setJobs] = useState(own);
  const [kind, setKind] = useState<"all" | "traverse" | "level">("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return jobs.filter(
      (j) => (kind === "all" || j.kind === kind) && (!t || `${j.name} ${String(j.summary.project || "")}`.toLowerCase().includes(t))
    );
  }, [jobs, kind, q]);

  const checked = jobs.filter((j) => j.summary.status === "accepted" || j.summary.status === "rejected");
  const accepted = checked.filter((j) => j.summary.status === "accepted").length;

  const remove = async (j: TraverseJobCard) => {
    if (!window.confirm(`Delete “${j.name}” from your account? It also goes from the Traverse & Level app on every device.`)) return;
    setBusy(j.id);
    try {
      const r = await fetch(`/api/traverse/jobs/${encodeURIComponent(j.id)}`, { method: "DELETE" });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error);
      setJobs((js) => js.filter((x) => x.id !== j.id));
      setNote({ ok: true, text: `Deleted ${j.name}.` });
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message || `Couldn't delete ${j.name}. Please try again.` });
    }
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Jobs", jobs.length, "kept in your account"],
          ["Traverses", jobs.filter((j) => j.kind === "traverse").length, `${jobs.filter((j) => j.kind === "traverse" && j.summary.status === "accepted").length} accepted`],
          ["Level runs", jobs.filter((j) => j.kind === "level").length, `${jobs.filter((j) => j.kind === "level" && j.summary.status === "accepted").length} accepted`],
          ["Pass rate", checked.length ? `${Math.round((100 * accepted) / checked.length)}%` : "–", `${checked.length} checked`],
        ].map(([k, v, sub]) => (
          <div key={k as string} className="bg-white rounded-2xl border border-slate-200/80 p-4">
            <p className="text-[11.5px] font-semibold text-slate-500">{k}</p>
            <p className="text-2xl font-extrabold tracking-tight tabular-nums">{v}</p>
            <p className="text-[11.5px] text-slate-500">{sub}</p>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b border-slate-100">
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Job or project"
              aria-label="Search Traverse & Level jobs"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-base sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Kind" className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(["all", "traverse", "level"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  aria-pressed={kind === k}
                  className={`px-3 py-1 rounded-lg text-[12px] font-semibold cursor-pointer ${kind === k ? "bg-white shadow-xs text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {k === "all" ? "All" : k === "traverse" ? "Traverses" : "Level runs"}
                </button>
              ))}
            </div>
            <a
              href="/traverse/app"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[12.5px] font-semibold"
            >
              Open Traverse &amp; Level <ExternalLink className="w-3.5 h-3.5" aria-hidden />
            </a>
          </div>
        </div>
        {note && (
          <p role="status" className={`px-5 py-2.5 text-[13px] border-b border-slate-100 ${note.ok ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
            {note.text}
          </p>
        )}
        {shown.length === 0 ? (
          <div className="text-center py-12 px-6">
            <span className="mx-auto w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" aria-hidden />
            </span>
            <p className="font-semibold text-slate-800">{jobs.length ? "No jobs match" : "No Traverse & Level jobs yet"}</p>
            <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">
              {jobs.length
                ? "Try another filter or search."
                : "Open Traverse & Level, enter a traverse or a level book and press Save. Every job you save appears here, from the web app and the Windows program."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((j) => {
              const [label, cls] = STATUS[String(j.summary.status)] || STATUS.incomplete;
              const result = traverseResult(j);
              return (
                <li key={j.id} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-slate-900 break-all flex flex-wrap items-center gap-2">
                      {j.name}
                      <span className={`px-1.5 py-0.5 rounded-md border text-[10.5px] font-bold ${cls}`}>{label}</span>
                    </p>
                    <p className="text-[11.5px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{j.kind === "level" ? "Level run" : "Traverse"}</span>
                      {typeof j.summary.project === "string" && j.summary.project && <span>· {j.summary.project}</span>}
                      {result && <span className="text-slate-700">· {result}</span>}
                      {j.sharedWith > 0 && (
                        <span className="inline-flex items-center gap-1">
                          · <Share2 className="w-3 h-3" aria-hidden /> shared with {j.sharedWith}
                        </span>
                      )}
                      <span>· {kb(j.size)}</span>
                      <span>· saved {date(j.savedAt)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/api/traverse/jobs/${encodeURIComponent(j.id)}?download=1`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-blue-200 hover:text-[#0071e3]"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden /> Download
                    </a>
                    <button
                      onClick={() => remove(j)}
                      disabled={busy === j.id}
                      aria-label={`Delete ${j.name}`}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 cursor-pointer disabled:opacity-50"
                    >
                      {busy === j.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Trash2 className="w-3.5 h-3.5" aria-hidden />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <h2 className="px-4 sm:px-5 py-3.5 border-b border-slate-100 text-[15px] font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" aria-hidden /> Shared with me
        </h2>
        {shared.length === 0 ? (
          <p className="px-5 py-5 text-[13px] text-slate-500">Nothing yet. When a colleague shares a Traverse &amp; Level job with your email, it appears here.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {shared.map((j) => {
              const [label, cls] = STATUS[String(j.summary.status)] || STATUS.incomplete;
              return (
                <li key={j.id} className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-slate-900 break-all flex flex-wrap items-center gap-2">
                      {j.name}
                      <span className={`px-1.5 py-0.5 rounded-md border text-[10.5px] font-bold ${cls}`}>{label}</span>
                    </p>
                    <p className="text-[11.5px] text-slate-500 mt-1">
                      {j.kind === "level" ? "Level run" : "Traverse"} · from {j.ownerName || j.ownerEmail} · saved {date(j.savedAt)}
                      {traverseResult(j) && ` · ${traverseResult(j)}`}
                    </p>
                  </div>
                  <a
                    href={`/api/traverse/jobs/${encodeURIComponent(j.id)}?download=1`}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-700 hover:border-blue-200 hover:text-[#0071e3]"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden /> Download
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
