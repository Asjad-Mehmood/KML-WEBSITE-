"use client";

import { useState } from "react";
import { MailCheck, MailQuestion, MailWarning, Send, Undo2, Check } from "lucide-react";
import type { EmailStatus } from "@/lib/emailVerify";

const METHOD: Record<string, string> = {
  code: "with the emailed code",
  link: "with the emailed link",
  google: "by signing in with Google",
  reset: "by setting a password from the reset email",
  admin: "by an admin",
};
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Admin → user profile: whether the account's email is confirmed, with the actions for it */
export default function EmailConfirmPanel({
  userId,
  status,
  isAdmin,
  fetcher,
  onChanged,
  onToast,
}: {
  userId: string;
  status: EmailStatus | null;
  isAdmin: boolean;
  fetcher: (url: string, options?: RequestInit) => Promise<Response>;
  onChanged: (s: EmailStatus | null) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const act = async (action: "confirm" | "unconfirm" | "send") => {
    setBusy(action);
    try {
      const r = await fetcher(`/api/admin/users/${userId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "That didn't work.");
      onChanged(j.emailStatus ?? null);
      onToast(action === "send" ? "Confirmation email sent" : action === "confirm" ? "Email marked as confirmed" : "The account must confirm its email again", "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "That didn't work.", "error");
    } finally {
      setBusy(null);
    }
  };

  const confirmed = Boolean(status?.verifiedAt);
  const waiting = !confirmed && Boolean(status?.required);
  const view = confirmed
    ? { Icon: MailCheck, cls: "text-emerald-300", title: "Email confirmed", text: `Confirmed ${METHOD[status?.method || ""] || ""} on ${day(status!.verifiedAt!)}.` }
    : waiting
      ? { Icon: MailWarning, cls: "text-amber-300", title: "Waiting for confirmation", text: "Signed up but hasn't entered the code or opened the link yet, so they can't sign in. The address may be fake or mistyped." }
      : { Icon: MailQuestion, cls: "text-slate-300", title: "Not confirmed (older account)", text: "Made before email confirmation started. It signs in as before unless Settings asks older accounts to confirm too." };
  const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50";

  return (
    <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800">
      <h4 className={`text-sm font-bold flex items-center gap-2 ${view.cls}`}>
        <view.Icon className="w-4 h-4" aria-hidden /> {view.title}
      </h4>
      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{isAdmin ? "Admin accounts sign in with their own emailed code." : view.text}</p>
      {!isAdmin && (
        <div className="mt-3 flex flex-wrap gap-2">
          {!confirmed && (
            <>
              <button disabled={!!busy} onClick={() => act("send")} className={`${btn} bg-blue-600/15 border-blue-500/30 text-blue-300 hover:bg-blue-600/25`}>
                <Send className="w-3.5 h-3.5" aria-hidden /> {busy === "send" ? "Sending…" : "Email a confirmation link"}
              </button>
              <button disabled={!!busy} onClick={() => act("confirm")} className={`${btn} bg-emerald-600/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/25`}>
                <Check className="w-3.5 h-3.5" aria-hidden /> Mark as confirmed
              </button>
            </>
          )}
          {confirmed && (
            <button disabled={!!busy} onClick={() => act("unconfirm")} className={`${btn} bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800`}>
              <Undo2 className="w-3.5 h-3.5" aria-hidden /> Ask them to confirm again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
