"use client";

import { useLatestRelease } from "@/lib/useLatestRelease";
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Showcase from "../components/Showcase";
import MetricsRibbon from "../components/MetricsRibbon";
import Features from "../components/Features";
import Workflow from "../components/Workflow";
import DownloadHub from "../components/DownloadHub";
import SpecsTable from "../components/SpecsTable";
import Faq from "../components/Faq";
import GridsAndGuides from "../components/GridsAndGuides";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function HomeClient() {
  const { requireAuth, trackDownload } = useAuth();

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
      trackDownload("windows_installer", fileName, versionTag);
      showToast(`Starting download for ${fileName} (${versionTag})`);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
        {/* Hero */}
        <Hero
          versionTag={versionTag}
          fileSizeText={fileSizeText}
          onDownloadClick={handleDownloadApp}
        />

        {/* Showcase Window */}
        <Showcase versionTag={versionTag} onToast={showToast} />

        {/* Metrics Ribbon */}
        <MetricsRibbon />

        {/* Key Features */}
        <Features />

        {/* 3-Step Workflow */}
        <Workflow />

        {/* Download Hub */}
        <DownloadHub
          versionTag={versionTag}
          downloadUrl={downloadUrl}
          releaseNotesUrl={releaseNotesUrl}
          fileSizeText={fileSizeText}
          bytesText={bytesText}
          releaseDateText={releaseDateText}
          sha256Hash={sha256Hash}
          onToast={showToast}
        />

        {/* Technical Specifications */}
        <SpecsTable />

        {/* Grid converter pages and guides */}
        <GridsAndGuides />

        {/* FAQ */}
        <Faq />

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
