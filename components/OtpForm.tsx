"use client";

import { useEffect, useId, useState } from "react";
import { MailCheck } from "lucide-react";
import { useAuth, type AuthResult } from "../context/AuthContext";

const RESEND_WAIT_S = 30;

// The 6-digit code that was emailed: the second step of an admin sign-in from a new browser,
// or a new account confirming its email address. Shown by the login and sign-up pages and the
// sign-in popup while useAuth().otp is set.
export default function OtpForm({ onSuccess }: { onSuccess: (result: Extract<AuthResult, { ok: true }>) => void }) {
  const { otp, verifyOtp, resendOtp, cancelOtp } = useAuth();
  const [code, setCode] = useState("");
  const [trust, setTrust] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_WAIT_S * 1000);
  const [now, setNow] = useState(() => Date.now());
  const codeId = useId();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  if (!otp) return null;
  const confirming = otp.kind === "email";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const result = await verifyOtp(code, trust);
    setBusy(false);
    if (result.ok) onSuccess(result);
    else {
      setError(result.error);
      setCode("");
    }
  };

  const resend = async () => {
    setError(null);
    setNotice(null);
    const result = await resendOtp();
    if (result.ok) {
      setNotice(`A new code is on its way to ${result.sentTo}.`);
      setResendAt(Date.now() + RESEND_WAIT_S * 1000);
      setNow(Date.now());
      setCode("");
    } else setError(result.error);
  };

  return (
    <form onSubmit={submit} className="space-y-4" aria-label={confirming ? "Confirm your email" : "Enter your sign-in code"}>
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
          <MailCheck className="w-6 h-6 text-blue-600" aria-hidden />
        </div>
        <h2 className="mt-3 text-lg font-extrabold text-slate-900">{confirming ? "Confirm your email" : "Check your email"}</h2>
        <p className="mt-1 text-[13px] text-slate-600">
          We sent a 6-digit code to <strong>{otp.sentTo}</strong>. It works for {confirming ? "24 hours" : "10 minutes"}.
        </p>
        {confirming && <p className="mt-1 text-[12px] text-slate-500">Not in your inbox? Look in Spam or Promotions.</p>}
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
          {notice}
        </div>
      )}

      <div>
        <label htmlFor={codeId} className="sr-only">
          6-digit code
        </label>
        <input
          id={codeId}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          pattern="\d{6}"
          maxLength={6}
          placeholder="000000"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-center text-2xl font-mono font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
      </div>

      {!confirming && (
        <label className="flex items-start gap-2 text-[13px] text-slate-700 cursor-pointer">
          <input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-600" />
          <span>
            Trust this browser for 90 days
            <span className="block text-[12px] text-slate-500">Only tick this on your own device. Next time it signs in without a code.</span>
          </span>
        </label>
      )}

      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all"
      >
        {busy ? "Checking…" : confirming ? "Confirm and continue" : "Verify and sign in"}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={cancelOtp} className="font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
          &larr; Back
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={wait > 0}
          className="font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
        >
          {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
        </button>
      </div>
    </form>
  );
}
