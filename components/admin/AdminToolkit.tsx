"use client";

// Admin → Survey Toolkit: everything about the Toolkit in one place.
//   Overview   accounts, PCs, downloads, installs, updates and failures; 30 days day by day;
//              each tool on the PCs (up to date or not); Toolkit and Windows versions
//   Accounts   each account that uses it: PCs, Toolkit version, what it did, when it downloaded
//   PCs        each PC with the version of every tool; its whole history on demand
//   Activity   every install, update, uninstall, failure and open, filtered and exported
//   Downloads  each download from the website (who, where, which version) and GitHub's counts
//   Access     open to everyone or only the testers, and the testers themselves
// Data from /api/toolkit/admin; testers added and removed with /api/toolkit/testers.
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { SECTIONS, smallBtn, type Data, type Fetcher, type Section } from "@/components/admin/toolkit/shared";
import { Overview } from "@/components/admin/toolkit/Overview";
import { Accounts } from "@/components/admin/toolkit/Accounts";
import { Pcs } from "@/components/admin/toolkit/Pcs";
import { ActivityLog } from "@/components/admin/toolkit/ActivityLog";
import { Downloads } from "@/components/admin/toolkit/Downloads";
import { Access } from "@/components/admin/toolkit/Access";
export default function AdminToolkit({
  adminFetch,
  onToast,
  embedded = false,
  part,
  onPart,
}: {
  adminFetch: Fetcher;
  onToast: (s: string) => void;
  /** the part chosen in the Admin menu; the page's own buttons hide when it's given */
  part?: Section;
  onPart?: (s: Section) => void;
  /** under the app tab (Admin → Apps → Survey Toolkit), which already shows the totals */
  embedded?: boolean;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [own, setOwn] = useState<Section>("overview");
  const section = part ?? own;
  const setSection = onPart ?? setOwn;
  const [now, setNow] = useState(0);

  // the first load runs from the effect, so it only sets state once the answer is in
  const fetchData = useCallback(
    () =>
      adminFetch("/api/toolkit/admin", { cache: "no-store" })
        .then(async (r) => {
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.error || `The server answered ${r.status}.`);
          setData(j as Data);
          setNow(Date.now());
          setError("");
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the Toolkit's data."))
        .finally(() => setLoading(false)),
    [adminFetch]
  );
  const load = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {!part && SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              section === s.id ? "bg-blue-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" /> {embedded && s.id === "overview" ? "Tools on PCs" : s.label}
          </button>
        ))}
        <button onClick={load} disabled={loading} className={`${smallBtn} ml-auto bg-slate-900 border border-slate-800 text-slate-300 hover:text-white`}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {!data && loading && (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      )}
      {data && section === "overview" && <Overview data={data} now={now} onShow={setSection} embedded={embedded} />}
      {data && section === "accounts" && <Accounts data={data} now={now} />}
      {data && section === "pcs" && <Pcs data={data} now={now} adminFetch={adminFetch} onToast={onToast} onChanged={load} />}
      {data && section === "activity" && <ActivityLog data={data} />}
      {data && section === "downloads" && <Downloads data={data} />}
      {data && section === "access" && <Access data={data} adminFetch={adminFetch} onToast={onToast} onChanged={load} />}
    </div>
  );
}

// ---------------------------------------------------------------- Overview

