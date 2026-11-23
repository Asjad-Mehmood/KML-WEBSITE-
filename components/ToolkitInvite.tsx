"use client";

// Shown once a new account is made (the sign-up, and Google's /welcome): the account is ready,
// and the Survey Toolkit is the way to get every program. Download starts the installer
// (/api/toolkit/download; on the sign-in address through the handover, so the main site is
// signed in for it); "Continue to …" goes on to where they were going.
import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Download, PartyPopper, RefreshCw, ShieldCheck, LayoutGrid, ArrowRight } from "lucide-react";
import toolkitIcon from "@/components/toolkit/images/toolkit-icon.png";
import shot from "@/components/toolkit/images/shot-home.png";

const POINTS = [
  { Icon: LayoutGrid, text: "Excel to KML, Traverse & Level, Slope Calculator, Auto Drafting and more, in one app" },
  { Icon: ShieldCheck, text: "Sign in once: every program opens already signed in" },
  { Icon: RefreshCw, text: "New versions install themselves, checked before they run" },
];

export default function ToolkitInvite({
  firstName,
  downloadHref,
  onContinue,
  continueLabel,
}: {
  firstName: string;
  downloadHref: string;
  onContinue: () => void;
  continueLabel: string;
}) {
  const [started, setStarted] = useState(false);
  return (
    <div className="si-in">
      <div className="text-center">
        <span className="si-pop mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
          <PartyPopper className="w-6 h-6" aria-hidden />
        </span>
        <h1 className="mt-3 text-[22px] font-semibold text-[#1d1d1f]">Welcome{firstName ? `, ${firstName}` : ""}!</h1>
        <p className="mt-1 text-[14px] text-slate-500">Your account is ready. One more step gets you everything:</p>
      </div>

      {/* the Toolkit, as it looks */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-[#f5f7fb]">
        <div className="flex items-center gap-3 px-4 pt-4">
          <Image src={toolkitIcon} alt="" width={40} height={40} className="h-10 w-10 rounded-xl" />
          <div className="min-w-0">
            <p className="font-semibold text-[#071a44] leading-tight">Survey Toolkit</p>
            <p className="text-[12.5px] text-slate-500">Free · Windows 10 and 11</p>
          </div>
        </div>
        <div className="relative mx-4 mt-4 overflow-hidden rounded-t-lg border border-b-0 border-slate-200 shadow-[0_-8px_30px_-12px_rgba(7,26,68,0.25)]">
          <Image src={shot} alt="The Survey Toolkit's home, with every program and its updates" sizes="400px" className="block h-auto w-full" />
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {POINTS.map(({ Icon, text }) => (
          <li key={text} className="flex gap-3 text-[13.5px] text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#071a44] text-[#ffd21f]">
              <Icon className="w-3.5 h-3.5" aria-hidden />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <a
        href={downloadHref}
        onClick={() => setStarted(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)] transition-colors hover:bg-[#0077ed]"
      >
        <Download className="w-4 h-4" aria-hidden /> Download the Survey Toolkit
      </a>
      {started && (
        <p role="status" className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-medium text-emerald-700">
          <CheckCircle2 className="w-4 h-4" aria-hidden /> Your download is starting. Open it to install.
        </p>
      )}
      <button
        type="button"
        onClick={onContinue}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-[14px] font-semibold transition-colors ${
          started ? "bg-slate-900 text-white hover:bg-slate-800" : "text-[#0071e3] hover:bg-blue-50"
        }`}
      >
        {started ? continueLabel : "Maybe later"} <ArrowRight className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}
