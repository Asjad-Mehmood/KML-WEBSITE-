"use client";

// Admin → Email: write an email and send it to one person, people picked from the accounts,
// everyone who uses an app, or every account (lib/customMail.ts, /api/admin/mail). Preview it,
// send yourself a test, see how many it reaches, then watch it go out (it carries on when this
// page is closed) with pause, resume and stop.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAIL_TEMPLATES, type MailTemplate } from "@/lib/mailTemplates";
import { releaseDraft, type ReleaseForMail } from "@/lib/releaseMailDraft";
import ReleasePicker from "./ReleasePicker";
import { CheckCircle2, Clock, Eye, Loader2, Mail, Pause, Play, RefreshCw, Search, Send, Square, User, Users, X, AppWindow, Globe2, FlaskConical } from "lucide-react";

type Audience = "one" | "selected" | "app" | "all" | "inactive";
const DAYS = [30, 60, 90, 180];
interface Person {
  id: string;
  name: string;
  email: string;
  emailState?: string;
}
interface MailRow {
  id: string;
  subject: string;
  audienceLabel: string;
  status: "sending" | "paused" | "done";
  total: number;
  sent: number;
  failed: number;
  lastError: string | null;
  createdBy: string;
  createdAt: string;
}

const APPS = [
  { id: "excel-to-kml", name: "Excel to KML" },
  { id: "traverse", name: "Traverse & Level" },
  { id: "slope", name: "Slope Calculator" },
  { id: "auto-draft", name: "Auto Drafting" },
  { id: "roadpro", name: "RoadPro" },
  { id: "folder-manager", name: "Project Folder Manager" },
  { id: "toolkit", name: "Survey Toolkit" },
];
const AUDIENCES: { id: Audience; label: string; Icon: typeof User }[] = [
  { id: "one", label: "One person", Icon: User },
  { id: "selected", label: "Pick people", Icon: Users },
  { id: "app", label: "Users of an app", Icon: AppWindow },
  { id: "all", label: "Everyone", Icon: Globe2 },
  { id: "inactive", label: "Not seen lately", Icon: Clock },
];

const field = "w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none";
const label = "mb-1.5 block text-xs font-semibold text-slate-300";

