"use client";

// Admin → Survey Toolkit → Accounts: the people who signed in to the Toolkit.
import { useState } from "react";
import { ChevronDown, ChevronRight, FileSpreadsheet } from "lucide-react";
import { isOlder } from "@/components/toolkit/ToolkitAdmin";
import { Empty, EventTable, SearchBox, ago, exportBtn, plural, saveCsv, stamp, when, type Data } from "@/components/admin/toolkit/shared";
import { PcTable } from "@/components/admin/toolkit/Pcs";

export function Accounts({ data, now }: { data: Data; now: number }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const latestToolkit = data.downloads?.latest?.version ?? null;
  const shown = data.users.filter((u) =>
    `${u.name ?? ""} ${u.email ?? ""} ${u.organization ?? ""} ${u.location ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())
  );
  const exportAll = () =>
    saveCsv(
      `toolkit-accounts-${stamp()}.csv`,
      ["Name", "Email", "Organization", "Location", "PCs", "Toolkit version", "First seen", "Last seen", "Installs", "Updates", "Failures", "Events", "Last download"],
      shown.map((u) => [u.name, u.email, u.organization, u.location, u.pcs, u.toolkitVersion, u.firstSeen, u.lastSeen, u.installs, u.updates, u.failures, u.events, u.lastDownload ?? ""])
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email, organization, place" />
        <span className="text-xs text-slate-400">{shown.length} of {data.users.length} accounts</span>
        <button onClick={exportAll} disabled={!shown.length} className={`${exportBtn} ml-auto`}>
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      {!shown.length && <Empty>{data.users.length ? "No one matches" : "No account has used the Toolkit yet"}</Empty>}
      <ul className="space-y-2">
        {shown.map((u) => {
          const isOpen = open === u.userId;
          const pcs = data.devices.filter((d) => d.userId === u.userId);
          const events = data.events.filter((e) => e.email && e.email === u.email).slice(0, 50);
          const downloads = data.siteDownloads.filter((d) => d.userId === u.userId);
          return (
            <li key={u.userId} className={`rounded-2xl border ${isOpen ? "border-blue-500/40 bg-slate-900" : "border-slate-800 bg-slate-900/70"}`}>
              <button onClick={() => setOpen(isOpen ? null : u.userId)} aria-expanded={isOpen} className="w-full flex flex-wrap items-center gap-3 p-4 text-left cursor-pointer">
                {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white truncate">{u.name || u.email || u.userId}</span>
                  <span className="block text-xs text-slate-400 truncate">
                    {[u.email, u.organization, u.location].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex flex-wrap gap-2 text-[11.5px]">
                  <Chip>{plural(u.pcs, "PC")}</Chip>
                  <Chip tone={latestToolkit && u.toolkitVersion && isOlder(u.toolkitVersion, latestToolkit) ? "amber" : "slate"}>Toolkit {u.toolkitVersion || "?"}</Chip>
                  <Chip>{plural(u.installs, "install")}</Chip>
                  <Chip>{plural(u.updates, "update")}</Chip>
                  {u.failures > 0 && <Chip tone="red">{u.failures} failed</Chip>}
                  <Chip>seen {ago(u.lastSeen, now)}</Chip>
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-800 p-4 space-y-4">
                  <div className="grid sm:grid-cols-4 gap-3 text-[12.5px]">
                    <Fact k="First used" v={when(u.firstSeen)} />
                    <Fact k="Last seen" v={when(u.lastSeen)} />
                    <Fact k="Downloaded the Toolkit" v={downloads.length ? `${downloads.length}× · last ${when(downloads[0].timestamp)}` : "not from the website"} />
                    <Fact k="Everything it did" v={`${u.events} events`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">PCs and their tools</p>
                    <PcTable devices={pcs} tools={data.tools} now={now} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Latest activity</p>
                    <div className="rounded-xl border border-slate-800">
                      <EventTable events={events} tools={data.tools} />
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Chip({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "amber" | "red" }) {
  const c = tone === "red" ? "bg-red-500/15 text-red-300" : tone === "amber" ? "bg-amber-500/15 text-amber-300" : "bg-slate-800 text-slate-300";
  return <span className={`px-2 py-0.5 rounded-full font-semibold tabular-nums ${c}`}>{children}</span>;
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-slate-950/50 border border-slate-800 px-3 py-2">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{k}</p>
      <p className="mt-0.5 text-slate-200">{v}</p>
    </div>
  );
}
