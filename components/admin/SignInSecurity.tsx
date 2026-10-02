"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Monitor, ShieldCheck } from "lucide-react";

type Browser = { id: string; label: string; ipAddress: string | null; createdAt: string; lastUsedAt: string; current: boolean };
type Info = { otpActive: boolean; email: string; browsers: Browser[] };

// Admin → Settings: the emailed sign-in code and the browsers that skip it
export default function SignInSecurity({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminFetch("/api/admin/trusted-browsers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInfo(d))
      .catch(() => {});
  }, [adminFetch]);
  useEffect(() => {
    load();
  }, [load]);

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
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start gap-3">
        {info.otpActive ? (
          <ShieldCheck className="w-5 h-5 mt-0.5 text-emerald-400 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-400 shrink-0" />
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white">Sign-in security</h3>
          {info.otpActive ? (
            <p className="mt-1 text-xs text-slate-400">
              A browser that hasn&apos;t signed in to admin before must enter a 6-digit code emailed to <strong className="text-slate-200">{info.email}</strong>.
              Browsers you trust skip the code for 90 days.
            </p>
          ) : (
            <p className="mt-1 text-xs text-amber-300">
              The email code is <strong>off</strong>: sign-in is password only. It turns on by itself once email is set up (SMTP_HOST, SMTP_USER and SMTP_PASS
              in Vercel, then redeploy).
            </p>
          )}
        </div>
      </div>

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
