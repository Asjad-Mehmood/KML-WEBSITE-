"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Eye, FileJson, FileSpreadsheet, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";

interface Person {
  userId: string;
  email: string | null;
  name: string | null;
  organization: string | null;
  jobs: number;
  lastSaved: string | null;
}
interface Summary { percent?: number; rise?: number; length?: number; start?: number; end?: number; stations?: number }
interface Calc {
  id: string;
  name: string;
  data: { calculation?: Record<string, unknown>; plate?: Record<string, unknown> } | null;
  summary: Summary;
  size: number;
  created_at: string;
  saved_at: string;
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;

/** 1250.5 → 1+250.500, as the app writes chainages */
function chainage(v?: number): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v < 0 ? "-" : "";
  const mm = Math.round(Math.abs(v) * 1000);
  const km = Math.floor(mm / 1e6);
  const m = ((mm % 1e6) / 1000).toFixed(3).padStart(7, "0");
  return `${sign}${km}+${m}`;
}
const signed = (v: number | undefined, d: number) => (v == null || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}`);
const slopeText = (s: Summary) => (s.percent == null ? "—" : `${signed(s.percent, 3)} %`);
const rangeText = (s: Summary) => (s.start == null || s.end == null ? "—" : `${chainage(s.start)} to ${chainage(s.end)}`);

// What the app's Calculator boxes and project plate are called
const INPUTS: [string, string][] = [
  ["y1", "Start level (m)"],
  ["y2", "End level (m)"],
  ["x1", "Start chainage"],
  ["x2", "End chainage"],
  ["interval", "Interval (m)"],
  ["decimals", "Decimals"],
  ["spacing", "Stations"],
];
const PLATE: [string, string][] = [
  ["project", "Project"],
  ["client", "Client"],
  ["contractor", "Contractor"],
  ["contract", "Contract no."],
  ["location", "Location"],
  ["package", "Work package"],
  ["drawing", "Drawing no."],
  ["revision", "Revision"],
  ["title", "Drawing title"],
  ["scale", "Scale"],
  ["zone", "Zone"],
  ["area", "Area (m²)"],
  ["workDate", "Work date"],
  ["preparedBy", "Prepared by"],
  ["checkedBy", "Checked by"],
  ["remarks", "Remarks"],
];
const text = (v: unknown) => (v == null ? "" : String(v));
const SPACING: Record<string, string> = { roundChainages: "On round chainages", fromStart: "Counted from the start" };
/** A Calculator value as the app shows it */
const input = (calc: Record<string, unknown>, k: string) => (k === "spacing" ? SPACING[text(calc[k])] ?? text(calc[k]) : text(calc[k]));

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function saveFile(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const fileSafe = (s: string) => s.replace(/[^\w.@-]+/g, "_").slice(0, 60);

const CSV_HEAD = ["SAVED", "SURVEYOR", "NAME", "CALCULATION", "SLOPE %", "RISE M", "LENGTH M", "FROM", "TO", "STATIONS", ...INPUTS.map(([, l]) => l.toUpperCase()), "PROJECT", "CLIENT", "LOCATION"];
function csvRow(c: Calc, who: Person) {
  const s = c.summary || {};
  const calc = c.data?.calculation || {};
  const plate = c.data?.plate || {};
  return [
    c.saved_at, who.email ?? "", who.name ?? "", c.name,
    s.percent?.toFixed(4) ?? "", s.rise?.toFixed(3) ?? "", s.length?.toFixed(3) ?? "",
    chainage(s.start), chainage(s.end), s.stations ?? "",
    ...INPUTS.map(([k]) => input(calc, k)), text(plate.project), text(plate.client), text(plate.location),
  ];
}
const csvOf = (rows: unknown[][]) => "﻿" + [CSV_HEAD.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\r\n") + "\r\n";

async function fetchCalcs(adminFetch: Fetcher, userId: string): Promise<Calc[] | null> {
  try {
    const r = await adminFetch(`/api/admin/slope?userId=${encodeURIComponent(userId)}`);
    if (!r.ok) return null;
    return ((await r.json()).jobs || []) as Calc[];
  } catch {
    return null;
  }
}

// Admin → Slope Calculator: the calculations surveyors keep in their accounts, one row per
// surveyor; open one to see their calculations, the inputs and project plate, export or delete
export default function AdminSlope({ adminFetch, onToast }: { adminFetch: Fetcher; onToast: (m: string, t?: "success" | "error") => void }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useRef(onToast);
  useEffect(() => {
    toast.current = onToast;
  });

  const load = useCallback(() => {
    adminFetch("/api/admin/slope")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load the Slope Calculator figures"))))
      .then((d) => setPeople(d.users || []))
      .catch((e) => toast.current(e.message, "error"))
      .finally(() => setLoading(false));
  }, [adminFetch]);
  useEffect(() => {
    load();
  }, [load]);

  const label = (p: Person) => p.email || p.name || "Deleted account";
  const total = people.reduce((n, p) => n + p.jobs, 0);

  const exportPerson = async (p: Person) => {
    const list = await fetchCalcs(adminFetch, p.userId);
    if (!list) return toast.current("Couldn't load this person's calculations", "error");
    saveFile(`Slope Calculator - ${fileSafe(label(p))}.csv`, csvOf(list.map((c) => csvRow(c, p))), "text/csv;charset=utf-8");
  };

  const exportAll = async () => {
    setBusy(true);
    try {
      const rows: unknown[][] = [];
      for (const p of people) {
        const list = await fetchCalcs(adminFetch, p.userId);
        if (!list) {
          toast.current(`Couldn't load the calculations of ${label(p)}`, "error");
          continue;
        }
        rows.push(...list.map((c) => csvRow(c, p)));
      }
      saveFile("Slope Calculator calculations.csv", csvOf(rows), "text/csv;charset=utf-8");
    } finally {
      setBusy(false);
    }
  };

  const f = filter.trim().toLowerCase();
  const shown = f ? people.filter((p) => [p.email, p.name, p.organization].join(" ").toLowerCase().includes(f)) : people;

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Slope Calculator</h3>
          <p className="text-xs text-slate-400">
            {loading
              ? "Calculations saved in the Slope Calculator app."
              : `${total.toLocaleString()} ${total === 1 ? "calculation" : "calculations"} kept by ${people.length.toLocaleString()} ${people.length === 1 ? "surveyor" : "surveyors"}.`}{" "}
            Open a surveyor to see their calculations, the inputs and the project plate.
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
              load();
            }}
            aria-label="Refresh"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportAll}
            disabled={!people.length || busy}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 text-xs font-bold flex items-center gap-2 border border-emerald-500/30 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export all CSV
          </button>
        </div>
      </div>

      {!loading && shown.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400 text-sm">
          {people.length ? "No one matches" : "No Slope Calculator calculations saved yet"}
        </div>
      )}

      <ul className="space-y-2">
        {shown.map((p) => {
          const isOpen = open === p.userId;
          return (
            <li key={p.userId} className={`rounded-2xl border ${isOpen ? "border-blue-500/40 bg-slate-900" : "border-slate-800 bg-slate-900/70"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <button onClick={() => setOpen(isOpen ? null : p.userId)} aria-expanded={isOpen} className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">{label(p)}</span>
                    <span className="block text-xs text-slate-400 truncate">
                      {p.name && p.email ? `${p.name} · ` : ""}
                      {p.organization ? `${p.organization} · ` : ""}
                      {p.lastSaved ? `last saved ${new Date(p.lastSaved).toLocaleDateString()}` : ""}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold">
                    {p.jobs.toLocaleString()} {p.jobs === 1 ? "calculation" : "calculations"}
                  </span>
                </button>
                <button
                  onClick={() => exportPerson(p)}
                  className="sm:ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 cursor-pointer self-start sm:self-auto"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-slate-800">
                  <SlopeUserCalcs adminFetch={adminFetch} person={p} who={label(p)} onToast={onToast} onChanged={load} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One surveyor's calculations: slope, chainages, stations, project; View shows the inputs and the project plate */
function SlopeUserCalcs({
  adminFetch,
  person,
  who,
  onToast,
  onChanged,
}: {
  adminFetch: Fetcher;
  person: Person;
  who: string;
  onToast: (m: string, t?: "success" | "error") => void;
  onChanged: () => void;
}) {
  const [list, setList] = useState<Calc[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<string | null>(null);

  // the caller's fetch may be a new function on every render: load again only for another surveyor
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  const userId = person.userId;
  const load = useCallback(() => {
    fetchCalcs(fetcher.current, userId).then((l) => {
      setList(l);
      setFailed(!l);
    });
  }, [userId]);
  useEffect(() => {
    load();
  }, [load]);

  const remove = async (c: Calc) => {
    if (!confirm(`Delete "${c.name}" from ${who}'s Slope Calculator account? It goes from every device they use. This cannot be undone.`)) return;
    const r = await adminFetch(`/api/admin/slope?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
    if (!r.ok) return onToast("The calculation could not be deleted", "error");
    onToast(`Deleted "${c.name}"`);
    load();
    onChanged();
  };

  if (failed) return <p className="p-6 text-center text-rose-300 text-xs">Couldn&apos;t load the calculations.</p>;
  if (!list)
    return (
      <p className="p-6 text-center text-slate-400 text-xs">
        <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
        Loading calculations…
      </p>
    );
  if (!list.length) return <p className="p-6 text-center text-slate-400 text-xs">No calculations saved.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-2.5">Calculation</th>
            <th className="px-4 py-2.5">Slope</th>
            <th className="px-4 py-2.5 hidden md:table-cell">Chainages</th>
            <th className="px-4 py-2.5 hidden lg:table-cell">Stations</th>
            <th className="px-4 py-2.5 hidden md:table-cell">Project</th>
            <th className="px-4 py-2.5 hidden sm:table-cell">Saved</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {list.map((c) => {
            const s = c.summary || {};
            const viewing = view === c.id;
            const calc = c.data?.calculation || {};
            const plate = c.data?.plate || {};
            return (
              <Fragment key={c.id}>
                <tr className="hover:bg-slate-800/30 align-top">
                  <td className="px-4 py-2.5">
                    <span className="block font-semibold text-white max-w-[220px] truncate" title={c.name}>{c.name}</span>
                    <span className="block text-slate-400">{s.rise != null ? `${signed(s.rise, 3)} m over ${s.length?.toFixed(3) ?? "—"} m` : ""}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-amber-300 whitespace-nowrap">{slopeText(s)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-200 whitespace-nowrap hidden md:table-cell">{rangeText(s)}</td>
                  <td className="px-4 py-2.5 text-slate-300 hidden lg:table-cell">{s.stations ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-300 hidden md:table-cell">
                    <span className="block max-w-[160px] truncate" title={text(plate.project)}>{text(plate.project) || "—"}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap hidden sm:table-cell" title={new Date(c.saved_at).toLocaleString()}>
                    {new Date(c.saved_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setView(viewing ? null : c.id)}
                        aria-expanded={viewing}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> {viewing ? "Hide" : "View"}
                      </button>
                      <button
                        onClick={() =>
                          saveFile(
                            `${fileSafe(c.name)}.json`,
                            JSON.stringify({ id: c.id, name: c.name, owner: person.email, saved_at: c.saved_at, summary: c.summary, data: c.data }, null, 2),
                            "application/json"
                          )
                        }
                        title="The calculation exactly as saved (JSON)"
                        aria-label={`${c.name}: JSON`}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        title="Delete this calculation"
                        aria-label={`Delete ${c.name}`}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {viewing && (
                  <tr>
                    <td colSpan={7} className="px-4 pb-4 pt-1 bg-slate-950/40">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Pairs title="Calculator" rows={INPUTS.map(([k, l]) => [l, input(calc, k)])} mono />
                        <Pairs title="Project plate" rows={PLATE.map(([k, l]) => [l, text(plate[k])]).filter(([, v]) => v)} />
                      </div>
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

function Pairs({ title, rows, mono }: { title: string; rows: string[][]; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{title}</p>
      {rows.length === 0 ? (
        <p className="text-[11.5px] text-slate-500">Nothing filled in.</p>
      ) : (
        <dl className="rounded-lg border border-slate-800 divide-y divide-slate-800/60">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-3 px-3 py-1.5 text-[11.5px]">
              <dt className="w-32 shrink-0 text-slate-400">{k}</dt>
              <dd className={`min-w-0 break-words text-slate-200 ${mono ? "font-mono" : ""}`}>{v || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
