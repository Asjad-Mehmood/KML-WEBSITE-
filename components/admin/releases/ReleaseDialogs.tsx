"use client";

// The windows of Admin → Releases: the release form, the email preview and the send confirmations.
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, GitBranch, Link2, Loader2, Send, X } from "lucide-react";
import { NoteLines, Recipients } from "@/components/admin/ReleaseTools";
import { btn, errorOf, input, json, type App, type Fetch, type Release, type Who } from "@/components/admin/releases/shared";

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
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

export function ReleaseForm({
  apps,
  initial,
  isNew,
  adminFetch,
  onClose,
  onSaved,
  onError,
  onPreview,
}: {
  apps: App[];
  initial: Partial<Release> & { app: string };
  isNew: boolean;
  adminFetch: Fetch;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
  /** show the email as it would go out, before saving */
  onPreview: (p: { subject: string; html: string; text: string }) => void;
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
  const [tool, setTool] = useState<string | null>(null);
  const [linkState, setLinkState] = useState<{ ok: boolean; message: string; link: string } | null>(null);
  const app = apps.find((a) => a.id === f.app);

  // this version's title, notes and date from its release on GitHub
  const fillFromGitHub = async () => {
    if (!f.version.trim()) return onError("Type the version first.");
    if (f.notes.trim() && !confirm("Replace the notes you have with the ones on GitHub?")) return;
    setTool("github");
    const r = await adminFetch(`/api/admin/releases/tools?github=${encodeURIComponent(f.app)}&version=${encodeURIComponent(f.version.trim())}`);
    setTool(null);
    if (!r.ok) return onError(await errorOf(r));
    const { release: g } = await r.json();
    setF((x) => ({ ...x, notes: g.notes || x.notes, title: x.title.trim() ? x.title : g.title || x.title, releasedAt: g.releasedAt || x.releasedAt }));
    if (!g.notes) onError(`GitHub's v${g.version} has no notes to copy.`);
  };
  const checkLink = async () => {
    setTool("link");
    const r = await adminFetch(`/api/admin/releases/tools?link=${encodeURIComponent(f.link.trim())}`);
    setTool(null);
    const j = await r.json().catch(() => ({}));
    setLinkState({ ok: !!j.ok, message: j.message || j.error || "Couldn't check it", link: f.link.trim() });
  };
  const previewEmail = async () => {
    setTool("preview");
    const r = await adminFetch("/api/admin/releases/tools", json({ action: "preview", release: f }));
    setTool(null);
    if (!r.ok) return onError(await errorOf(r));
    onPreview(await r.json());
  };
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
            <span className="flex gap-1.5">
              <input id="rel-version" required value={f.version} onChange={set("version")} placeholder={app?.current || "3.4"} className={input} />
              {app?.github && (
                <button
                  type="button"
                  onClick={fillFromGitHub}
                  disabled={tool !== null}
                  title="Copy this version's title, notes and date from its release on GitHub"
                  className={`${btn} shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-200`}
                >
                  {tool === "github" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />} From GitHub
                </button>
              )}
            </span>
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
          {f.notes.trim() && (
            <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">How it reads ({f.notes.split("\n").filter((l) => l.trim()).length} items)</p>
              <NoteLines notes={f.notes} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="rel-link">Download link</label>
            <span className="flex gap-1.5">
              <input id="rel-link" required value={f.link} onChange={set("link")} placeholder="/roadpro" className={input} />
              <button type="button" onClick={checkLink} disabled={tool !== null || !f.link.trim()} className={`${btn} shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-200`}>
                {tool === "link" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />} Check
              </button>
            </span>
            {linkState && linkState.link === f.link.trim() ? (
              <p className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${linkState.ok ? "text-emerald-300" : "text-rose-300"}`}>
                {linkState.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} {linkState.message}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">A page on this site (/roadpro) or an https:// address.</p>
            )}
          </div>
          <div>
            <label className={label} htmlFor="rel-label">Button text</label>
            <input id="rel-label" value={f.linkLabel} onChange={set("linkLabel")} maxLength={60} placeholder={`Get ${app?.name || "the app"} ${f.version || ""}`.trim()} className={input} />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button type="button" onClick={previewEmail} disabled={tool !== null} className={`${btn} px-4 py-2 mr-auto bg-slate-800 hover:bg-slate-700 text-slate-200`}>
            {tool === "preview" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Preview the email
          </button>
          <button type="button" onClick={onClose} className={`${btn} px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200`}>Cancel</button>
          <button type="submit" disabled={saving} className={`${btn} px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white`}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {isNew ? "Add release" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function PreviewModal({ preview, onClose }: { preview: { subject: string; html: string; text: string }; onClose: () => void }) {
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

export function ConfirmBroadcast({
  adminFetch,
  release,
  initialWho,
  appName,
  appUsers,
  everyone,
  onClose,
  onStart,
  onPreview,
}: {
  adminFetch: Fetch;
  release: Release;
  initialWho: Who;
  appName: string;
  appUsers: number;
  everyone: number;
  onClose: () => void;
  onStart: (onlyNew: boolean, audience: Who) => void;
  onPreview: () => void;
}) {
  const sentBefore = release.broadcasts.some((b) => b.sent > 0);
  const [who, setWho] = useState<Who>(initialWho);
  const [onlyNew, setOnlyNew] = useState(false);
  const [checked, setChecked] = useState(false);
  // the people behind are counted by the server (Recipients below)
  const [behindCount, setBehindCount] = useState<number | null>(null);
  const count =
    who === "behind" ? behindCount ?? 0 : who === "app" ? (onlyNew ? release.notYet : appUsers) : onlyNew ? release.notYetAll : everyone;
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
          <input
            type="radio"
            checked={who === "behind"}
            onChange={() => {
              setBehindCount(null);
              setWho("behind");
            }}
            className="mt-1"
          />
          <span>
            {appName} users on an older version
            <span className="block text-xs text-slate-500">Only the people whose copy is older than the newest {appName}: a reminder to update</span>
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
          <input
            type="checkbox"
            checked={onlyNew}
            onChange={(e) => {
              if (who === "behind") setBehindCount(null);
              setOnlyNew(e.target.checked);
            }}
          />{" "}
          Skip people who already got this release
        </label>
      )}
      {!release.notes.trim() && (
        <p className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-200">
          This release has no &quot;What&apos;s new&quot; notes, so the email only says the version is out. Edit it first to add some.
        </p>
      )}
      <div className="mt-4 rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-300">
        <b className="text-white">{count}</b> {count === 1 ? "person" : "people"} will get this email, one by one. People who stopped release emails are left out.
        <Recipients adminFetch={adminFetch} releaseId={release.id} who={who} onlyNew={onlyNew} onCount={who === "behind" ? setBehindCount : undefined} />
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
        <button onClick={() => onStart(onlyNew, who)} disabled={!checked || count === 0 || (who === "behind" && behindCount === null)} className={`${btn} px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white`}>
          <Send className="w-3.5 h-3.5" /> Send to {count}
        </button>
      </div>
    </Modal>
  );
}

export function ConfirmReviews({
  appName,
  toAsk,
  notAskedYet,
  busy,
  onClose,
  onStart,
}: {
  appName: string;
  toAsk: number;
  notAskedYet: number;
  busy: boolean;
  onClose: () => void;
  onStart: (onlyNew: boolean) => void;
}) {
  const [onlyNew, setOnlyNew] = useState(notAskedYet > 0 && notAskedYet < toAsk);
  const count = onlyNew ? notAskedYet : toAsk;
  const choice = (on: boolean, title: string, n: number, text: string) => (
    <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${onlyNew === on ? "border-amber-500/60 bg-amber-500/10" : "border-slate-700"}`}>
      <input type="radio" name="review-who" checked={onlyNew === on} onChange={() => setOnlyNew(on)} className="mt-1" />
      <span>
        <span className="block text-sm font-semibold text-white">
          {title} <span className="text-slate-400 font-normal">({n})</span>
        </span>
        <span className="block text-xs text-slate-400">{text}</span>
      </span>
    </label>
  );
  return (
    <Modal title={`Ask ${appName} users for a review`} onClose={onClose}>
      <div className="space-y-3">
        {choice(false, "Everyone who hasn't reviewed it", toAsk, `People who downloaded or used ${appName} with their account and haven't written a review.`)}
        {choice(true, "Only people never asked", notAskedYet, "Leaves out anyone who got a review request for it before.")}
        <p className="text-xs text-slate-500">People who stopped our emails are left out. Each email has a link to stop them.</p>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>Cancel</button>
          <button onClick={() => onStart(onlyNew)} disabled={busy || count === 0} className={`${btn} bg-amber-500 hover:bg-amber-400 text-slate-950`}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send to {count} {count === 1 ? "person" : "people"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
