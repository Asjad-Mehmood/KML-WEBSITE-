"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { GITHUB_REPO_URL } from "@/lib/site";

// Site navbar and footer around a content page (grid pages, guides)
export default function PageShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toDownload = () => router.push("/#download");
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar onDownloadClick={toDownload} />
      <main id="main-content" className="pt-24 sm:pt-28 pb-20">
        {children}
      </main>
      <Footer
        versionTag="v3.6.2"
        downloadUrl={`${GITHUB_REPO_URL}/releases/latest`}
        releaseNotesUrl={`${GITHUB_REPO_URL}/releases/latest`}
        onDownloadClick={toDownload}
      />
    </div>
  );
}
