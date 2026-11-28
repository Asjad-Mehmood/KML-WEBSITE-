"use client";

// Admin → Survey Toolkit → PCs: every PC with the Toolkit, its tools and its history.
import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { Empty, EventTable, SHORT, SearchBox, Version, ago, date, exportBtn, saveCsv, stamp, td, th, windowsName, type Data, type Device, type Event, type Fetcher, type Tool } from "@/components/admin/toolkit/shared";

export function PcTable({ devices, tools, now, onForget, onHistory, history }: {
  devices: Device[];
  tools: Tool[];
  now: number;
  onForget?: (d: Device) => void;
  onHistory?: (d: Device) => void;
  history?: { id: string; events: Event[] | null } | null;
}) {
  if (!devices.length) return <p className="text-sm text-slate-400">No PCs.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800">
            {onHistory && <th className={th} />}
            <th className={th}>PC</th>
            {onForget && <th className={th}>Account</th>}
            <th className={th}>Windows</th>
            <th className={th}>Toolkit</th>
            {tools.map((t) => (
              <th key={t.id} className={th} title={t.latest ? `Latest ${t.latest}` : undefined}>
                {SHORT[t.id] ?? t.name}
              </th>
            ))}
            <th className={th}>First seen</th>
            <th className={th}>Last seen</th>
            {onForget && <th className={th} />}
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => {
            const open = history?.id === d.id;
            return (
              <Fragment key={d.id}>
                <tr className="border-b border-slate-800/60 last:border-0">
                  {onHistory && (
                    <td className="pl-3">
                      <button onClick={() => onHistory(d)} aria-expanded={open} title="This PC's history" className="text-slate-400 hover:text-white cursor-pointer">
                        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                  <td className={`${td} font-semibold text-white`}>{d.name || d.id}</td>
                  {onForget && (
                    <td className={td}>
                      <span className="block text-slate-200">{d.userName || "—"}</span>
                      <span className="block text-[11.5px] text-slate-500">{d.email ?? "—"}</span>
                    </td>
                  )}
                  <td className={td} title={d.windows}>
                    {windowsName(d.windows)}
                  </td>
                  <td className={`${td} tabular-nums`}>{d.toolkitVersion || "—"}</td>
                  {tools.map((t) => (
                    <td key={t.id} className={td}>
                      <Version v={d.tools[t.id]} latest={t.latest} />
                    </td>
                  ))}
                  <td className={td}>{date(d.firstSeen)}</td>
                  <td className={td}>{ago(d.lastSeen, now)}</td>
                  {onForget && (
                    <td className="pr-3 text-right">
                      <button onClick={() => onForget(d)} title="Forget this PC" className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
                {open && (
                  <tr className="border-b border-slate-800/60">
                    <td colSpan={tools.length + 8} className="bg-slate-950/40">
                      {history?.events == null ? (
                        <div className="py-6 flex justify-center">
                          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                        </div>
                      ) : (
                        <EventTable events={history.events} tools={tools} showPc={false} />
                      )}
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

// ---------------------------------------------------------------- PCs

export function Pcs({ data, now, adminFetch, onToast, onChanged }: { data: Data; now: number; adminFetch: Fetcher; onToast: (s: string) => void; onChanged: () => Promise<void> }) {
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<{ id: string; events: Event[] | null } | null>(null);
  const shown = data.devices.filter((d) => `${d.name} ${d.email ?? ""} ${d.userName ?? ""} ${d.windows}`.toLowerCase().includes(q.trim().toLowerCase()));

  const showHistory = async (d: Device) => {
    if (history?.id === d.id) return setHistory(null);
    setHistory({ id: d.id, events: null });
    const r = await adminFetch(`/api/toolkit/admin?device=${encodeURIComponent(d.id)}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      onToast(j.error || "Couldn't read that PC's history.");
      return setHistory(null);
    }
    setHistory({ id: d.id, events: j.events as Event[] });
  };
  const forget = async (d: Device) => {
    if (!confirm(`Forget ${d.name || d.id} and its history? It comes back the next time its Toolkit reports.`)) return;
    const r = await adminFetch(`/api/toolkit/admin?device=${encodeURIComponent(d.id)}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    onToast(r.ok ? `${d.name || "The PC"} is forgotten` : j.error || "Couldn't remove the PC.");
    if (r.ok) await onChanged();
  };
  const exportAll = () =>
    saveCsv(
      `toolkit-pcs-${stamp()}.csv`,
      ["PC", "Account", "Email", "Windows", "Toolkit", ...data.tools.map((t) => t.name), "First seen", "Last seen"],
      shown.map((d) => [d.name, d.userName, d.email, d.windows, d.toolkitVersion, ...data.tools.map((t) => d.tools[t.id] ?? ""), d.firstSeen, d.lastSeen])
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search PC, account, Windows" />
        <span className="text-xs text-slate-400">
          {shown.length} of {data.devices.length} PCs · <span className="text-emerald-300">green</span> up to date, <span className="text-amber-300">amber</span> older
        </span>
        <button onClick={exportAll} disabled={!shown.length} className={`${exportBtn} ml-auto`}>
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      {shown.length ? (
        <PcTable devices={shown} tools={data.tools} now={now} onForget={forget} onHistory={showHistory} history={history} />
      ) : (
        <Empty>{data.devices.length ? "No PC matches" : "No PC has reported yet"}</Empty>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Activity
