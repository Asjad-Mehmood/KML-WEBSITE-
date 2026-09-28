"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

type Info = { retentionDays: number; last: { at: string; title: string } | null };

// Admin → Settings: automatic clean-up of old stored files, and "Clean up now"
export default function CleanupCard({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/cleanup")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInfo(d))
      .catch(() => {});
  }, [adminFetch]);

  const run = async () => {
    const keep = info?.retentionDays ?? 365;
    if (keep > 0 && !confirm(`Delete stored files and points older than ${keep} days now? This can't be undone.`)) return;
    setRunning(true);
    setError(null);
    try {
      const r = await adminFetch("/api/admin/cleanup", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Clean-up failed.");
      setInfo({ retentionDays: d.result.retentionDays, last: d.last });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  if (!info) return null;
  const days = info.retentionDays;
  return (
    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-bold text-white">Storage clean-up</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {days > 0
              ? `Every night, stored files and their points older than ${days} days (about ${Math.round(days / 30.4)} months) are deleted, with expired sign-ins.`
              : "Files are kept forever (FILE_RETENTION_DAYS is 0). Expired sign-ins are still cleared every night."}{" "}
            Change it with FILE_RETENTION_DAYS in Vercel.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {info.last ? `Last run ${new Date(info.last.at).toLocaleString()}: ${info.last.title.replace(/^Clean-up: /, "")}` : "Not run yet."}
          </p>
          {error && <p className="text-xs text-rose-300 mt-1">{error}</p>}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Clean up now
        </button>
      </div>
    </div>
  );
}
