"use client";

import React from "react";
import Navbar from "../../components/Navbar";
import Faq from "../../components/Faq";
import CtaBanner from "../../components/CtaBanner";
import { GITHUB_REPO_URL, LATEST_VERSION } from "@/lib/site";
import Footer from "../../components/Footer";

export default function FaqPage() {
  const handleDownload = () => {
    window.location.href = "/download";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar onDownloadClick={handleDownload} />
      <main id="main-content" className="pt-20">
        <Faq headingLevel="h1" />
        <CtaBanner
          versionTag={LATEST_VERSION}
          fileSizeText="3.15 MB"
          onDownloadClick={handleDownload}
        />
      </main>
      <Footer
        versionTag={LATEST_VERSION}
        downloadUrl={`${GITHUB_REPO_URL}/releases/latest`}
        releaseNotesUrl={`${GITHUB_REPO_URL}/releases/latest`}
        onDownloadClick={handleDownload}
      />
    </div>
  );
}
