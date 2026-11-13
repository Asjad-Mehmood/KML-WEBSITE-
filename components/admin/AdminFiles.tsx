"use client";

// Admin → Files: everything people keep in their accounts, for every app or one (chosen in the
// menu under Files): files opened and saved in Excel to KML and Traverse & Level, jobs kept from
// both, and calculations kept from Slope Calculator (app/api/admin/data, lib/adminData.ts).
// The numbers at the top, then filters (kind, Windows or web, file type, period, search), sorting,
// a list that loads 50 at a time as you scroll or one row per person, and select-and-delete and
// CSV export of whatever the filters show.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calculator,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileUp,
  FolderOpen,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
  Square,
  Trash2,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
type Kind = "opened" | "saved" | "job" | "calculation";

export interface DataItem {
  key: string;
  app: string;
  kind: Kind;
  platform: string | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  title: string;
  ext: string | null;
  size: number;
  points: number | null;
  grid: string | null;
  detail: string | null;
  hasContent: boolean;
  at: string;
  url: string | null;
}
interface Summary {
  total: number;
  bytes: number;
  people: number;
  week: number;
  kept: number;
  last: string | null;
  apps: Record<string, number>;
  kinds: Record<string, number>;
  exts: Record<string, number>;
  platforms: Record<string, number>;
}
interface Person {
  userId: string | null;
  email: string | null;
  name: string | null;
  items: number;
  bytes: number;
  opened: number;
  saved: number;
  jobs: number;
  calculations: number;
  last: string;
}

/** The apps that keep anything in accounts: the menu under Files */
export const FILE_APPS = [
  { id: "excel-to-kml", name: "Excel to KML" },
  { id: "traverse", name: "Traverse & Level" },
  { id: "slope", name: "Slope Calculator" },
];
const APP_NAME: Record<string, string> = Object.fromEntries(FILE_APPS.map((a) => [a.id, a.name]));
const APP_KEEPS: Record<string, string> = {
  "excel-to-kml": "Files opened and saved in the Windows program and the web app, and jobs kept in the account.",
  traverse: "Files opened and saved, and traverse and level jobs kept in the account.",
  slope: "Calculations kept in the account, from the Windows program and the web app.",
};
// the apps that keep nothing in accounts, so it's plain they aren't missing
const KEEPS_NOTHING = [
  { name: "RoadPro", why: "Works on the PC with AutoCAD; nothing is sent to the account." },
  { name: "Project Folder Manager", why: "Works with folders on the PC; nothing is sent to the account." },
  { name: "Survey Toolkit", why: "Installs and updates the apps; what it does is in Activity and Survey Toolkit." },
];
const KINDS: Record<Kind, { label: string; plural: string; icon: LucideIcon; tone: string }> = {
  opened: { label: "Opened file", plural: "Opened files", icon: FileUp, tone: "bg-blue-500/10 text-blue-400" },
  saved: { label: "Saved file", plural: "Saved files", icon: FileDown, tone: "bg-emerald-500/10 text-emerald-400" },
  job: { label: "Kept job", plural: "Kept jobs", icon: FolderOpen, tone: "bg-violet-500/10 text-violet-300" },
  calculation: { label: "Calculation", plural: "Calculations", icon: Calculator, tone: "bg-amber-500/10 text-amber-300" },
};
const APP_KINDS: Record<string, Kind[]> = {
  "": ["opened", "saved", "job", "calculation"],
  "excel-to-kml": ["opened", "saved", "job"],
  traverse: ["opened", "saved", "job"],
  slope: ["calculation"],
};
const SORTS = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["largest", "Largest first"],
  ["smallest", "Smallest first"],
  ["name", "Name A–Z"],
] as const;
const PERIODS = [
  ["all", "Any time"],
  ["1", "Today"],
  ["7", "Last 7 days"],
  ["30", "Last 30 days"],
  ["90", "Last 90 days"],
  ["365", "Last year"],
  ["custom", "Between dates…"],
] as const;
const PAGE = 50;
const VIEWABLE = /\.(kml|kmz|csv|txt|json|geojson|xml|gpx)$/i;

const card = "rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)]";
const control =
  "px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
