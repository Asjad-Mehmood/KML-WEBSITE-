"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import AuthShell, { buttonClass, inputClass } from "../../components/AuthShell";

export default function ResetPasswordPage() {
  // ?token= from the emailed link; read on the client only
  const token = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("token"),
    () => null
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus({ ok: false, text: "The two passwords don't match." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      setStatus(res.ok ? { ok: true, text: data.message } : { ok: false, text: data.error || "Something went wrong." });
    } catch {
      setStatus({ ok: false, text: "Network error. Please try again." });
    }
    setSubmitting(false);
  };

  const done = status?.ok;

  return (
    <AuthShell title="Choose a new password" subtitle="At least 8 characters. You'll be signed out on all devices.">
      {status && (
        <div
          role="status"
          className={`mb-5 p-3 rounded-xl border text-xs font-semibold ${
            status.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {status.text}
        </div>
      )}

      {done ? (
        <Link href="/login" className={`${buttonClass} block text-center`}>Go to sign in</Link>
      ) : token === null ? (
        <p className="text-sm text-slate-600 text-center">
          This page needs the link from your reset email.{" "}
          <Link href="/forgot-password" className="font-bold text-blue-600 hover:text-blue-700">Request a new link</Link>
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="rp-new" className="block text-xs font-bold text-slate-700 mb-1.5">New password</label>
            <input id="rp-new" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="rp-confirm" className="block text-xs font-bold text-slate-700 mb-1.5">Repeat new password</label>
            <input id="rp-confirm" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? "Saving…" : "Save new password"}
          </button>
          {status && !status.ok && (
            <p className="text-center text-xs">
              <Link href="/forgot-password" className="font-bold text-blue-600 hover:text-blue-700">Request a new reset link</Link>
            </p>
          )}
        </form>
      )}
    </AuthShell>
  );
}
