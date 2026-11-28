"use client";

// Admin → Usage → Invites: people who came from invite links, who invites most, the latest ones
import { useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";

type Data = {
  totals: Record<string, number>;
  top: { id: string; name: string; email: string; joined: number; rewarded: number }[];
  recent: { friend: string; friendEmail: string; inviter: string; status: string; note: string; createdAt: string }[];
};

const card = "rounded-2xl border border-[var(--adm-line)] bg-[var(--adm-card)] p-4";
const STATUS: Record<string, string> = {
  pending: "waiting for first use",
  rewarded: "month given",
  held: "held: same network as the inviter",
  capped: "inviter at the most months",
};

export default function AdminInvites({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [d, setD] = useState<Data | null>(null);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });
  useEffect(() => {
    let live = true;
    fetcher
      .current("/api/admin/referrals")
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => live && x && setD(x))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!d) return null;
  const all = Object.values(d.totals).reduce((a, b) => a + b, 0);

  return (
    <section className={card} aria-labelledby="inv-title">
      <h3 id="inv-title" className="text-sm font-bold text-white flex items-center gap-2">
        <Gift className="w-4 h-4 text-blue-400" aria-hidden /> Invites
      </h3>
      <p className="mt-1 text-xs text-slate-400 tabular-nums">
        {all} signed up from an invite link · {d.totals.rewarded ?? 0} months of Pro given · {d.totals.pending ?? 0} waiting
        {d.totals.held ? ` · ${d.totals.held} held` : ""}
      </p>
      {all === 0 ? (
        <p className="mt-2 text-xs text-slate-500">No one yet. Each account has its invite link on its dashboard.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-300">Invite the most</p>
            <ol className="mt-1.5 space-y-1">
              {d.top.map((t) => (
                <li key={t.id} className="flex justify-between gap-2 text-xs">
                  <span className="truncate text-slate-200">{t.name || t.email}</span>
                  <span className="shrink-0 tabular-nums text-slate-400">
                    {t.joined} joined · {t.rewarded} months
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-300">Latest</p>
            <ul className="mt-1.5 space-y-1">
              {d.recent.map((r, i) => (
                <li key={i} className="text-xs">
                  <span className="text-slate-200">{r.friend || r.friendEmail}</span>
                  <span className="text-slate-500"> invited by {r.inviter} · {STATUS[r.status] || r.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
