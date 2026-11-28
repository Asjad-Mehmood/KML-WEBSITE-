"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, ChevronDown, CheckCircle2, Download, Eye, Search, Loader2, Mail, Megaphone, Pause, PartyPopper, Pencil, Play, Plus, RefreshCw, Send, Square, Star, Trash2, Users } from "lucide-react";
import { EmailHistory, NoteLines, OptOuts, ReleaseTimeline, VersionBoard } from "@/components/admin/ReleaseTools";
import { btn, day, errorOf, json, when, type App, type Broadcast, type Data, type Fetch, type Release, type Who } from "@/components/admin/releases/shared";
import { ConfirmBroadcast, ConfirmReviews, Modal, PreviewModal, ReleaseForm } from "@/components/admin/releases/ReleaseDialogs";
import { WhoUpdated, compareVersionsLoose } from "@/components/admin/releases/WhoUpdated";
// Admin → Releases: each app's versions, and emailing one to the people who use that app.
// Admin → Releases (the menu has a part per app): with no app, every app's versions, every
// release, the emails sent and who stopped them (components/admin/ReleaseTools.tsx); with an app,
// its releases, review requests, and a new program's introduction: the email to everyone and
// the announcement bar on the website (Settings → Notices).
export default function AdminReleases({
  adminFetch,
  onToast,
  app: appId = "",
  onShow = () => {},
  onOpenAccount = () => {},
  onCounts,
}: {
  adminFetch: Fetch;
  onToast: (message: string, type?: "success" | "error") => void;
  /** "" every app, or one app's releases */
  app?: string;
  onShow?: (section: string) => void;
  onOpenAccount?: (userId: string) => void;
  /** releases per app, for the menu */
  onCounts?: (c: Record<string, number>) => void;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  // the overview's lower part: every release, the emails sent, or who stopped release emails
  const [tab, setTab] = useState<"releases" | "emails" | "optouts">("releases");
  const [editing, setEditing] = useState<{ release: Partial<Release> & { app: string }; isNew: boolean } | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [confirming, setConfirming] = useState<{ release: Release; who: Who } | null>(null);
  const [asking, setAsking] = useState<string | null>(null); // the app whose users are about to be asked for a review
  const [running, setRunning] = useState<string | null>(null); // broadcast id being sent from this page
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ id: string; list: { email: string; error: string | null }[] } | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "unsent" | "nonotes">("all");
  // the website's announcement bar (Settings → Notices), so a new program can be shown there too
  const [notice, setNotice] = useState<{ text: string; active: boolean; link: string; endsAt: string } | null>(null);
  const [announcing, setAnnouncing] = useState<string | null>(null); // the app about to be shown on the website
  const [unfolded, setUnfolded] = useState<string[]>([]); // older releases opened to their buttons
  // per app, from Who has updated: the newest version out and how many people are behind it
  const [versionsOf, setVersionsOf] = useState<Record<string, { latest: string; behind: number }>>({});
  const toast = useRef(onToast);
  const counts = useRef(onCounts);
  useEffect(() => {
    toast.current = onToast;
    counts.current = onCounts;
  });
  const stopRef = useRef(false);

  const load = useCallback(
    () =>
      adminFetch("/api/admin/releases")
        .then(async (r) => {
          if (!r.ok) throw new Error(await errorOf(r));
          const d = (await r.json()) as Data;
          setData(d);
          counts.current?.(Object.fromEntries(d.groups.map((g) => [g.app.id, g.releases.length])));
        })
        .catch((e) => toast.current((e as Error).message, "error"))
        .finally(() => setLoading(false)),
    [adminFetch]
  );

  useEffect(() => {
    load();
    return () => {
      stopRef.current = true;
    };
  }, [load]);

  const loadNotice = useCallback(
    () =>
      adminFetch("/api/admin/settings")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const s = d?.settings;
          if (s) setNotice({ text: s.announcementBanner || "", active: !!s.announcementActive, link: s.announcementLink || "", endsAt: s.announcementEndsAt || "" });
        })
        .catch(() => undefined),
    [adminFetch]
  );
  useEffect(() => {
    loadNotice();
  }, [loadNotice]);

  /** Shows the new program in the bar along the bottom of every page for two weeks (Settings → Notices) */
  const announce = async (app: App, text: string) => {
    setBusy(`announce-${app.id}`);
    const ends = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
    const r = await adminFetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementBanner: text, announcementActive: true, announcementTone: "success", announcementLink: app.href, announcementEndsAt: ends }),
    });
    setBusy(null);
    setAnnouncing(null);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    toast.current(`${app.name} is announced on the website until ${day(ends)}`);
    loadNotice();
  };

  // Watch a broadcast the server is sending until it is done or paused (closing the page doesn't stop it)
  const run = useCallback(
    async (broadcastId: string) => {
      setRunning(broadcastId);
      stopRef.current = false;
      try {
        for (;;) {
          if (stopRef.current) break;
          const r = await adminFetch(`/api/admin/broadcasts/${broadcastId}`, json({ action: "watch" }));
          if (!r.ok) throw new Error(await errorOf(r));
          const { broadcast } = (await r.json()) as { broadcast: Broadcast };
          setData((d) =>
            d && {
              ...d,
              groups: d.groups.map((g) => ({
                ...g,
                releases: g.releases.map((rel) => ({ ...rel, broadcasts: rel.broadcasts.map((b) => (b.id === broadcast.id ? broadcast : b)) })),
                review: { ...g.review, broadcasts: g.review.broadcasts.map((b) => (b.id === broadcast.id ? broadcast : b)) },
              })),
            }
          );
          if (broadcast.status === "done") {
            toast.current(`Sent to ${broadcast.sent} ${broadcast.sent === 1 ? "person" : "people"}${broadcast.failed ? `, ${broadcast.failed} failed` : ""}`);
            break;
          }
          if (broadcast.status === "paused") {
            toast.current(broadcast.lastError || "Paused", "error");
            break;
          }
          await new Promise((res) => setTimeout(res, 3000));
        }
      } catch (e) {
        toast.current((e as Error).message, "error");
      } finally {
        setRunning(null);
        setHistoryKey((k) => k + 1);
        load();
      }
    },
    [adminFetch, load]
  );

  const act = async (b: Broadcast, action: "pause" | "resume" | "cancel") => {
    if (action === "cancel" && !confirm("Stop this broadcast for good? People not reached yet won't get it (you can send again later to those who haven't had it).")) return;
    if (action === "pause" || action === "cancel") stopRef.current = true;
    const r = await adminFetch(`/api/admin/broadcasts/${b.id}`, json({ action }));
    if (!r.ok) return toast.current(await errorOf(r), "error");
    if (action === "resume") return run(b.id);
    load();
  };

  const showPreview = async (rel: Release) => {
    setBusy(`preview-${rel.id}`);
    const r = await adminFetch(`/api/admin/releases/${rel.id}/preview`);
    setBusy(null);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    setPreview(await r.json());
  };

  const sendTest = async (rel: Release) => {
    setBusy(`test-${rel.id}`);
    const r = await adminFetch(`/api/admin/releases/${rel.id}/test`, json({}));
    setBusy(null);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    const { to } = await r.json();
    toast.current(`Test sent to ${to}`);
  };

  const reviewPreview = async (app: App) => {
    setBusy(`rpreview-${app.id}`);
    const r = await adminFetch(`/api/admin/review-requests/preview?app=${encodeURIComponent(app.id)}`);
    setBusy(null);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    setPreview(await r.json());
  };

  const reviewTest = async (app: App) => {
    setBusy(`rtest-${app.id}`);
    const r = await adminFetch("/api/admin/review-requests/test", json({ app: app.id }));
    setBusy(null);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    const { to } = await r.json();
    toast.current(`Test sent to ${to}`);
  };

  const startReviews = async (app: App, onlyNew: boolean) => {
    setBusy(`rstart-${app.id}`);
    const r = await adminFetch("/api/admin/review-requests", json({ app: app.id, onlyNew, confirm: true }));
    setBusy(null);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    setAsking(null);
    const { broadcastId } = await r.json();
    await load();
    run(broadcastId);
  };

  const remove = async (rel: Release, appName: string) => {
    const sent = rel.broadcasts.reduce((n, b) => n + b.sent, 0);
    if (!confirm(`Delete ${appName} ${rel.version} from the list?${sent ? ` Its broadcast history (${sent} emails sent) goes too.` : ""}`)) return;
    const r = await adminFetch(`/api/admin/releases/${rel.id}`, { method: "DELETE" });
    if (!r.ok) return toast.current(await errorOf(r), "error");
    toast.current("Release deleted");
    load();
  };

  const importGitHub = async (app: App) => {
    setBusy(`import-${app.id}`);
    const r = await adminFetch("/api/admin/releases/import", json({ app: app.id }));
    setBusy(null);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    const { added, filled } = await r.json();
    toast.current(
      added || filled
        ? `${added} added, ${filled} filled in from GitHub`
        : "Nothing new on GitHub: betas and releases without files are left out"
    );
    load();
  };

  const createIntro = async (app: App) => {
    setBusy(`intro-${app.id}`);
    const r = await adminFetch("/api/admin/releases/intro", json({ app: app.id }));
    setBusy(null);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    toast.current("Introduction email ready: preview it, send a test, then email everyone");
    load();
  };

  // a new email to only the people this one failed for
  const retryFailed = async (broadcastId: string) => {
    setBusy(`retry-${broadcastId}`);
    const r = await adminFetch("/api/admin/releases/tools", json({ action: "retry", broadcastId }));
    setBusy(null);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    setFailed(null);
    const { broadcastId: id } = await r.json();
    toast.current("Sending again to the people it failed for");
    await load();
    run(id);
  };

  const showFailed = async (b: Broadcast) => {
    const r = await adminFetch(`/api/admin/broadcasts/${b.id}`);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    setFailed({ id: b.id, list: (await r.json()).failed });
  };

  // One broadcast's progress and its Pause / Continue / Stop buttons (releases and review requests)
  const broadcastRow = (b: Broadcast, appName: string) => {
    const done = b.sent + b.failed;
    const pct = b.total ? Math.round((done / b.total) * 100) : 0;
    const live = running === b.id;
    return (
      <li key={b.id} className="rounded-xl bg-slate-950/60 border border-slate-800 px-3.5 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {b.status === "done" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : b.status === "paused" ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <Loader2 className={`w-4 h-4 text-blue-400 ${live ? "animate-spin" : ""}`} />
          )}
          <span className="text-slate-200 font-semibold">
            {b.status === "done" ? `Sent to ${b.sent} of ${b.total}` : `${b.status === "paused" ? "Paused" : "Sending"}: ${done} of ${b.total}`}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{b.kind === "review" ? `Review request · ${appName} users` : b.audience === "app" ? `${appName} users` : b.audience === "behind" ? `${appName} users on an older version` : "Everyone"}</span>
          {b.failed > 0 && (
            <button onClick={() => showFailed(b)} className="text-rose-300 hover:underline cursor-pointer">
              {b.failed} failed
            </button>
          )}
          <span className="text-slate-500">
            {when(b.createdAt)} by {b.createdBy}
          </span>
          <span className="ml-auto flex gap-1.5">
            {b.status === "sending" && live && (
              <button onClick={() => act(b, "pause")} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            )}
            {((b.status === "sending" && !live && !running) || b.status === "paused") && (
              <button onClick={() => (b.status === "paused" ? act(b, "resume") : run(b.id))} disabled={!!running} className={`${btn} bg-blue-600 hover:bg-blue-500 text-white`}>
                <Play className="w-3.5 h-3.5" /> Continue
              </button>
            )}
            {b.status !== "done" && (
              <button onClick={() => act(b, "cancel")} className={`${btn} text-rose-300 hover:bg-rose-500/10`}>
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            )}
          </span>
        </div>
        {b.status !== "done" && (
          <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
        {b.lastError && b.status !== "sending" && <p className="mt-1.5 text-amber-300/90 break-words">{b.lastError}</p>}
      </li>
    );
  };

  const unfold = (id: string) => setUnfolded((u) => (u.includes(id) ? u.filter((x) => x !== id) : [...u, id]));

  // A release: the newest one open, older ones folded to a line that opens on a tap
  const releaseItem = (rel: Release, app: App, newest: boolean) => {
    const open = rel.broadcasts.find((b) => b.status !== "done");
    const sentTo = rel.broadcasts.reduce((n, b) => n + b.sent, 0);
    const mailOk = !!data?.mail.configured;
    const status = open ? (open.status === "paused" ? "Email paused" : "Sending…") : sentTo ? `Emailed to ${sentTo}` : "Not emailed";
    if (!newest && !unfolded.includes(rel.id)) {
      return (
        <li key={rel.id}>
          <button
            onClick={() => unfold(rel.id)}
            aria-expanded={false}
            className="w-full flex items-center gap-3 px-5 py-3 text-left text-xs hover:bg-slate-800/40 cursor-pointer"
          >
            <span className="w-16 shrink-0 font-bold text-slate-200">{rel.version}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-slate-300">{rel.title || "No title"}</span>
              <span className="block text-slate-500">{day(rel.releasedAt)}</span>
            </span>
            <span className={`shrink-0 ${open ? "text-amber-300" : sentTo ? "text-emerald-300" : "text-slate-500"}`}>{status}</span>
            <ChevronDown className="w-4 h-4 shrink-0 text-slate-500" />
          </button>
        </li>
      );
    }
    return (
      <li key={rel.id} className={`px-5 py-4 ${newest ? "" : "bg-slate-950/30"}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-200 font-bold">{app.name} {rel.version}</span>
          {newest && <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">Newest</span>}
          {rel.version === app.current && !newest && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-semibold">On the download page</span>
          )}
          {rel.introduces && <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-200 font-semibold">Introduction email</span>}
          <span className="text-slate-500">{day(rel.releasedAt)}</span>
          {!newest && (
            <button onClick={() => unfold(rel.id)} aria-expanded className="ml-auto p-1 rounded text-slate-400 hover:text-white cursor-pointer" aria-label="Fold">
              <ChevronDown className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>
        <p className="mt-2 text-sm font-semibold text-white">{rel.title}</p>
        {rel.introduces ? (
          <p className="mt-1.5 text-[13px] text-slate-400">The introduction email: it says what {app.name} is and how to start, so it needs no &ldquo;what&apos;s new&rdquo;.</p>
        ) : rel.notes.trim() ? (
          <div className="mt-1.5">
            <NoteLines notes={rel.notes} limit={5} />
          </div>
        ) : (
          <p className="mt-1.5 text-[13px] text-amber-300/90">No &ldquo;what&apos;s new&rdquo; yet. Press Edit to add it before emailing.</p>
        )}

        {/* the emails sent about it, newest first */}
        {rel.broadcasts.length > 0 ? (
          <ul className="mt-3 space-y-2">{rel.broadcasts.map((b) => broadcastRow(b, app.name))}</ul>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Not emailed to anyone yet.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {!open && !rel.introduces && (
            <button
              onClick={() => setConfirming({ release: rel, who: "app" })}
              disabled={!mailOk || !!running}
              title="Choose who gets it on the next step"
              className={`${btn} bg-blue-600 hover:bg-blue-500 text-white`}
            >
              <Send className="w-3.5 h-3.5" /> {sentTo ? "Email again…" : "Email it…"}
            </button>
          )}
          <button onClick={() => showPreview(rel)} disabled={busy === `preview-${rel.id}`} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={() => sendTest(rel)} disabled={!mailOk || busy === `test-${rel.id}`} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
            {busy === `test-${rel.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Test to me
          </button>
          <button onClick={() => setEditing({ isNew: false, release: rel })} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => remove(rel, app.name)} disabled={!!open} className={`${btn} ml-auto text-rose-300 hover:bg-rose-500/10`}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </li>
    );
  };

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
        <Loader2 className="w-6 h-6 mx-auto animate-spin" />
      </div>
    );
  }
  if (!data) return null;
  const shown = appId ? data.groups.find((g) => g.app.id === appId) ?? null : null;
  const allReleases = data.groups.flatMap((g) =>
    g.releases.map((r) => ({
      id: r.id,
      app: g.app.id,
      appName: g.app.name,
      version: r.version,
      releasedAt: r.releasedAt,
      title: r.title,
      notes: r.notes,
      sent: r.broadcasts.reduce((n, b) => n + b.sent, 0),
      sending: r.broadcasts.some((b) => b.status !== "done"),
    }))
  );
  const editById = (id: string) => {
    const rel = data.groups.flatMap((g) => g.releases).find((r) => r.id === id);
    if (rel) setEditing({ isNew: false, release: rel });
  };

  return (
    <div className="space-y-6">
      {/* Email and audience: on the overview; an app's page only warns when email isn't set up */}
      {shown && !data.mail.configured && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Email isn&apos;t set up, so nothing can be sent. Add SMTP_HOST, SMTP_USER and SMTP_PASS in Vercel, then redeploy.
        </p>
      )}
      {!shown && (
        <div className="flex flex-wrap items-stretch gap-2">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] ${
              data.mail.configured ? "border-slate-800 bg-slate-900/60 text-slate-300" : "border-amber-500/40 bg-amber-500/10 text-amber-200"
            }`}
            title={
              data.mail.configured
                ? `Gmail sends about 500 emails a day (2,000 with Google Workspace). A send that reaches the limit pauses by itself; press Continue the next day.${
                    data.mail.freeMailbox ? " Emails to many people from a personal Gmail address often land in Spam; sending from your own domain fixes this." : ""
                  }`
                : "Add SMTP_HOST, SMTP_USER and SMTP_PASS in Vercel, then redeploy."
            }
          >
            <Mail className="w-4 h-4 shrink-0" />
            {data.mail.configured ? (
              <span>
                Sends from <b className="text-white break-all">{data.mail.from}</b>
              </span>
            ) : (
              <span>
                <b>Email isn&apos;t set up</b>: add SMTP_HOST, SMTP_USER and SMTP_PASS in Vercel
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[13px] text-slate-300" title="Each app's releases go only to the people who use it">
            <Users className="w-4 h-4 shrink-0" />
            <span>
              <b className="text-white tabular-nums">{data.audience.everyone.toLocaleString()}</b> {data.audience.everyone === 1 ? "account" : "accounts"}
            </span>
          </div>
          <button
            onClick={() => setTab("optouts")}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[13px] text-slate-300 hover:border-slate-600 cursor-pointer"
            title="They pressed Stop release emails in an email, so they're left out"
          >
            <Megaphone className="w-4 h-4 shrink-0" />
            <span>
              <b className="text-white tabular-nums">{data.audience.optedOut}</b> stopped release emails
            </span>
          </button>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            aria-label="Refresh"
            className="ml-auto self-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      {/* every app: its versions; then every release, the emails sent and who stopped them, one at a time */}
      {!shown && (
        <>
          <VersionBoard adminFetch={adminFetch} onToast={(m, t) => toast.current(m, t)} onShow={onShow} onImported={load} />
          <div>
            <div role="tablist" aria-label="Releases and emails" className="mb-3 inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1">
              {(
                [
                  ["releases", `Every release · ${allReleases.length}`],
                  ["emails", "Emails sent"],
                  ["optouts", `Stopped emails · ${data.audience.optedOut}`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${tab === id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "releases" && <ReleaseTimeline releases={allReleases} onShow={onShow} onEdit={editById} />}
            {tab === "emails" && <EmailHistory adminFetch={adminFetch} onToast={(m, t) => toast.current(m, t)} onRun={run} reloadKey={historyKey} />}
            {tab === "optouts" && <OptOuts adminFetch={adminFetch} onToast={(m, t) => toast.current(m, t)} onOpenAccount={onOpenAccount} onChanged={load} />}
          </div>
        </>
      )}

      {shown && [shown].map(({ app, users, releases, review, intro }) => (
        <section key={app.id} role="tabpanel" className="rounded-2xl border border-slate-800 bg-slate-900/40">
          <header className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-800">
            <div className="mr-auto">
              <h4 className="text-sm font-bold text-white">{app.name}</h4>
              <p className="text-xs text-slate-400">
                <span className="text-slate-200 font-semibold">{users}</span> {users === 1 ? "person has" : "people have"} downloaded or used it · on the site now:{" "}
                <span className="text-slate-200 font-semibold">{app.current}</span> · download page{" "}
                <a href={app.href} target="_blank" rel="noopener" className="text-blue-400 hover:underline">{app.href}</a>
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                load();
              }}
              aria-label="Refresh"
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            {app.github && (
              <button onClick={() => importGitHub(app)} disabled={busy === `import-${app.id}`} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                {busy === `import-${app.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Import from GitHub
              </button>
            )}
            <button
              onClick={() =>
                setEditing({
                  isNew: true,
                  release: { app: app.id, version: "", releasedAt: new Date().toISOString().slice(0, 10), title: "", notes: "", link: app.href, linkLabel: "" },
                })
              }
              className={`${btn} bg-blue-600 hover:bg-blue-500 text-white`}
            >
              <Plus className="w-3.5 h-3.5" /> Add release
            </button>
          </header>

          {/* Next step: the one thing to do now, worked out from the releases and who has updated */}
          {(() => {
            const newest = releases[0] ?? null;
            const v = versionsOf[app.id];
            const introRel = intro?.releaseId ? releases.find((r) => r.id === intro.releaseId) ?? null : null;
            const sending = newest?.broadcasts.find((b) => b.status !== "done");
            const sentTo = newest ? newest.broadcasts.reduce((n, b) => n + b.sent, 0) : 0;
            const mailOk = data.mail.configured && !running;
            const addNew = (version: string) =>
              setEditing({
                isNew: true,
                release: { app: app.id, version, releasedAt: new Date().toISOString().slice(0, 10), title: "", notes: "", link: app.href, linkLabel: "" },
              });
            let tone: "todo" | "done" = "todo";
            let title: string;
            let text: string;
            let action: React.ReactNode = null;
            const go = (label: string, onClick: () => void, disabled = false) => (
              <button onClick={onClick} disabled={disabled} className={`${btn} px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white`}>
                {label} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            );
            if (!newest) {
              title = "Add the first release";
              text = app.github ? "Import the versions from GitHub, or add one by hand." : "Add the version that's on the download page now.";
              action = app.github ? go("Import from GitHub", () => importGitHub(app), busy === `import-${app.id}`) : go("Add release", () => addNew(app.current));
            } else if (sending) {
              title = sending.status === "paused" ? `The email about ${newest.version} is paused` : `Sending ${newest.version}…`;
              text = `${sending.sent + sending.failed} of ${sending.total} done. Press Continue on the release below to carry on; nobody gets it twice.`;
            } else if (intro && !introRel) {
              title = `Introduce ${app.name} to everyone`;
              text = "Make the one-time introduction email, check it, then send it.";
              action = go("Create the introduction email", () => createIntro(app), busy === `intro-${app.id}`);
            } else if (introRel && !introRel.broadcasts.some((b) => b.sent > 0)) {
              title = `Introduce ${app.name} to everyone`;
              text = `The introduction email is ready for ${introRel.notYetAll} ${introRel.notYetAll === 1 ? "person" : "people"}. Look at the preview, then send it.`;
              action = go("Email everyone", () => setConfirming({ release: introRel, who: "all" }), !mailOk || introRel.notYetAll === 0);
            } else if (v && compareVersionsLoose(v.latest, newest.version) > 0) {
              title = `Add release ${v.latest}`;
              text = `${app.name} ${v.latest} is out, but the newest release here is ${newest.version}. Add it, with what's new, so you can email people about it.`;
              action = app.github ? go("Import from GitHub", () => importGitHub(app), busy === `import-${app.id}`) : go(`Add release ${v.latest}`, () => addNew(v.latest));
            } else if (!newest.introduces && !newest.notes.trim()) {
              title = `Write what's new in ${newest.version}`;
              text = "The email lists the changes, so add them first.";
              action = go("Edit release", () => setEditing({ isNew: false, release: newest }));
            } else if (!sentTo) {
              title = `Email ${newest.version} to ${app.name} users`;
              text = `${users} ${users === 1 ? "person has" : "people have"} downloaded or used ${app.name}. You choose who gets it on the next step.`;
              action = go("Email it", () => setConfirming({ release: newest, who: "app" }), !mailOk);
            } else if (v && v.behind > 0) {
              title = `Remind the ${v.behind} on an older version`;
              text = `${newest.version} went to ${sentTo} ${sentTo === 1 ? "person" : "people"}, but ${v.behind} still ${v.behind === 1 ? "has" : "have"} an older copy (listed below).`;
              action = go(`Email the ${v.behind}`, () => setConfirming({ release: newest, who: "behind" }), !mailOk);
            } else {
              tone = "done";
              title = "All done";
              text = `${newest.version} went to ${sentTo} ${sentTo === 1 ? "person" : "people"}${v ? ", and everyone we know of is up to date" : ""}. Next time there's a new version, add it here.`;
            }
            return (
              <div className={`mx-4 mt-4 sm:mx-5 rounded-xl border px-4 py-3 ${tone === "done" ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-blue-500/40 bg-blue-500/[0.08]"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="mr-auto min-w-0 max-w-xl">
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${tone === "done" ? "text-emerald-300" : "text-blue-300"}`}>
                      {tone === "done" ? <CheckCircle2 className="inline w-3.5 h-3.5 -mt-0.5 mr-1" /> : null}Next step
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{text}</p>
                  </div>
                  {action}
                </div>
              </div>
            );
          })()}

          {/* A new program: introduce it to everyone */}
          {intro && (() => {
            const rel = releases.find((r) => r.id === intro.releaseId) ?? null;
            const sent = rel?.broadcasts.some((b) => b.sent > 0) ?? false;
            const open = rel?.broadcasts.find((b) => b.status !== "done");
            return (
              <div className="px-5 py-4 border-b border-slate-800 bg-amber-400/[0.06]">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="mr-auto max-w-xl">
                    <p className="flex items-center gap-2 text-sm font-bold text-white">
                      <PartyPopper className="w-4 h-4 text-amber-300" /> Introduce {app.name} to everyone
                      {sent && <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px]">Sent</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      A one-time email to everyone with an account: what {app.name} is, what it does and how to start, with a Download button. Later
                      releases send the usual update email.
                    </p>
                    {rel ? (
                      <p className="mt-1 text-[12px] text-slate-300">
                        &ldquo;{rel.title}&rdquo; · version {rel.version}
                        {!sent && <> · <span className="text-slate-400">{rel.notYetAll} to send to</span></>}
                      </p>
                    ) : (
                      <p className="mt-1 text-[12px] text-slate-300">&ldquo;{intro.title}&rdquo;</p>
                    )}
                    {!data.mail.configured && (
                      <p className="mt-1 text-[12px] text-amber-300">Email isn&apos;t set up yet (Settings → System health), so it can&apos;t be sent.</p>
                    )}
                    {intro.announce && (() => {
                      const live = !!notice && notice.active && notice.text === intro.announce && (!notice.endsAt || notice.endsAt >= new Date().toISOString().slice(0, 10));
                      return (
                        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2">
                          <p className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-slate-200">
                            <Megaphone className="w-3.5 h-3.5 text-emerald-300" /> On the website
                            {live && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px]">
                                Showing{notice?.endsAt ? ` until ${day(notice.endsAt)}` : ""}
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[12px] text-slate-400">
                            A green bar along the bottom of every page, linking to {app.href}: &ldquo;{intro.announce}&rdquo;. Visitors can close it. Change or stop it in
                            Settings → Notices.
                          </p>
                          {!live && notice?.active && notice.text && notice.text !== intro.announce && (
                            <p className="mt-1 text-[12px] text-amber-300">This replaces the announcement showing now: &ldquo;{notice.text}&rdquo;</p>
                          )}
                          {!live &&
                            (announcing === app.id ? (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-[12px] text-slate-300">Show it for two weeks?</span>
                                <button onClick={() => announce(app, intro.announce!)} disabled={busy === `announce-${app.id}`} className={`${btn} bg-emerald-500 hover:bg-emerald-400 text-slate-950`}>
                                  {busy === `announce-${app.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Yes, show it
                                </button>
                                <button onClick={() => setAnnouncing(null)} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setAnnouncing(app.id)} className={`${btn} mt-2 bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                                <Megaphone className="w-3.5 h-3.5" /> Show on the website
                              </button>
                            ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!rel ? (
                      <button onClick={() => createIntro(app)} disabled={busy === `intro-${app.id}`} className={`${btn} bg-amber-400 hover:bg-amber-300 text-slate-950`}>
                        {busy === `intro-${app.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Create the introduction email
                      </button>
                    ) : (
                      <>
                        <button onClick={() => showPreview(rel)} disabled={busy === `preview-${rel.id}`} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button onClick={() => sendTest(rel)} disabled={!data.mail.configured || busy === `test-${rel.id}`} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                          {busy === `test-${rel.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Send test to me
                        </button>
                        <button onClick={() => setEditing({ isNew: false, release: rel })} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        {!open && sent && (
                          <button
                            onClick={() => setConfirming({ release: rel, who: "all" })}
                            disabled={!data.mail.configured || !!running || rel.notYetAll === 0}
                            className={`${btn} bg-amber-400 hover:bg-amber-300 text-slate-950`}
                          >
                            <Send className="w-3.5 h-3.5" /> Send to the rest ({rel.notYetAll})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* the newest release, open */}
          {releases.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">No releases yet. Add one{app.github ? ", or import them from GitHub" : ""}.</p>
          ) : (
            <ul className="border-b border-slate-800">{releaseItem(releases[0], app, true)}</ul>
          )}

          {/* Who has the newest version, and emailing the ones who don't */}
          <WhoUpdated
            key={`who-${app.id}-${historyKey}`}
            adminFetch={adminFetch}
            app={app}
            newest={releases[0] ?? null}
            canSend={data.mail.configured && !running}
            onEmail={(rel) => setConfirming({ release: rel, who: "behind" })}
            onAddRelease={(version) =>
              setEditing({
                isNew: true,
                release: { app: app.id, version, releasedAt: new Date().toISOString().slice(0, 10), title: "", notes: "", link: app.href, linkLabel: "" },
              })
            }
            onOpenAccount={onOpenAccount}
            onLoaded={(v) => setVersionsOf((m) => (m[app.id]?.latest === v.latest && m[app.id]?.behind === v.behind ? m : { ...m, [app.id]: v }))}
          />

          {/* older releases, one line each */}
          {releases.length > 1 && (() => {
            const older = releases
              .slice(1)
              .filter((rel) => (filter === "unsent" ? !rel.broadcasts.some((b) => b.sent > 0) : filter === "nonotes" ? !rel.notes.trim() : true))
              .filter((rel) => !q.trim() || `${rel.version} ${rel.title} ${rel.notes}`.toLowerCase().includes(q.trim().toLowerCase()));
            return (
              <div className="border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2 px-5 pt-4 pb-2">
                  <p className="mr-auto text-xs font-bold uppercase tracking-wider text-slate-400">Older releases ({releases.length - 1})</p>
                  {releases.length > 4 && (
                    <>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Version or words"
                  aria-label={`Search ${app.name} releases`}
                  className="w-52 max-w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div role="group" aria-label="Show" className="flex gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
                {(
                  [
                    ["all", "All"],
                    ["unsent", "Not emailed"],
                    ["nonotes", "No notes"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    aria-pressed={filter === k}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer ${filter === k ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
                    </>
                  )}
                </div>
                {older.length === 0 ? (
                  <p className="px-5 pb-4 text-xs text-slate-500">None match.</p>
                ) : (
                  <ul className="divide-y divide-slate-800/70">{older.map((rel) => releaseItem(rel, app, false))}</ul>
                )}
              </div>
            );
          })()}

          {/* Ask the app's users for a review */}
          <div className="px-5 py-4 border-b border-slate-800 bg-amber-500/[0.04]">
            <div className="flex flex-wrap items-start gap-3">
              <div className="mr-auto">
                <p className="flex items-center gap-2 text-sm font-bold text-white">
                  <Star className="w-4 h-4 text-amber-400" /> Ask for reviews
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  <span className="text-slate-200 font-semibold">{review.reviewed}</span> {review.reviewed === 1 ? "review" : "reviews"} so far ·{" "}
                  <span className="text-slate-200 font-semibold">{review.toAsk}</span> of the {users} {users === 1 ? "user hasn't" : "users haven't"} reviewed it ·{" "}
                  <span className="text-slate-200 font-semibold">{review.notAskedYet}</span> never asked
                </p>
                <p className="mt-0.5 text-[11.5px] text-slate-500">
                  An email with five star links; each opens the review form set to that rating. Reviews wait in Admin → Reviews until you publish them.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => reviewPreview(app)} disabled={busy === `rpreview-${app.id}`} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button onClick={() => reviewTest(app)} disabled={!data.mail.configured || busy === `rtest-${app.id}`} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                  {busy === `rtest-${app.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Send test to me
                </button>
                {!review.broadcasts.some((b) => b.status !== "done") && (
                  <button
                    onClick={() => setAsking(app.id)}
                    disabled={!data.mail.configured || !!running || review.toAsk === 0}
                    className={`${btn} bg-amber-500 hover:bg-amber-400 text-slate-950`}
                  >
                    <Send className="w-3.5 h-3.5" /> Ask {review.toAsk} {review.toAsk === 1 ? "person" : "people"}
                  </button>
                )}
              </div>
            </div>
            {review.broadcasts.length > 0 && <ul className="mt-3 space-y-2">{review.broadcasts.map((b) => broadcastRow(b, app.name))}</ul>}
          </div>

        </section>
      ))}

      {editing && (
        <ReleaseForm
          apps={data.groups.map((g) => g.app)}
          initial={editing.release}
          isNew={editing.isNew}
          adminFetch={adminFetch}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            toast.current(msg);
            load();
          }}
          onError={(m) => toast.current(m, "error")}
          onPreview={setPreview}
        />
      )}

      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} />}

      {asking && (() => {
        const g = data.groups.find((x) => x.app.id === asking)!;
        return (
          <ConfirmReviews
            appName={g.app.name}
            toAsk={g.review.toAsk}
            notAskedYet={g.review.notAskedYet}
            busy={busy === `rstart-${g.app.id}`}
            onClose={() => setAsking(null)}
            onStart={(onlyNew) => startReviews(g.app, onlyNew)}
          />
        );
      })()}

      {confirming && (
        <ConfirmBroadcast
          adminFetch={adminFetch}
          release={confirming.release}
          initialWho={confirming.who}
          appName={data.groups.find((g) => g.app.id === confirming.release.app)?.app.name || confirming.release.app}
          appUsers={data.groups.find((g) => g.app.id === confirming.release.app)?.users ?? 0}
          everyone={data.audience.everyone}
          onClose={() => setConfirming(null)}
          onStart={async (onlyNew, audience) => {
            const rel = confirming.release;
            setConfirming(null);
            const r = await adminFetch(`/api/admin/releases/${rel.id}/broadcast`, json({ confirm: true, onlyNew, audience }));
            if (!r.ok) return toast.current(await errorOf(r), "error");
            const { broadcastId } = await r.json();
            await load();
            run(broadcastId);
          }}
          onPreview={() => showPreview(confirming.release)}
        />
      )}

      {failed && (
        <Modal title="Couldn't be reached" onClose={() => setFailed(null)}>
          {failed.list.length === 0 ? (
            <p className="text-sm text-slate-400">None.</p>
          ) : (
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto text-xs">
              {failed.list.map((f) => (
                <li key={f.email} className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                  <p className="font-semibold text-slate-200 break-all">{f.email}</p>
                  {f.error && <p className="text-slate-400 break-words">{f.error}</p>}
                </li>
              ))}
            </ul>
          )}
          {failed.list.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button onClick={() => retryFailed(failed.id)} disabled={!!running || busy === `retry-${failed.id}`} className={`${btn} px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white`}>
                {busy === `retry-${failed.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Send again to these {failed.list.length}
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

