"use client";

// Admin → Apps → Excel to KML: the shared app tab (components/admin/AppTab.tsx) and its own part:
// the points converted and the grids they were in, and its switches (sign-in to download, Traverse
// adjust in the app) with the version the website offers.
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Globe, Loader2, MapPin, Users } from "lucide-react";
import AppTab, { BarRow, Delta, Empty, Panel, Stat, type AppOverviewData } from "@/components/admin/AppTab";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
interface Extras {
  points: { cur: number; prev: number };
  pointsTotal: number;
  pointsPeople: number;
  grids: { grid: string; count: number; people: number }[];
}
interface Settings {
  appVersion: string;
  installerFileName: string;
  installerFileSize: string;
  requireAuthForDownload: boolean;
  traverseEnabled: boolean;
}

const SWITCHES: { key: "requireAuthForDownload" | "traverseEnabled"; label: string; on: string; off: string }[] = [
  {
    key: "requireAuthForDownload",
    label: "Sign in to download",
    on: "People sign in (or make an account) before the installer downloads.",
    off: "Anyone can download the installer without an account.",
  },
  {
    key: "traverseEnabled",
    label: "Traverse adjust in the app",
    on: "Traverse and level-run adjustment is shown in Excel to KML.",
    off: "Traverse adjustment is hidden in Excel to KML.",
  },
];

function Toggle({ on, busy, onClick, label }: { on: boolean; busy: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onClick}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-60 ${on ? "bg-blue-600" : "bg-slate-700"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

function ExcelSettings({ adminFetch, onToast, onShow, latest }: { adminFetch: Fetcher; onToast: (m: string, t?: "success" | "error") => void; onShow: (s: string) => void; latest: string }) {
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  useEffect(() => {
    fetcher
      .current("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.success && setS(j.settings))
      .catch(() => {});
  }, []);

  const flip = async (key: (typeof SWITCHES)[number]["key"]) => {
    if (!s) return;
    const next = !s[key];
    setBusy(key);
    try {
      const r = await fetcher.current("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: next }) });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "failed");
      setS(j.settings);
      onToast(`${SWITCHES.find((x) => x.key === key)!.label}: ${next ? "on" : "off"}`);
    } catch (e) {
      onToast(e instanceof Error && e.message !== "failed" ? e.message : "Couldn't save", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title="Settings"
      action={
        <button onClick={() => onShow("settings")} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
          All settings
        </button>
      }
    >
      {!s ? (
        <Empty>
          <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> Loading…
        </Empty>
      ) : (
        <ul className="pb-2">
          {SWITCHES.map((x) => (
            <li key={x.key} className="px-5 py-3 border-t border-[var(--adm-line)] flex items-center justify-between gap-4">
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-white">{x.label}</span>
                <span className="block text-xs text-slate-400">{s[x.key] ? x.on : x.off}</span>
              </span>
              <Toggle on={s[x.key]} busy={busy === x.key} onClick={() => flip(x.key)} label={x.label} />
            </li>
          ))}
          <li className="px-5 py-3 border-t border-[var(--adm-line)]">
            <span className="block text-[13px] font-semibold text-white">The download page offers</span>
            <span className="block text-xs text-slate-400">
              {s.appVersion} · {s.installerFileName} ({s.installerFileSize}). Change it in Settings, or publish a release in Releases.
            </span>
            {latest && s.appVersion.replace(/^v/i, "") !== latest && (
              <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> The newest release is v{latest}, but Settings still say {s.appVersion}.
              </span>
            )}
          </li>
        </ul>
      )}
    </Panel>
  );
}

export default function AdminExcelToKml({
  adminFetch,
  onToast,
  onShow,
  onOpenAccount,
}: {
  adminFetch: Fetcher;
  onToast: (m: string, t?: "success" | "error") => void;
  onShow: (section: string) => void;
  onOpenAccount: (userId: string) => void;
}) {
  return (
    <AppTab
      app="excel-to-kml"
      adminFetch={adminFetch}
      onShow={onShow}
      onOpenAccount={onOpenAccount}
      intro="Converts survey points from Excel and CSV to KML, KMZ and more: the Windows program and the web app."
    >
      {(d: AppOverviewData) => {
        const x = d.extras as Extras | null;
        const periodWord = d.days === 365 ? "year" : `${d.days} days`;
        return (
          <>
            {x && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <Stat icon={MapPin} label="Points converted" value={x.points.cur.toLocaleString()} sub={<Delta p={x.points} />} />
                <Stat icon={Users} label="People converting" value={x.pointsPeople.toLocaleString()} sub={`in the last ${periodWord}`} />
                <Stat icon={Globe} label="Points, all time" value={x.pointsTotal.toLocaleString()} sub="kept from saved files" />
              </div>
            )}
            <div className="grid lg:grid-cols-2 gap-4">
              <Panel
                title="Grids used"
                action={
                  <button onClick={() => onShow("conversions")} className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
                    All points
                  </button>
                }
              >
                {x && x.grids.length ? (
                  <ul className="pb-2">
                    {x.grids.map((g) => (
                      <BarRow
                        key={g.grid}
                        label={g.grid}
                        sub={`${g.people.toLocaleString()} ${g.people === 1 ? "person" : "people"}`}
                        value={g.count}
                        max={Math.max(...x.grids.map((y) => y.count))}
                        color="bg-amber-400"
                        right={<span className="text-[11px] text-slate-500">points</span>}
                      />
                    ))}
                  </ul>
                ) : (
                  <Empty>No points converted in this period.</Empty>
                )}
              </Panel>
              <ExcelSettings adminFetch={adminFetch} onToast={onToast} onShow={onShow} latest={d.app.latest} />
            </div>
          </>
        );
      }}
    </AppTab>
  );
}
