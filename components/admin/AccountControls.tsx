"use client";

// Admin → Surveyors → an account → Controls: block or unblock sign-in, sign out of every device,
// send a password reset email, make or remove an admin, and save all the account's data.
// Each action asks first, says what happened, and goes into the Admin log
// (app/api/admin/users/[id]/control).
import { useCallback, useEffect, useRef, useState } from "react";
import { Ban, CheckCircle2, FileJson, KeyRound, Loader2, LogOut, ShieldCheck, ShieldOff } from "lucide-react";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;

interface State {
  blocked: boolean;
  reason: string;
  blockedBy: string;
  blockedAt: string | null;
  sessions: number;
  isAdmin: boolean;
  self: boolean;
  owner: boolean;
}

export default function AccountControls({
  userId,
  email,
  adminFetch,
  onToast,
  onChanged,
  allData,
}: {
  userId: string;
  email: string;
  adminFetch: Fetcher;
  onToast: (message: string, type?: "success" | "error") => void;
  onChanged: () => void;
  /** everything the window loaded about the account, for "Save all data" */
  allData: unknown;
}) {
  const [s, setS] = useState<State | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  // the window makes a new fetcher on every render: read it from a ref, so this loads once per account
  const fetcher = useRef(adminFetch);
  const toast = useRef(onToast);
  useEffect(() => {
    fetcher.current = adminFetch;
    toast.current = onToast;
  });
  const read = useCallback(
    () =>
      fetcher.current(`/api/admin/users/${encodeURIComponent(userId)}/control`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => (j.success ? setS(j as State) : toast.current(j.error || "Couldn't read the controls.", "error")))
        .catch(() => toast.current("Couldn't read the controls.", "error")),
    [userId]
  );
  useEffect(() => {
    void read();
  }, [read]);

  const run = async (action: string, ask: string) => {
    if (!confirm(ask)) return;
    setBusy(action);
    try {
      const r = await adminFetch(`/api/admin/users/${encodeURIComponent(userId)}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return onToast(j.error || "That didn't work.", "error");
      setS((old) => (old ? { ...old, ...j } : j));
      setReason("");
      onToast(j.message || "Done", "success");
      onChanged();
    } finally {
      setBusy(null);
    }
  };

  const saveAll = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${email.replace(/[^a-z0-9@._-]/gi, "_")}-all-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!s) {
    return (
      <div className="py-10 flex justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  const box = "p-5 rounded-2xl bg-slate-800/40 border border-slate-800";
  const btn = "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const spin = (a: string) => (busy === a ? <Loader2 className="w-4 h-4 animate-spin" /> : null);
  const lockedNote = s.self ? "This is your own account." : s.owner ? "This is the site's own admin account." : "";

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* where the account stands */}
      <div className={`${box} grid sm:grid-cols-3 gap-3`}>
        <Fact label="Sign-in" value={s.blocked ? "Blocked" : "Allowed"} tone={s.blocked ? "red" : "green"} />
        <Fact label="Signed in now on" value={`${s.sessions} ${s.sessions === 1 ? "device or app" : "devices and apps"}`} />
        <Fact label="Role" value={s.isAdmin ? "Admin" : "Surveyor"} tone={s.isAdmin ? "amber" : undefined} />
      </div>

      {/* block */}
      <div className={box}>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Ban className="w-4 h-4 text-red-400" /> {s.blocked ? "This account is blocked" : "Block sign-in"}
        </h3>
        {s.blocked ? (
          <>
            <p className="mt-1 text-sm text-slate-300">
              Blocked {s.blockedAt ? new Date(s.blockedAt).toLocaleString() : ""} {s.blockedBy && `by ${s.blockedBy}`}.
              {s.reason && <span className="block mt-1 text-slate-400">Reason: {s.reason}</span>}
            </p>
            <button
              onClick={() => run("unblock", `Let ${email} sign in again?`)}
              disabled={!!busy}
              className={`${btn} mt-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300`}
            >
              {spin("unblock") ?? <CheckCircle2 className="w-4 h-4" />} Unblock
            </button>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-400">
              They are signed out everywhere at once (website, apps, Toolkit) and can&apos;t sign in until you unblock them. Their data stays.
            </p>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (only admins see it)"
              disabled={!!lockedNote}
              className="mt-3 w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
            <button
              onClick={() => run("block", `Block ${email}? They are signed out everywhere and can't sign in.`)}
              disabled={!!busy || !!lockedNote}
              className={`${btn} mt-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300`}
            >
              {spin("block") ?? <Ban className="w-4 h-4" />} Block account
            </button>
            {lockedNote && <p className="mt-2 text-xs text-slate-500">{lockedNote} It can&apos;t be blocked.</p>}
          </>
        )}
      </div>

      {/* sign-in and password */}
      <div className={`${box} grid sm:grid-cols-2 gap-4`}>
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <LogOut className="w-4 h-4 text-blue-400" /> Sign out everywhere
          </h3>
          <p className="mt-1 text-sm text-slate-400">Ends every session: browsers, Windows apps and the Toolkit. They can sign in again.</p>
          <button
            onClick={() => run("signout", `Sign ${email} out of all ${s.sessions} sessions?`)}
            disabled={!!busy || s.self || s.sessions === 0}
            className={`${btn} mt-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300`}
          >
            {spin("signout") ?? <LogOut className="w-4 h-4" />} Sign out ({s.sessions})
          </button>
        </div>
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" /> Password reset email
          </h3>
          <p className="mt-1 text-sm text-slate-400">Sends {email} a link to choose a new password. It works once, for an hour.</p>
          <button
            onClick={() => run("reset-email", `Email ${email} a password reset link?`)}
            disabled={!!busy}
            className={`${btn} mt-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300`}
          >
            {spin("reset-email") ?? <KeyRound className="w-4 h-4" />} Send reset link
          </button>
        </div>
      </div>

      {/* admin */}
      <div className={box}>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          {s.isAdmin ? <ShieldOff className="w-4 h-4 text-rose-400" /> : <ShieldCheck className="w-4 h-4 text-rose-400" />} Admin
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          {s.isAdmin
            ? "An admin sees and changes everything here. Removing admin gives back the job title they had and signs them out."
            : "An admin sees and changes everything in this Admin, including other people's accounts. Only for people you trust."}
        </p>
        {s.isAdmin ? (
          <button
            onClick={() => run("remove-admin", `Remove admin from ${email}? They are signed out.`)}
            disabled={!!busy || s.self || s.owner}
            className={`${btn} mt-3 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200`}
          >
            {spin("remove-admin") ?? <ShieldOff className="w-4 h-4" />} Remove admin
          </button>
        ) : (
          <button
            onClick={() => run("make-admin", `Make ${email} an admin? They will see and change everything in Admin.`)}
            disabled={!!busy}
            className={`${btn} mt-3 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300`}
          >
            {spin("make-admin") ?? <ShieldCheck className="w-4 h-4" />} Make admin
          </button>
        )}
        {s.isAdmin && lockedNote && <p className="mt-2 text-xs text-slate-500">{lockedNote} Its admin can&apos;t be removed here.</p>}
      </div>

      {/* data */}
      <div className={box}>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileJson className="w-4 h-4 text-emerald-400" /> All the account&apos;s data
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          One file with the profile, activity, downloads, files list, points, jobs and program versions, as this window shows them. For a request from the person, or a backup.
        </p>
        <button onClick={saveAll} className={`${btn} mt-3 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300`}>
          <FileJson className="w-4 h-4" /> Save as JSON
        </button>
      </div>
    </div>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: "red" | "green" | "amber" }) {
  const c = tone === "red" ? "text-red-300" : tone === "green" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : "text-white";
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${c}`}>{value}</p>
    </div>
  );
}
