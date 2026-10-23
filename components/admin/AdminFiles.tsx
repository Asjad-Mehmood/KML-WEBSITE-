"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Download, Eye, FileDown, FileUp, Loader2, RefreshCw, Search, Trash2, UserRound } from "lucide-react";

interface Group {
  userId: string | null;
  email: string | null;
  name: string | null;
  files: number;
  bytes: number;
  opened: number;
  saved: number;
  lastAt: string | null;
}

export interface AdminFileItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  direction: "import" | "export";
  fileName: string;
  fileSize: number;
  size: string;
  pointsCount: number | null;
  crs: string | null;
  platform: "web_app" | "windows_app" | "traverse_app";
  hasContent: boolean;
  timestamp: string;
  downloadUrl: string;
}

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
type Dir = "all" | "import" | "export";

const PAGE = 50;

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Admin → Files: one row per surveyor, like Points; open a row to see that person's files
// and view, download or delete them
export default function AdminFiles({
  adminFetch,
  onToast,
  onView,
  onOpenUser,
}: {
  adminFetch: Fetcher;
  onToast: (m: string, t?: "success" | "error") => void;
  onView: (f: AdminFileItem) => void;
  onOpenUser: (userId: string) => void;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [bytes, setBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dir, setDir] = useState<Dir>("all");
  // which app the files came from ("" = every app)
  const [app, setApp] = useState<"" | "windows_app" | "web_app" | "traverse_app">("");
  const [open, setOpen] = useState<string | null>(null); // userId or "none"
  const [files, setFiles] = useState<Record<string, { rows: AdminFileItem[]; total: number }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const toast = useRef(onToast);
  useEffect(() => {
    toast.current = onToast;
  });

  const loadGroups = useCallback(
    async (q: string, d: Dir, a: string) => {
      setLoading(true);
      try {
        const r = await adminFetch(`/api/admin/files?${new URLSearchParams({ group: "user", q, direction: d, platform: a })}`);
        if (!r.ok) throw new Error();
        const data = await r.json();
        setGroups(data.groups || []);
        setTotal(data.total || 0);
        setBytes(data.bytes || 0);
        setFiles({});
      } catch {
        toast.current("Couldn't load the files", "error");
      } finally {
        setLoading(false);
      }
    },
    [adminFetch]
  );

  // search after typing stops, and whenever Opened / Saved changes
  useEffect(() => {
    const t = setTimeout(() => loadGroups(search, dir, app), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, dir, app, loadGroups]);

  const keyOf = (g: Group) => g.userId ?? "none";
  const label = (g: Group) => g.email || g.name || "No account";

  const loadFiles = async (k: string, more = false) => {
    setBusy(k);
    try {
      const have = more ? files[k]?.rows ?? [] : [];
      const page = Math.floor(have.length / PAGE);
      const qs = new URLSearchParams({ userId: k, q: search, direction: dir, platform: app, page: String(page), size: String(PAGE) });
      const r = await adminFetch(`/api/admin/files?${qs}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setFiles((p) => ({ ...p, [k]: { rows: [...have, ...((d.files || []) as AdminFileItem[])], total: d.total || 0 } }));
    } catch {
      toast.current("Couldn't load this person's files", "error");
    } finally {
      setBusy(null);
    }
  };

  const toggle = (g: Group) => {
    const k = keyOf(g);
    if (open === k) return setOpen(null);
    setOpen(k);
    if (!files[k]) loadFiles(k);
  };

  const remove = async (f: AdminFileItem, k: string) => {
    if (!window.confirm(`Delete “${f.fileName}” from ${f.userEmail || "this account"}? Its points go with it. This can't be undone.`)) return;
    setDeleting(f.id);
    try {
      const r = await adminFetch(`/api/admin/files?id=${encodeURIComponent(f.id)}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.current(`Deleted ${f.fileName}`);
      setFiles((p) => {
        const v = p[k];
        return v ? { ...p, [k]: { rows: v.rows.filter((x) => x.id !== f.id), total: Math.max(0, v.total - 1) } } : p;
      });
      const saved = f.direction === "export";
      setGroups((gs) =>
        gs
          .map((g) =>
            keyOf(g) === k
              ? { ...g, files: g.files - 1, bytes: Math.max(0, g.bytes - f.fileSize), saved: g.saved - (saved ? 1 : 0), opened: g.opened - (saved ? 0 : 1) }
              : g
          )
          .filter((g) => g.files > 0)
      );
      setTotal((t) => Math.max(0, t - 1));
      setBytes((b) => Math.max(0, b - f.fileSize));
    } catch {
      toast.current(`Couldn't delete ${f.fileName}`, "error");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = search.trim() !== "" || dir !== "all" || app !== "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">All files</h3>
          <p className="text-xs text-slate-400">
            {total.toLocaleString()} {filtered ? "matching" : ""} {total === 1 ? "file" : "files"} · {fmtBytes(bytes)} from{" "}
            {groups.length.toLocaleString()} {groups.length === 1 ? "person" : "people"}. Open a person to see, view or download their files.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="File, surveyor or grid"
              aria-label="Search files"
              className="w-64 max-w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div role="group" aria-label="Show" className="flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(["all", "import", "export"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDir(d)}
                aria-pressed={dir === d}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${dir === d ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {d === "all" ? "All" : d === "import" ? "Opened" : "Saved"}
              </button>
            ))}
          </div>
          <select
            value={app}
            onChange={(e) => setApp(e.target.value as typeof app)}
            aria-label="App"
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Every app</option>
            <option value="windows_app">Excel to KML · Windows</option>
            <option value="web_app">Excel to KML · Web</option>
            <option value="traverse_app">Traverse &amp; Level</option>
          </select>
          <button
            onClick={() => loadGroups(search, dir, app)}
            aria-label="Refresh files"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {!loading && groups.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400 text-sm">
          {filtered ? "No files match" : "No files kept yet"}
        </div>
      )}

      <ul className="space-y-2">
        {groups.map((g) => {
          const k = keyOf(g);
          const isOpen = open === k;
          const data = files[k];
          return (
            <li key={k} className={`rounded-2xl border ${isOpen ? "border-blue-500/40 bg-slate-900" : "border-slate-800 bg-slate-900/70"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <button onClick={() => toggle(g)} aria-expanded={isOpen} className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">{label(g)}</span>
                    <span className="block text-xs text-slate-400 truncate">
                      {g.name && g.email ? `${g.name} · ` : ""}
                      {g.opened.toLocaleString()} opened · {g.saved.toLocaleString()} saved · {fmtBytes(g.bytes)}
                      {g.lastAt ? ` · last ${new Date(g.lastAt).toLocaleDateString()}` : ""}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold">
                    {g.files.toLocaleString()} {g.files === 1 ? "file" : "files"}
                  </span>
                </button>
                {g.userId && (
                  <div className="flex gap-2 sm:ml-2">
                    <button
                      onClick={() => onOpenUser(g.userId as string)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                    >
                      <UserRound className="w-3.5 h-3.5" /> Surveyor
                    </button>
                  </div>
                )}
              </div>

              {isOpen && (
                <div className="border-t border-slate-800">
                  {!data ? (
                    <p className="p-6 text-center text-slate-400 text-xs">
                      <Loader2 className="inline w-4 h-4 animate-spin mr-2" />
                      Loading files…
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="sticky top-0 bg-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-2.5">File</th>
                              <th className="px-4 py-2.5 hidden md:table-cell">Kind</th>
                              <th className="px-4 py-2.5 text-right hidden sm:table-cell">Size</th>
                              <th className="px-4 py-2.5 text-right hidden lg:table-cell">Points</th>
                              <th className="px-4 py-2.5 hidden xl:table-cell">Grid</th>
                              <th className="px-4 py-2.5 hidden lg:table-cell">When</th>
                              <th className="px-4 py-2.5 text-right">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {data.rows.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                  No files left
                                </td>
                              </tr>
                            ) : (
                              data.rows.map((f) => (
                                <tr key={f.id} className="hover:bg-slate-800/30">
                                  <td className="px-4 py-2">
                                    <span className="block max-w-[160px] sm:max-w-[300px] truncate font-semibold text-white" title={f.fileName}>
                                      {f.fileName}
                                    </span>
                                    <span className="text-[11px] text-slate-500 md:hidden">
                                      {f.direction === "export" ? "Saved" : "Opened"} · {f.size}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 hidden md:table-cell whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                        f.direction === "export" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                                      }`}
                                    >
                                      {f.direction === "export" ? <FileDown className="w-3 h-3" /> : <FileUp className="w-3 h-3" />}
                                      {f.direction === "export" ? "Saved" : "Opened"}
                                    </span>
                                    <span className="ml-2 text-[11px] text-slate-500">{f.platform === "web_app" ? "Web" : f.platform === "traverse_app" ? "Traverse & Level" : "Windows"}</span>
                                  </td>
                                  <td className="px-4 py-2 text-right text-slate-300 hidden sm:table-cell whitespace-nowrap">{f.size}</td>
                                  <td className="px-4 py-2 text-right text-slate-300 hidden lg:table-cell">
                                    {f.pointsCount != null ? f.pointsCount.toLocaleString() : "—"}
                                  </td>
                                  <td className="px-4 py-2 hidden xl:table-cell">
                                    <span className="block max-w-[180px] truncate text-slate-400" title={f.crs || ""}>
                                      {f.crs || "—"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-slate-400 hidden lg:table-cell whitespace-nowrap">{new Date(f.timestamp).toLocaleString()}</td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center justify-end gap-2">
                                      {f.hasContent && (
                                        <button
                                          onClick={() => onView(f)}
                                          aria-label={`View ${f.fileName}`}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white whitespace-nowrap cursor-pointer"
                                        >
                                          <Eye className="w-3.5 h-3.5" aria-hidden />
                                          <span className="sr-only sm:not-sr-only">View</span>
                                        </button>
                                      )}
                                      {f.hasContent ? (
                                        <a
                                          href={f.downloadUrl}
                                          download
                                          aria-label={`Download ${f.fileName}`}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-white whitespace-nowrap"
                                        >
                                          <Download className="w-3.5 h-3.5" aria-hidden />
                                          <span className="sr-only sm:not-sr-only">Download</span>
                                        </a>
                                      ) : (
                                        <span className="text-[11px] text-slate-500 whitespace-nowrap" title="The file was too big to keep; only its name and size are recorded">
                                          Details only
                                        </span>
                                      )}
                                      <button
                                        onClick={() => remove(f, k)}
                                        disabled={deleting === f.id}
                                        aria-label={`Delete ${f.fileName}`}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50"
                                      >
                                        {deleting === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {data.total > data.rows.length && (
                        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
                          <span>
                            Showing {data.rows.length.toLocaleString()} of {data.total.toLocaleString()}
                          </span>
                          <button
                            onClick={() => loadFiles(k, true)}
                            disabled={busy === k}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 cursor-pointer disabled:opacity-50"
                          >
                            {busy === k && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Show more
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
    </div>
  );
}
