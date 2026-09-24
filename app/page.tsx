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
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { requireAuth, trackDownload } = useAuth();

  // Dynamic GitHub Release details
  const [versionTag, setVersionTag] = useState("v3.5.5");
  const [downloadUrl, setDownloadUrl] = useState(
    "https://github.com/chaudaryyabdullah03-collab/kml-convertor/releases/latest/download/ExcelToKMLPro-Lite-Setup.exe"
  );
  const [releaseNotesUrl, setReleaseNotesUrl] = useState(
    "https://github.com/chaudaryyabdullah03-collab/kml-convertor/releases/latest"
  );
  const [fileSizeText, setFileSizeText] = useState("3.14 MB");
  const [bytesText, setBytesText] = useState("3.14 MB (3,291,632 bytes)");
  const [releaseDateText, setReleaseDateText] = useState("Release Build: September 2026");
  const [sha256Hash, setSha256Hash] = useState(
    "2ba12091e995085a9472520701c8e67d7668e6c1771499cde68b5456680429c1"
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
      try {
        const res = await fetch(
          "https://api.github.com/repos/chaudaryyabdullah03-collab/kml-convertor/releases/latest"
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
    }, "Surveyor Authentication Required: Please create a free account or sign in to download the Windows Installer.");
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

      {/* FAQ */}
      <Faq />

      {/* Bottom CTA Banner */}
      <CtaBanner
        versionTag={versionTag}
        fileSizeText={fileSizeText}
        onDownloadClick={handleDownloadApp}
      />

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
