"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Inbox, Mail, RefreshCw, RotateCcw, Trash2 } from "lucide-react";

interface Message {
  id: string;
  ref: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  details: string | null;
  status: "new" | "open" | "done";
  createdAt: string;
}

const TOPIC_LABEL: Record<string, string> = {
  question: "Question",
  problem: "Problem",
  grid: "Grid request",
  idea: "Idea",
  business: "Business",
};
const TOPIC_TONE: Record<string, string> = {
  problem: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  grid: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  business: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};
const FILTERS = [
  ["new", "New"],
  ["open", "Open"],
  ["done", "Done"],
  ["all", "All"],
] as const;

// Admin → Messages: contact-form messages to work through. Reply opens your
// email app addressed to the sender, with the reference in the subject.
export default function AdminMessages({
  adminFetch,
  onToast,
  onCounts,
}: {
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onToast: (message: string, type?: "success" | "error") => void;
  onCounts: (newCount: number) => void;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("new");
  const [messages, setMessages] = useState<Message[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  // The parent's callbacks change on every render; keep the latest in refs so
  // they don't make the list reload
  const toast = useRef(onToast);
  const report = useRef(onCounts);
  useEffect(() => {
    toast.current = onToast;
    report.current = onCounts;
  });

  const load = useCallback(() => {
    adminFetch(`/api/admin/messages?status=${filter}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Couldn't load messages"))))
      .then((d) => {
        setMessages(d.messages || []);
        setCounts(d.counts || {});
        report.current(d.counts?.new || 0);
      })
      .catch((e) => toast.current(e.message, "error"))
      .finally(() => setLoading(false));
  }, [adminFetch, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (m: Message, status: Message["status"] | "delete") => {
    if (status === "delete" && !confirm(`Delete message ${m.ref} from ${m.name}? This can't be undone.`)) return;
    const res = await adminFetch(`/api/admin/messages/${m.id}`, {
      method: status === "delete" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: status === "delete" ? undefined : JSON.stringify({ status }),
    });
    if (!res.ok) return toast.current("Couldn't update the message", "error");
    toast.current(status === "delete" ? "Message deleted" : `Marked ${status}`);
    load();
  };

  const replyHref = (m: Message) => {
    const quoted = m.message.split("\n").map((l) => `> ${l}`).join("\n");
    return `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.ref} — your message to Excel to KML Pro`)}&body=${encodeURIComponent(`Hi ${m.name.split(" ")[0]},\n\n\n\n—\n${quoted}`)}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Messages</h3>
          <p className="text-xs text-slate-400">From the contact form. Reply opens your email app; mark a message done when it&apos;s answered.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            {FILTERS.map(([k, label]) => (
              <button
                key={k}
                onClick={() => {
                  if (k !== filter) setLoading(true);
                  setFilter(k);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${filter === k ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {label}
                {k !== "all" && counts[k] ? <span className="ml-1.5 opacity-80">{counts[k]}</span> : null}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            aria-label="Refresh" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {!loading && messages.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
          <Inbox className="w-8 h-8 mx-auto mb-3 text-slate-500" />
          {filter === "new" ? "No new messages. You're all caught up." : "No messages here."}
        </div>
      )}

      <ul className="space-y-3">
        {messages.map((m) => {
          const details = m.details ? (JSON.parse(m.details) as Record<string, string>) : null;
          return (
            <li key={m.id} className={`rounded-2xl border p-5 ${m.status === "new" ? "border-blue-500/40 bg-slate-900" : "border-slate-800 bg-slate-900/60"}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full border font-semibold ${TOPIC_TONE[m.topic] || "bg-blue-500/15 text-blue-300 border-blue-500/30"}`}>
                  {TOPIC_LABEL[m.topic] || m.topic}
                </span>
                <span className="font-mono text-slate-500">{m.ref}</span>
                {m.status === "new" && <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">New</span>}
                {m.status === "done" && <span className="text-emerald-400 font-semibold">Done</span>}
                <span className="ml-auto text-slate-500">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                {m.name} <span className="font-normal text-slate-400">&lt;{m.email}&gt;</span>
              </p>
              {details && (
                <p className="mt-1 text-xs text-slate-400">
                  {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </p>
              )}
              <p className="mt-3 text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={replyHref(m)}
                  onClick={() => m.status === "new" && act(m, "open")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <Mail className="w-3.5 h-3.5" /> Reply
                </a>
                {m.status !== "done" ? (
                  <button onClick={() => act(m, "done")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold cursor-pointer">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark done
                  </button>
                ) : (
                  <button onClick={() => act(m, "open")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5" /> Reopen
                  </button>
                )}
                <button onClick={() => act(m, "delete")} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-300 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
