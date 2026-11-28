"use client";

// Admin → Survey Toolkit → Access: who may use the Toolkit while it is in testing.
import { useState } from "react";
import { ExternalLink, Loader2, Trash2, UserPlus } from "lucide-react";
import { card, date, smallBtn, td, th, type Data, type Fetcher, type Tester } from "@/components/admin/toolkit/shared";

export function Access({ data, adminFetch, onToast, onChanged }: { data: Data; adminFetch: Fetcher; onToast: (s: string) => void; onChanged: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    const r = await adminFetch("/api/toolkit/testers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, note }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    onToast(r.ok ? `${email.trim()} is a tester` : j.error || "Couldn't add the tester.");
    if (r.ok) {
      setEmail("");
      setNote("");
      await onChanged();
    }
  };
  const remove = async (t: Tester) => {
    if (!confirm(`Remove ${t.email} from the testers?`)) return;
    const r = await adminFetch(`/api/toolkit/testers?email=${encodeURIComponent(t.email)}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    onToast(r.ok ? `${t.email} removed` : j.error || "Couldn't remove the tester.");
    if (r.ok) await onChanged();
  };

  return (
    <div className="space-y-5">
      <div className={`${card} p-5`}>
        <h3 className="text-[15px] font-bold text-white">Who may use the Toolkit</h3>
        <p className="mt-1 text-sm text-slate-300">
          {data.isPublic === false
            ? "Only the testers below (and admins). Everyone else sees that it isn't open yet."
            : "Everyone with an account. The testers list only matters when the Toolkit is closed."}
        </p>
        <p className="mt-2 text-xs text-slate-400">Change this in Settings → Survey Toolkit. The Toolkit&apos;s front page options are on the Toolkit&apos;s own admin page.</p>
        <a href="/toolkit-beta/admin" className={`${smallBtn} mt-3 bg-slate-800 hover:bg-slate-700 text-slate-200`}>
          <ExternalLink className="w-3.5 h-3.5" /> Toolkit admin page
        </a>
      </div>

      <div className={card}>
        <div className="px-5 pt-4 pb-3 flex flex-wrap items-end gap-2">
          <h3 className="w-full text-[15px] font-bold text-white">Testers ({data.testers.length})</h3>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button onClick={add} disabled={busy || !email.trim()} className={`${smallBtn} py-2 bg-blue-600 hover:bg-blue-500 text-white`}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Add tester
          </button>
        </div>
        {data.testers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-slate-800">
                  <th className={th}>Email</th>
                  <th className={th}>Account</th>
                  <th className={th}>PCs</th>
                  <th className={th}>Note</th>
                  <th className={th}>Added</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {data.testers.map((t) => (
                  <tr key={t.email} className="border-b border-slate-800/60 last:border-0">
                    <td className={`${td} text-white`}>{t.email}</td>
                    <td className={td}>{t.name ? `${t.name} · signed in ${date(t.lastLogin)}` : <span className="text-slate-500">no account yet</span>}</td>
                    <td className={`${td} tabular-nums`}>{t.devices}</td>
                    <td className={td}>{t.note || "—"}</td>
                    <td className={td}>
                      {date(t.createdAt)}
                      {t.addedBy && <span className="block text-[11px] text-slate-500">by {t.addedBy}</span>}
                    </td>
                    <td className="pr-3 text-right">
                      <button onClick={() => remove(t)} title={`Remove ${t.email}`} className="p-1.5 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 pb-5 text-sm text-slate-400">No testers.</p>
        )}
      </div>
    </div>
  );
}
