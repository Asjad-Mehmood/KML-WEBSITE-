"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { GITHUB_REPO_URL, LATEST_VERSION } from "@/lib/site";

// Page frame for the Privacy Policy and Terms: site navbar and footer around readable text
export default function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const router = useRouter();
  const toDownload = () => router.push("/download");
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar onDownloadClick={toDownload} />
      <main id="main-content" className="pt-28 sm:pt-32 pb-20">
        <article
          className="max-w-[760px] mx-auto px-5 sm:px-8 text-[15px] leading-relaxed text-slate-700
            [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-3
            [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:mb-4 [&_li]:pl-1
            [&_a]:text-[#0071e3] [&_a]:font-medium hover:[&_a]:underline [&_strong]:text-slate-900"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-2 mb-8">Last updated {updated}</p>
          {children}
        </article>
      </main>
      <Footer
        versionTag={LATEST_VERSION}
        downloadUrl={`${GITHUB_REPO_URL}/releases/latest`}
        releaseNotesUrl={`${GITHUB_REPO_URL}/releases/latest`}
        onDownloadClick={toDownload}
      />
    </div>
  );
}
