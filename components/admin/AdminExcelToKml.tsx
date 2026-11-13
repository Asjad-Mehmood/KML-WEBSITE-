"use client";

// Admin → Apps → Excel to KML: the shared app tab (components/admin/AppTab.tsx) and its own part:
// the points converted and the grids they were in, and its switches (sign-in to download, Traverse
// adjust in the app) with the version the website offers.
import { AlertTriangle, Globe, MapPin, Users } from "lucide-react";
import AppTab, { AppSettings, BarRow, Delta, Empty, Panel, Stat, type AppOverviewData, type SettingField } from "@/components/admin/AppTab";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
interface Extras {
  points: { cur: number; prev: number };
  pointsTotal: number;
  pointsPeople: number;
  grids: { grid: string; count: number; people: number }[];
}
const FIELDS: SettingField[] = [
  {
    key: "requireAuthForDownload",
    kind: "switch",
    label: "Sign in to download",
    on: "People sign in (or make an account) before the installer downloads.",
    off: "Anyone can download the installer without an account.",
  },
  {
    key: "traverseEnabled",
    kind: "switch",
    label: "Traverse adjust in the app",
    on: "Traverse and level-run adjustment is shown in Excel to KML.",
    off: "Traverse adjustment is hidden in Excel to KML.",
  },
];

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
              <AppSettings
                adminFetch={adminFetch}
                onToast={onToast}
                onShow={onShow}
                fields={FIELDS}
                footer={(st) => {
                  const v = String(st.appVersion ?? "");
                  return (
                    <li className="px-5 py-3 border-t border-[var(--adm-line)]">
                      <span className="block text-[13px] font-semibold text-white">The download page offers</span>
                      <span className="block text-xs text-slate-400">
                        {v} · {String(st.installerFileName ?? "")} ({String(st.installerFileSize ?? "")}). Change it in Settings, or publish a release in Releases.
                      </span>
                      {d.app.latest && v.replace(/^v/i, "") !== d.app.latest && (
                        <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> The newest release is v{d.app.latest}, but Settings still say {v}.
                        </span>
                      )}
                    </li>
                  );
                }}
              />
            </div>
          </>
        );
      }}
    </AppTab>
  );
}
