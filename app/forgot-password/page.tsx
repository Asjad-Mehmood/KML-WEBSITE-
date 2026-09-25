"use client";

import React, { useState } from "react";
import AuthShell, { buttonClass, inputClass } from "../../components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setStatus(res.ok ? { ok: true, text: data.message } : { ok: false, text: data.error || "Something went wrong." });
    } catch {
      setStatus({ ok: false, text: "Network error. Please try again." });
    }
    setSubmitting(false);
  };

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your account email and we'll send you a link to choose a new one.">
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
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="fp-email" className="block text-xs font-bold text-slate-700 mb-1.5">Email address</label>
          <input
            id="fp-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={submitting} className={buttonClass}>
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
