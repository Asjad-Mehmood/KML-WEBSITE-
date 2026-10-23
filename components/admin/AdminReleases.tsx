"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Mail,
  Megaphone,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Send,
  Square,
  Trash2,
  Users,
  X,
} from "lucide-react";

interface App {
  id: string;
  name: string;
  href: string;
  current: string;
  github?: string;
}
interface Broadcast {
  id: string;
  subject: string;
  status: "sending" | "paused" | "done";
  total: number;
  sent: number;
  failed: number;
  lastError: string | null;
  createdBy: string;
  /** app: people who use the app; all: everyone with an account */
  audience: "app" | "all";
  createdAt: string;
  finishedAt: string | null;
}
interface Release {
  id: string;
  app: string;
  version: string;
  releasedAt: string;
  title: string;
  notes: string;
  link: string;
  linkLabel: string;
  broadcasts: Broadcast[];
  /** Still to get it: the app's users, and everyone with an account */
  notYet: number;
  notYetAll: number;
}
interface Data {
  /** users: people who downloaded or used the app with their account */
  groups: { app: App; users: number; releases: Release[] }[];
  audience: { everyone: number; optedOut: number };
  mail: { configured: boolean; from: string };
}
type Fetch = (url: string, options?: RequestInit) => Promise<Response>;

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const errorOf = async (r: Response) => ((await r.json().catch(() => ({}))) as { error?: string }).error || `Request failed (${r.status})`;

const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const input = "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500";

