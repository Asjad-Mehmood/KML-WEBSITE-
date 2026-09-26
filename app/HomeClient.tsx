"use client";

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
import { useDownloadGate } from "../context/useDownloadGate";
import { useSiteSettings } from "../context/SiteSettings";
import { GITHUB_REPO_URL, RELEASES_API_URL } from "@/lib/site";

type ReleaseAsset = { name?: string; size?: number; browser_download_url?: string; digest?: string };
type Release = { tag: string; url: string; date: string; assets: ReleaseAsset[]; body: string };

const REPO = GITHUB_REPO_URL;

export default function HomeClient() {
  const { trackDownload } = useAuth();
  const gate = useDownloadGate();
  const site = useSiteSettings();

  // The latest GitHub release, read live; until it arrives (or if GitHub can't be reached)
  // the version, size and file name set in the admin page are shown.
  const [release, setRelease] = useState<Release | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  useEffect(() => {
    let alive = true;
    fetch(RELEASES_API_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        setRelease({
          tag: data.tag_name || data.name || "",
          url: data.html_url || "",
          date: data.published_at || "",
          assets: Array.isArray(data.assets) ? data.assets : [],
          body: data.body || "",
        });
      })
      .catch(() => {
        // the admin settings stand in
      });
    return () => {
      alive = false;
    };
  }, []);

  const installerName = site.installerFileName || "ExcelToKMLPro-Lite-Setup.exe";
  const asset =
    release?.assets.find((a) => a.name === installerName) ||
    release?.assets.find((a) => a.name?.toLowerCase().endsWith(".exe")) ||
    null;
  const versionTag = release?.tag || site.appVersion || "v4.0.0";
  const downloadUrl = asset?.browser_download_url || `${REPO}/releases/latest/download/${encodeURIComponent(installerName)}`;
  const downloadName = asset?.name || installerName;
  const releaseNotesUrl = release?.url || `${REPO}/releases/latest`;
  const mb = asset?.size ? (asset.size / (1024 * 1024)).toFixed(2) + " MB" : "";
  const fileSizeText = mb || site.installerFileSize || "3.2 MB";
  const bytesText = asset?.size ? `${mb} (${asset.size.toLocaleString()} bytes)` : fileSizeText;
  const releaseDateText = release?.date
    ? `Release Build: ${new Date(release.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "Latest release";
  const sha256Hash =
    (asset?.digest?.startsWith("sha256:") ? asset.digest.slice(7) : "") ||
    release?.body.match(/[a-fA-F0-9]{64}/)?.[0] ||
    "";

  // Download buttons follow the admin setting "Require sign-in to download"
  const handleDownloadApp = () => {
    gate(() => {
      trackDownload("windows_installer", downloadName, versionTag);
      showToast(`🚀 Starting download for ${downloadName} (${versionTag})`);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
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
          installerName={downloadName}
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
