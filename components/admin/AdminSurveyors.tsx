"use client";

// Admin → Surveyors: every account, searched, filtered and sorted in the database (app/api/admin/surveyors),
// 50 at a time as you scroll. The numbers at the top; filters for the email (confirmed or not), admins,
// blocked, full access, a program they downloaded, never downloaded, when they joined, when they last
// signed in and their country; tick many to block, unblock, sign out everywhere, export or delete.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  CheckSquare,
  Edit3,
  Eye,
  FileSpreadsheet,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Square,
  Trash2,
  Unlock,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
export interface SurveyorRow {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  role: string | null;
  hasFullAccess: boolean;
  customMaxPoints: number | null;
  ipAddress: string | null;
  location: string | null;
  createdAt: string;
  lastLoginAt: string;
  downloads: number;
  lastDownload: string | null;
  apps: string[];
  emailState: "confirmed" | "waiting" | "older";
  blocked: boolean;
}
interface Summary {
  total: number;
  new7: number;
  new30: number;
  active30: number;
  confirmed: number;
  waiting: number;
  blocked: number;
  admins: number;
  downloaders: number;
  countries: [string, number][];
}

const APPS: Record<string, { short: string; tone: string }> = {
  "excel-to-kml": { short: "Excel to KML", tone: "bg-blue-500/10 text-blue-300 border-blue-500/25" },
  traverse: { short: "Traverse", tone: "bg-violet-500/10 text-violet-300 border-violet-500/25" },
  slope: { short: "Slope", tone: "bg-amber-500/10 text-amber-300 border-amber-500/25" },
  roadpro: { short: "RoadPro", tone: "bg-rose-500/10 text-rose-300 border-rose-500/25" },
  "folder-manager": { short: "Folders", tone: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25" },
  toolkit: { short: "Toolkit", tone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" },
};
const PRESETS = [
  { id: "waiting", label: "Email not confirmed", set: { email: "waiting" } },
  { id: "never", label: "Never downloaded", set: { downloaded: "no" } },
  { id: "inactive", label: "Away 90+ days", set: { active: "-90" } },
  { id: "new", label: "Joined this week", set: { joined: "7" } },
  { id: "blocked", label: "Blocked", set: { kind: "blocked" } },
  { id: "admin", label: "Admins", set: { kind: "admin" } },
] as const;
type F = { q: string; email: string; kind: string; app: string; downloaded: string; joined: string; active: string; country: string; sort: string };
const EMPTY: F = { q: "", email: "", kind: "", app: "", downloaded: "", joined: "", active: "", country: "", sort: "newest" };
const PAGE = 50;

const card = "rounded-2xl border border-slate-800 bg-slate-900/60";
const control = "px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const ago = (s: string | null) => {
  if (!s) return "—";
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 864e5);
  return d < 1
    ? "today"
    : d === 1
      ? "yesterday"
      : d < 30
        ? `${d} days ago`
        : new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export default function AdminSurveyors({
  adminFetch,
  onToast,
  onOpenAccount,
  onAdd,
  onEdit,
  reloadKey,
  place,
  me,
}: {
  adminFetch: Fetcher;
  onToast: (m: string, t?: "success" | "error") => void;
  onOpenAccount: (id: string) => void;
  onAdd: () => void;
  onEdit: (u: SurveyorRow) => void;
  /** changes when an account was added or edited in the window above */
  reloadKey: number;
  /** "Doha, Qatar" → flag and text */
  place: (loc?: string | null) => { text: string; flag: string };
  /** the admin's own account, never blocked or deleted from here */
  me: string;
}) {
  const [f, setF] = useState<F>(EMPTY);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<SurveyorRow[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const fetcher = useRef(adminFetch);
  const toast = useRef(onToast);
  useEffect(() => {
    fetcher.current = adminFetch;
    toast.current = onToast;
  });

  useEffect(() => {
    const t = setTimeout(() => setQ(f.q.trim()), 300);
    return () => clearTimeout(t);
  }, [f.q]);

  const params = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      for (const k of ["email", "kind", "app", "downloaded", "joined", "active", "country", "sort"] as const) if (f[k]) p.set(k, f[k]);
      for (const [k, v] of Object.entries(extra)) p.set(k, v);
      return p.toString();
    },
    [q, f]
  );

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      setLoading(true);
      Promise.all([
        fetcher.current(`/api/admin/surveyors?${params({ limit: String(PAGE), offset: "0" })}`, { cache: "no-store" }).then((r) => r.json()),
        fetcher.current("/api/admin/surveyors?view=summary", { cache: "no-store" }).then((r) => r.json()),
      ])
        .then(([l, s]) => {
          if (!live) return;
          if (!l.success) throw new Error(l.error);
          setRows(l.rows);
          setTotal(l.total);
          if (s.success) setSummary(s);
          setSelected(new Set());
        })
        .catch(() => live && toast.current("Couldn't load the accounts", "error"))
        .finally(() => live && setLoading(false));
    }, 0);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [params, reload, reloadKey]);

  const loadMore = useCallback(() => {
    setMore(true);
    fetcher
      .current(`/api/admin/surveyors?${params({ limit: String(PAGE), offset: String(rows.length) })}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) return;
        setRows((have) => {
          const seen = new Set(have.map((r) => r.id));
          return [...have, ...(j.rows as SurveyorRow[]).filter((r) => !seen.has(r.id))];
        });
        setTotal(j.total);
      })
      .finally(() => setMore(false));
  }, [params, rows.length]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || loading || more || rows.length >= total) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && loadMore(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, more, rows.length, total, loadMore]);

  const set = (k: keyof F, v: string) => setF((x) => ({ ...x, [k]: v }));
  const filtered = Object.entries(f).some(([k, v]) => k !== "sort" && v);
  const preset = (p: (typeof PRESETS)[number]) => setF({ ...EMPTY, sort: f.sort, ...p.set });
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allShown = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const picked = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);

  // block, unblock or sign out every ticked account (not your own), one by one through Controls
  const control_ = async (action: "block" | "unblock" | "signout") => {
    const list = picked.filter((r) => r.id !== me && (action !== "block" || !r.blocked) && (action !== "unblock" || r.blocked));
    if (!list.length) return onToast("Nothing to change in the ticked accounts", "error");
    const reason =
      action === "block"
        ? window.prompt(
            `Block ${list.length} ${list.length === 1 ? "account" : "accounts"}? They can't sign in until unblocked. Reason (kept in the Admin log):`,
            ""
          )
        : "";
    if (reason === null) return;
    if (
      action !== "block" &&
      !window.confirm(`${action === "unblock" ? "Unblock" : "Sign out everywhere"} ${list.length} ${list.length === 1 ? "account" : "accounts"}?`)
    )
      return;
    setBusy(action);
    let ok = 0;
    for (const r of list) {
      const res = await adminFetch(`/api/admin/users/${r.id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) ok++;
    }
    setBusy(null);
    onToast(
      `${action === "block" ? "Blocked" : action === "unblock" ? "Unblocked" : "Signed out"} ${ok} of ${list.length}`,
      ok === list.length ? "success" : "error"
    );
    setReload((x) => x + 1);
  };
  const remove = async (list: SurveyorRow[]) => {
    const ok = list.filter((r) => r.id !== me && r.email !== "admin@exceltokml.com");
    if (!ok.length) return onToast("Your own account can't be deleted from here", "error");
    if (
      !window.confirm(
        `Delete ${ok.length === 1 ? `${ok[0].name} (${ok[0].email})` : `${ok.length} accounts`}? Their files, jobs and calculations go too. This can't be undone.`
      )
    )
      return;
    setBusy("delete");
    let done = 0;
    for (const r of ok) {
      const res = await adminFetch(`/api/admin/users/${r.id}`, { method: "DELETE" });
      if (res.ok) done++;
    }
    setBusy(null);
    onToast(`Deleted ${done} of ${ok.length}`, done === ok.length ? "success" : "error");
    setReload((x) => x + 1);
  };
  const exportCsv = async () => {
    setBusy("csv");
    try {
      const r = await adminFetch(`/api/admin/surveyors?${params({ format: "csv" })}`);
      if (!r.ok) throw new Error();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(await r.blob());
      a.download = `surveyors-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      onToast("Couldn't export", "error");
    } finally {
      setBusy(null);
    }
  };

  const s = summary;
  const tiles: [string, string, string, () => void][] = s
    ? [
        ["Accounts", s.total.toLocaleString(), `${s.admins} admin${s.admins === 1 ? "" : "s"}`, () => setF({ ...EMPTY, sort: f.sort })],
        ["New", s.new30.toLocaleString(), `in 30 days · ${s.new7} this week`, () => setF({ ...EMPTY, sort: f.sort, joined: "30" })],
        [
          "Signed in, 30 days",
          s.active30.toLocaleString(),
          `${s.total ? Math.round((s.active30 / s.total) * 100) : 0}% of accounts`,
          () => setF({ ...EMPTY, sort: f.sort, active: "30" }),
        ],
        [
          "Downloaded something",
          s.downloaders.toLocaleString(),
          `${(s.total - s.downloaders).toLocaleString()} never did`,
          () => setF({ ...EMPTY, sort: f.sort, downloaded: "yes" }),
        ],
        ["Email confirmed", s.confirmed.toLocaleString(), `${s.waiting} waiting`, () => setF({ ...EMPTY, sort: f.sort, email: "confirmed" })],
        ["Blocked", s.blocked.toLocaleString(), s.blocked ? "can't sign in" : "none", () => setF({ ...EMPTY, sort: f.sort, kind: "blocked" })],
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* the numbers: each one filters the list */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {tiles.map(([label, value, sub, go]) => (
          <button key={label} onClick={go} className={`${card} p-4 text-left hover:border-slate-600 cursor-pointer`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-white tabular-nums">{value}</p>
            <p className="text-[11.5px] text-slate-400">{sub}</p>
          </button>
        ))}
      </div>

      {/* find */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] sm:flex-none">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <input
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            type="search"
            placeholder="Name, email, company, place or IP"
            aria-label="Search accounts"
            className={`${control} w-full sm:w-72 pl-9`}
          />
        </div>
        <select
          value={f.email}
          onChange={(e) => set("email", e.target.value)}
          aria-label="Email"
          className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
        >
          <option value="">Any email</option>
          <option value="confirmed">Email confirmed</option>
          <option value="waiting">Not confirmed yet</option>
          <option value="older">Older accounts</option>
        </select>
        <select
          value={f.app}
          onChange={(e) => set("app", e.target.value)}
          aria-label="Downloaded"
          className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
        >
          <option value="">Any program</option>
          {Object.entries(APPS).map(([id, a]) => (
            <option key={id} value={id}>
              Downloaded {a.short}
            </option>
          ))}
        </select>
        <select
          value={f.active}
          onChange={(e) => set("active", e.target.value)}
          aria-label="Signed in"
          className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
        >
          <option value="">Signed in any time</option>
          <option value="7">In the last 7 days</option>
          <option value="30">In the last 30 days</option>
          <option value="-90">Not for 90+ days</option>
          <option value="-180">Not for 180+ days</option>
        </select>
        <select
          value={f.joined}
          onChange={(e) => set("joined", e.target.value)}
          aria-label="Joined"
          className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
        >
          <option value="">Joined any time</option>
          <option value="7">Joined in 7 days</option>
          <option value="30">Joined in 30 days</option>
          <option value="90">Joined in 90 days</option>
          <option value="365">Joined this year</option>
        </select>
        {s && s.countries.length > 0 && (
          <select
            value={f.country}
            onChange={(e) => set("country", e.target.value)}
            aria-label="Country"
            className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
          >
            <option value="">Every country</option>
            {s.countries.map(([c, n]) => (
              <option key={c} value={c}>
                {c} ({n})
              </option>
            ))}
          </select>
        )}
        <select
          value={f.sort}
          onChange={(e) => set("sort", e.target.value)}
          aria-label="Sort"
          className={`${control} flex-1 basis-[45%] sm:flex-none sm:basis-auto`}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="active">Last signed in</option>
          <option value="inactive">Longest away</option>
          <option value="downloads">Most downloads</option>
          <option value="name">Name A–Z</option>
        </select>
        <span className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={busy !== null}
            className={`${btn} py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white`}
            title="Every account the filters show, as a spreadsheet"
          >
            {busy === "csv" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />} Export CSV
          </button>
          <button
            onClick={() => setReload((x) => x + 1)}
            aria-label="Refresh"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={onAdd} className={`${btn} py-2 bg-blue-600 hover:bg-blue-500 text-white`}>
            <Plus className="w-4 h-4" /> Add surveyor
          </button>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => {
          const on = Object.entries(p.set).every(([k, v]) => f[k as keyof F] === v);
          return (
            <button
              key={p.id}
              onClick={() => (on ? setF({ ...EMPTY, sort: f.sort }) : preset(p))}
              aria-pressed={on}
              className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold border cursor-pointer ${on ? "bg-blue-600 border-blue-500 text-white" : "border-slate-700 text-slate-400 hover:text-white"}`}
            >
              {p.label}
            </button>
          );
        })}
        {filtered && (
          <button
            onClick={() => setF({ ...EMPTY, sort: f.sort })}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11.5px] font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {total.toLocaleString()} {filtered ? "matching" : ""} {total === 1 ? "account" : "accounts"}
        </span>
      </div>

      {/* what's ticked */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 backdrop-blur text-sm text-white">
          <span className="font-bold">{selected.size} ticked</span>
          <button onClick={() => control_("block")} disabled={busy !== null} className={`${btn} bg-slate-900/70 hover:bg-slate-900 text-red-300`}>
            {busy === "block" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Block
          </button>
          <button onClick={() => control_("unblock")} disabled={busy !== null} className={`${btn} bg-slate-900/70 hover:bg-slate-900 text-emerald-300`}>
            {busy === "unblock" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />} Unblock
          </button>
          <button onClick={() => control_("signout")} disabled={busy !== null} className={`${btn} bg-slate-900/70 hover:bg-slate-900 text-slate-200`}>
            {busy === "signout" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />} Sign out everywhere
          </button>
          <button
            onClick={() => {
              const lines = [
                ["Name", "Email", "Organization", "Downloads", "Joined"],
                ...picked.map((r) => [r.name, r.email, r.organization ?? "", String(r.downloads), r.createdAt]),
              ];
              const a = document.createElement("a");
              a.href = URL.createObjectURL(
                new Blob(["﻿" + lines.map((l) => l.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\r\n")], {
                  type: "text/csv",
                })
              );
              a.download = "surveyors-ticked.csv";
              a.click();
            }}
            className={`${btn} bg-slate-900/70 hover:bg-slate-900 text-slate-200`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export ticked
          </button>
          <button onClick={() => remove(picked)} disabled={busy !== null} className={`${btn} bg-rose-600 hover:bg-rose-500 text-white`}>
            {busy === "delete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-blue-100 hover:text-white cursor-pointer">
            Clear
          </button>
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="pl-4 pr-1 py-3 w-8">
                  <button
                    onClick={() => setSelected(allShown ? new Set() : new Set(rows.map((r) => r.id)))}
                    aria-label="Tick everything shown"
                    className="p-0.5 hover:text-white cursor-pointer"
                  >
                    {allShown ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-3 py-3">Surveyor</th>
                <th className="px-3 py-3 hidden lg:table-cell">Organization</th>
                <th className="px-3 py-3 hidden md:table-cell">Programs</th>
                <th className="px-3 py-3 text-right">Downloads</th>
                <th className="px-3 py-3 hidden sm:table-cell">Joined</th>
                <th className="px-3 py-3 hidden md:table-cell">Last signed in</th>
                <th className="px-3 py-3 hidden xl:table-cell">From</th>
                <th className="px-3 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    {filtered ? "No account matches." : "No accounts yet."}
                  </td>
                </tr>
              )}
              {rows.map((u) => {
                const loc = u.location ? place(u.location) : { text: "Not known", flag: "" };
                return (
                  <tr key={u.id} className={selected.has(u.id) ? "bg-blue-500/10" : "hover:bg-slate-800/30"}>
                    <td className="pl-4 pr-1 py-3 align-top sm:align-middle">
                      <button
                        onClick={() => toggle(u.id)}
                        aria-pressed={selected.has(u.id)}
                        aria-label={`Tick ${u.name}`}
                        className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {selected.has(u.id) ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <button
                          onClick={() => onOpenAccount(u.id)}
                          className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 cursor-pointer"
                          aria-label={`Open ${u.name}`}
                        >
                          {(u.name || u.email).charAt(0).toUpperCase()}
                        </button>
                        <div className="min-w-0">
                          <button
                            onClick={() => onOpenAccount(u.id)}
                            className="font-bold text-white hover:text-blue-400 flex flex-wrap items-center gap-1.5 text-left cursor-pointer"
                          >
                            <span>{u.name}</span>
                            {u.role === "ADMIN" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Admin
                              </span>
                            )}
                            {u.blocked && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                                Blocked
                              </span>
                            )}
                            {u.hasFullAccess && u.role !== "ADMIN" && (
                              <span title="Full access" className="text-emerald-300">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </button>
                          <div className="text-xs text-slate-400 truncate max-w-[240px]">{u.email}</div>
                          {u.emailState === "confirmed" && <span className="text-[10px] font-bold text-emerald-400">✓ Email confirmed</span>}
                          {u.emailState === "waiting" && <span className="text-[10px] font-bold text-amber-400">Not confirmed yet</span>}
                          <div className="md:hidden text-[11px] text-slate-500">
                            {u.downloads} downloads · signed in {ago(u.lastLoginAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs hidden lg:table-cell">
                      <div className="text-slate-200 max-w-[180px] truncate" title={u.organization || ""}>
                        {u.organization || "—"}
                      </div>
                      <div className="text-slate-500 max-w-[180px] truncate">{u.role}</div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {u.apps.length ? (
                          u.apps.map((a) => (
                            <span
                              key={a}
                              className={`px-1.5 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${APPS[a]?.tone ?? "border-slate-700 text-slate-300"}`}
                            >
                              {APPS[a]?.short ?? a}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-bold text-blue-400 tabular-nums">{u.downloads}</span>
                      {u.lastDownload && <span className="block text-[10.5px] text-slate-500 whitespace-nowrap">{ago(u.lastDownload)}</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap hidden sm:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap hidden md:table-cell">{ago(u.lastLoginAt)}</td>
                    <td className="px-3 py-3 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-slate-200 whitespace-nowrap">
                        <span>{loc.flag}</span>
                        <span className="truncate max-w-[150px]">{loc.text}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">{u.ipAddress || "—"}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onOpenAccount(u.id)}
                          className="p-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/20 cursor-pointer"
                          title="Open: files, points, activity, controls"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(u)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== me && u.email !== "admin@exceltokml.com" && (
                          <button
                            onClick={() => remove([u])}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div ref={sentinel} className="px-4 py-3 border-t border-slate-800 text-center text-xs text-slate-400">
          {loading || more ? (
            <>
              <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> Loading…
            </>
          ) : rows.length < total ? (
            `Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()}; more load as you scroll`
          ) : rows.length ? (
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> That&apos;s everyone: {total.toLocaleString()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" /> No one here.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