// Admin → Releases: each app's versions, and emailing one to the people who use that app.
export default function AdminReleases({ adminFetch, onToast }: { adminFetch: Fetch; onToast: (message: string, type?: "success" | "error") => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ release: Partial<Release> & { app: string }; isNew: boolean } | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [confirming, setConfirming] = useState<{ release: Release; who: "app" | "all" } | null>(null);
  const [running, setRunning] = useState<string | null>(null); // broadcast id being sent from this page
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ id: string; list: { email: string; error: string | null }[] } | null>(null);
  const [tab, setTab] = useState<string | null>(null); // the app whose versions are shown
  const toast = useRef(onToast);
  useEffect(() => {
    toast.current = onToast;
  });
  const stopRef = useRef(false);

  const load = useCallback(
    () =>
      adminFetch("/api/admin/releases")
        .then(async (r) => {
          if (!r.ok) throw new Error(await errorOf(r));
          setData((await r.json()) as Data);
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

  // Ask for one batch after another until the broadcast is done or paused
  const run = useCallback(
    async (broadcastId: string) => {
      setRunning(broadcastId);
      stopRef.current = false;
      try {
        for (;;) {
          if (stopRef.current) break;
          const r = await adminFetch(`/api/admin/broadcasts/${broadcastId}`, json({ action: "send" }));
          if (!r.ok) throw new Error(await errorOf(r));
          const { broadcast } = (await r.json()) as { broadcast: Broadcast };
          setData((d) =>
            d && {
              ...d,
              groups: d.groups.map((g) => ({
                ...g,
                releases: g.releases.map((rel) => ({ ...rel, broadcasts: rel.broadcasts.map((b) => (b.id === broadcast.id ? broadcast : b)) })),
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
        }
      } catch (e) {
        toast.current((e as Error).message, "error");
      } finally {
        setRunning(null);
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
    toast.current(added || filled ? `${added} added, ${filled} filled in from GitHub` : "Nothing new on GitHub");
    load();
  };

  const showFailed = async (b: Broadcast) => {
    const r = await adminFetch(`/api/admin/broadcasts/${b.id}`);
    if (!r.ok) return toast.current(await errorOf(r), "error");
    setFailed({ id: b.id, list: (await r.json()).failed });
  };

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
        <Loader2 className="w-6 h-6 mx-auto animate-spin" />
      </div>
    );
  }
  if (!data) return null;
  const shown = data.groups.find((g) => g.app.id === tab) || data.groups[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Releases</h3>
          <p className="text-xs text-slate-400">
            Every version of each app. A release goes to the people who downloaded or used that app, new version or past; each email has a link to stop release emails.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          aria-label="Refresh"
          className="self-start sm:self-auto p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Email and audience */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`rounded-2xl border p-4 ${data.mail.configured ? "border-slate-800 bg-slate-900/60" : "border-amber-500/40 bg-amber-500/10"}`}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Mail className="w-4 h-4" /> Sends from
          </p>
          {data.mail.configured ? (
            <p className="mt-1.5 text-sm text-white break-all">{data.mail.from}</p>
          ) : (
            <p className="mt-1.5 text-sm text-amber-200">Email isn&apos;t set up. Add SMTP_HOST, SMTP_USER and SMTP_PASS in Vercel, then redeploy.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Users className="w-4 h-4" /> Accounts
          </p>
          <p className="mt-1.5 text-sm text-white">
            <b className="text-lg">{data.audience.everyone}</b> {data.audience.everyone === 1 ? "person" : "people"} with an account
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Each app&apos;s releases go only to the people who use it. The tab shows how many.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Megaphone className="w-4 h-4" /> Unsubscribed
          </p>
          <p className="mt-1.5 text-sm text-white">
            <b className="text-lg">{data.audience.optedOut}</b> stopped release emails
          </p>
          <p className="mt-0.5 text-xs text-slate-500">They pressed &ldquo;Stop release emails&rdquo; in an email, so they&apos;re left out.</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 -mt-3">
        Gmail sends about 500 emails a day (2,000 with Google Workspace). A broadcast that reaches the limit pauses by itself; press Continue the next day and it carries on
        with the people not reached yet.
      </p>

      {/* One tab per app; the selected app's versions below */}
      <div role="tablist" aria-label="Apps" className="flex gap-2 overflow-x-auto pb-1">
        {data.groups.map(({ app, releases }) => {
          const active = app.id === shown.app.id;
          const sending = releases.some((r) => r.broadcasts.some((b) => b.status !== "done"));
          return (
            <button
              key={app.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(app.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                active ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
              }`}
            >
              {app.name}
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] ${active ? "bg-white/20" : "bg-slate-800 text-slate-400"}`}>{releases.length}</span>
              {sending && <span className="w-2 h-2 rounded-full bg-amber-400" title="A broadcast isn't finished" />}
            </button>
          );
        })}
      </div>

      {[shown].map(({ app, users, releases }) => (
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

          {releases.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">No releases yet. Add one{app.github ? ", or import them from GitHub" : ""}.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {releases.map((rel) => {
                const open = rel.broadcasts.find((b) => b.status !== "done");
                const sentBefore = rel.broadcasts.some((b) => b.sent > 0);
                const notes = rel.notes.split("\n").filter(Boolean);
                return (
                  <li key={rel.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-200 font-bold">{app.name} {rel.version}</span>
                      {rel.version === app.current && <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">Latest</span>}
                      <span className="text-slate-500">{day(rel.releasedAt)}</span>
                      {!rel.broadcasts.length && <span className="ml-auto text-slate-500">Not sent yet</span>}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">{rel.title}</p>
                    {notes.length ? (
                      <ul className="mt-1.5 space-y-0.5 text-[13px] text-slate-300 list-disc pl-5">
                        {notes.slice(0, 5).map((n, i) => (
                          <li key={i} className="break-words">{n}</li>
                        ))}
                        {notes.length > 5 && <li className="list-none -ml-5 text-slate-500">and {notes.length - 5} more</li>}
                      </ul>
                    ) : (
                      <p className="mt-1.5 text-[13px] text-amber-300/90">No &ldquo;what&apos;s new&rdquo; yet. Edit to add it before sending.</p>
                    )}

                    {/* Broadcast history, newest first */}
                    {rel.broadcasts.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {rel.broadcasts.map((b) => {
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
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{b.audience === "app" ? `${app.name} users` : "Everyone"}</span>
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
                        })}
                      </ul>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => showPreview(rel)} disabled={busy === `preview-${rel.id}`} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                      <button onClick={() => sendTest(rel)} disabled={!data.mail.configured || busy === `test-${rel.id}`} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                        {busy === `test-${rel.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Send test to me
                      </button>
                      {!open && (
                        <>
                          <button
                            onClick={() => setConfirming({ release: rel, who: "app" })}
                            disabled={!data.mail.configured || !!running}
                            title={`People who downloaded or used ${app.name} with their account`}
                            className={`${btn} bg-blue-600 hover:bg-blue-500 text-white`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            {sentBefore ? "Send again" : "Send"} to {app.name} users ({users})
                          </button>
                          <button
                            onClick={() => setConfirming({ release: rel, who: "all" })}
                            disabled={!data.mail.configured || !!running}
                            title="Everyone with an account, also people who haven't used this app"
                            className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}
                          >
                            <Users className="w-3.5 h-3.5" /> Send to all users ({data.audience.everyone})
                          </button>
                        </>
                      )}
                      <button onClick={() => setEditing({ isNew: false, release: rel })} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => remove(rel, app.name)} disabled={!!open} className={`${btn} ml-auto text-rose-300 hover:bg-rose-500/10`}>
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
        />
      )}

      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} />}

      {confirming && (
        <ConfirmBroadcast
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
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ReleaseForm({
  apps,
  initial,
  isNew,
  adminFetch,
  onClose,
  onSaved,
  onError,
}: {
  apps: App[];
  initial: Partial<Release> & { app: string };
  isNew: boolean;
  adminFetch: Fetch;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [f, setF] = useState({
    app: initial.app,
    version: initial.version || "",
    releasedAt: (initial.releasedAt || new Date().toISOString()).slice(0, 10),
    title: initial.title || "",
    notes: initial.notes || "",
    link: initial.link || apps.find((a) => a.id === initial.app)?.href || "/",
    linkLabel: initial.linkLabel || "",
  });
  const [saving, setSaving] = useState(false);
  const app = apps.find((a) => a.id === f.app);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await adminFetch(isNew ? "/api/admin/releases" : `/api/admin/releases/${initial.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setSaving(false);
    if (!r.ok) return onError(await errorOf(r));
    onSaved(isNew ? "Release added" : "Release saved");
  };

  const label = "block text-xs font-semibold text-slate-300 mb-1";
  return (
    <Modal title={isNew ? "Add a release" : `Edit ${app?.name || ""} ${initial.version}`} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={label} htmlFor="rel-app">App</label>
            <select
              id="rel-app"
              value={f.app}
              onChange={(e) => {
                const a = apps.find((x) => x.id === e.target.value);
                setF({ ...f, app: e.target.value, link: f.link === app?.href ? a?.href || f.link : f.link });
              }}
              className={input}
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="rel-version">Version</label>
            <input id="rel-version" required value={f.version} onChange={set("version")} placeholder={app?.current || "3.4"} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="rel-date">Release date</label>
            <input id="rel-date" type="date" required value={f.releasedAt} onChange={set("releasedAt")} className={input} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="rel-title">Headline (also the email subject)</label>
          <input id="rel-title" value={f.title} onChange={set("title")} maxLength={150} placeholder={`${app?.name || "App"} ${f.version || "x.y"} is out`} className={input} />
        </div>
        <div>
          <label className={label} htmlFor="rel-notes">What&apos;s new, one item per line</label>
          <textarea
            id="rel-notes"
            value={f.notes}
            onChange={set("notes")}
            rows={8}
            placeholder={"The full corridor: lanes, median, sidewalks, drains and utilities\nEdit the radius later: RDER changes any curve after the road is built"}
            className={`${input} font-mono text-[13px] leading-relaxed`}
          />
          <p className="mt-1 text-[11px] text-slate-500">Start a line with a short title and a colon (&ldquo;Paver hatch: …&rdquo;) to show the title in bold.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="rel-link">Download link</label>
            <input id="rel-link" required value={f.link} onChange={set("link")} placeholder="/roadpro" className={input} />
            <p className="mt-1 text-[11px] text-slate-500">A page on this site (/roadpro) or an https:// address.</p>
          </div>
          <div>
            <label className={label} htmlFor="rel-label">Button text</label>
            <input id="rel-label" value={f.linkLabel} onChange={set("linkLabel")} maxLength={60} placeholder={`Download ${app?.name || "the app"} ${f.version || ""}`.trim()} className={input} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={`${btn} px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200`}>Cancel</button>
          <button type="submit" disabled={saving} className={`${btn} px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white`}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {isNew ? "Add release" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PreviewModal({ preview, onClose }: { preview: { subject: string; html: string; text: string }; onClose: () => void }) {
  const [plain, setPlain] = useState(false);
  return (
    <Modal title="Email preview" onClose={onClose} wide>
      <p className="text-xs text-slate-400">Subject</p>
      <p className="text-sm font-semibold text-white mb-3">{preview.subject}</p>
      <div className="flex gap-1 p-1 mb-3 rounded-xl bg-slate-950 border border-slate-800 w-max">
        {[["Email", false], ["Plain text", true]].map(([l, v]) => (
          <button key={String(l)} onClick={() => setPlain(v as boolean)} className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${plain === v ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
            {l as string}
          </button>
        ))}
      </div>
      {plain ? (
        <pre className="whitespace-pre-wrap break-words rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs text-slate-200 max-h-[60vh] overflow-y-auto">{preview.text}</pre>
      ) : (
        <iframe title="Email preview" sandbox="" srcDoc={preview.html} className="w-full h-[60vh] rounded-xl bg-white" />
      )}
      <p className="mt-2 text-[11px] text-slate-500">Shown addressed to you. Each person gets their own name and their own unsubscribe link.</p>
    </Modal>
  );
}

function ConfirmBroadcast({
  release,
  initialWho,
  appName,
  appUsers,
  everyone,
  onClose,
  onStart,
  onPreview,
}: {
  release: Release;
  initialWho: "app" | "all";
  appName: string;
  appUsers: number;
  everyone: number;
  onClose: () => void;
  onStart: (onlyNew: boolean, audience: "app" | "all") => void;
  onPreview: () => void;
}) {
  const sentBefore = release.broadcasts.some((b) => b.sent > 0);
  const [who, setWho] = useState<"app" | "all">(initialWho);
  const [onlyNew, setOnlyNew] = useState(false);
  const [checked, setChecked] = useState(false);
  const count = who === "app" ? (onlyNew ? release.notYet : appUsers) : onlyNew ? release.notYetAll : everyone;
  return (
    <Modal title={`Send ${appName} ${release.version}`} onClose={onClose}>
      <p className="text-sm text-slate-300">
        Subject: <span className="font-semibold text-white">{release.title}</span>
      </p>
      <fieldset className="mt-4 space-y-2 text-sm">
        <legend className="text-xs font-semibold text-slate-400 mb-1">Who gets it</legend>
        <label className="flex items-start gap-2 text-slate-200 cursor-pointer">
          <input type="radio" checked={who === "app"} onChange={() => setWho("app")} className="mt-1" />
          <span>
            {appName} users ({appUsers})
            <span className="block text-xs text-slate-500">People who downloaded or used {appName} with their account</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-slate-200 cursor-pointer">
          <input type="radio" checked={who === "all"} onChange={() => setWho("all")} className="mt-1" />
          <span>
            All users: everyone with an account ({everyone})
            <span className="block text-xs text-slate-500">Also people who haven&apos;t tried {appName}, e.g. to announce a new app</span>
          </span>
        </label>
      </fieldset>
      {sentBefore && (
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} /> Skip people who already got this release
        </label>
      )}
      {!release.notes.trim() && (
        <p className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-200">
          This release has no &quot;What&apos;s new&quot; notes, so the email only says the version is out. Edit it first to add some.
        </p>
      )}
      <div className="mt-4 rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-300">
        <b className="text-white">{count}</b> {count === 1 ? "person" : "people"} will get this email, one by one. People who stopped release emails are left out.
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm text-slate-200 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5" />
        <span>
          I&apos;ve checked the{" "}
          <button type="button" onClick={onPreview} className="text-blue-400 hover:underline cursor-pointer">preview</button>
          {" "}(or a test email). This can&apos;t be unsent.
        </span>
      </label>
      <p className="mt-3 text-xs text-slate-500">Keep this page open while it sends. If you close it, press Continue later: nobody gets it twice.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={`${btn} px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200`}>Cancel</button>
        <button onClick={() => onStart(onlyNew, who)} disabled={!checked || count === 0} className={`${btn} px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white`}>
          <Send className="w-3.5 h-3.5" /> Send to {count}
        </button>
      </div>
    </Modal>
  );
}
