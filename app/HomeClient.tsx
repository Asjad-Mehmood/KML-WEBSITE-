"use client";

import { useLatestRelease } from "@/lib/useLatestRelease";
import { goToDownload } from "@/lib/downloadHandoff";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import HeroClassic from "../components/HeroClassic";
import Showcase from "../components/Showcase";
// Hidden from the home page to keep it short; uncomment here and below to bring it back
// import MetricsRibbon from "../components/MetricsRibbon";
import Features from "../components/Features";
// Hidden from the home page (the tutorial steps below cover it; still on /how-it-works)
// import Workflow from "../components/Workflow";
import TutorialTeaser from "../components/TutorialTeaser";
import ProductSpotlight from "../components/ProductSpotlight";
import DownloadHub from "../components/DownloadHub";
// Hidden from the home page (the same ground as /formats and the grids section)
// import SpecsTable from "../components/SpecsTable";
import Faq from "../components/Faq";
import GridsAndGuides from "../components/GridsAndGuides";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import ToolkitFlow from "../components/home/ToolkitFlow";
import { CompanyCta, CompanyHero, ProductGrid, ToolkitBand, WhyUs } from "../components/home/CompanyHome";
import HomeReviews from "../components/home/HomeReviews";
import HomeFaq from "../components/home/HomeFaq";
import { useAuth } from "../context/AuthContext";
import type { HomeHero } from "@/lib/siteSettings";
import type { PublicStats } from "@/lib/publicCounts";

// heroStyle (Admin → Settings → Home page): "new" is the website's home page (the suite, every
// product, the Survey Toolkit, how they work together, reviews, guides and questions);
// "classic" is the page all about Excel to KML, which is also Excel to KML's own page (/excel-to-kml)
// What the sign-in popup says when a download needs an account: why, and that it's quick
const DOWNLOAD_INTENT =
  "Create a free account to download: it takes 30 seconds, or one click with Google. It keeps your downloads and files, and tells you when there's an update.";

export default function HomeClient({ heroStyle = "new", stats = null }: { heroStyle?: HomeHero; stats?: PublicStats | null }) {
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
    }, DOWNLOAD_INTENT);
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
        {heroStyle === "classic" ? (
          <>
            {/* The earlier home page, all about Excel to KML */}
            <HeroClassic versionTag={versionTag} fileSizeText={fileSizeText} onDownloadClick={handleDownloadApp} />
            {/* Spotlight on our other software (lib/products.ts) */}
            <ProductSpotlight />
            <Showcase versionTag={versionTag} onToast={showToast} />
            <Features />
            <TutorialTeaser />
            {/* the installer card only; the guide and requirements are on /download */}
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
              compact
            />
            <GridsAndGuides />
            {/* one question per topic and a link to /faq (FaqStructuredData short in app/page.tsx) */}
            <Faq short />
            <CtaBanner versionTag={versionTag} fileSizeText={fileSizeText} onDownloadClick={handleDownloadApp} />
          </>
        ) : (
          <>
            {/* The website's home: the suite, every product and where to go next */}
            <CompanyHero stats={stats} />
            <ProductGrid excelVersion={versionTag} />
            <ToolkitBand />
            {/* How the programs follow one job */}
            <ToolkitFlow />
            <WhyUs />
            {/* Published reviews of any program; hidden until there are some */}
            <HomeReviews />
            {/* Grid converter pages and guides */}
            <GridsAndGuides leftHeading />
            {/* Questions about every program (FaqStructuredData home in app/page.tsx) */}
            <HomeFaq />
            <CompanyCta />
          </>
        )}
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
