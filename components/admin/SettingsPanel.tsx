"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  History,
  Loader2,
  Megaphone,
  RotateCcw,
  Save,
  ShieldCheck,
  Server,
  UserPlus,
  Wrench,
  Waypoints,
  Compass,
} from "lucide-react";
import SignInSecurity from "./SignInSecurity";
import SystemHealth from "./SystemHealth";
import AppSourceStatus from "./AppSourceStatus";
import CleanupCard from "./CleanupCard";

export interface AllSettings {
  appVersion: string;
  installerFileName: string;
  installerFileSize: string;
  requireAuthForDownload: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementBanner: string;
  announcementActive: boolean;
  announcementTone: "info" | "success" | "warning";
  announcementLink: string;
  announcementEndsAt: string;
  allowSignups: boolean;
  googleSignInEnabled: boolean;
  traverseEnabled: boolean;
  tlEnabled: boolean;
  tlMessage: string;
  tlSharing: boolean;
  tlKeepFiles: boolean;
  tlMaxJobs: number;
  tlBlocked: string;
  signupPrompt: boolean;
  reviewPrompt: boolean;
}

type Draft = AllSettings;
type Change = { id: string; by: string | null; changes: string | null; at: string };
type AdminFetch = (url: string, options?: RequestInit) => Promise<Response>;

const toDraft = (s: AllSettings): Draft => ({ ...s });

const SECTIONS = [
  ["status", "Status"],
  ["access", "Access"],
  ["notices", "Notices"],
  ["features", "App features"],
  ["traverse", "Traverse & Level"],
  ["release", "Release"],
  ["security", "Security"],
  ["system", "System"],
  ["history", "History"],
] as const;

const DEFAULT_TL_CLOSED = "Traverse & Level is closed for maintenance. Your jobs are safe; please try again later.";

const DEFAULT_MAINTENANCE = "The web app is down for maintenance for a short while. The Windows app works as usual.";

