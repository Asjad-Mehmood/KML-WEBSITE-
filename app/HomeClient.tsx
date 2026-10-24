"use client";

import { useLatestRelease } from "@/lib/useLatestRelease";
import { goToDownload } from "@/lib/downloadHandoff";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HeroClassic from "../components/HeroClassic";
import Showcase from "../components/Showcase";
// Hidden from the home page to keep it short; uncomment here and below to bring it back
// import MetricsRibbon from "../components/MetricsRibbon";
import Features from "../components/Features";
// Hidden from the home page (the tutorial steps below cover it; still on /how-it-works)
// import Workflow from "../components/Workflow";
import TutorialTeaser from "../components/TutorialTeaser";
import ConverterSection from "../components/ConverterSection";
import ProductSpotlight from "../components/ProductSpotlight";
import DownloadHub from "../components/DownloadHub";
// Hidden from the home page (the same ground as /formats and the grids section)
// import SpecsTable from "../components/SpecsTable";
import Faq from "../components/Faq";
import GridsAndGuides from "../components/GridsAndGuides";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

// Which hero the home page shows: "new" has a tab and screenshot for every program, with the
// converter in its own section below; "classic" is the earlier one (the converter inside the
// hero, then the "More software" cards). Change this one word to switch.
const HERO_STYLE = "new" as "new" | "classic";

export default function HomeClient() {
  const { requireAuth, trackDownload } = useAuth();
  const router = useRouter();

  // The latest release (lib/useLatestRelease.ts): shared with the download page
  const { versionTag, downloadUrl, fileName, releaseNotesUrl, fileSizeText, bytesText, releaseDateText, sha256Hash } =
    useLatestRelease();

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  // Gated download handler used across buttons
  const handleDownloadApp = () => {
    requireAuth(() => {
      // Record it, then the thank-you page starts the file
      trackDownload("windows_installer", fileName, versionTag);
      goToDownload(router.push, downloadUrl, versionTag);
    }, "Sign in or create a free account to download the Windows app.");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium py-3 px-5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar onDownloadClick={handleDownloadApp} />

      {/* Main Content Landmark for Search Engine Crawlers & Accessibility */}
      <main id="main-content">
        {HERO_STYLE === "classic" ? (
          <>
            {/* Hero with the converter, then the spotlight on our other software */}
            <HeroClassic versionTag={versionTag} fileSizeText={fileSizeText} onDownloadClick={handleDownloadApp} />
            <ProductSpotlight />
          </>
        ) : (
          <>
            {/* Hero with a tab for every program, then the live coordinate converter */}
            <Hero versionTag={versionTag} fileSizeText={fileSizeText} onDownloadClick={handleDownloadApp} />
            <ConverterSection />
          </>
        )}

        {/* Showcase Window */}
        <Showcase versionTag={versionTag} onToast={showToast} />

        {/* Metrics Ribbon: hidden to keep the page short (the hero carries the same figures).
            Uncomment this and its import to bring it back.
        <MetricsRibbon />
        */}

        {/* Key Features */}
        <Features />

        {/* 3-Step Workflow: hidden to keep the page short (the tutorial steps below say the same
            with screenshots; it is still on /how-it-works). Uncomment this and its import to bring it back.
        <Workflow />
        */}
        <TutorialTeaser />

        {/* Download Hub */}
        <DownloadHub
          versionTag={versionTag}
          downloadUrl={downloadUrl}
          releaseNotesUrl={releaseNotesUrl}
          fileName={fileName}
          fileSizeText={fileSizeText}
          bytesText={bytesText}
          releaseDateText={releaseDateText}
          sha256Hash={sha256Hash}
          onToast={showToast}
          // the installer card only; the guide and requirements are on /download.
          // Remove this line to show the whole section again.
          compact
        />

        {/* Technical Specifications: hidden to keep the page short (see /formats and the grids
            section). Uncomment this and its import to bring it back.
        <SpecsTable />
        */}

        {/* Grid converter pages and guides */}
        <GridsAndGuides />

        {/* FAQ: one question per topic and a link to /faq. Remove `short` to show them all
            (and in app/page.tsx, `short` on FaqStructuredData). */}
        <Faq short />

        {/* Bottom CTA Banner */}
        <CtaBanner
          versionTag={versionTag}
          fileSizeText={fileSizeText}
          onDownloadClick={handleDownloadApp}
        />
      </main>

      {/* Footer */}
      <Footer
        versionTag={versionTag}
        downloadUrl={downloadUrl}
        releaseNotesUrl={releaseNotesUrl}
        onDownloadClick={handleDownloadApp}
      />
    </div>
  );
}
