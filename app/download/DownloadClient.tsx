"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Globe, RefreshCw, Smartphone, Wrench } from "lucide-react";
import DownloadHub from "../../components/DownloadHub";
import WebAppLink from "../../components/WebAppLink";
import { useLatestRelease } from "@/lib/useLatestRelease";

/** The download section with the live release details, and the other ways to get the program. */
export default function DownloadClient() {
  const r = useLatestRelease();
  const [toast, setToast] = useState<string | null>(null);
  const onToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 3500);
  };

  const card = "rounded-2xl border border-slate-200/80 bg-white p-6";
  return (
    <>
      <DownloadHub
        versionTag={r.versionTag}
        downloadUrl={r.downloadUrl}
        releaseNotesUrl={r.releaseNotesUrl}
        fileSizeText={r.fileSizeText}
        bytesText={r.bytesText}
        releaseDateText={r.releaseDateText}
        sha256Hash={r.sha256Hash}
        onToast={onToast}
        asPage
      />

      <div className="max-w-[1140px] mx-auto px-5 sm:px-8 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className={card}>
            <Smartphone className="w-5 h-5 text-[#0071e3]" aria-hidden />
            <h2 className="mt-3 text-[18px] font-bold text-slate-900">Android</h2>
            <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">
              The Android app is the same converter, with your account, jobs and satellite pictures. Install the <code>.apk</code> file
              and allow installs from your browser when Android asks.
            </p>
            {r.apkUrl ? (
              <a href={r.apkUrl} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13.5px] font-semibold">
                Download for Android
              </a>
            ) : (
              <a href={r.releaseNotesUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0071e3] hover:underline">
                Find the Android file with the latest release <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
              </a>
            )}
          </section>

          <section className={card}>
            <Globe className="w-5 h-5 text-[#0071e3]" aria-hidden />
            <h2 className="mt-3 text-[18px] font-bold text-slate-900">In your browser</h2>
            <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">
              Nothing to install: the web app runs in Chrome, Edge, Firefox or Safari on any computer, tablet or phone. Sign in with a free
              account to use it. The web version converts smaller sheets; the Windows app has no point limit.
            </p>
            <WebAppLink className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-[13.5px] font-semibold text-slate-800">
              Open the web app
            </WebAppLink>
          </section>

          <section className={card}>
            <RefreshCw className="w-5 h-5 text-[#0071e3]" aria-hidden />
            <h2 className="mt-3 text-[18px] font-bold text-slate-900">Updates and uninstalling</h2>
            <ul className="mt-2 space-y-2 text-[14px] text-slate-600 leading-relaxed list-disc pl-5">
              <li>Each time the Windows app opens, it checks for a newer version. Press <b>Yes</b> and it updates and restarts by itself.</li>
              <li>An update checks the installer against its SHA-256 before installing it.</li>
              <li>Your jobs, settings and symbol library are kept through updates.</li>
              <li>Uninstall from <i>Settings → Apps</i>, like any other program.</li>
            </ul>
            <Link href="/whats-new" className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0071e3] hover:underline">
              What&apos;s new in each version
            </Link>
          </section>

          <section className={card}>
            <Wrench className="w-5 h-5 text-[#0071e3]" aria-hidden />
            <h2 className="mt-3 text-[18px] font-bold text-slate-900">If it won&apos;t install or open</h2>
            <ul className="mt-2 space-y-2 text-[14px] text-slate-600 leading-relaxed list-disc pl-5">
              <li>
                <b>&ldquo;Windows protected your PC&rdquo;:</b> press <i>More info</i>, then <i>Run anyway</i>. It shows for new programs
                that are not yet signed with a paid certificate.
              </li>
              <li>
                <b>A blank window:</b> Microsoft Edge WebView2 is missing. Install it from{" "}
                <a href="https://developer.microsoft.com/microsoft-edge/webview2/" target="_blank" rel="noopener noreferrer" className="text-[#0071e3] hover:underline">
                  microsoft.com
                </a>{" "}
                and open the program again.
              </li>
              <li>
                <b>No update offered:</b> the check needs the internet. You can always install the newest version over the top.
              </li>
            </ul>
            <Link href="/contact" className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0071e3] hover:underline">
              Still stuck? Contact us
            </Link>
          </section>
        </div>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium py-3 px-5 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}
    </>
  );
}
