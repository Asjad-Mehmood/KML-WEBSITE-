"use client";

// Dashboard → Teams (lib/teams.ts): make a team, invite colleagues with its link, share jobs with
// it, and copy or download what the others shared.
import { useCallback, useEffect, useState } from "react";
import { Copy, Download, Link2, Loader2, LogOut, Plus, Share2, Trash2, Users, X } from "lucide-react";

type Member = { id: string; name: string; email: string; role: string; me: boolean };
type Share = { id: string; kind: string; app: string; name: string; by: string; mine: boolean; itemId: string | null; note: string; sharedAt: string; updatedAt: string | null };
type Team = { id: string; name: string; role: "owner" | "member"; link: string; members: Member[]; shares: Share[] };
type Item = { kind: string; id: string; name: string; detail: string; updated: string };

const APP_OF: Record<string, string> = { kml: "Excel to KML", traverse: "Traverse & Level", slope: "Slope Calculator" };
const card = "bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6";
const btn = "inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer disabled:opacity-50";
const primary = "inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0062c4] cursor-pointer disabled:opacity-60";
const field = "rounded-xl border border-slate-200 px-3 py-2 text-[14px] text-slate-900";
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function TeamsPanel() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [pick, setPick] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/teams", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Your teams couldn't be loaded.");
      setTeams(d.teams);
      setItems(d.items || []);
    } catch (e) {
      setMsg({ text: (e as Error).message, bad: true });
      setTeams([]);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("team") === "joined") setMsg({ text: "You're in the team. Its shared jobs are below." });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const act = async (key: string, body: Record<string, unknown>, done?: string, ask?: string) => {
    if (ask && !window.confirm(ask)) return;
    setBusy(key);
    setMsg(null);
    try {
      const r = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "That didn't work.");
      if (done) setMsg({ text: done });
      await load();
      return d;
    } catch (e) {
      setMsg({ text: (e as Error).message, bad: true });
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setMsg({ text: "Invite link copied. Send it to your colleagues." });
    } catch {
      window.prompt("Copy the invite link:", link);
    }
  };

  if (!teams) return null;

  const createForm = (
    <form
      className="mt-4 flex flex-col sm:flex-row gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void act("create", { action: "create", name: newName }, "Team made. Copy its invite link and send it to your colleagues.").then((d) => {
          if (d) {
            setNewName("");
            setCreating(false);
          }
        });
      }}
    >
      <input className={`${field} flex-1`} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Team name, e.g. North Gas Field survey" maxLength={60} required aria-label="Team name" />
      <button type="submit" className={primary} disabled={busy === "create"}>
        {busy === "create" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />} Make the team
      </button>
    </form>
  );

  return (
    <section id="teams" className="mt-6 scroll-mt-24" aria-labelledby="teams-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="teams-title" className="text-[18px] font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0071e3]" aria-hidden /> Teams
          </h2>
          <p className="text-[13px] text-slate-500">Share jobs with your colleagues, and copy theirs into your own account to open in the apps.</p>
        </div>
        {teams.length > 0 && !creating && (
          <button type="button" className={btn} onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" aria-hidden /> New team
          </button>
        )}
      </div>

      {msg && (
        <p role={msg.bad ? "alert" : "status"} className={`mt-3 rounded-xl px-3 py-2 text-[13px] ${msg.bad ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
          {msg.text}
        </p>
      )}

      {(teams.length === 0 || creating) && (
        <div className={`${card} mt-4`}>
          <p className="text-[15px] font-bold text-slate-900">{teams.length === 0 ? "Work together on your survey jobs" : "A new team"}</p>
          {teams.length === 0 && (
            <ul className="mt-2 space-y-1 text-[13px] text-slate-600 list-disc pl-5">
              <li>Make a team for your office or a project, and send its link to your colleagues.</li>
              <li>Share any job you keep in your account: Excel to KML jobs, traverses and level runs, slope calculations.</li>
              <li>The others see it here: they download it, or copy it into their own account and open it in the app.</li>
            </ul>
          )}
          {createForm}
          {creating && (
            <button type="button" className="mt-2 text-[13px] text-slate-500 hover:text-slate-800 cursor-pointer" onClick={() => setCreating(false)}>
              Cancel
            </button>
          )}
        </div>
      )}

      {teams.map((t) => {
        const shareable = items.filter((it) => !t.shares.some((s) => s.mine && s.kind === it.kind && s.itemId === it.id));
        const choice = pick[t.id] || "";
        return (
          <div key={t.id} className={`${card} mt-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[16px] font-bold text-slate-900 truncate">{t.name}</h3>
                <p className="text-[12.5px] text-slate-500">
                  {t.members.length} {t.members.length === 1 ? "member" : "members"} · {t.shares.length} shared {t.shares.length === 1 ? "job" : "jobs"}
                  {t.role === "owner" ? " · you own it" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn} onClick={() => void copyLink(t.link)}>
                  <Link2 className="w-4 h-4" aria-hidden /> Copy invite link
                </button>
                <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(`Join my team "${t.name}" on SurveyX Digital to share survey jobs: ${t.link}`)}`} target="_blank" rel="noopener noreferrer">
                  <Share2 className="w-4 h-4" aria-hidden /> WhatsApp
                </a>
              </div>
            </div>

            {/* shared jobs */}
            <h4 className="mt-5 text-[13px] font-bold text-slate-900">Shared with the team</h4>
            {t.shares.length === 0 ? (
              <p className="mt-1 text-[13px] text-slate-500">Nothing yet. Share one of your jobs below.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {t.shares.map((s) => (
                  <li key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-slate-900 truncate">{s.name}</p>
                      <p className="text-[12px] text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{s.app}</span> · {s.mine ? "shared by you" : `by ${s.by}`} · {day(s.updatedAt || s.sharedAt)}
                        {s.note ? ` · ${s.note}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {!s.mine && (
                        <button
                          type="button"
                          className={btn}
                          disabled={busy === `copy${s.id}`}
                          onClick={() => void act(`copy${s.id}`, { action: "copy", shareId: s.id }, `"${s.name}" is now in your account: open it in ${s.app}.`)}
                        >
                          <Copy className="w-4 h-4" aria-hidden /> Copy to my account
                        </button>
                      )}
                      <a className={btn} href={`/api/teams/download/${s.id}`}>
                        <Download className="w-4 h-4" aria-hidden /> Download
                      </a>
                      {(s.mine || t.role === "owner") && (
                        <button type="button" className={btn} aria-label={`Stop sharing ${s.name}`} onClick={() => void act(`un${s.id}`, { action: "unshare", shareId: s.id }, "Taken off the team.")}>
                          <X className="w-4 h-4" aria-hidden /> Unshare
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* share one of mine */}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <select className={`${field} flex-1 min-w-0`} value={choice} onChange={(e) => setPick({ ...pick, [t.id]: e.target.value })} aria-label="A job to share">
                <option value="">{items.length ? "Share one of your jobs…" : "You don't keep any jobs in your account yet"}</option>
                {(["kml", "traverse", "slope"] as const).map((k) => {
                  const list = shareable.filter((it) => it.kind === k);
                  return list.length ? (
                    <optgroup key={k} label={APP_OF[k]}>
                      {list.map((it) => (
                        <option key={`${k}:${it.id}`} value={`${k}:${it.id}`}>
                          {it.name} — {it.detail}
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })}
              </select>
              <button
                type="button"
                className={primary}
                disabled={!choice || busy === `share${t.id}`}
                onClick={() => {
                  const [kind, ...rest] = choice.split(":");
                  void act(`share${t.id}`, { action: "share", teamId: t.id, kind, itemId: rest.join(":") }, "Shared with the team.").then(() => setPick({ ...pick, [t.id]: "" }));
                }}
              >
                <Share2 className="w-4 h-4" aria-hidden /> Share
              </button>
            </div>

            {/* members */}
            <h4 className="mt-5 text-[13px] font-bold text-slate-900">Members</h4>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {t.members.map((m) => (
                <li key={m.id} className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-[12.5px] text-slate-800">
                  {m.me ? "You" : m.name || m.email}
                  {m.role === "owner" && <span className="text-[11px] text-slate-500">owner</span>}
                  {t.role === "owner" && !m.me && (
                    <button
                      type="button"
                      aria-label={`Take ${m.name || m.email} out of the team`}
                      className="rounded-full p-0.5 text-slate-500 hover:bg-white hover:text-red-600 cursor-pointer"
                      onClick={() => void act(`rm${m.id}`, { action: "remove", teamId: t.id, userId: m.id }, "Taken out of the team.", `Take ${m.name || m.email} out of ${t.name}? The jobs they shared leave the team too.`)}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-3 text-[12.5px]">
              {t.role === "owner" ? (
                <>
                  <button
                    type="button"
                    className="text-slate-500 hover:text-slate-900 cursor-pointer"
                    onClick={() => {
                      const n = window.prompt("The team's new name:", t.name);
                      if (n && n.trim() && n.trim() !== t.name) void act(`ren${t.id}`, { action: "rename", teamId: t.id, name: n }, "Renamed.");
                    }}
                  >
                    Rename
                  </button>
                  <button type="button" className="text-slate-500 hover:text-slate-900 cursor-pointer" onClick={() => void act(`nl${t.id}`, { action: "newLink", teamId: t.id }, "New invite link made: the old one no longer works.", "Make a new invite link? The old one will stop working (people already in the team stay).")}>
                    New invite link
                  </button>
                  <button type="button" className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 cursor-pointer" onClick={() => void act(`del${t.id}`, { action: "delete", teamId: t.id }, "The team is deleted. Everyone's jobs stay in their own accounts.", `Delete ${t.name} for everyone? The jobs stay in each person's own account.`)}>
                    <Trash2 className="w-3.5 h-3.5" aria-hidden /> Delete team
                  </button>
                </>
              ) : (
                <button type="button" className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 cursor-pointer" onClick={() => void act(`lv${t.id}`, { action: "remove", teamId: t.id }, "You left the team.", `Leave ${t.name}? The jobs you shared leave the team too; copies you made stay yours.`)}>
                  <LogOut className="w-3.5 h-3.5" aria-hidden /> Leave team
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
