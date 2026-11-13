"use client";

// Admin → Admin log: every change an admin made (lib/adminLog.ts): who, what, to what, when and
// from where. Filter by admin, by kind of change, or search; export what is shown.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, RefreshCw, Search, ShieldCheck } from "lucide-react";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
interface Row {
  id: string;
  at: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  ip: string;
}

const GROUP_STYLE: Record<string, string> = {
  account: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  settings: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  release: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  data: "bg-red-500/15 text-red-300 border-red-500/30",
  file: "bg-red-500/15 text-red-300 border-red-500/30",
  toolkit: "bg-teal-500/15 text-teal-300 border-teal-500/30",
};
const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function AdminLog({ adminFetch, onToast }: { adminFetch: Fetcher; onToast: (m: string, t?: "success" | "error") => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [who, setWho] = useState("all");
  const [kind, setKind] = useState("all");
  const toast = useRef(onToast);
  useEffect(() => {
    toast.current = onToast;
  });

  const fetchRows = useCallback(
    () =>
      adminFetch("/api/admin/log", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          if (!j.success) throw new Error(j.error || "Couldn't read the admin log.");
          setRows(j.rows);
          setLabels(j.actions || {});
        })
        .catch((e) => toast.current(e.message, "error"))
        .finally(() => setLoading(false)),
    [adminFetch]
  );
  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const admins = useMemo(() => [...new Set((rows ?? []).map((r) => r.adminEmail))].sort(), [rows]);
  const groups = useMemo(() => [...new Set((rows ?? []).map((r) => r.action.split(".")[0]))].sort(), [rows]);
  const shown = (rows ?? []).filter(
    (r) =>
      (who === "all" || r.adminEmail === who) &&
      (kind === "all" || r.action.startsWith(`${kind}.`)) &&
      `${r.target} ${r.details} ${labels[r.action] ?? r.action} ${r.ip}`.toLowerCase().includes(q.trim().toLowerCase())
  );
  const exportCsv = () => {
    const body = [["When", "Admin", "What", "To what", "Details", "IP"], ...shown.map((r) => [r.at, r.adminEmail, labels[r.action] ?? r.action, r.target, r.details, r.ip])]
      .map((r) => r.map(csvCell).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const select = "px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer";
  const th = "px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300">
          Every change made in Admin is noted here: accounts blocked or changed, files and records deleted, settings, releases and emails sent. Kept for a year.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search account, setting, details, IP"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select value={who} onChange={(e) => setWho(e.target.value)} className={select} aria-label="Admin">
          <option value="all">Every admin</option>
          {admins.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={select} aria-label="Kind of change">
          <option value="all">Every kind</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g[0].toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setLoading(true);
            void fetchRows();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
        <button
          onClick={exportCsv}
          disabled={!shown.length}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {rows === null && loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
          {rows?.length ? "Nothing matches" : "No changes yet. From now on, every change made in Admin shows here."}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className={th}>When</th>
                <th className={th}>Admin</th>
                <th className={th}>What</th>
                <th className={th}>To what</th>
                <th className={th}>Details</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 1000).map((r) => (
                <tr key={r.id} className="border-b border-slate-800/60 last:border-0 align-top">
                  <td className="px-3 py-2.5 text-[13px] text-slate-300 whitespace-nowrap">
                    {new Date(r.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    {r.ip && <span className="block text-[11px] text-slate-500">{r.ip}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-slate-200 whitespace-nowrap">{r.adminEmail}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${GROUP_STYLE[r.action.split(".")[0]] ?? "bg-slate-500/15 text-slate-300 border-slate-500/30"}`}>
                      {labels[r.action] ?? r.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] text-slate-200 max-w-[260px] break-words">{r.target || "—"}</td>
                  <td className="px-3 py-2.5 text-[12.5px] text-slate-400 max-w-[420px] whitespace-pre-line break-words">{r.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