export default function AdminMail({
  adminFetch,
  onToast,
}: {
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onToast: (message: string, type?: "success" | "error") => void;
}) {
  const toast = useRef(onToast);
  useEffect(() => {
    toast.current = onToast;
  });

  // ---------------------------------------------------------------- who
  const [audience, setAudience] = useState<Audience>("one");
  const [app, setApp] = useState(APPS[0].id);
  const [days, setDays] = useState(60);
  const [picked, setPicked] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [reach, setReach] = useState<{ count: number; sample: { email: string; name: string }[] } | null>(null);
  const [reachError, setReachError] = useState<string | null>(null);

  useEffect(() => {
    if (audience !== "one" && audience !== "selected") return;
    const q = query.trim();
    if (q.length < 2) return;
    const t = window.setTimeout(async () => {
      setSearching(true);
      try {
        const r = await adminFetch(`/api/admin/users?query=${encodeURIComponent(q)}`);
        const j = await r.json();
        setFound(((j.users || []) as Person[]).slice(0, 12));
      } catch {
        setFound([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [query, audience, adminFetch]);

  const ids = useMemo(() => picked.map((p) => p.id), [picked]);
  const needsPick = (audience === "one" || audience === "selected") && !ids.length;
  const audienceBody = useMemo(() => ({ audience, userIds: audience === "one" ? ids.slice(0, 1) : ids, app, days }), [audience, ids, app, days]);

  // how many it reaches, as the choice changes
  useEffect(() => {
    if (needsPick) return;
    let live = true;
    (async () => {
      try {
        const r = await adminFetch("/api/admin/mail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "count", ...audienceBody }) });
        const j = await r.json();
        if (!live) return;
        if (!r.ok) {
          setReach(null);
          setReachError(j.error || "Couldn't count.");
        } else {
          setReach({ count: j.count, sample: j.sample });
          setReachError(null);
        }
      } catch {
        if (live) setReachError("Couldn't count.");
      }
    })();
    return () => {
      live = false;
    };
  }, [audienceBody, needsPick, adminFetch]);
  // shown only for the current choice
  const shownReach = needsPick ? null : reach;
  const shownReachError = needsPick ? null : reachError;
  const shownFound = query.trim().length >= 2 ? found : [];

  const pick = (p: Person) => {
    if (audience === "one") setPicked([p]);
    else setPicked((xs) => (xs.some((x) => x.id === p.id) ? xs.filter((x) => x.id !== p.id) : [...xs, p]));
    if (audience === "one") setQuery("");
  };

  // ---------------------------------------------------------------- what
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const draft = { subject, title, body, buttonLabel, buttonUrl };
  const [template, setTemplate] = useState("");
  const [pickingRelease, setPickingRelease] = useState(false);
  const fill = (id: string, d: { subject: string; title: string; body: string; buttonLabel: string; buttonUrl: string }) => {
    setTemplate(id);
    setSubject(d.subject);
    setTitle(d.title);
    setBody(d.body);
    setButtonLabel(d.buttonLabel);
    setButtonUrl(d.buttonUrl);
    setPreview(null);
  };
  // a template fills the email; what was typed is replaced only after a yes. New versions first
  // asks which release, and is filled from its notes
  const applyTemplate = (t: MailTemplate) => {
    const typed = subject.trim() || title.trim() || body.trim();
    if (typed && !window.confirm(`Replace what you wrote with "${t.label}"?`)) return;
    if (t.id === "update") {
      setPickingRelease(true);
      return;
    }
    fill(t.id, t);
    // "We miss you" is for the people not seen lately
    if (t.id === "missyou") setAudience("inactive");
  };
  const pickRelease = (r: ReleaseForMail) => {
    setPickingRelease(false);
    fill("update", releaseDraft(r));
    // "Users of an app" goes to the users of this program
    if (APPS.some((a) => a.id === r.app)) setApp(r.app);
    toast.current(`Filled from ${r.appName} ${r.version}'s release notes`, "success");
  };
  const [busy, setBusy] = useState<"" | "preview" | "test" | "send">("");
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const post = async (action: string, extra: object = {}) => {
    const r = await adminFetch("/api/admin/mail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, draft, ...extra }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "That didn't work.");
    return j;
  };

  const doPreview = async () => {
    setBusy("preview");
    try {
      setPreview(await post("preview"));
    } catch (e) {
      toast.current((e as Error).message, "error");
    } finally {
      setBusy("");
    }
  };
  const doTest = async () => {
    setBusy("test");
    try {
      const j = await post("test");
      toast.current(`A test copy went to ${j.sentTo}.`);
    } catch (e) {
      toast.current((e as Error).message, "error");
    } finally {
      setBusy("");
    }
  };
  const doSend = async () => {
    setBusy("send");
    setConfirming(false);
    try {
      const j = await post("send", audienceBody);
      toast.current(`Sending to ${j.mail?.total ?? 0} ${j.mail?.total === 1 ? "person" : "people"}.`);
      setSubject("");
      setTitle("");
      setBody("");
      setButtonLabel("");
      setButtonUrl("");
      setPicked([]);
      void loadList();
    } catch (e) {
      toast.current((e as Error).message, "error");
    } finally {
      setBusy("");
    }
  };

  // ---------------------------------------------------------------- sent
  const [mails, setMails] = useState<MailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const loadList = useCallback(async () => {
    try {
      const r = await adminFetch("/api/admin/mail");
      const j = await r.json();
      if (r.ok) setMails(j.mails || []);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);
  useEffect(() => {
    void loadList();
  }, [loadList]);
  // while one is going out, follow it
  const going = mails.some((m) => m.status === "sending");
  useEffect(() => {
    if (!going) return;
    const t = window.setInterval(() => void loadList(), 4000);
    return () => window.clearInterval(t);
  }, [going, loadList]);

  const control = async (id: string, action: "pause" | "resume" | "stop") => {
    if (action === "stop" && !window.confirm("Stop this email? Nobody else will get it.")) return;
    const r = await adminFetch("/api/admin/mail", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    if (!r.ok) toast.current("That didn't work.", "error");
    void loadList();
  };

  const canSend = subject.trim() && body.trim() && !needsPick && reach && reach.count > 0;

  return (
    <div className="space-y-5 pb-24 sm:space-y-6 sm:pb-0">
      <p className="text-xs leading-relaxed text-slate-400">
        It goes out in the background (closing this page doesn&apos;t stop it) and skips anyone who stopped our emails.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---------------- who ---------------- */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <p className="text-sm font-bold text-white">1. Who gets it</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {AUDIENCES.map(({ id, label: l, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setAudience(id);
                  if (id === "one") setPicked((p) => p.slice(0, 1));
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] sm:text-sm font-semibold cursor-pointer ${
                  audience === id ? "border-blue-500 bg-blue-600/15 text-white" : "border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden /> {l}
              </button>
            ))}
          </div>

          {(audience === "one" || audience === "selected") && (
            <div className="mt-4">
              {picked.length > 0 && (
                <ul className="mb-3 flex flex-wrap gap-1.5">
                  {picked.map((p) => (
                    <li key={p.id} className="flex items-center gap-1.5 rounded-full bg-blue-600/20 py-1 pl-3 pr-1 text-xs text-blue-100">
                      {p.name || p.email}
                      <button type="button" aria-label={`Remove ${p.email}`} onClick={() => setPicked((xs) => xs.filter((x) => x.id !== p.id))} className="rounded-full p-0.5 hover:bg-white/10 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={audience === "one" ? "Find the person: name or email" : "Find people to add: name or email"}
                  className={`${field} pl-9`}
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" aria-hidden />}
              </div>
              {shownFound.length > 0 && (
                <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800">
                  {shownFound.map((p) => {
                    const on = picked.some((x) => x.id === p.id);
                    return (
                      <li key={p.id}>
                        <button type="button" onClick={() => pick(p)} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm cursor-pointer ${on ? "bg-blue-600/15" : "hover:bg-slate-800/60"}`}>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${on ? "bg-blue-600 text-white" : "border border-slate-600"}`}>{on && <CheckCircle2 className="w-3.5 h-3.5" />}</span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-white">{p.name || "(no name)"}</span>
                            <span className="block truncate text-xs text-slate-400">
                              {p.email}
                              {p.emailState === "waiting" && " · email not confirmed"}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {audience === "app" && (
            <div className="mt-4">
              <label className={label} htmlFor="mail-app">
                The app
              </label>
              <select id="mail-app" value={app} onChange={(e) => setApp(e.target.value)} className={field}>
                {APPS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">Everyone who downloaded or used it with their account, as Releases counts them.</p>
            </div>
          )}

          {audience === "all" && <p className="mt-4 text-xs text-slate-400">Every account with a confirmed email.</p>}

          {audience === "inactive" && (
            <div className="mt-4">
              <label className={label} htmlFor="mail-days">
                Not seen for
              </label>
              <select id="mail-days" value={days} onChange={(e) => setDays(Number(e.target.value))} className={field}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d} days or more
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                Accounts with a confirmed email that haven&apos;t signed in, used a program or done any work in that time. Send it once in a while, not every week.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-xl bg-slate-950/60 px-4 py-3 text-sm" aria-live="polite">
            {shownReachError ? (
              <span className="text-rose-300">{shownReachError}</span>
            ) : shownReach ? (
              <>
                <span className="font-bold text-white">
                  Reaches {shownReach.count} {shownReach.count === 1 ? "person" : "people"}
                </span>
                {shownReach.sample.length > 0 && <span className="block truncate text-xs text-slate-500">{shownReach.sample.map((s) => s.email).join(", ")}{shownReach.count > shownReach.sample.length ? ", …" : ""}</span>}
                {shownReach.count === 0 && <span className="block text-xs text-slate-500">They stopped our emails, or have no valid address.</span>}
              </>
            ) : (
              <span className="text-slate-500">{audience === "one" ? "Choose the person." : "Pick people."}</span>
            )}
          </div>
        </section>

        {/* ---------------- what ---------------- */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <p className="text-sm font-bold text-white">2. The email</p>
          <div className="mt-3">
            <p className={label}>Start from a template</p>
            <div className="mt-1 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
              {MAIL_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left cursor-pointer ${
                    template === t.id ? "border-blue-500 bg-blue-600/15" : "border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <span className="block text-[13px] font-semibold text-white">{t.label}</span>
                  <span className="block text-[11.5px] text-slate-400">{t.hint}</span>
                </button>
              ))}
            </div>
            {template && template !== "blank" && /…/.test(subject + title + body) && (
              <p className="mt-1.5 text-[12px] text-amber-300">Fill in the … before you send.</p>
            )}
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <label className={label} htmlFor="mail-subject">Subject</label>
              <input id="mail-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} placeholder="e.g. Your Traverse jobs now sync to every PC" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="mail-title">
                Title in the email <span className="font-normal text-slate-500">(optional, the subject otherwise)</span>
              </label>
              <input id="mail-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="mail-body">Message</label>
              <textarea
                id="mail-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                maxLength={10000}
                placeholder={"It starts with \"Hi {name},\" by itself.\n\nA blank line starts a new paragraph. {name} is each person's first name."}
                className={`${field} resize-y leading-relaxed`}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="mail-btn">
                  Button text <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input id="mail-btn" value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} maxLength={40} placeholder="Open the Toolkit page" className={field} />
              </div>
              <div>
                <label className={label} htmlFor="mail-url">Button link</label>
                <input id="mail-url" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} maxLength={500} placeholder="/toolkit or https://…" className={field} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button type="button" disabled={!!busy} onClick={doPreview} className="inline-flex justify-center items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50 cursor-pointer">
              {busy === "preview" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Preview
            </button>
            <button type="button" disabled={!!busy} onClick={doTest} className="inline-flex justify-center items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50 cursor-pointer">
              {busy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />} <span className="sm:hidden">Test to me</span><span className="hidden sm:inline">Send me a test</span>
            </button>
            <button
              type="button"
              disabled={!!busy || !canSend}
              onClick={() => setConfirming(true)}
              className="ml-auto hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-40 cursor-pointer"
            >
              {busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send{shownReach?.count ? ` to ${shownReach.count}` : ""}
            </button>
          </div>
        </section>
      </div>

      {/* on a phone: who it reaches and Send, always at hand */}
      <div className="fixed inset-x-0 bottom-0 z-[70] flex items-center gap-3 border-t border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur sm:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="min-w-0 flex-1 text-xs">
          <p className="font-bold text-white truncate">{shownReach ? `Reaches ${shownReach.count} ${shownReach.count === 1 ? "person" : "people"}` : audience === "one" ? "Choose the person" : "Pick people"}</p>
          <p className="truncate text-slate-400">{subject.trim() || "No subject yet"}</p>
        </div>
        <button
          type="button"
          disabled={!!busy || !canSend}
          onClick={() => setConfirming(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 cursor-pointer"
        >
          {busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
        </button>
      </div>

      {/* ---------------- sent ---------------- */}
      <section>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">Sent</p>
          <button type="button" aria-label="Refresh" onClick={() => void loadList()} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {!loading && !mails.length && (
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
            <Mail className="mx-auto mb-2 h-7 w-7 text-slate-500" />
            Nothing sent yet.
          </div>
        )}
        <ul className="mt-3 space-y-2">
          {mails.map((m) => {
            const pct = m.total ? Math.round(((m.sent + m.failed) / m.total) * 100) : 0;
            return (
              <li key={m.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      m.status === "sending" ? "bg-blue-600 text-white" : m.status === "paused" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {m.status === "sending" ? "Sending" : m.status === "paused" ? "Paused" : "Done"}
                  </span>
                  <span className="text-slate-400">{m.audienceLabel}</span>
                  <span className="ml-auto text-slate-500">{new Date(m.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{m.subject}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full ${m.status === "paused" ? "bg-amber-500" : "bg-blue-500"} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  {m.sent} of {m.total} sent{m.failed ? ` · ${m.failed} failed` : ""}
                  {m.lastError && m.status !== "done" ? ` · ${m.lastError}` : ""}
                </p>
                {m.status !== "done" && (
                  <div className="mt-3 flex gap-2">
                    {m.status === "sending" ? (
                      <button type="button" onClick={() => void control(m.id, "pause")} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer">
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                    ) : (
                      <button type="button" onClick={() => void control(m.id, "resume")} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer">
                        <Play className="w-3.5 h-3.5" /> Resume
                      </button>
                    )}
                    <button type="button" onClick={() => void control(m.id, "stop")} className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 cursor-pointer">
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {pickingRelease && <ReleasePicker adminFetch={adminFetch} onPick={pickRelease} onClose={() => setPickingRelease(false)} />}

      {/* ---------------- preview ---------------- */}
      {preview && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 sm:p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-t-2xl sm:rounded-2xl bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
              <p className="truncate text-sm font-semibold text-white">{preview.subject}</p>
              <button type="button" aria-label="Close" onClick={() => setPreview(null)} className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe title="Email preview" sandbox="" srcDoc={preview.html} className="h-[82vh] sm:h-[65vh] w-full bg-white" />
          </div>
        </div>
      )}

      {/* ---------------- are you sure ---------------- */}
      {confirming && shownReach && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 sm:p-4" onClick={() => setConfirming(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-800 bg-slate-900 p-6" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-bold text-white">
              Send to {shownReach.count} {shownReach.count === 1 ? "person" : "people"}?
            </p>
            <p className="mt-2 text-sm text-slate-400">&ldquo;{subject}&rdquo; goes out now, in small batches. You can pause or stop it while it sends.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={() => void doSend()} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 cursor-pointer">
                <Send className="w-4 h-4" /> Send now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
