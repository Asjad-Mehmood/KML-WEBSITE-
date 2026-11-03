"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Monitor, ShieldCheck } from "lucide-react";

type Browser = { id: string; label: string; ipAddress: string | null; createdAt: string; lastUsedAt: string; current: boolean };
type Info = { otpActive: boolean; otpAvailable?: boolean; forcedOff?: boolean; email: string; browsers: Browser[] };

// Admin → Settings → Security: the switch for two-factor sign-in (the emailed code),
// and the browsers that skip the code. The switch is part of the settings draft and
// takes effect with the panel's Save, like every other setting.
export default function SignInSecurity({
  adminFetch,
  twoFactor,
  savedTwoFactor,
  onTwoFactor,
}: {
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  /** the switch as drawn (the unsaved draft) */
  twoFactor: boolean;
  /** the switch as saved, which is what sign-in uses */
  savedTwoFactor: boolean;
  onTwoFactor: (on: boolean) => void;
}) {
  const [info, setInfo] = useState<Info | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminFetch("/api/admin/trusted-browsers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInfo(d))
      .catch(() => {});
  }, [adminFetch]);
  // again after a save that changed the switch, so the status below follows it
  useEffect(() => {
    load();
  }, [load, savedTwoFactor]);

  const forget = async (id?: string) => {
    const what = id ? "this browser" : "every trusted browser";
    if (!confirm(`Forget ${what}? ${id ? "It" : "They"} will ask for an emailed code the next time you sign in.`)) return;
    setBusy(true);
    try {
      const r = await adminFetch(`/api/admin/trusted-browsers${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method: "DELETE" });
      const d = await r.json().catch(() => null);
      if (r.ok && d) setInfo((i) => (i ? { ...i, browsers: d.browsers } : i));
    } finally {
      setBusy(false);
    }
  };

  if (!info) return null;
  // older servers don't send otpAvailable: the code could be sent whenever it was active
  const canSend = info.otpAvailable ?? info.otpActive;
  const pending = twoFactor !== savedTwoFactor;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <label className={`flex items-center justify-between gap-4 ${canSend ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
        <span className="flex items-start gap-3 min-w-0">
          {info.otpActive ? (
            <ShieldCheck className="w-5 h-5 mt-0.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-400 shrink-0" />
          )}
          <span className="min-w-0">
            <span className="block text-sm font-bold text-white">Two-factor sign-in (emailed code)</span>
            <span className="block mt-1 text-xs text-slate-400">
              On: after the password, a browser that hasn&apos;t signed in to admin before must enter a 6-digit code emailed to{" "}
              <strong className="text-slate-200">{info.email}</strong>. Off: admin sign-in is password only.
            </span>
          </span>
        </span>
        <span className="relative inline-flex items-center shrink-0">
          <input
            type="checkbox"
            checked={canSend && twoFactor}
            disabled={!canSend}
            onChange={(e) => onTwoFactor(e.target.checked)}
            className="sr-only peer"
            aria-label="Two-factor sign-in"
          />
          <span className="w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-emerald-600" />
        </span>
      </label>

      <p className={`mt-3 text-xs ${info.otpActive ? "text-emerald-300" : "text-amber-300"}`}>
        {!canSend ? (
          info.forcedOff ? (
            <>
              <strong>Off</strong>: switched off with ADMIN_OTP=off in Vercel. Remove that variable and redeploy to use this switch.
            </>
          ) : (
            <>
              <strong>Off</strong>: the code needs email. Set up SMTP_HOST, SMTP_USER and SMTP_PASS in Vercel and redeploy, then switch it on here.
            </>
          )
        ) : info.otpActive ? (
          <>
            <strong>On now.</strong> Browsers you trust skip the code for 90 days.
          </>
        ) : (
          <>
            <strong>Off now</strong>: admin sign-in is password only. Switch it on and save to ask for the code again.
          </>
        )}
        {pending && canSend && <span className="ml-1 text-blue-300">Save to {twoFactor ? "switch it on" : "switch it off"}.</span>}
      </p>

      {info.otpActive && (
        <div className="mt-4">
          {info.browsers.length === 0 ? (
            <p className="text-xs text-slate-500">No trusted browsers yet. Tick &ldquo;Trust this browser&rdquo; on the code step to add one.</p>
          ) : (
            <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
              {info.browsers.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Monitor className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-semibold text-slate-200">
                      {b.label}
                      {b.current && <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">This browser</span>}
                    </p>
                    <p className="text-slate-500">
                      Last used {new Date(b.lastUsedAt).toLocaleString()}
                      {b.ipAddress ? ` · IP ${b.ipAddress}` : ""}
                    </p>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => forget(b.id)}
                    className="text-xs font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50 cursor-pointer"
                  >
                    Forget
                  </button>
                </li>
              ))}
            </ul>
          )}
          {info.browsers.length > 1 && (
            <button disabled={busy} onClick={() => forget()} className="mt-3 text-xs font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-50 cursor-pointer">
              Forget all browsers
            </button>
          )}
        </div>
      )}
    </div>
  );
}
