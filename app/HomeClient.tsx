"use client";

import { loadPublicSettings } from "@/lib/publicSettings";
import React, { useState, useEffect } from "react";
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
import { LATEST_VERSION } from "@/lib/site";

export default function HomeClient() {
  const { requireAuth, trackDownload } = useAuth();

  // Dynamic GitHub Release details
  const [versionTag, setVersionTag] = useState(LATEST_VERSION);
  const [downloadUrl, setDownloadUrl] = useState(
    "https://github.com/Asjad-Mehmood/kml-convertor/releases/latest/download/ExcelToKMLPro-Lite-Setup.exe"
  );
  const [releaseNotesUrl, setReleaseNotesUrl] = useState(
    "https://github.com/Asjad-Mehmood/kml-convertor/releases/latest"
  );
  const [fileSizeText, setFileSizeText] = useState("3.15 MB");
  const [bytesText, setBytesText] = useState("3.15 MB (3,305,002 bytes)");
  const [releaseDateText, setReleaseDateText] = useState("Release Build: Sep 25, 2026");
  const [sha256Hash, setSha256Hash] = useState(
    "70b6f5638be6231b651b65a4af8815d3cab1c006f4822481878f5b75fb0c77e2"
  );

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  // Fetch latest GitHub release details
  useEffect(() => {
    async function loadRelease() {
      // Admin settings (version, installer file and size) are the fallback;
      // GitHub's latest release, when it answers, is the source of truth
      const settings = await loadPublicSettings();
      if (settings?.appVersion) setVersionTag(settings.appVersion);
      if (settings?.installerFileSize) {
        setFileSizeText(settings.installerFileSize);
        setBytesText(settings.installerFileSize);
      }
      if (settings?.installerFileName && /^[\w.-]+\.exe$/i.test(settings.installerFileName)) {
        setDownloadUrl(`https://github.com/Asjad-Mehmood/kml-convertor/releases/latest/download/${settings.installerFileName}`);
      }
      try {
        const res = await fetch(
          "https://api.github.com/repos/Asjad-Mehmood/kml-convertor/releases/latest"
        );
        if (!res.ok) return;
        const data = await res.json();
        const tag = data.tag_name || data.name;
        if (tag) {
          setVersionTag(tag);
        }
        if (data.html_url) {
          setReleaseNotesUrl(data.html_url);
        }
        if (data.published_at) {
          const pubDate = new Date(data.published_at);
          setReleaseDateText(
            `Release Build: ${pubDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`
          );
        }
        if (data.assets && Array.isArray(data.assets) && data.assets.length > 0) {
          const exeAsset =
            data.assets.find((a: { name?: string }) => a.name && a.name.endsWith(".exe")) ||
            data.assets[0];
          if (exeAsset) {
            if (exeAsset.browser_download_url) {
              setDownloadUrl(exeAsset.browser_download_url);
            }
            if (exeAsset.size) {
              const mb = (exeAsset.size / (1024 * 1024)).toFixed(2) + " MB";
              setFileSizeText(mb);
              setBytesText(`${mb} (${exeAsset.size.toLocaleString()} bytes)`);
            }
            if (exeAsset.digest && exeAsset.digest.startsWith("sha256:")) {
              setSha256Hash(exeAsset.digest.replace("sha256:", ""));
            } else if (data.body) {
              const match = data.body.match(/[a-fA-F0-9]{64}/);
              if (match) setSha256Hash(match[0]);
            }
          }
        }
      } catch {
        // Fallback pre-populated
      }
    }
    loadRelease();
  }, []);

  // Gated download handler used across buttons
  const handleDownloadApp = () => {
    requireAuth(() => {
      trackDownload("windows_installer", "ExcelToKMLPro-Lite-Setup.exe", versionTag);
      showToast(`🚀 Starting download for ExcelToKMLPro-Lite-Setup.exe (${versionTag})`);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "ExcelToKMLPro-Lite-Setup.exe";
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
