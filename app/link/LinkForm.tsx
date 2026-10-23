"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass, buttonClass } from "../../components/AuthShell";

// /link: type the code, see which app asked, then confirm.
export default function LinkForm({ email, initial }: { email: string; initial: string }) {
  const [code, setCode] = useState(initial ? `${initial.slice(0, 4)}-${initial.slice(4)}` : "");
  const [found, setFound] = useState<{ code: string; app: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const send = async (confirm: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/device/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, confirm }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/link?code=${code.replace(/[^A-Za-z0-9]/g, "")}`)}`);
        return;
      }
      if (!r.ok) throw new Error(d.error || "That didn't work. Please try again.");
      if (confirm) setDone(d.app || "The app");
      else setFound({ code: d.code, app: d.app });
    } catch (e) {
      setError((e as Error).message);
      setFound(null);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="text-center space-y-3" role="status">
        <p className="text-4xl" aria-hidden>✓</p>
        <p className="font-bold text-slate-900">{done} is signed in</p>
        <p className="text-sm text-slate-500">Go back to the app window: it opens your dashboard in a few seconds. You can close this page.</p>
      </div>
    );
  }

  if (found) {
    return (
      <div className="space-y-4">
        <p className="text-center text-sm text-slate-700">
          <strong>{found.app}</strong> asked to sign in as <strong>{email}</strong> with the code
        </p>
        <p className="text-center font-mono text-3xl font-bold tracking-[0.2em] text-slate-900">{found.code}</p>
        <button type="button" onClick={() => send(true)} disabled={busy} className={buttonClass}>
          {busy ? "Signing in…" : "Yes, sign it in"}
        </button>
        <button type="button" onClick={() => setFound(null)} className="w-full text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
          Not me, cancel
        </button>
        <p className="text-center text-xs text-slate-500">Only confirm a code you can see in your own app window right now.</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        send(false);
      }}
    >
      <label className="block">
        <span className="block text-xs font-bold text-slate-600 mb-1.5">Code from the app</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD-1234"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          className={`${inputClass} font-mono text-center text-xl tracking-[0.2em]`}
          autoFocus
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-rose-600 text-center">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || code.replace(/[^A-Za-z0-9]/g, "").length !== 8} className={buttonClass}>
        {busy ? "Checking…" : "Continue"}
      </button>
      <p className="text-center text-xs text-slate-500">Signed in here as {email}.</p>
    </form>
  );
}
