"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, FileSpreadsheet, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";

interface Group {
  userId: string | null;
  email: string | null;
  name: string | null;
  points: number;
  lastSaved: string | null;
  grids: string[];
}

interface Point {
  id: string;
  userEmail?: string | null;
  fileName?: string | null;
  station: string;
  featureCode: string;
  easting: number;
  northing: number;
  elevation: number | null;
  coordSystem: string;
  lat: string;
  lon: string;
  timestamp: string;
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;

const HEAD = ["SAVED", "SURVEYOR", "FILE", "STATION", "CODE", "GRID", "EASTING", "NORTHING", "ELEVATION", "LATITUDE", "LONGITUDE"];
const rowOf = (c: Point) => {
  const noGrid = !c.easting && !c.northing;
  return [
    c.timestamp,
    c.userEmail ?? "",
    c.fileName ?? "",
    c.station,
    c.featureCode,
    c.coordSystem,
    noGrid ? "" : c.easting,
    noGrid ? "" : c.northing,
    c.elevation ?? "",
    c.lat,
    c.lon,
  ];
};

function download(name: string, points: Point[]) {
  const q = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + [HEAD.join(","), ...points.map((c) => rowOf(c).map(q).join(","))].join("\r\n") + "\r\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const fileSafe = (s: string) => s.replace(/[^\w.@-]+/g, "_").slice(0, 60);

// Admin → Points: one row per surveyor; open a row to see that person's points,
// and copy or export just theirs
export default function AdminPoints({ adminFetch, onToast }: { adminFetch: Fetcher; onToast: (m: string, t?: "success" | "error") => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null); // userId or "none"
  const [points, setPoints] = useState<Record<string, { rows: Point[]; total: number }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [inner, setInner] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const toast = useRef(onToast);
  useEffect(() => {
    toast.current = onToast;
  });

  const loadGroups = useCallback(() => {
    adminFetch("/api/admin/conversions?group=user")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load points"))))
      .then((d) => {
        setGroups(d.groups || []);
        setTotal(d.total || 0);
      })
      .catch((e) => toast.current(e.message, "error"))
      .finally(() => setLoading(false));
  }, [adminFetch]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const keyOf = (g: Group) => g.userId ?? "none";

  const pointsFor = async (g: Group) => {
    const k = keyOf(g);
    if (points[k]) return points[k];
    setBusy(k);
    try {
      const r = await adminFetch(`/api/admin/conversions?userId=${encodeURIComponent(k)}&limit=5000`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      const v = { rows: (d.conversions || []) as Point[], total: d.total || 0 };
      setPoints((p) => ({ ...p, [k]: v }));
      return v;
    } catch {
      toast.current("Couldn't load this person's points", "error");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (g: Group) => {
    const k = keyOf(g);
    if (open === k) return setOpen(null);
    setInner("");
    setOpen(k);
    await pointsFor(g);
  };

  const label = (g: Group) => g.email || g.name || "No account";

  const copy = async (g: Group) => {
    const v = await pointsFor(g);
    if (!v) return;
    const tsv = [HEAD.join("\t"), ...v.rows.map((c) => rowOf(c).join("\t"))].join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(keyOf(g));
      setTimeout(() => setCopied(null), 1800);
      toast.current(`Copied ${v.rows.length.toLocaleString()} points — paste into Excel`);
    } catch {
      toast.current("Your browser blocked copying. Use Export CSV instead.", "error");
    }
  };

  const exportOne = async (g: Group) => {
    const v = await pointsFor(g);
    if (v) download(`Points - ${fileSafe(label(g))}.csv`, v.rows);
  };

  const exportAll = async () => {
    setBusy("all");
    try {
      const r = await adminFetch("/api/admin/conversions?limit=5000");
      const d = await r.json();
      download("Converted points.csv", d.conversions || []);
      if ((d.total || 0) > (d.conversions || []).length) toast.current(`Exported the newest 5,000 of ${d.total.toLocaleString()} points`);
    } catch {
      toast.current("Export failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const clearAll = async () => {
    if (!confirm("Delete every converted point for every surveyor? The files stay. This cannot be undone.")) return;
    const r = await adminFetch("/api/admin/conversions", { method: "DELETE" });
    if (!r.ok) return toast.current("Failed to clear points", "error");
    setPoints({});
    setOpen(null);
    toast.current("All points cleared");
    loadGroups();
  };

  const f = filter.trim().toLowerCase();
  const shown = f ? groups.filter((g) => [g.email, g.name, ...g.grids].join(" ").toLowerCase().includes(f)) : groups;

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Converted points</h3>
          <p className="text-xs text-slate-400">
            {total.toLocaleString()} points from {groups.length.toLocaleString()} {groups.length === 1 ? "person" : "people"}. Open a person to see,
            copy or export their points.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Surveyor or grid"
              className="w-56 max-w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setPoints({});
              loadGroups();
            }}
            aria-label="Refresh"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportAll}
            disabled={!total || busy === "all"}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 text-xs font-bold flex items-center gap-2 border border-emerald-500/30 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export all CSV
          </button>
          <button
            onClick={clearAll}
            className="px-3.5 py-2 rounded-xl bg-rose-600/15 text-rose-400 hover:bg-rose-600/25 text-xs font-bold flex items-center gap-2 border border-rose-500/30 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Clear all
          </button>
        </div>
      </div>

      {!loading && shown.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400 text-sm">
          {groups.length ? "No one matches" : "No converted points yet"}
        </div>
      )}

      <ul className="space-y-2">
        {shown.map((g) => {
          const k = keyOf(g);
          const isOpen = open === k;
          const data = points[k];
          const q = inner.trim().toLowerCase();
          const rows = isOpen && data ? (q ? data.rows.filter((c) => [c.fileName, c.station, c.featureCode, c.coordSystem].join(" ").toLowerCase().includes(q)) : data.rows) : [];
          return (
            <li key={k} className={`rounded-2xl border ${isOpen ? "border-blue-500/40 bg-slate-900" : "border-slate-800 bg-slate-900/70"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <button onClick={() => toggle(g)} aria-expanded={isOpen} className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">{label(g)}</span>
                    <span className="block text-xs text-slate-400 truncate">
                      {g.name && g.email ? `${g.name} · ` : ""}
                      {g.grids.slice(0, 3).join(", ")}
                      {g.grids.length > 3 ? ` +${g.grids.length - 3} more` : ""}
                      {g.lastSaved ? ` · last saved ${new Date(g.lastSaved).toLocaleDateString()}` : ""}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold">
                    {g.points.toLocaleString()} {g.points === 1 ? "point" : "points"}
                  </span>
                </button>
                <div className="flex gap-2 sm:ml-2">
                  <button
                    onClick={() => copy(g)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    {copied === k ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} Copy
                  </button>
                  <button
                    onClick={() => exportOne(g)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-800">
                  {busy === k && !data ? (
                    <p className="p-6 text-center text-slate-400 text-xs">
                      <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
                      Loading points…
                    </p>
                  ) : data ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <p className="text-xs text-slate-400">
                          {data.total > data.rows.length
                            ? `Showing the newest ${data.rows.length.toLocaleString()} of ${data.total.toLocaleString()} points`
                            : `${data.rows.length.toLocaleString()} points`}
                          {q ? ` · ${rows.length.toLocaleString()} match` : ""}
                        </p>
                        <input
                          type="search"
                          value={inner}
                          onChange={(e) => setInner(e.target.value)}
                          placeholder="File, station, code or grid"
                          className="w-56 max-w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="sticky top-0 bg-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-2.5">File</th>
                              <th className="px-4 py-2.5">Station</th>
                              <th className="px-4 py-2.5 hidden md:table-cell">Code</th>
                              <th className="px-4 py-2.5 hidden lg:table-cell">Grid</th>
                              <th className="px-4 py-2.5 text-right">Easting</th>
                              <th className="px-4 py-2.5 text-right">Northing</th>
                              <th className="px-4 py-2.5 text-right hidden md:table-cell">Elevation</th>
                              <th className="px-4 py-2.5 text-right">Latitude</th>
                              <th className="px-4 py-2.5 text-right">Longitude</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {rows.map((c) => {
                              const noGrid = !c.easting && !c.northing;
                              return (
                                <tr key={c.id} className="whitespace-nowrap hover:bg-slate-800/30">
                                  <td className="px-4 py-2 font-sans">
                                    <span className="block max-w-[160px] truncate text-slate-300" title={`${c.fileName || ""} · ${new Date(c.timestamp).toLocaleString()}`}>
                                      {c.fileName || "—"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 font-bold text-white">{c.station}</td>
                                  <td className="px-4 py-2 text-slate-300 hidden md:table-cell">{c.featureCode || "—"}</td>
                                  <td className="px-4 py-2 hidden lg:table-cell font-sans">
                                    <span className="block max-w-[170px] truncate text-blue-400" title={c.coordSystem}>
                                      {c.coordSystem}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-right text-slate-300">{noGrid ? "—" : c.easting.toFixed(3)}</td>
                                  <td className="px-4 py-2 text-right text-slate-300">{noGrid ? "—" : c.northing.toFixed(3)}</td>
                                  <td className="px-4 py-2 text-right text-slate-300 hidden md:table-cell">{c.elevation == null ? "—" : c.elevation.toFixed(3)}</td>
                                  <td className="px-4 py-2 text-right text-emerald-400">{Number(c.lat).toFixed(7)}</td>
                                  <td className="px-4 py-2 text-right text-emerald-400">{Number(c.lon).toFixed(7)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
