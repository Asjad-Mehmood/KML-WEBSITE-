"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Download, Globe, LayoutDashboard, Map, PlayCircle } from "lucide-react";
import PageShell from "../../../components/PageShell";
import { clearPendingDownload, peekPendingDownload } from "@/lib/downloadHandoff";
import { useAuth } from "../../../context/AuthContext";
import { INSTALLER_URL, SUPPORT_EMAIL } from "@/lib/site";

const NEXT: { href: string; title: string; text: string; Icon: React.ElementType }[] = [
  { href: "/tutorial", title: "App tutorial", text: "Four steps from your sheet to Google Earth, with screenshots.", Icon: PlayCircle },
  { href: "/guides", title: "Guides", text: "Total station CSV to KMZ, finding your UTM zone, KML vs KMZ and more.", Icon: BookOpen },
  { href: "/convert", title: "Grid converters", text: "A page for every coordinate system, with its parameters.", Icon: Map },
  { href: "/app", title: "Web app", text: "Convert in your browser on any computer, no install.", Icon: Globe },
];

export default function ThanksClient() {
  const { user } = useAuth();
  const [url, setUrl] = useState(INSTALLER_URL);
  const [started, setStarted] = useState(false);

  // Arrived from a Download button: start the file once
  useEffect(() => {
    const pending = peekPendingDownload();
    if (!pending) return;
    const t = setTimeout(() => {
      clearPendingDownload(); // once only: a refresh doesn't download again
      setUrl(pending.url);
      setStarted(true);
      const a = document.createElement("a");
      a.href = pending.url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <PageShell>
      <div className="max-w-[900px] mx-auto px-5 sm:px-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-blue-50/70 to-white p-7 sm:p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#0071e3] flex items-center justify-center shadow-lg shadow-blue-600/25">
            <Download className="w-7 h-7 text-white" aria-hidden />
          </div>
          <h1 className="mt-5 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-slate-900">
            Thanks for downloading{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-3 text-[16px] text-slate-600 leading-relaxed max-w-xl mx-auto">
            {started
              ? "Your download of Excel to KML Pro has started. It's a small installer — about 3 MB."
              : "Get the Excel to KML Pro installer for Windows — about 3 MB."}{" "}
            We hope it saves you hours on every job.
          </p>
          <a
            href={url}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold"
          >
            <Download className="w-4 h-4" aria-hidden />
            {started ? "Download didn't start? Click here" : "Download for Windows"}
          </a>
        </div>

        <section className="mt-12">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Install in a minute</h2>
          <ol className="mt-5 space-y-4">
            {[
              ["Run the installer", "Open ExcelToKMLPro-Lite-Setup.exe from your Downloads folder and follow the steps."],
              ["If Windows asks", "If a blue SmartScreen message appears, click More info, then Run anyway."],
              ["Try the sample", "Open the app and click Try the sample: a finished job on the Dubai grid, ready to save as KMZ."],
              ["Open your own sheet", "Load your Excel or CSV, choose your grid, check one known mark and save for Google Earth."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-[#0071e3] text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="font-semibold text-slate-900">{t}</p>
                  <p className="text-[14.5px] text-slate-600 leading-relaxed">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Where to next</h2>
          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {NEXT.map(({ href, title, text, Icon }) => (
              <li key={href}>
                <Link href={href} className="group flex gap-3 h-full rounded-2xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
                  <Icon className="w-5 h-5 mt-0.5 text-[#0071e3] shrink-0" aria-hidden />
                  <span>
                    <span className="flex items-center gap-1 font-semibold text-slate-900 group-hover:text-[#0071e3]">
                      {title} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                    </span>
                    <span className="block mt-0.5 text-[14px] text-slate-600">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {user && (
            <Link href="/dashboard" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0071e3] hover:underline">
              <LayoutDashboard className="w-4 h-4" aria-hidden /> See your downloads and files in your dashboard
            </Link>
          )}
        </section>

        <p className="mt-12 flex items-start gap-2 text-[14.5px] text-slate-600">
          <CheckCircle2 className="w-4 h-4 mt-1 text-emerald-600 shrink-0" aria-hidden />
          <span>
            Questions, ideas or a grid we don&apos;t cover? Write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#0071e3] hover:underline">{SUPPORT_EMAIL}</a> — we read every message.
          </span>
        </p>
      </div>
    </PageShell>
  );
}
