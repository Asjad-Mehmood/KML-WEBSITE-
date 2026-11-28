"use client";

// Admin → Dashboard: the trends, the all-time numbers, and the latest accounts, activity and
// downloads (app/admin/AdminClient.tsx loads its data and opens a person's window).
import { Activity, Download, FileSpreadsheet, Layers, Server, Sparkles, Users } from "lucide-react";
import AdminTrends from "@/components/admin/AdminTrends";
import { actionLabel, adminActionTag } from "@/lib/admin/activityKinds";
import { barWidth, fmtBytes, formatLocationDisplay } from "@/components/admin/format";
import type { AdminStats, ConversionItem, DownloadItem, UserActivityItem, UserItem } from "@/lib/admin/adminTypes";

export default function AdminOverview({
  stats,
  downloads,
  users,
  conversions,
  conversionsTotal,
  allActivities,
  activitiesTotal,
  adminFetch,
  onShow,
  onTab,
  onOpenUser,
}: {
  stats: AdminStats | null;
  downloads: DownloadItem[];
  users: UserItem[];
  conversions: ConversionItem[];
  conversionsTotal: number;
  allActivities: UserActivityItem[];
  activitiesTotal: number;
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onShow: (id: string) => void;
  onTab: (tab: "users" | "activities" | "downloads") => void;
  onOpenUser: (id: string) => void;
}) {
  return (
      <div className="space-y-8">
        <AdminTrends adminFetch={adminFetch} onShow={onShow} />
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500 -mb-4">All time</h2>
        {/* Stat Cards (5 metrics) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Surveyors</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-[28px] leading-none font-extrabold tracking-tight text-white tabular-nums">{stats?.totalUsers ?? users.length}</div>
              <p className="text-[11px] text-slate-400 mt-1">Registered accounts</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Downloads</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-[28px] leading-none font-extrabold tracking-tight text-white tabular-nums">{stats?.totalDownloads ?? 0}</div>
              <p className="text-[11px] text-slate-400 mt-1">Installer and sample files</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Points Kept</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-[28px] leading-none font-extrabold tracking-tight text-cyan-300 tabular-nums">
                {(stats?.totalPointsKept ?? conversionsTotal).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Converted points in saved files</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Activity</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-[28px] leading-none font-extrabold tracking-tight text-white tabular-nums">
                {(stats?.totalActivities ?? allActivities.length) || conversions.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Conversions, saves and opens logged</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] flex flex-col justify-between min-w-0 last:col-span-2 lg:last:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Files Stored</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-[28px] leading-none font-extrabold tracking-tight text-white tabular-nums">{(stats?.totalFilesStored ?? 0).toLocaleString()}</div>
              <p className="text-[11px] text-slate-400 mt-1">
                {fmtBytes(stats?.totalStorageBytes ?? 0)} kept in {(stats?.totalFilesWithCopy ?? 0).toLocaleString()} copies
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Live Telemetry Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Distribution */}
          <div className="p-6 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" /> Downloads by file
              </h3>
              <span className="text-xs text-slate-500">All-time downloads</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Windows Lite Setup (.exe)</span>
                  <span className="text-blue-400">
                    {stats?.assetCounts?.windows_installer ?? 0} downloads
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: barWidth(stats?.assetCounts?.windows_installer ?? 0, stats?.totalDownloads ?? 0),
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">RoadPro for AutoCAD (.zip)</span>
                  <span className="text-amber-400">{stats?.assetCounts?.roadpro ?? 0} downloads</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: barWidth(stats?.assetCounts?.roadpro ?? 0, stats?.totalDownloads ?? 0),
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Traverse &amp; Level for Windows (.exe)</span>
                  <span className="text-yellow-300">{stats?.assetCounts?.traverse ?? 0} downloads</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{
                      width: barWidth(stats?.assetCounts?.traverse ?? 0, stats?.totalDownloads ?? 0),
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Project Folder Manager for Windows</span>
                  <span className="text-teal-300">{stats?.assetCounts?.folder_manager ?? 0} downloads</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full"
                    style={{
                      width: barWidth(stats?.assetCounts?.folder_manager ?? 0, stats?.totalDownloads ?? 0),
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Slope Calculator for Windows (.exe)</span>
                  <span className="text-sky-300">{stats?.assetCounts?.slope ?? 0} downloads</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full"
                    style={{
                      width: barWidth(stats?.assetCounts?.slope ?? 0, stats?.totalDownloads ?? 0),
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Sample Survey Benchmarks (.csv)</span>
                  <span className="text-indigo-400">{stats?.assetCounts?.sample_csv ?? 0} downloads</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: barWidth(stats?.assetCounts?.sample_csv ?? 0, stats?.totalDownloads ?? 0),
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">Dubai DLTM Test (.kml)</span>
                  <span className="text-emerald-400">{stats?.assetCounts?.test_kml ?? 0} downloads</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: barWidth(stats?.assetCounts?.test_kml ?? 0, stats?.totalDownloads ?? 0),
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2.5">
              <a
                href="/api/admin/download-log?format=csv"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
              </a>
              <button
                onClick={() => onTab("users")}
                className="px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" /> All Surveyors ({users.length})
              </button>
            </div>
          </div>

          {/* Live Application Telemetry Feed (Desktop & Web App) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Latest activity
                </h3>
                <p className="text-xs text-slate-400">
                  Conversions, saved files and opened files, newest first
                </p>
              </div>
              <button
                onClick={() => onTab("activities")}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Log ({Math.max(activitiesTotal, allActivities.length)})</span> &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {allActivities.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs bg-slate-800/30 rounded-2xl border border-slate-800">
                  No activity yet. Conversions and saved files show up here.
                </div>
              ) : (
                allActivities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800/80 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 ${adminActionTag(act.action)}`}>
                        {actionLabel(act.action)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate max-w-md">
                          {act.title}
                        </div>
                        {(act.action === "settings_update" || act.action === "settings_changed") && act.details && (
                          <div className="mt-0.5 text-[11px] text-slate-400 whitespace-pre-line break-words max-w-md">{act.details}</div>
                        )}
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          {act.userId ? (
                            <button
                              onClick={() => {
                                if (act.userId) onOpenUser(act.userId);
                              }}
                              className="text-blue-400 hover:text-blue-300 font-semibold underline decoration-dotted cursor-pointer"
                            >
                              {act.userName || act.userEmail || "Surveyor"}
                            </button>
                          ) : (
                            <span className="text-slate-400">{act.userName || act.userEmail || "Anonymous"}</span>
                          )}
                          {act.pointsCount !== undefined && (
                            <span className="text-cyan-400 font-mono">• {act.pointsCount} points</span>
                          )}
                          {act.crs && <span className="text-amber-400 truncate max-w-[120px]">• {act.crs}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{act.ipAddress || "127.0.0.1"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* The latest downloads (where they come from is in "Downloads by country" above) */}
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Real-time Activity Card */}
          <div className="p-6 rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-400" /> Latest downloads
              </h3>
              <button
                onClick={() => onTab("downloads")}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                View All &rarr;
              </button>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {downloads.slice(0, 8).map((dl) => {
                const loc = formatLocationDisplay(dl.location);
                return (
                  <div
                    key={dl.id}
                    className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate max-w-[150px]">
                          {dl.userName || dl.userEmail || "Anonymous"}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span className="text-xs shrink-0">{loc.flag}</span>
                          <span className="truncate max-w-[130px]">{loc.text}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 block mb-1">
                        {dl.ipAddress || "—"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(dl.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
}