// Admin → Settings: everything the admin can switch for the whole site, saved
// together with one bar that appears when something has changed
export default function SettingsPanel({
  adminFetch,
  onToast,
  onSaved,
}: {
  adminFetch: AdminFetch;
  onToast: (message: string, type?: "success" | "error") => void;
  onSaved?: (s: AllSettings) => void;
}) {
  const [saved, setSaved] = useState<AllSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [history, setHistory] = useState<Change[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    adminFetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load the settings."))))
      .then((d) => {
        setSaved(d.settings);
        setDraft(toDraft(d.settings));
        setHistory(d.history || []);
      })
      .catch((e) => setLoadError((e as Error).message));
  }, [adminFetch]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const changedKeys = useMemo(() => {
    if (!saved || !draft) return [];
    return (Object.keys(draft) as (keyof AllSettings)[]).filter((k) => saved[k] !== draft[k]);
  }, [saved, draft]);
  const dirty = changedKeys.length > 0;

  // Leaving the page with unsaved changes asks first
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const onHealth = useCallback((h: { checks: { id: string; ok: boolean }[] }) => {
    setGoogleConfigured(h.checks.find((c) => c.id === "google")?.ok ?? null);
  }, []);

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
        {loadError}{" "}
        <button onClick={load} className="underline font-semibold cursor-pointer">
          Try again
        </button>
      </div>
    );
  }
  if (!saved || !draft) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 p-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading settings…
      </div>
    );
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = async () => {
    if (draft.announcementActive && !draft.announcementBanner.trim()) {
      onToast("Write the announcement text before switching it on.", "error");
      return;
    }
    setSaving(true);
    try {
      const r = await adminFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't save the settings.");
      setSaved(d.settings);
      setDraft(toDraft(d.settings));
      setHistory(d.history || []);
      onSaved?.(d.settings);
      onToast(d.changed ? `Saved ${d.changed} change${d.changed > 1 ? "s" : ""}. Live on the site within a minute.` : "Nothing changed");
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const announcementLive = saved.announcementActive && saved.announcementBanner.trim() && (!saved.announcementEndsAt || saved.announcementEndsAt >= today);

  return (
    <div className="max-w-4xl mx-auto w-full pb-28">
      {/* Section links */}
      <nav aria-label="Settings sections" className="sticky top-0 z-20 -mx-1 mb-6 px-1 py-2 bg-slate-950/90 backdrop-blur">
        <div className="flex gap-1.5 overflow-x-auto">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#settings-${id}`}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-6">
        {/* Status at a glance (what is live now, not the unsaved draft) */}
        <Section id="status" icon={CheckCircle2} title="Live now" text="What visitors see right now, from the saved settings.">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Pill label="Web app" value={saved.maintenanceMode ? "Maintenance" : "Running"} warn={saved.maintenanceMode} />
            <Pill label="Traverse & Level" value={saved.tlEnabled ? "Open" : "Closed"} warn={!saved.tlEnabled} />
            <Pill label="Traverse adjust" value={saved.traverseEnabled ? "Shown" : "Hidden"} warn={!saved.traverseEnabled} />
            <Pill label="New sign-ups" value={saved.allowSignups ? "Open" : "Paused"} warn={!saved.allowSignups} />
            <Pill label="Downloads" value={saved.requireAuthForDownload ? "Sign-in needed" : "Open to all"} />
            <Pill label="Announcement" value={announcementLive ? "Showing" : "Off"} />
          </div>
        </Section>

        {/* Access */}
        <Section id="access" icon={UserPlus} title="Access" text="Who can create accounts, sign in with Google and download.">
          <Toggle
            label="Allow new sign-ups"
            text="Off: the sign-up form and Google stop creating accounts. People who already have one still sign in."
            checked={draft.allowSignups}
            onChange={(v) => set("allowSignups", v)}
            tone="emerald"
          />
          <Toggle
            label="Continue with Google"
            text={
              googleConfigured === false
                ? "Google isn't set up yet (see System health), so the button stays hidden even when this is on."
                : "Shows the Google button on sign-in and sign-up. Off: hidden, and Google sign-in is refused."
            }
            checked={draft.googleSignInEnabled}
            onChange={(v) => set("googleSignInEnabled", v)}
            tone="emerald"
          />
          <Toggle
            label="Invite visitors to sign up"
            text="Signed-out visitors who look around (3 pages, a minute on the site, reading most of a page or using a tool) see a small card inviting them to create a free account. Shown at most once a visit; Not now hides it for a week."
            checked={draft.signupPrompt}
            onChange={(v) => set("signupPrompt", v)}
            tone="emerald"
          />
          <Toggle
            label="Ask for a review after a download"
            text="After someone downloads one of our programs they are asked for a star rating and a comment, and again a few days later if they haven't answered. Reviews wait in Admin → Reviews until you publish them."
            checked={draft.reviewPrompt}
            onChange={(v) => set("reviewPrompt", v)}
            tone="emerald"
          />
          <Toggle
            label="Sign-in needed to download"
            text="On: visitors sign in or create an account before the Windows download starts. Off: it starts straight away."
            checked={draft.requireAuthForDownload}
            onChange={(v) => set("requireAuthForDownload", v)}
          />
        </Section>

        {/* App features: sections of the app the admin can show or hide */}
        <Section id="features" icon={Waypoints} title="App features" text="Sections of the app you can show or hide, in the web app and the Windows and phone apps.">
          <Toggle
            label="Traverse adjust"
            text="On: Control points, Traverse and Level run show in the app's side panel. Off: none of them show anywhere in the app; work already typed is kept and comes back when it is turned on. The web app follows on its next open or refresh; the Windows and phone apps when they next start online."
            checked={draft.traverseEnabled}
            onChange={(v) => set("traverseEnabled", v)}
            tone="emerald"
          />
        </Section>

        {/* Traverse & Level app */}
        <Section
          id="traverse"
          icon={Compass}
          title="Traverse & Level app"
          text="The Traverse & Level web app and Windows program. Changes reach open apps the next time they start or save. Block single accounts in Admin → Traverse & Level."
        >
          <Toggle
            label="Traverse & Level open"
            text="Off: signed-in users see the message below instead of their jobs and tools, and nothing can be saved or shared. Jobs already kept stay in the accounts."
            checked={draft.tlEnabled}
            onChange={(v) => set("tlEnabled", v)}
            tone="emerald"
          />
          <Field label="Message while closed" hint="Leave empty for the standard text.">
            <input value={draft.tlMessage} maxLength={300} onChange={(e) => set("tlMessage", e.target.value)} placeholder={DEFAULT_TL_CLOSED} className={inputCls} />
          </Field>
          <Toggle
            label="Sharing jobs"
            text="On: users can share a job with a colleague's email. Off: the Share button is hidden; jobs already shared stay shared."
            checked={draft.tlSharing}
            onChange={(v) => set("tlSharing", v)}
            tone="emerald"
          />
          <Toggle
            label="Keep copies of files"
            text="On: every CSV opened in the app and every PDF report, CSV and KML it exports is kept in the user's account (Dashboard → Files) and in Admin → Files. Off: only the activity line is recorded."
            checked={draft.tlKeepFiles}
            onChange={(v) => set("tlKeepFiles", v)}
            tone="emerald"
          />
          <Field label="Jobs per account" hint="From 1 to 5000. Accounts over the limit keep their jobs but can't add new ones.">
            <input
              type="number"
              min={1}
              max={5000}
              value={draft.tlMaxJobs}
              onChange={(e) => set("tlMaxJobs", Math.max(1, Math.min(5000, Math.round(Number(e.target.value) || 1))))}
              className={`${inputCls} max-w-[160px]`}
            />
          </Field>
        </Section>

        {/* Notices */}
        <Section id="notices" icon={Megaphone} title="Notices" text="Maintenance and the announcement bar along the bottom of the site.">
          <Toggle
            label="Maintenance mode"
            text="Pauses the web app for everyone except admins and shows the maintenance message on the site. The Windows app is not affected."
            checked={draft.maintenanceMode}
            onChange={(v) => set("maintenanceMode", v)}
            tone="amber"
          />
          <Field label="Maintenance message" hint="Leave empty for the standard text.">
            <input
              value={draft.maintenanceMessage}
              maxLength={300}
              onChange={(e) => set("maintenanceMessage", e.target.value)}
              placeholder={DEFAULT_MAINTENANCE}
              className={inputCls}
            />
          </Field>

          <div className="pt-4 mt-2 border-t border-slate-800 space-y-4">
            <Toggle
              label="Show announcement"
              text="A bar along the bottom of every public page. Visitors can close it; it comes back when the text changes."
              checked={draft.announcementActive}
              onChange={(v) => set("announcementActive", v)}
            />
            <Field label="Announcement text">
              <input
                value={draft.announcementBanner}
                maxLength={300}
                onChange={(e) => set("announcementBanner", e.target.value)}
                placeholder="e.g. Version 4.3 is out: sign in with Google in the Windows app"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Colour" group>
                <div className="flex gap-1.5">
                  {(
                    [
                      ["info", "Blue", "bg-[#0071e3]"],
                      ["success", "Green", "bg-emerald-600"],
                      ["warning", "Amber", "bg-amber-400"],
                    ] as const
                  ).map(([v, name, sw]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set("announcementTone", v)}
                      aria-pressed={draft.announcementTone === v}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                        draft.announcementTone === v ? "border-blue-500 bg-slate-800 text-white" : "border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${sw}`} /> {name}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Link (optional)" hint="A page like /whats-new or an https:// address">
                <input value={draft.announcementLink} maxLength={300} onChange={(e) => set("announcementLink", e.target.value)} placeholder="/whats-new" className={inputCls} />
              </Field>
              <Field label="Hide after (optional)" hint="The bar disappears by itself after this day">
                <input type="date" value={draft.announcementEndsAt} min={today} onChange={(e) => set("announcementEndsAt", e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
              </Field>
            </div>
            {/* Preview */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Preview</p>
              <div
                className={`rounded-xl px-4 py-2.5 text-center text-[13px] font-medium ${
                  draft.maintenanceMode || draft.announcementTone === "warning"
                    ? "bg-amber-50 text-amber-900"
                    : draft.announcementTone === "success"
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0071e3] text-white"
                } ${!draft.maintenanceMode && !draft.announcementActive ? "opacity-40" : ""}`}
              >
                {draft.maintenanceMode ? (
                  <>
                    <Wrench className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" /> {draft.maintenanceMessage.trim() || DEFAULT_MAINTENANCE}
                  </>
                ) : (
                  <>
                    <Megaphone className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
                    {draft.announcementBanner.trim() || "Your announcement text"}
                    {draft.announcementLink.trim() && <span className="ml-2 underline font-semibold">Learn more</span>}
                  </>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {draft.maintenanceMode
                  ? "Maintenance takes the bar's place while it is on."
                  : draft.announcementActive
                    ? "Shown on the site after you save."
                    : "Switched off: nothing is shown."}
              </p>
            </div>
          </div>
        </Section>

        {/* Release */}
        <Section id="release" icon={Download} title="Release details" text="Shown on the download section until the latest GitHub release loads; GitHub's details win when it answers.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Version">
              <input value={draft.appVersion} maxLength={30} onChange={(e) => set("appVersion", e.target.value)} className={inputCls} placeholder="v4.3.0" />
            </Field>
            <Field label="Installer file" hint="Ends in .exe; used for the download link">
              <input value={draft.installerFileName} maxLength={120} onChange={(e) => set("installerFileName", e.target.value)} className={`${inputCls} font-mono text-xs`} />
            </Field>
            <Field label="Installer size">
              <input value={draft.installerFileSize} maxLength={20} onChange={(e) => set("installerFileSize", e.target.value)} className={inputCls} placeholder="3.2 MB" />
            </Field>
          </div>
        </Section>

        {/* Security */}
        <Section id="security" icon={ShieldCheck} title="Security" text="Admin sign-in from new browsers.">
          <SignInSecurity adminFetch={adminFetch} />
        </Section>

        {/* System */}
        <Section id="system" icon={Server} title="System" text="Setup checks, the web app's source and stored-file clean-up.">
          <SystemHealth adminFetch={adminFetch} onToast={onToast} onLoaded={onHealth} />
          <AppSourceStatus adminFetch={adminFetch} />
          <CleanupCard adminFetch={adminFetch} />
        </Section>

        {/* History */}
        <Section id="history" icon={History} title="Change history" text="The last 15 saves, with who changed what.">
          {history.length === 0 ? (
            <p className="text-xs text-slate-500">No changes recorded yet. Saves from now on are listed here.</p>
          ) : (
            <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
              {history.map((h) => (
                <li key={h.id} className="px-3 py-2.5 text-xs">
                  <p className="text-slate-400">
                    <span className="font-semibold text-slate-200">{h.by || "Unknown"}</span> · {new Date(h.at).toLocaleString()}
                  </p>
                  {h.changes && <p className="mt-1 whitespace-pre-line text-slate-300 font-mono text-[11px] leading-relaxed">{h.changes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Save bar: only while something has changed */}
      {dirty && (
        <div role="region" aria-label="Unsaved changes" className="fixed bottom-4 inset-x-4 z-40 flex justify-center">
          <div className="w-full max-w-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-blue-500/40 bg-slate-900/95 backdrop-blur px-4 py-3 shadow-2xl shadow-black/50">
            <p className="text-sm text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              {changedKeys.length} unsaved change{changedKeys.length > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDraft(toDraft(saved))}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Discard
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500";

function Section({
  id,
  icon: Icon,
  title,
  text,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`settings-${id}`} className="scroll-mt-16 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{text}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  text,
  checked,
  onChange,
  tone = "blue",
}: {
  label: string;
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  tone?: "blue" | "amber" | "emerald";
}) {
  const on = tone === "amber" ? "peer-checked:bg-amber-500" : tone === "emerald" ? "peer-checked:bg-emerald-600" : "peer-checked:bg-blue-600";
  return (
    <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 cursor-pointer">
      <span>
        <span className="block font-bold text-sm text-white">{label}</span>
        <span className="block text-xs text-slate-400">{text}</span>
      </span>
      <span className="relative inline-flex items-center shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
        <span
          className={`w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full ${on}`}
        />
      </span>
    </label>
  );
}

// A label wrapping its input; `group` for a set of buttons, which a label can't wrap
function Field({ label, hint, group, children }: { label: string; hint?: string; group?: boolean; children: React.ReactNode }) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className="block" {...(group ? { role: "group", "aria-label": label } : {})}>
      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</span>
      {children}
      {hint && <span className="block mt-1 text-[11px] text-slate-500">{hint}</span>}
    </Tag>
  );
}

function Pill({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${warn ? "border-amber-500/40 bg-amber-500/10" : "border-slate-800 bg-slate-800/40"}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-bold ${warn ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
