"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, RefreshCw, XCircle } from "lucide-react";

type Check = { id: string; label: string; ok: boolean; detail: string; fix?: string };
type Health = { checks: Check[]; deployment: { site: string; environment: string; commit: string | null; message: string | null } };

// Admin → Settings → System: whether each part of the setup works, and a test email
export default function SystemHealth({
  adminFetch,
  onToast,
  onLoaded,
}: {
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onToast: (message: string, type?: "success" | "error") => void;
  onLoaded?: (h: Health) => void;
}) {
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setChecking(true);
    adminFetch("/api/admin/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Health | null) => {
        if (d) {
          setHealth(d);
          onLoaded?.(d);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [adminFetch, onLoaded]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const testEmail = async () => {
    setSending(true);
    try {
      const r = await adminFetch("/api/admin/health", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Sending failed");
      onToast(`Test email sent to ${d.to}. Check the inbox (and spam).`);
    } catch (e) {
      onToast((e as Error).message, "error");
    } finally {
      setSending(false);
    }
  };

  const problems = health?.checks.filter((c) => !c.ok).length ?? 0;
  const emailOk = health?.checks.find((c) => c.id === "email")?.ok;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white">System health</h4>
          <p className="mt-0.5 text-xs text-slate-400">
            {!health ? "Checking…" : problems ? `${problems} item${problems > 1 ? "s" : ""} need${problems > 1 ? "" : "s"} attention` : "Everything is set up"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={testEmail}
            disabled={sending || !emailOk}
            title={emailOk ? "Send a test email to your admin address" : "Set up email first"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Send test email
          </button>
          <button onClick={load} aria-label="Check again" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {health && (
        <>
          <ul className="mt-4 divide-y divide-slate-800 rounded-xl border border-slate-800">
            {health.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-3 py-2.5">
                {c.ok ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                )}
                <div className="min-w-0 text-xs">
                  <p className="font-semibold text-slate-200">{c.label}</p>
                  <p className={c.ok ? "text-slate-500" : "text-amber-300"}>{c.detail}</p>
                  {c.fix && <p className="mt-0.5 text-slate-400">Fix: {c.fix}</p>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">
            {health.deployment.site} · {health.deployment.environment}
            {health.deployment.commit && ` · build ${health.deployment.commit}`}
            {health.deployment.message && ` (${health.deployment.message})`}
          </p>
        </>
      )}
    </div>
  );
}