const when = (s: string) => new Date(s).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const whereFrom = (r: DataItem, showApp: boolean) =>
  [showApp ? APP_NAME[r.app] : "", r.platform === "web_app" ? "Web" : r.platform === "windows_app" ? "Windows" : ""].filter(Boolean).join(" · ");

function KindBadge({ kind }: { kind: Kind }) {
  const k = KINDS[kind];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${k.tone}`}>
      <k.icon className="w-3 h-3" aria-hidden /> {k.label}
    </span>
  );
}

// one kept item: what it is, whose, and View, Download and Delete
function Row({
  r,
  showApp,
  showPerson,
  selected,
  onSelect,
  onView,
  onDelete,
  deleting,
  onOpenUser,
}: {
  r: DataItem;
  showApp: boolean;
  showPerson: boolean;
  selected: boolean;
  onSelect: () => void;
  onView: (r: DataItem) => void;
  onDelete: () => void;
  deleting: boolean;
  onOpenUser: (id: string) => void;
}) {
  const from = whereFrom(r, showApp);
  const person = r.email || r.name || "No account";
  return (
    <tr className={selected ? "bg-blue-500/10" : "hover:bg-slate-800/30"}>
      <td className="pl-4 pr-1 py-2 w-8 align-top sm:align-middle">
        <button onClick={onSelect} aria-pressed={selected} aria-label={`Select ${r.title}`} className="p-0.5 text-slate-400 hover:text-white cursor-pointer">
          {selected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
        </button>
      </td>
      <td className="px-3 py-2 min-w-0">
        <span className="flex items-center gap-2 min-w-0">
          <span className="block max-w-[170px] sm:max-w-[280px] truncate font-semibold text-white" title={r.title}>
            {r.title}
          </span>
          {r.ext && r.ext !== "job" && r.ext !== "calculation" && (
            <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold uppercase text-slate-400">{r.ext}</span>
          )}
        </span>
        {r.detail && <span className="block max-w-[300px] truncate text-[11px] text-slate-400">{r.detail}</span>}
        {/* on a phone the other columns are hidden: the essentials go here */}
        <span className="block md:hidden text-[11px] text-slate-500">
          {KINDS[r.kind].label} · {fmtBytes(r.size)} · {when(r.at)}
          {from ? ` · ${from}` : ""}
        </span>
        {showPerson && (
          <span className="block sm:hidden text-[11px] text-slate-400 truncate max-w-[220px]">
            {r.userId ? (
              <button onClick={() => onOpenUser(r.userId as string)} className="underline decoration-dotted cursor-pointer">
                {person}
              </button>
            ) : (
              person
            )}
          </span>
        )}
      </td>
      {showPerson && (
        <td className="px-3 py-2 hidden sm:table-cell">
          {r.userId ? (
            <button onClick={() => onOpenUser(r.userId as string)} className="block max-w-[190px] truncate text-left text-slate-300 hover:text-white cursor-pointer" title={r.email || ""}>
              {person}
            </button>
          ) : (
            <span className="text-slate-500">{person}</span>
          )}
        </td>
      )}
      <td className="px-3 py-2 hidden md:table-cell whitespace-nowrap">
        <KindBadge kind={r.kind} />
        {from && <span className="block mt-0.5 text-[11px] text-slate-500">{from}</span>}
      </td>
      <td className="px-3 py-2 text-right text-slate-300 hidden md:table-cell whitespace-nowrap tabular-nums">{fmtBytes(r.size)}</td>
      <td className="px-3 py-2 text-right text-slate-300 hidden lg:table-cell tabular-nums">{r.points != null ? r.points.toLocaleString() : "—"}</td>
      <td className="px-3 py-2 hidden xl:table-cell">
        <span className="block max-w-[160px] truncate text-slate-400" title={r.grid || ""}>
          {r.grid || "—"}
        </span>
      </td>
      <td className="px-3 py-2 text-slate-400 hidden lg:table-cell whitespace-nowrap">{when(r.at)}</td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1.5">
          {r.url && r.key.startsWith("f:") && VIEWABLE.test(r.title) && (
            <button
              onClick={() => onView(r)}
              aria-label={`View ${r.title}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden />
              <span className="sr-only xl:not-sr-only">View</span>
            </button>
          )}
          {r.url ? (
            <a
              href={r.url}
              download
              aria-label={`Download ${r.title}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-white whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              <span className="sr-only xl:not-sr-only">Download</span>
            </a>
          ) : (
            <span className="text-[11px] text-slate-500 whitespace-nowrap" title="The file was too big to keep; only its name and size are recorded">
              Details only
            </span>
          )}
          <button
            onClick={onDelete}
            disabled={deleting}
            aria-label={`Delete ${r.title}`}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

function Head({ showPerson, allSelected, onSelectAll }: { showPerson: boolean; allSelected: boolean; onSelectAll: () => void }) {
  return (
    <thead className="sticky top-0 z-[1] bg-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
      <tr>
        <th className="pl-4 pr-1 py-2.5 w-8">
          <button onClick={onSelectAll} aria-pressed={allSelected} aria-label="Select everything shown" className="p-0.5 hover:text-white cursor-pointer">
            {allSelected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
          </button>
        </th>
        <th className="px-3 py-2.5">Name</th>
        {showPerson && <th className="px-3 py-2.5 hidden sm:table-cell">Surveyor</th>}
        <th className="px-3 py-2.5 hidden md:table-cell">Kind</th>
        <th className="px-3 py-2.5 text-right hidden md:table-cell">Size</th>
        <th className="px-3 py-2.5 text-right hidden lg:table-cell">Points</th>
        <th className="px-3 py-2.5 hidden xl:table-cell">Grid</th>
        <th className="px-3 py-2.5 hidden lg:table-cell">When</th>
        <th className="px-3 py-2.5 text-right">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );
}

export default function AdminFiles({
  adminFetch,
  onToast,
  onView,
  onOpenUser,
  app = "",
  onCounts,
  onApp,
}: {
  adminFetch: Fetcher;
  onToast: (m: string, t?: "success" | "error") => void;
  /** show a kept file in the viewer */
  onView: (f: { fileName: string; url: string; size: string }) => void;
  onOpenUser: (userId: string) => void;
  /** "" every app, or one of FILE_APPS */
  app?: string;
  /** how much each app keeps, for the menu */
  onCounts?: (c: Record<string, number>) => void;
  /** show one app (from the cards on the every-app page) */
  onApp?: (id: string) => void;
}) {
  const [kind, setKind] = useState<"" | Kind>("");
  const [platform, setPlatform] = useState("");
  const [ext, setExt] = useState("");
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>("all");
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("newest");
  const [view, setView] = useState<"list" | "people">("list");
  const [peopleSort, setPeopleSort] = useState<"recent" | "most" | "largest">("recent");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<DataItem[]>([]);
  const [total, setTotal] = useState(0);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [openPerson, setOpenPerson] = useState<string | null>(null);
  const [personRows, setPersonRows] = useState<Record<string, { rows: DataItem[]; total: number; busy: boolean }>>({});
  const [reload, setReload] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const fetcher = useRef(adminFetch);
  const toast = useRef(onToast);
  const counts = useRef(onCounts);
  useEffect(() => {
    fetcher.current = adminFetch;
    toast.current = onToast;
    counts.current = onCounts;
  });

  // search a moment after typing stops
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // the filters as a query, worked out when asked (the period counts back from now)
  const params = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams();
      if (app) p.set("app", app);
      if (kind) p.set("kind", kind);
      if (platform) p.set("platform", platform);
      if (ext) p.set("ext", ext);
      if (q) p.set("q", q);
      if (period === "custom") {
        if (fromDay) p.set("from", new Date(`${fromDay}T00:00:00`).toISOString());
        if (toDay) p.set("to", new Date(new Date(`${toDay}T00:00:00`).getTime() + 864e5).toISOString());
      } else if (period !== "all") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (Number(period) - 1));
        p.set("from", start.toISOString());
      }
      for (const [k, v] of Object.entries(extra)) p.set(k, v);
      return p.toString();
    },
    [app, kind, platform, ext, q, period, fromDay, toDay]
  );

  const getJson = async (url: string) => {
    const r = await fetcher.current(url, { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  };

  // the menu's counts: everything each app keeps, whatever the filters
  useEffect(() => {
    getJson("/api/admin/data?view=summary")
      .then((j) => counts.current?.(j.apps || {}))
      .catch(() => {});
  }, [reload]);

  // the numbers, and the first page of the list or the people, whenever a filter changes
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      setLoading(true);
      const list =
        view === "list"
          ? getJson(`/api/admin/data?${params({ sort, limit: String(PAGE), offset: "0" })}`).then((j) => {
              if (!live) return;
              setRows(j.rows || []);
              setTotal(j.total || 0);
            })
          : getJson(`/api/admin/data?${params({ view: "people", sort: peopleSort })}`).then((j) => {
              if (!live) return;
              setPeople(j.people || []);
              setPersonRows({});
              setOpenPerson(null);
            });
      Promise.all([getJson(`/api/admin/data?${params({ view: "summary" })}`).then((j) => live && setSummary(j as Summary)), list])
        .catch(() => live && toast.current("Couldn't load the files", "error"))
        .finally(() => {
          if (!live) return;
          setLoading(false);
          setSelected(new Set());
        });
    }, 0);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [params, sort, view, peopleSort, reload]);

  // the next 50 when the end of the list scrolls into view
  const loadMore = useCallback(() => {
    setLoadingMore(true);
    getJson(`/api/admin/data?${params({ sort, limit: String(PAGE), offset: String(rows.length) })}`)
      .then((j) => {
        setRows((have) => {
          const seen = new Set(have.map((r) => r.key));
          return [...have, ...((j.rows || []) as DataItem[]).filter((r) => !seen.has(r.key))];
        });
        setTotal(j.total || 0);
      })
      .catch(() => toast.current("Couldn't load more", "error"))
      .finally(() => setLoadingMore(false));
  }, [params, sort, rows.length]);
  useEffect(() => {
    const el = sentinel.current;
    if (view !== "list" || !el || loading || loadingMore || rows.length >= total) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && loadMore(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [view, loading, loadingMore, rows.length, total, loadMore]);

  // one person's items, in the By person view
  const loadPerson = (k: string, more = false) => {
    const have = more ? personRows[k]?.rows ?? [] : [];
    setPersonRows((p) => ({ ...p, [k]: { rows: have, total: p[k]?.total ?? 0, busy: true } }));
    getJson(`/api/admin/data?${params({ user: k, sort, limit: String(PAGE), offset: String(have.length) })}`)
      .then((j) => setPersonRows((p) => ({ ...p, [k]: { rows: [...have, ...(j.rows || [])], total: j.total || 0, busy: false } })))
      .catch(() => {
        toast.current("Couldn't load this person's files", "error");
        setPersonRows((p) => ({ ...p, [k]: { ...(p[k] ?? { rows: [], total: 0 }), busy: false } }));
      });
  };
  const togglePerson = (k: string) => {
    if (openPerson === k) return setOpenPerson(null);
    setOpenPerson(k);
    if (!personRows[k]) loadPerson(k);
  };

  const toggle = (key: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  const toggleAll = (list: DataItem[]) =>
    setSelected((s) => {
      const keys = list.map((r) => r.key);
      const all = keys.length > 0 && keys.every((k) => s.has(k));
      const n = new Set(s);
      for (const k of keys) {
        if (all) n.delete(k);
        else n.add(k);
      }
      return n;
    });

  const remove = async (keys: string[]) => {
    if (!keys.length) return;
    const one = [...rows, ...Object.values(personRows).flatMap((p) => p.rows)].find((r) => r.key === keys[0]);
    const named = keys.length === 1 ? `“${one?.title ?? "this"}”` : `${keys.length} items`;
    if (!window.confirm(`Delete ${named} from the account${keys.length === 1 ? "" : "s"}? Points from a deleted file go with it. This can't be undone.`)) return;
    setDeleting((d) => new Set([...d, ...keys]));
    try {
      let gone: string[] = [];
      for (let i = 0; i < keys.length; i += 200) {
        const r = await fetcher.current("/api/admin/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", keys: keys.slice(i, i + 200) }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "failed");
        gone = gone.concat(j.deleted || []);
      }
      const set = new Set(gone);
      setRows((rs) => rs.filter((r) => !set.has(r.key)));
      setTotal((t) => Math.max(0, t - set.size));
      setPersonRows((p) =>
        Object.fromEntries(
          Object.entries(p).map(([k, v]) => [k, { ...v, rows: v.rows.filter((r) => !set.has(r.key)), total: Math.max(0, v.total - v.rows.filter((r) => set.has(r.key)).length) }])
        )
      );
      setSelected((s) => new Set([...s].filter((k) => !set.has(k))));
      const failed = keys.length - set.size;
      toast.current(failed ? `Deleted ${set.size}; ${failed} couldn't be deleted` : `Deleted ${set.size === 1 ? named : `${set.size} items`}`, failed ? "error" : "success");
      // the numbers and the menu again
      getJson(`/api/admin/data?${params({ view: "summary" })}`)
        .then((j) => setSummary(j as Summary))
        .catch(() => {});
      getJson("/api/admin/data?view=summary")
        .then((j) => counts.current?.(j.apps || {}))
        .catch(() => {});
    } catch {
      toast.current("Couldn't delete", "error");
    } finally {
      setDeleting((d) => new Set([...d].filter((k) => !keys.includes(k))));
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r = await fetcher.current(`/api/admin/data?${params({ format: "csv", sort })}`);
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `files-${app || "all"}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      toast.current("Couldn't export", "error");
    } finally {
      setExporting(false);
    }
  };

  const view1 = (r: DataItem) => {
    if (r.url) onView({ fileName: r.title, url: r.url, size: fmtBytes(r.size) });
  };

  const kinds = APP_KINDS[app] ?? APP_KINDS[""];
  const showApp = !app;
  const hasFiles = kinds.includes("opened") || kinds.includes("saved");
  const exts = useMemo(() => Object.entries(summary?.exts ?? {}).filter(([e]) => e !== "job" && e !== "calculation"), [summary]);
  const filtered = Boolean(kind || platform || ext || q || period !== "all");
  const clearFilters = () => {
    setKind("");
    setPlatform("");
    setExt("");
    setSearch("");
    setQ("");
    setPeriod("all");
    setFromDay("");
    setToDay("");
  };
  const selectedShown = view === "list" ? rows.filter((r) => selected.has(r.key)) : [];
  const allShownSelected = rows.length > 0 && rows.every((r) => selected.has(r.key));
  const noun = app === "slope" ? "calculations" : "items";

  return (
    <div className="space-y-4">
      {/* what this is */}
      <div>
        <h3 className="text-base font-bold text-white">{app ? `${APP_NAME[app] ?? app}: everything kept` : "Everything kept in accounts"}</h3>
        <p className="text-xs text-slate-400">
          {app ? APP_KEEPS[app] : "Files, jobs and calculations people keep from every app. Choose an app under Files in the menu to see only its own."}
        </p>
      </div>

      {/* the numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(
          [
            [FolderOpen, filtered ? `Matching ${noun}` : `Kept ${noun}`, summary ? summary.total.toLocaleString() : "…", summary ? `${summary.kept.toLocaleString()} with a copy to download` : ""],
            [HardDrive, "Storage", summary ? fmtBytes(summary.bytes) : "…", summary && summary.total ? `${fmtBytes(Math.round(summary.bytes / summary.total))} on average` : ""],
            [Users, "People", summary ? summary.people.toLocaleString() : "…", summary && summary.people ? `${(summary.total / summary.people).toFixed(1)} each on average` : ""],
            [RefreshCw, "New in the last 7 days", summary ? summary.week.toLocaleString() : "…", summary?.last ? `Last: ${when(summary.last)}` : ""],
          ] as const
        ).map(([Icon, label, value, sub]) => (
          <div key={label} className={`${card} p-4`}>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <Icon className="w-3.5 h-3.5" aria-hidden /> {label}
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">{value}</p>
            {sub && <p className="text-[11.5px] text-slate-400 truncate">{sub}</p>}
          </div>
        ))}
      </div>

      {/* every app: what each one keeps */}
      {!app && (
        <div className={`${card} p-4`}>
          <h4 className="text-sm font-bold text-white">What each app keeps</h4>
          <div className="mt-3 grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {FILE_APPS.map((a) => (
              <button
                key={a.id}
                onClick={() => onApp?.(a.id)}
                className="text-left p-3 rounded-xl bg-[var(--adm-hover)] hover:bg-[var(--adm-hover-strong)] border border-[var(--adm-line)] cursor-pointer"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-white">{a.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-[11px] font-bold tabular-nums">{(summary?.apps[a.id] ?? 0).toLocaleString()}</span>
                </span>
                <span className="block mt-1 text-[11.5px] text-slate-400">{APP_KEEPS[a.id]}</span>
              </button>
            ))}
            {KEEPS_NOTHING.map((a) => (
              <div key={a.name} className="p-3 rounded-xl border border-dashed border-[var(--adm-line)]">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-slate-300">{a.name}</span>
                  <span className="text-[11px] text-slate-500">keeps nothing</span>
                </span>
                <span className="block mt-1 text-[11.5px] text-slate-500">{a.why}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* kind */}
      {kinds.length > 1 && (
        <div role="group" aria-label="Kind" className="flex flex-wrap gap-1.5">
          {(["", ...kinds] as const).map((k) => {
            const n = k ? summary?.kinds[k] ?? 0 : Object.values(summary?.kinds ?? {}).reduce((s, v) => s + v, 0);
            return (
              <button
                key={k || "all"}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  kind === k ? "bg-blue-600 text-white" : "bg-[var(--adm-hover)] border border-[var(--adm-line)] text-slate-400 hover:text-white"
                }`}
              >
                {k ? KINDS[k].plural : "Everything"}
                <span className={`tabular-nums ${kind === k ? "opacity-80" : "text-slate-500"}`}>{n.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] sm:flex-none">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, surveyor, email or grid"
            aria-label="Search"
            className={`${control} w-full sm:w-64 pl-9`}
          />
        </div>
        {(app === "excel-to-kml" || !app) && (
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Windows or web" className={control}>
            <option value="">Windows and web</option>
            <option value="windows_app">Windows program ({(summary?.platforms.windows_app ?? 0).toLocaleString()})</option>
            <option value="web_app">Web app ({(summary?.platforms.web_app ?? 0).toLocaleString()})</option>
          </select>
        )}
        {hasFiles && exts.length > 0 && (
          <select value={ext} onChange={(e) => setExt(e.target.value)} aria-label="File type" className={control}>
            <option value="">Every type</option>
            {exts.map(([e, n]) => (
              <option key={e} value={e}>
                .{e} ({n.toLocaleString()})
              </option>
            ))}
          </select>
        )}
        <select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} aria-label="When" className={control}>
          {PERIODS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {period === "custom" && (
          <span className="flex items-center gap-1.5">
            <input type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} aria-label="From" className={control} />
            <span className="text-xs text-slate-500">to</span>
            <input type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} aria-label="To" className={control} />
          </span>
        )}
        {view === "list" ? (
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort" className={control}>
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        ) : (
          <select value={peopleSort} onChange={(e) => setPeopleSort(e.target.value as typeof peopleSort)} aria-label="Sort people" className={control}>
            <option value="recent">Most recent first</option>
            <option value="most">Most kept first</option>
            <option value="largest">Most storage first</option>
          </select>
        )}
        {filtered && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
        <span className="flex items-center gap-2 ml-auto">
          <span role="group" aria-label="View" className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(
              [
                ["list", "List"],
                ["people", "By person"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${view === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {l}
              </button>
            ))}
          </span>
          <button
            onClick={exportCsv}
            disabled={exporting || !summary?.total}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
            title="Everything the filters show, as a spreadsheet"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />} Export CSV
          </button>
          <button onClick={() => setReload((n) => n + 1)} aria-label="Refresh" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </span>
      </div>

      {/* what's selected */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-sm text-white backdrop-blur">
          <span className="font-bold">{selected.size.toLocaleString()} selected</span>
          {selectedShown.length > 0 && <span className="text-xs text-blue-200">· {fmtBytes(selectedShown.reduce((s, r) => s + r.size, 0))}</span>}
          <button onClick={() => setSelected(new Set())} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-100 hover:text-white cursor-pointer">
            Clear
          </button>
          <button
            onClick={() => remove([...selected])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}

      {!loading && summary && summary.total === 0 && (
        <div className={`${card} p-10 text-center text-slate-400 text-sm`}>
          {filtered ? (
            <>
              Nothing matches.{" "}
              <button onClick={clearFilters} className="text-blue-400 hover:underline cursor-pointer">
                Clear the filters
              </button>
            </>
          ) : (
            `Nothing kept${app ? ` from ${APP_NAME[app]}` : ""} yet.`
          )}
        </div>
      )}

      {/* the list */}
      {view === "list" && rows.length > 0 && (
        <div className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <Head showPerson allSelected={allShownSelected} onSelectAll={() => toggleAll(rows)} />
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((r) => (
                  <Row
                    key={r.key}
                    r={r}
                    showApp={showApp}
                    showPerson
                    selected={selected.has(r.key)}
                    onSelect={() => toggle(r.key)}
                    onView={view1}
                    onDelete={() => remove([r.key])}
                    deleting={deleting.has(r.key)}
                    onOpenUser={onOpenUser}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div ref={sentinel} className="px-4 py-3 border-t border-slate-800 text-center text-xs text-slate-400">
            {loadingMore ? (
              <>
                <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
                Loading more…
              </>
            ) : rows.length < total ? (
              `Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()}; more load as you scroll`
            ) : (
              `That's everything: ${total.toLocaleString()} ${total === 1 ? "item" : noun}.`
            )}
          </div>
        </div>
      )}
      {loading && !rows.length && view === "list" && (
        <p className="py-10 text-center text-xs text-slate-400">
          <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
          Loading…
        </p>
      )}

      {/* one row per person */}
      {view === "people" && people && people.length > 0 && (
        <ul className="space-y-2">
          {people.map((p) => {
            const k = p.userId ?? "none";
            const isOpen = openPerson === k;
            const data = personRows[k];
            const parts = [
              p.opened && `${p.opened.toLocaleString()} opened`,
              p.saved && `${p.saved.toLocaleString()} saved`,
              p.jobs && `${p.jobs.toLocaleString()} ${p.jobs === 1 ? "job" : "jobs"}`,
              p.calculations && `${p.calculations.toLocaleString()} ${p.calculations === 1 ? "calculation" : "calculations"}`,
              fmtBytes(p.bytes),
              `last ${new Date(p.last).toLocaleDateString()}`,
            ].filter(Boolean);
            const shown = data?.rows ?? [];
            return (
              <li key={k} className={`rounded-2xl border ${isOpen ? "border-blue-500/40 bg-slate-900" : "border-slate-800 bg-slate-900/70"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <button onClick={() => togglePerson(k)} aria-expanded={isOpen} className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white truncate">{p.email || p.name || "No account"}</span>
                      <span className="block text-xs text-slate-400 truncate">
                        {p.name && p.email ? `${p.name} · ` : ""}
                        {parts.join(" · ")}
                      </span>
                    </span>
                    <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold tabular-nums">{p.items.toLocaleString()}</span>
                  </button>
                  {p.userId && (
                    <button
                      onClick={() => onOpenUser(p.userId as string)}
                      className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                    >
                      <UserRound className="w-3.5 h-3.5" /> Surveyor
                    </button>
                  )}
                </div>
                {isOpen && (
                  <div className="border-t border-slate-800">
                    {!data || (data.busy && !shown.length) ? (
                      <p className="p-6 text-center text-slate-400 text-xs">
                        <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
                        Loading…
                      </p>
                    ) : (
                      <>
                        <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <Head showPerson={false} allSelected={shown.length > 0 && shown.every((r) => selected.has(r.key))} onSelectAll={() => toggleAll(shown)} />
                            <tbody className="divide-y divide-slate-800/60">
                              {shown.map((r) => (
                                <Row
                                  key={r.key}
                                  r={r}
                                  showApp={showApp}
                                  showPerson={false}
                                  selected={selected.has(r.key)}
                                  onSelect={() => toggle(r.key)}
                                  onView={view1}
                                  onDelete={() => remove([r.key])}
                                  deleting={deleting.has(r.key)}
                                  onOpenUser={onOpenUser}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {data.total > shown.length && (
                          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
                            <span>
                              Showing {shown.length.toLocaleString()} of {data.total.toLocaleString()}
                            </span>
                            <button
                              onClick={() => loadPerson(k, true)}
                              disabled={data.busy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 cursor-pointer disabled:opacity-50"
                            >
                              {data.busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Show more
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
