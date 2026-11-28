"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

// The Join button on /t/<code>; signed out, it asks to sign in or make an account first
export default function JoinTeam({ code }: { code: string }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const here = `/t/${encodeURIComponent(code)}`;
  const primary = "inline-block rounded-full bg-[#0071e3] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#0062c4] disabled:opacity-60 cursor-pointer";

  if (isLoading) return <div className="mt-8 h-12" aria-hidden />;
  if (!user)
    return (
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/login?next=${encodeURIComponent(here)}`} className={primary}>
          Sign in to join
        </Link>
        <Link href={`/signup/details?next=${encodeURIComponent(here)}`} className="inline-block rounded-full border border-slate-300 px-6 py-3 text-[15px] font-semibold text-slate-900 hover:bg-slate-50">
          Create a free account
        </Link>
      </div>
    );

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", code }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "You couldn't join. Try again.");
      router.push("/dashboard?team=joined#teams");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mt-8">
      <button type="button" onClick={() => void join()} disabled={busy} className={primary}>
        {busy ? "Joining…" : `Join as ${user.name || user.email}`}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
