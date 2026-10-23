"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Ban, FileDown, FileUp, Loader2, MonitorSmartphone, RefreshCw, Save, Share2, Users } from "lucide-react";
import { actionLabel, adminActionTag } from "@/lib/activityKinds";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;

interface Usage {
  totals: { opens: number; saves: number; imports: number; exports: number; shares: number; simulations: number; deletes: number };
  last30: { opens: number; saves: number; imports: number; exports: number };
  activeUsers: { d7: number; d30: number };
  exportFormats: Record<string, number>;
  openedFrom: Record<string, number>;
  daily: { day: string; n: number }[];
  files: { opened: number; saved: number; bytes: number };
  blocked: { userId: string; email: string | null; name: string | null }[];
  recent: { id: string; action: string; title: string; details: string | null; userEmail: string | null; userName: string | null; status: string | null; timestamp: string }[];
}

const num = (n: number) => n.toLocaleString("en-US");
const bytes = (b: number) => (b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`);

/** Admin → Traverse & Level → how the app is used, from its activity log and the files it keeps. */
export default function TraverseUsage({ adminFetch, onToast, onUnblocked }: { adminFetch: Fetcher; onToast: (m: string, t?: "success" | "error") => void; onUnblocked?: () => void }) {
  const [u, setU] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch("/api/admin/traverse?usage=1")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load Traverse & Level usage"))))
      .then((d) => setU(d.usage))
      .catch((e) => onToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [adminFetch, onToast]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const unblock = async (userId: string, who: string) => {
    setBusy(userId);
    try {
      const r = await adminFetch("/api/admin/traverse", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, blocked: false }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Couldn't unblock");
      onToast(`${who} can use Traverse & Level again`);
      load();
      onUnblocked?.();
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  if (!u) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400 flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {loading ? "Loading usage…" : "No usage yet."}
      </div>
    );
  }

  const max = Math.max(1, ...u.daily.map((d) => d.n));
  const tiles: [string, number, string, React.ElementType][] = [
    ["Active users", u.activeUsers.d30, `${num(u.activeUsers.d7)} in the last 7 days`, Users],
    ["Opened", u.totals.opens, `${num(u.last30.opens)} in 30 days`, MonitorSmartphone],
    ["Jobs saved", u.totals.saves, `${num(u.last30.saves)} in 30 days`, Save],
    ["Files opened", u.totals.imports, `${num(u.files.opened)} ${u.files.opened === 1 ? "copy" : "copies"} kept`, FileUp],
    ["Exports", u.totals.exports, `${num(u.files.saved)} ${u.files.saved === 1 ? "copy" : "copies"} kept · ${bytes(u.files.bytes)}`, FileDown],
    ["Shared", u.totals.shares, `${num(u.totals.simulations)} simulator runs`, Share2],
  ];

  return (
    <section aria-label="Traverse & Level usage" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">Usage</h3>
          <p className="text-xs text-slate-400">Everything the app records: openings, imports, exports, saves and sharing, from every account.</p>
        </div>
        <button onClick={load} aria-label="Refresh usage" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {tiles.map(([k, v, sub, Icon]) => (
          <div key={k} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" /> {k}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white tabular-nums">{num(v)}</p>
            <p className="text-[11px] text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:col-span-2">
          <p className="text-xs font-bold text-slate-300 mb-3">Activity per day, last 14 days</p>
          <div className="flex items-end gap-1.5 h-28" role="img" aria-label={`Activity per day: ${u.daily.map((d) => `${d.day} ${d.n}`).join(", ")}`}>
            {u.daily.map((d, i) => (
              <div key={d.day} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full" title={`${d.day}: ${d.n}`}>
                <span className="text-[10px] text-slate-400 tabular-nums">{d.n || ""}</span>
                <span className="w-full rounded-t bg-amber-400/80" style={{ height: `${Math.max(d.n ? 6 : 2, (100 * d.n) / max)}%` }} />
                {/* every other date on a phone, every date on wider screens */}
                <span className={`mt-1 text-[9.5px] text-slate-500 whitespace-nowrap ${i % 2 ? "invisible sm:visible" : ""}`}>
                  {new Date(d.day).toLocaleDateString("en-GB", { day: "numeric", month: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
          <Breakdown title="Exports by format" rows={u.exportFormats} />
          <Breakdown title="Opened from" rows={u.openedFrom} />
        </div>
      </div>

      {u.blocked.length > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
          <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5 mb-2">
            <Ban className="w-3.5 h-3.5" /> Blocked from Traverse &amp; Level ({u.blocked.length})
          </p>
          <ul className="flex flex-wrap gap-2">
            {u.blocked.map((b) => (
              <li key={b.userId} className="inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-200">
                {b.email || b.name || "Deleted account"}
                <button
                  onClick={() => unblock(b.userId, b.email || "This account")}
                  disabled={busy === b.userId}
                  className="px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <p className="px-4 py-3 text-xs font-bold text-slate-300 border-b border-slate-800 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Latest activity
        </p>
        {u.recent.length === 0 ? (
          <p className="px-4 py-5 text-sm text-slate-400">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800 max-h-[420px] overflow-y-auto">
            {u.recent.map((a) => (
              <li key={a.id} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-xs">
                <span className={`shrink-0 self-start px-2 py-0.5 rounded-md border text-[10.5px] font-semibold ${adminActionTag(a.action)}`}>{actionLabel(a.action)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-slate-200 break-words">{a.title}</span>
                  {a.details && <span className="block text-slate-500 break-words">{a.details}</span>}
                </span>
                <span className="shrink-0 text-slate-400 sm:text-right">
                  {a.userEmail || a.userName || "No account"}
                  <span className="block text-slate-500">{new Date(a.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Record<string, number> }) {
  const list = Object.entries(rows).sort((a, b) => b[1] - a[1]);
  const total = list.reduce((t, [, n]) => t + n, 0) || 1;
  return (
    <div>
      <p className="text-xs font-bold text-slate-300 mb-2">{title}</p>
      {list.length === 0 ? (
        <p className="text-xs text-slate-500">None yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map(([k, n]) => (
            <li key={k}>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{k}</span>
                <span className="tabular-nums">{n.toLocaleString("en-US")}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-400/80 rounded-full" style={{ width: `${(100 * n) / total}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
