"use client";

// Admin → Survey Toolkit → Downloads: the Toolkit's downloads from the website.
import { useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Empty, SearchBox, Stat, browser, card, date, exportBtn, saveCsv, stamp, td, th, when, type Data } from "@/components/admin/toolkit/shared";
import { Bar } from "@/components/admin/toolkit/Overview";

export function Downloads({ data }: { data: Data }) {
  const [q, setQ] = useState("");
  const site = data.siteDownloads;
  const shown = site.filter((d) => `${d.userName ?? ""} ${d.userEmail ?? ""} ${d.location ?? ""} ${d.version}`.toLowerCase().includes(q.trim().toLowerCase()));
  const accounts = new Set(site.map((d) => d.userId).filter(Boolean)).size;
  const signedOut = site.filter((d) => !d.userId).length;
  const usedIt = new Set(data.users.map((u) => u.userId));
  const downloadedNotUsed = new Set(site.map((d) => d.userId).filter((id): id is string => !!id && !usedIt.has(id))).size;
  const places = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of site) {
      const c = (d.location || "").split(",").pop()?.trim() || "Unknown";
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [site]);
  const exportAll = () =>
    saveCsv(
      `toolkit-downloads-${stamp()}.csv`,
      ["When", "Name", "Email", "Version", "Location", "Browser"],
      shown.map((d) => [d.timestamp, d.userName, d.userEmail, d.version, d.location, browser(d.userAgent)])
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="From the website" value={site.length} sub={`${accounts} accounts${signedOut ? ` · ${signedOut} signed out` : ""}`} />
        <Stat label="On GitHub" value={data.downloads?.total ?? "—"} sub="every installer download, all releases" />
        <Stat label="Downloaded, not used yet" value={downloadedNotUsed} sub="accounts with no PC reporting" />
        <Stat label="Latest Toolkit" value={data.downloads?.latest?.version ?? "—"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${card} lg:col-span-2`}>
          <h3 className="px-5 pt-4 pb-3 text-[15px] font-bold text-white">By release (GitHub)</h3>
          {data.downloads?.releases.length ? (
            <table className="w-full">
              <thead>
                <tr className="border-y border-slate-800">
                  <th className={th}>Release</th>
                  <th className={th}>Published</th>
                  <th className={th}>Downloads</th>
                </tr>
              </thead>
              <tbody>
                {data.downloads.releases.map((r) => (
                  <tr key={r.tag} className="border-b border-slate-800/60 last:border-0">
                    <td className={`${td} font-semibold text-white`}>
                      {r.tag}
                      {r.prerelease && <span className="ml-2 text-[10.5px] font-bold text-amber-300">pre-release</span>}
                    </td>
                    <td className={td}>{date(r.published)}</td>
                    <td className={`${td} tabular-nums`}>{r.downloads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-5 pb-5 text-sm text-slate-400">GitHub can&apos;t be read just now.</p>
          )}
        </div>
        <div className={`${card} p-5`}>
          <h3 className="text-[15px] font-bold text-white">Where from</h3>
          <p className="text-xs text-slate-400">website downloads by country</p>
          <ul className="mt-3 space-y-2">
            {places.map(([p, n]) => (
              <Bar key={p} label={p} n={n} of={site.length} tone="bg-blue-400" />
            ))}
            {!places.length && <li className="text-sm text-slate-500">No downloads yet</li>}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email, place, version" />
        <span className="text-xs text-slate-400">{shown.length} downloads</span>
        <button onClick={exportAll} disabled={!shown.length} className={`${exportBtn} ml-auto`}>
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      {shown.length ? (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className={th}>When</th>
                <th className={th}>Who</th>
                <th className={th}>Version</th>
                <th className={th}>Location</th>
                <th className={th}>Browser</th>
                <th className={th}>Uses it</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 500).map((d) => (
                <tr key={d.id} className="border-b border-slate-800/60 last:border-0">
                  <td className={td}>{when(d.timestamp)}</td>
                  <td className={td}>
                    <span className="block text-slate-200">{d.userName || (d.userId ? "—" : "Signed out")}</span>
                    <span className="block text-[11.5px] text-slate-500">{d.userEmail ?? ""}</span>
                  </td>
                  <td className={`${td} tabular-nums`}>{d.version}</td>
                  <td className={td}>{d.location || "—"}</td>
                  <td className={td}>{browser(d.userAgent)}</td>
                  <td className={td}>{d.userId ? (usedIt.has(d.userId) ? <span className="text-emerald-300">Yes</span> : <span className="text-slate-500">Not yet</span>) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>{site.length ? "No download matches" : "No downloads recorded yet. From now on every download from the website is kept here."}</Empty>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Access
