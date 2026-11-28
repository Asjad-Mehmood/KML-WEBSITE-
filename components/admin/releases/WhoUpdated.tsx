"use client";

// Who has updated: the versions in use of each program, from the accounts that use it.
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Users } from "lucide-react";
import { btn, day, errorOf, type App, type Fetch, type Release } from "@/components/admin/releases/shared";

interface VersionsData {
  latest: string;
  current: number;
  behind: number;
  versions: { version: string; people: number; behind: boolean }[];
  people: { userId: string; email: string; name: string; version: string; source: "app" | "toolkit" | "download"; at: string; behind: boolean }[];
}

const SOURCE: Record<string, string> = { app: "the program", toolkit: "Survey Toolkit", download: "downloaded" };

/**
 * Who has the newest version of the app and who doesn't (lib/products/versionsInUse.ts), and emailing the
 * ones behind about the newest release
 */
export function WhoUpdated({
  adminFetch,
  app,
  newest,
  canSend,
  onEmail,
  onAddRelease,
  onOpenAccount,
  onLoaded,
}: {
  adminFetch: Fetch;
  app: App;
  /** the app's newest release in the list, which the email is about */
  newest: Release | null;
  canSend: boolean;
  onEmail: (release: Release) => void;
  onAddRelease: (version: string) => void;
  onOpenAccount: (userId: string) => void;
  /** the newest version and how many are behind it, for the page's Next step */
  onLoaded?: (v: { latest: string; behind: number }) => void;
}) {
  const [d, setD] = useState<VersionsData | null>(null);
  const loaded = useRef(onLoaded);
  useEffect(() => {
    loaded.current = onLoaded;
  });
  const [failed, setFailed] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  useEffect(() => {
    let live = true;
    fetcher
      .current(`/api/admin/releases/versions?app=${encodeURIComponent(app.id)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await errorOf(r));
        return r.json() as Promise<VersionsData>;
      })
      .then((v) => {
        if (!live) return;
        setD(v);
        loaded.current?.({ latest: v.latest, behind: v.behind });
      })
      .catch((e) => live && setFailed((e as Error).message));
    return () => {
      live = false;
    };
  }, [app.id]);

  const known = d ? d.current + d.behind : 0;
  const pct = (n: number) => (known ? Math.round((n / known) * 100) : 0);
  const behindPeople = d?.people.filter((p) => p.behind) ?? [];
  const shownPeople = all ? behindPeople : behindPeople.slice(0, 8);
  // the email is about the newest release in the list; it should be the newest version
  const newestListed = newest && d ? compareVersionsLoose(newest.version, d.latest) >= 0 : false;

  return (
    <div className="px-5 py-4 border-b border-slate-800 bg-emerald-500/[0.03]">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <Users className="w-4 h-4 text-emerald-300" /> Who has updated
            {d && <span className="text-xs font-semibold text-slate-400">newest: {d.latest}</span>}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            The version each person has, from the program, the Survey Toolkit or their last download. People we know nothing about aren&apos;t counted.
          </p>
        </div>
        {d && d.behind > 0 && (
          <button
            onClick={() => newest && onEmail(newest)}
            disabled={!canSend || !newest || !newestListed}
            title={!newestListed ? `Add release ${d.latest} first: the email is about the newest release` : undefined}
            className={`${btn} bg-emerald-500 hover:bg-emerald-400 text-slate-950`}
          >
            <Send className="w-3.5 h-3.5" /> Email the {d.behind} behind
          </button>
        )}
      </div>

      {!d && !failed && (
        <p className="mt-3 text-xs text-slate-500">
          <Loader2 className="inline w-3.5 h-3.5 animate-spin mr-1" /> Looking at everyone&apos;s versions…
        </p>
      )}
      {failed && <p className="mt-3 text-xs text-rose-300">{failed}</p>}

      {d && known === 0 && <p className="mt-3 text-xs text-slate-400">Nobody&apos;s version is known yet.</p>}

      {d && known > 0 && (
        <>
          {/* up to date against behind */}
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-800" aria-hidden>
            <div className="bg-emerald-400" style={{ width: `${pct(d.current)}%` }} />
            <div className="bg-amber-400" style={{ width: `${pct(d.behind)}%` }} />
          </div>
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="text-emerald-300">
              <b>{d.current}</b> up to date ({pct(d.current)}%)
            </span>
            <span className="text-amber-300">
              <b>{d.behind}</b> on an older version ({pct(d.behind)}%)
            </span>
          </p>

          {/* by version */}
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {d.versions.map((v) => (
              <li
                key={v.version}
                className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${
                  v.behind ? "bg-amber-500/10 border-amber-500/30 text-amber-200" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                }`}
              >
                {v.version}
                {!v.behind && " (newest)"} · {v.people}
              </li>
            ))}
          </ul>

          {d.behind > 0 && newest && !newestListed && (
            <p className="mt-2 text-xs text-amber-300">
              The newest release in the list is {newest.version}, but {d.latest} is out.{" "}
              <button onClick={() => onAddRelease(d.latest)} className="underline cursor-pointer">
                Add release {d.latest}
              </button>{" "}
              (or Import from GitHub) so the email tells them about it.
            </p>
          )}
          {d.behind > 0 && !newest && (
            <p className="mt-2 text-xs text-amber-300">
              There&apos;s no release in the list yet.{" "}
              <button onClick={() => onAddRelease(d.latest)} className="underline cursor-pointer">
                Add release {d.latest}
              </button>{" "}
              to email them.
            </p>
          )}

          {/* the people behind */}
          {behindPeople.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-[10.5px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-bold">Person</th>
                    <th className="px-3 py-2 font-bold">Has</th>
                    <th className="hidden sm:table-cell px-3 py-2 font-bold">From</th>
                    <th className="hidden sm:table-cell px-3 py-2 font-bold">Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {shownPeople.map((p) => (
                    <tr key={p.userId}>
                      <td className="px-3 py-2">
                        <button onClick={() => onOpenAccount(p.userId)} className="text-left hover:underline cursor-pointer">
                          <span className="block font-semibold text-slate-200">{p.name || p.email}</span>
                          {p.name && <span className="block text-slate-500">{p.email}</span>}
                        </button>
                      </td>
                      <td className="px-3 py-2 font-mono text-amber-200">{p.version}</td>
                      <td className="hidden sm:table-cell px-3 py-2 text-slate-400">{SOURCE[p.source]}</td>
                      <td className="hidden sm:table-cell px-3 py-2 text-slate-400">{day(p.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {behindPeople.length > 8 && (
                <button onClick={() => setAll(!all)} className="w-full px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-slate-800/50 cursor-pointer">
                  {all ? "Show fewer" : `Show all ${behindPeople.length}`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** 2.10.0 against 2.9.1, number by number (the page can't import lib/releases) */
export function compareVersionsLoose(a: string, b: string): number {
  const pa = a.replace(/^v/i, "").split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  const pb = b.replace(/^v/i, "").split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
