"use client";

// Admin → Email → New versions: pick the program and the version, and the email is filled from
// that release's notes in Admin → Releases (lib/mail/releaseMailDraft.ts). A version that isn't there
// yet comes in with "Get the newest from GitHub".
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Loader2, X } from "lucide-react";
import type { ReleaseForMail } from "@/lib/mail/releaseMailDraft";

type AppRow = { id: string; name: string };

export default function ReleasePicker({
  adminFetch,
  onPick,
  onClose,
}: {
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onPick: (r: ReleaseForMail) => void;
  onClose: () => void;
}) {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [releases, setReleases] = useState<ReleaseForMail[]>([]);
  const [app, setApp] = useState("");
  const [busy, setBusy] = useState<"" | "load" | "import">("load");
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (action: "releases" | "import", appId?: string) => {
      setBusy(action === "import" ? "import" : "load");
      setError(null);
      try {
        const r = await adminFetch("/api/admin/mail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, app: appId }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Couldn't read the releases.");
        setApps(d.apps || []);
        setReleases(d.releases || []);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy("");
      }
    },
    [adminFetch]
  );

  useEffect(() => {
    const t = setTimeout(() => void call("releases"), 0);
    return () => clearTimeout(t);
  }, [call]);

  // programs with releases first, newest release first
  const ordered = useMemo(() => {
    const latest = new Map<string, string>();
    for (const r of releases) if (!latest.has(r.app)) latest.set(r.app, r.releasedAt);
    return [...apps].sort((a, b) => (latest.get(b.id) || "").localeCompare(latest.get(a.id) || ""));
  }, [apps, releases]);
  const shown = app || ordered[0]?.id || "";
  const versions = releases.filter((r) => r.app === shown);

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Choose the version"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-slate-700 bg-slate-900"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-white">New versions: which release?</p>
            <p className="text-xs text-slate-400">The email is filled from its notes in Admin → Releases.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer">
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-800 px-4 py-3">
          {ordered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setApp(a.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                a.id === shown ? "border-blue-500 bg-blue-600/20 text-white" : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {busy === "load" && (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Reading the releases…
            </p>
          )}
          {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
          {!busy && !error && versions.length === 0 && (
            <p className="text-sm text-slate-400">No release of this program in Admin → Releases yet.</p>
          )}
          {versions.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onPick(r)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-left hover:border-blue-500 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {r.appName} {r.version}
                </span>
                {i === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" aria-hidden /> Newest
                  </span>
                )}
                <span className="ml-auto text-[11.5px] text-slate-500">{new Date(r.releasedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </span>
              <span className="mt-0.5 block truncate text-[12.5px] text-slate-400">{r.title || r.notes.split("\n")[0]}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-slate-800 px-4 py-3">
          <button
            type="button"
            disabled={!!busy || !shown}
            onClick={() => void call("import", shown)}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            {busy === "import" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Download className="w-4 h-4" aria-hidden />}
            Get the newest from GitHub
          </button>
          <p className="mt-1.5 text-[11.5px] text-slate-500">Published a release just now? This adds it, with its notes.</p>
        </div>
      </div>
    </div>
  );
}
