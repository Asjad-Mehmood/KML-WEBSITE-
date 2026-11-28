"use client";

// Admin → Survey Toolkit → Tools on PCs: which tool versions the PCs have, and installs per day.
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { isOlder } from "@/components/toolkit/ToolkitAdmin";
import { DAY, SHORT, Stat, ago, card, date, reason, td, th, windowsName, type Data, type Day, type Section } from "@/components/admin/toolkit/shared";

export function Overview({ data, now, onShow, embedded = false }: { data: Data; now: number; onShow: (s: Section) => void; embedded?: boolean }) {
  const active7 = data.devices.filter((d) => now - new Date(d.lastSeen).getTime() < 7 * DAY).length;
  const active30 = data.devices.filter((d) => now - new Date(d.lastSeen).getTime() < 30 * DAY).length;
  const c = (a: string) => data.counts[a] ?? { all: 0, automatic: 0 };
  const latestToolkit = data.downloads?.latest?.version ?? null;
  const siteAccounts = new Set(data.siteDownloads.map((d) => d.userId).filter(Boolean)).size;

  // the last 30 days, every day (days without events are 0)
  const days = useMemo(() => {
    const byDay = new Map(data.daily.map((d) => [d.day, d]));
    const out: Day[] = [];
    for (let i = 29; i >= 0; i--) {
      const k = new Date(now - i * DAY).toISOString().slice(0, 10);
      out.push(byDay.get(k) ?? { day: k, pcs: 0, installed: 0, updated: 0, uninstalled: 0, failed: 0, opened: 0 });
    }
    return out;
  }, [data.daily, now]);
  const top = Math.max(1, ...days.map((d) => d.installed + d.updated + d.uninstalled + d.failed + d.opened));

  const versions = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data.devices) m.set(d.toolkitVersion || "?", (m.get(d.toolkitVersion || "?") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => (isOlder(a[0], b[0]) ? 1 : -1));
  }, [data.devices]);
  const windows = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data.devices) m.set(windowsName(d.windows), (m.get(windowsName(d.windows)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [data.devices]);
  const failures = data.events.filter((e) => e.action === "failed").slice(0, 6);

  return (
    <div className="space-y-5">
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${embedded ? "hidden" : ""}`}>
        <Stat label="Accounts using it" value={data.users.length} sub={`${data.devices.length} PCs in all`} />
        <Stat label="Active PCs" value={active7} sub={`last 7 days · ${active30} in 30 days`} />
        <Stat
          label="Downloads"
          value={data.siteDownloads.length}
          sub={`from the website, ${siteAccounts} accounts${data.downloads ? ` · ${data.downloads.total} on GitHub` : ""}`}
        />
        <Stat label="Access" value={data.isPublic === false ? "Testers" : "Everyone"} sub={data.isPublic === false ? `${data.testers.length} testers` : "with an account"} />
        <Stat label="Installs, 30 days" value={c("installed").all} sub={`${c("installed").automatic} automatic`} />
        <Stat label="Updates, 30 days" value={c("updated").all} sub={`${c("updated").automatic} automatic`} />
        <Stat label="Uninstalls, 30 days" value={c("uninstalled").all} />
        <Stat label="Failures, 30 days" value={c("failed").all} warn={c("failed").all > 0} sub={c("failed").all ? "see Activity" : "none"} />
      </div>

      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="text-[15px] font-bold text-white">The last 30 days</h3>
          <span className="text-xs text-slate-400">what the Toolkits did each day, and how many PCs</span>
          <span className="ml-auto flex flex-wrap gap-3 text-[11px] text-slate-400">
            <Key c="bg-emerald-400" t="Installed" />
            <Key c="bg-blue-400" t="Updated" />
            <Key c="bg-violet-400" t="Opened" />
            <Key c="bg-slate-400" t="Uninstalled" />
            <Key c="bg-red-400" t="Failed" />
          </span>
        </div>
        <div className="mt-4 flex items-end gap-[3px] h-40">
          {days.map((d) => {
            const seg = (n: number, cls: string) => (n ? <div className={cls} style={{ height: `${(n / top) * 100}%` }} /> : null);
            const total = d.installed + d.updated + d.uninstalled + d.failed + d.opened;
            return (
              <div
                key={d.day}
                className="flex-1 h-full flex flex-col justify-end rounded-sm overflow-hidden bg-slate-800/40"
                title={`${date(d.day)}: ${total} events on ${d.pcs} PCs (${d.installed} installed, ${d.updated} updated, ${d.opened} opened, ${d.uninstalled} uninstalled, ${d.failed} failed)`}
              >
                {seg(d.failed, "bg-red-400")}
                {seg(d.uninstalled, "bg-slate-400")}
                {seg(d.opened, "bg-violet-400")}
                {seg(d.updated, "bg-blue-400")}
                {seg(d.installed, "bg-emerald-400")}
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[10.5px] text-slate-500">
          <span>{date(days[0]?.day ?? null)}</span>
          <span>today</span>
        </div>
      </div>

      <div className={card}>
        <h3 className="px-5 pt-4 pb-3 text-[15px] font-bold text-white">Each tool on the PCs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-slate-800">
                <th className={th}>Tool</th>
                <th className={th}>Latest</th>
                <th className={th}>On PCs</th>
                <th className={th}>Up to date</th>
                <th className={th}>Older</th>
                <th className={th}>Installed</th>
                <th className={th}>Updated</th>
                <th className={th}>Opened</th>
                <th className={th}>Uninstalled</th>
                <th className={th}>Failed</th>
              </tr>
            </thead>
            <tbody>
              {data.tools.map((t) => {
                const on = data.devices.filter((d) => d.tools[t.id]);
                const old = on.filter((d) => t.latest && isOlder(d.tools[t.id], t.latest)).length;
                const n = (a: string) => data.toolCounts[t.id]?.[a] ?? { all: 0, recent: 0 };
                const cell = (a: string, warn = false) => (
                  <td className={`${td} tabular-nums`}>
                    <span className={warn && n(a).all ? "text-red-300 font-semibold" : ""}>{n(a).all}</span>
                    <span className="text-slate-500 text-[11px]"> · {n(a).recent} in 30 d</span>
                  </td>
                );
                return (
                  <tr key={t.id} className="border-b border-slate-800/60 last:border-0">
                    <td className={`${td} font-semibold text-white`}>{t.name}</td>
                    <td className={`${td} tabular-nums`}>{t.latest ?? "—"}</td>
                    <td className={`${td} tabular-nums`}>{on.length}</td>
                    <td className={`${td} tabular-nums text-emerald-300`}>{on.length - old}</td>
                    <td className={`${td} tabular-nums ${old ? "text-amber-300" : ""}`}>{old}</td>
                    {cell("installed")}
                    {cell("updated")}
                    {cell("opened")}
                    {cell("uninstalled")}
                    {cell("failed", true)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${card} p-5`}>
          <h3 className="text-[15px] font-bold text-white">Toolkit versions</h3>
          <p className="text-xs text-slate-400">on the PCs{latestToolkit ? ` · latest ${latestToolkit}` : ""}</p>
          <ul className="mt-3 space-y-2">
            {versions.map(([v, n]) => (
              <Bar key={v} label={v} n={n} of={data.devices.length} tone={latestToolkit && isOlder(v, latestToolkit) ? "bg-amber-400" : "bg-emerald-400"} />
            ))}
            {!versions.length && <li className="text-sm text-slate-500">No PCs yet</li>}
          </ul>
        </div>
        <div className={`${card} p-5`}>
          <h3 className="text-[15px] font-bold text-white">Windows</h3>
          <p className="text-xs text-slate-400">the PCs&apos; Windows</p>
          <ul className="mt-3 space-y-2">
            {windows.map(([v, n]) => (
              <Bar key={v} label={v} n={n} of={data.devices.length} tone="bg-blue-400" />
            ))}
            {!windows.length && <li className="text-sm text-slate-500">No PCs yet</li>}
          </ul>
        </div>
        <div className={`${card} p-5`}>
          <div className="flex items-center">
            <h3 className="flex-1 text-[15px] font-bold text-white">Latest failures</h3>
            <button onClick={() => onShow("activity")} className="text-xs font-semibold text-blue-300 hover:text-blue-200 cursor-pointer">
              All activity
            </button>
          </div>
          <ul className="mt-3 space-y-2.5">
            {failures.map((e) => (
              <li key={e.id} className="text-[12.5px]">
                <span className="flex items-center gap-1.5 text-red-300 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> {SHORT[e.tool] ?? e.tool} · {ago(e.createdAt, now)}
                </span>
                <span className="block text-slate-400 break-words">{reason(e) || "No reason given"}</span>
                <span className="block text-slate-500">{e.email ?? "—"}</span>
              </li>
            ))}
            {!failures.length && <li className="text-sm text-slate-500">No failures</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Key({ c, t }: { c: string; t: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${c}`} /> {t}
    </span>
  );
}

export function Bar({ label, n, of, tone }: { label: string; n: number; of: number; tone: string }) {
  return (
    <li>
      <div className="flex justify-between text-[12.5px]">
        <span className="text-slate-200 tabular-nums">{label}</span>
        <span className="text-slate-400 tabular-nums">
          {n} · {of ? Math.round((n / of) * 100) : 0}%
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${of ? (n / of) * 100 : 0}%` }} />
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- Accounts
