"use client";

// Admin → Email: a full list of email addresses (who a message reaches, or who it went to), with a
// search, a count, and Copy all
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Copy, XCircle } from "lucide-react";

export type MailPerson = { email: string; name: string; status?: string; error?: string | null; sentAt?: string | null };

export default function MailPeople({ people, total }: { people: MailPerson[]; total: number }) {
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState(false);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? people.filter((p) => p.email.includes(s) || p.name.toLowerCase().includes(s)) : people;
  }, [people, q]);
  const counts = useMemo(() => {
    const c = { sent: 0, failed: 0, waiting: 0 };
    people.forEach((p) => {
      if (p.status === "sent") c.sent++;
      else if (p.status === "failed") c.failed++;
      else if (p.status) c.waiting++;
    });
    return c;
  }, [people]);
  const withStatus = people.some((p) => p.status);

  const copyAll = async () => {
    const text = shown.map((p) => p.email).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy the addresses:", text);
    }
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email"
          aria-label="Search the list"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500"
        />
        <button type="button" onClick={() => void copyAll()} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer">
          <Copy className="w-3.5 h-3.5" aria-hidden /> {copied ? "Copied" : `Copy ${shown.length}`}
        </button>
      </div>
      {withStatus && (
        <p className="mt-2 text-[11.5px] text-slate-400 tabular-nums">
          {counts.sent} sent{counts.failed ? ` · ${counts.failed} failed` : ""}
          {counts.waiting ? ` · ${counts.waiting} still to go` : ""}
        </p>
      )}
      <ol className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-slate-800 divide-y divide-slate-800">
        {shown.map((p, i) => (
          <li key={p.email} className="flex items-start gap-2 px-3 py-1.5 text-xs">
            <span className="w-7 shrink-0 text-right tabular-nums text-slate-600">{i + 1}</span>
            {p.status === "sent" ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-label="Sent" />
            ) : p.status === "failed" ? (
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-label="Failed" />
            ) : p.status ? (
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-label="Still to go" />
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block break-all text-slate-200">{p.email}</span>
              {p.name && <span className="block truncate text-slate-500">{p.name}</span>}
              {p.status === "failed" && p.error && <span className="block break-words text-rose-300/80">{p.error}</span>}
            </span>
            {p.sentAt && <span className="shrink-0 text-slate-600">{new Date(p.sentAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>}
          </li>
        ))}
        {!shown.length && <li className="px-3 py-3 text-xs text-slate-500">No one matches.</li>}
      </ol>
      {total > people.length && <p className="mt-1.5 text-[11.5px] text-slate-500">Showing the first {people.length} of {total}.</p>}
    </div>
  );
}
