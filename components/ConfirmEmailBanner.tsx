"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, MailWarning } from "lucide-react";

// Dashboard: an account whose email isn't confirmed (made before confirmation started) is
// asked to confirm it with a code, so we know the address is real and theirs
export default function ConfirmEmailBanner({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"ask" | "code" | "done">("ask");
  const [challenge, setChallenge] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/user/confirm-email", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "We couldn't send the email.");
      setChallenge(j.challenge);
      setSentTo(j.sentTo);
      setCode("");
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't send the email.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, code }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "That code didn't work.");
      setStep("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work.");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  if (step === "done") {
    return (
      <section role="status" className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 text-[13.5px] text-emerald-900">
        <MailCheck className="w-5 h-5 shrink-0" aria-hidden /> Thank you, your email is confirmed.
      </section>
    );
  }
  return (
    <section aria-labelledby="confirm-email-h" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <MailWarning className="w-5 h-5 mt-0.5 shrink-0 text-amber-700" aria-hidden />
          <div className="min-w-0">
            <h2 id="confirm-email-h" className="text-[14.5px] font-bold text-amber-950">Confirm your email</h2>
            <p className="text-[13px] text-amber-900/80 break-words">
              {step === "ask" ? (
                <>So you get password resets and program updates, confirm that {email} is yours. It takes a minute.</>
              ) : (
                <>We sent a 6-digit code to {sentTo}. Not in your inbox? Look in Spam.</>
              )}
            </p>
          </div>
        </div>
        {step === "ask" ? (
          <button onClick={send} disabled={busy} className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-[13px] font-semibold cursor-pointer">
            {busy ? "Sending…" : "Send me a code"}
          </button>
        ) : (
          <form onSubmit={confirm} className="shrink-0 flex items-center gap-2">
            <label htmlFor="confirm-email-code" className="sr-only">6-digit code</label>
            <input
              id="confirm-email-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              autoFocus
              className="w-[120px] px-3 py-2 rounded-xl border border-amber-300 bg-white text-center font-mono font-bold tracking-[0.3em] text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button type="submit" disabled={busy || code.length !== 6} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-[13px] font-semibold cursor-pointer">
              {busy ? "Checking…" : "Confirm"}
            </button>
          </form>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-rose-700">{error}</p>}
      {step === "code" && (
        <button onClick={send} disabled={busy} className="mt-2 text-[12.5px] font-semibold text-amber-800 hover:underline cursor-pointer">
          Send a new code
        </button>
      )}
    </section>
  );
}
