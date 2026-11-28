"use client";

// Admin → Survey Toolkit → Activity: installs, updates and failures.
import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { ACTIONS, ACTION_LABEL, EventTable, SearchBox, automatic, card, exportBtn, reason, saveCsv, stamp, type Data } from "@/components/admin/toolkit/shared";

export function ActivityLog({ data }: { data: Data }) {
  const [q, setQ] = useState("");
  const [tool, setTool] = useState("all");
  const [action, setAction] = useState("all");
  const [auto, setAuto] = useState<"all" | "auto" | "hand">("all");
  const shown = data.events.filter(
    (e) =>
      (tool === "all" || e.tool === tool) &&
      (action === "all" || e.action === action) &&
      (auto === "all" || (auto === "auto") === automatic(e)) &&
      `${e.email ?? ""} ${e.deviceName ?? ""} ${e.message} ${e.toVersion} ${e.fromVersion}`.toLowerCase().includes(q.trim().toLowerCase())
  );
  const select = "px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer";
  const exportAll = () =>
    saveCsv(
      `toolkit-activity-${stamp()}.csv`,
      ["When", "Email", "PC", "Tool", "What", "Automatic", "From", "To", "Details"],
      shown.map((e) => [e.createdAt, e.email, e.deviceName, e.tool, e.action, automatic(e) ? "yes" : "no", e.fromVersion, e.toVersion, reason(e)])
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search account, PC, version, reason" />
        <select value={tool} onChange={(e) => setTool(e.target.value)} className={select} aria-label="Tool">
          <option value="all">All tools</option>
          {data.tools.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className={select} aria-label="What">
          <option value="all">Everything</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABEL[a]}
            </option>
          ))}
        </select>
        <select value={auto} onChange={(e) => setAuto(e.target.value as typeof auto)} className={select} aria-label="By whom">
          <option value="all">By hand or automatic</option>
          <option value="hand">By hand</option>
          <option value="auto">Automatic</option>
        </select>
        <button onClick={exportAll} disabled={!shown.length} className={`${exportBtn} ml-auto`}>
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      <p className="text-xs text-slate-400">
        {shown.length} of the newest {data.events.length} events. A PC&apos;s whole history is under PCs.
      </p>
      <div className={card}>
        <EventTable events={shown.slice(0, 500)} tools={data.tools} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Downloads
