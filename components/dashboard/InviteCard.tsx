"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift, Mail, Share2 } from "lucide-react";

type Invites = { code: string; link: string; joined: number; active: number };

const MESSAGE =
  "I use SurveyX Digital's free survey tools: Excel to KML (survey points into Google Earth on any grid), Traverse & Level, Slope Calculator and more. Make a free account here:";

// Dashboard: the account's invite link, ways to send it, and how many colleagues joined from it
export default function InviteCard() {
  const [d, setD] = useState<Invites | null>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/user/invites", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => live && x && setD(x))
      .catch(() => {});
    const t = setTimeout(() => live && setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), 0);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, []);

  if (!d) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(d.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your invite link:", d.link);
    }
  };
  const share = () => navigator.share?.({ title: "SurveyX Digital", text: MESSAGE, url: d.link }).catch(() => {});
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${MESSAGE} ${d.link}`)}`;
  const email = `mailto:?subject=${encodeURIComponent("Free survey tools: SurveyX Digital")}&body=${encodeURIComponent(`${MESSAGE}\n\n${d.link}`)}`;
  const btn = "inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-2 text-[13px] font-semibold text-slate-900 hover:bg-slate-50 cursor-pointer";

  return (
    <section className="mt-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6" aria-labelledby="invite-title">
      <h2 id="invite-title" className="text-[15px] font-bold flex items-center gap-2">
        <Gift className="w-4 h-4 text-[#0071e3]" aria-hidden /> Invite a colleague
      </h2>
      <p className="mt-1 text-[13px] text-slate-600">
        They get a free account. See here who joined.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={d.link}
          aria-label="Your invite link"
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 font-mono"
        />
        <button type="button" onClick={() => void copy()} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0071e3] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0062c4] cursor-pointer">
          {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={btn}>
          WhatsApp
        </a>
        <a href={email} className={btn}>
          <Mail className="w-4 h-4" aria-hidden /> Email
        </a>
        {canShare && (
          <button type="button" onClick={share} className={btn}>
            <Share2 className="w-4 h-4" aria-hidden /> Share
          </button>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
        {[
          ["Joined from your link", d.joined],
          ["Already using an app", d.active],
        ].map(([label, n]) => (
          <div key={label as string} className="rounded-xl bg-slate-50 px-2 py-2.5">
            <dd className="text-[18px] font-extrabold text-slate-900 tabular-nums">{n}</dd>
            <dt className="text-[11.5px] text-slate-500">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
