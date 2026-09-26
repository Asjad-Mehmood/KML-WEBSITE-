"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SUPPORT_EMAIL } from "@/lib/site";

const TOPICS: [string, string][] = [
  ["question", "Question"],
  ["problem", "Problem / bug"],
  ["grid", "Grid or format request"],
  ["idea", "Feature idea"],
  ["business", "Business / licensing"],
];

const PLACEHOLDER: Record<string, string> = {
  question: "What would you like to know?",
  problem: "What did you do, what did you expect, and what happened instead? Paste any message the program showed.",
  grid: "Which grid or format do you need? Its name, EPSG code or country helps.",
  idea: "What would make the app more useful for your work?",
  business: "Tell us about your team and what you need.",
};

const input =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

// Contact form (/contact): signed-in details filled in, a topic that can come
// from ?topic=, and extra fields for problem reports
export default function ContactForm() {
  const { user } = useAuth();
  // ?topic=problem etc. picks the starting topic; the account fills name and
  // email until the person types their own
  const queryTopic = useSyncExternalStore(
    () => () => {},
    () => {
      const t = new URLSearchParams(window.location.search).get("topic");
      return t && TOPICS.some(([k]) => k === t) ? t : "question";
    },
    () => "question"
  );
  const [topicIn, setTopic] = useState<string | null>(null);
  const [nameIn, setName] = useState<string | null>(null);
  const [emailIn, setEmail] = useState<string | null>(null);
  const topic = topicIn ?? queryTopic;
  const name = nameIn ?? user?.name ?? "";
  const email = emailIn ?? user?.email ?? "";
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState({ version: "", platform: "", grid: "" });
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, details: topic === "problem" ? details : undefined, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Your message couldn't be sent. Please try again.");
      setRef(data.ref);
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  };

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-7 text-center">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" aria-hidden />
        <h2 className="mt-3 text-xl font-bold text-slate-900">Thanks — your message is on its way</h2>
        <p className="mt-2 text-[15px] text-slate-600">
          Your reference is <strong className="font-mono">{ref}</strong>. We&apos;ll reply to <strong>{email}</strong>, usually within one
          to two working days.
        </p>
        <button
          onClick={() => {
            setMessage("");
            setState("idle");
          }}
          className="mt-5 text-[14px] font-semibold text-[#0071e3] hover:underline cursor-pointer"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.25)] space-y-4">
      <fieldset>
        <legend className="text-[13px] font-semibold text-slate-700 mb-2">What is it about?</legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(([k, label]) => (
            <label
              key={k}
              className={`cursor-pointer px-3.5 py-1.5 rounded-full border text-[13.5px] font-medium transition-colors ${
                topic === k ? "bg-[#0071e3] border-[#0071e3] text-white" : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
              }`}
            >
              <input type="radio" name="topic" value={k} checked={topic === k} onChange={() => setTopic(k)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[13px] font-semibold text-slate-700">Your name</span>
          <input required maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1.5`} />
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-slate-700">Email for our reply</span>
          <input required type="email" maxLength={200} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1.5`} />
        </label>
      </div>

      {topic === "problem" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(
            [
              ["version", "App version", "e.g. v3.6.2"],
              ["platform", "Windows, Android or web", "e.g. Web app, Chrome"],
              ["grid", "Grid you chose", "e.g. Dubai DLTM"],
            ] as const
          ).map(([k, label, ph]) => (
            <label key={k} className="block">
              <span className="text-[13px] font-semibold text-slate-700">{label}</span>
              <input
                maxLength={120}
                placeholder={ph}
                value={details[k]}
                onChange={(e) => setDetails({ ...details, [k]: e.target.value })}
                className={`${input} mt-1.5`}
              />
            </label>
          ))}
        </div>
      )}

      <label className="block">
        <span className="text-[13px] font-semibold text-slate-700">Message</span>
        <textarea
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={PLACEHOLDER[topic]}
          className={`${input} mt-1.5 resize-y`}
        />
      </label>

      {/* Left empty by people; bots fill it in */}
      <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-[14px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <p className="text-[12.5px] text-slate-500">Please don&apos;t include passwords. Or email us: {SUPPORT_EMAIL}</p>
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-70 text-white text-sm font-semibold cursor-pointer"
        >
          {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
