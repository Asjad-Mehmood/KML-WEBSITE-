"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";

interface DownloadHubProps {
  versionTag: string;
  downloadUrl: string;
  releaseNotesUrl: string;
  fileSizeText: string;
  bytesText: string;
  releaseDateText: string;
  sha256Hash: string;
  onToast: (msg: string) => void;
}

export default function DownloadHub({
  versionTag,
  downloadUrl,
  releaseNotesUrl,
  fileSizeText,
  bytesText,
  releaseDateText,
  sha256Hash,
  onToast,
}: DownloadHubProps) {
  const { requireAuth, trackDownload } = useAuth();

  const handleDownloadExe = () => {
    requireAuth(() => {
      trackDownload("windows_installer", "ExcelToKMLPro-Lite-Setup.exe", versionTag);
      onToast(`🚀 Initiating download for ExcelToKMLPro-Lite-Setup.exe (${versionTag})`);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "ExcelToKMLPro-Lite-Setup.exe";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, "Surveyor Authentication Required: Please create a free account or log in to download the Windows Installer.");
  };

  const handleDownloadSampleCsv = (e: React.MouseEvent) => {
    e.preventDefault();
    requireAuth(() => {
      const csvData = `STATION,EASTING,NORTHING,ELEVATION,CODE,REMARKS
TBM-01,513556.612,2787467.856,14.85,BENCHMARK,Concrete Pillar on Site Boundary
TBM-02,513642.180,2787510.320,15.22,BENCHMARK,Brass Pin in Rock Outcrop
CORNER-NW,513490.100,2787590.450,14.10,BOUNDARY,Perimeter Fence Post NW
CORNER-NE,513720.500,2787610.200,15.40,BOUNDARY,Perimeter Fence Post NE
CORNER-SE,513745.300,2787400.800,16.05,BOUNDARY,Perimeter Fence Post SE
CORNER-SW,513510.800,2787380.150,14.50,BOUNDARY,Perimeter Fence Post SW
TREE-01,513580.400,2787490.000,14.90,TREE,Heritage Date Palm #1
TREE-02,513610.200,2787475.600,15.05,TREE,Heritage Date Palm #2
BLDG-C1,513560.000,2787440.000,15.10,STRUCTURE,Building Column Corner A
BLDG-C2,513620.000,2787440.000,15.15,STRUCTURE,Building Column Corner B
`;
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Survey_Sample_Coordinates_DLTM.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      trackDownload("sample_csv", "Survey_Sample_Coordinates_DLTM.csv", versionTag);
      onToast("📁 Downloaded Survey_Sample_Coordinates_DLTM.csv");
    }, "Please sign in or register to download the sample survey coordinates dataset.");
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sha256Hash).then(() => {
      onToast("📋 SHA-256 hash copied to clipboard");
    });
  };

  return (
    <section className="py-20 bg-white" id="download">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full mb-3 border border-amber-200">
            Official Release {versionTag}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-4">
            Download Excel to KML Pro
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Get the official release for Windows. Lightweight, native, and completely free to use for registered surveyors.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Primary Banner Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-slate-200 shadow-xl shadow-slate-200/50 mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-amber-400 text-slate-950 font-mono font-bold text-xs px-2.5 py-0.5 rounded shadow-2xs">
                    RECOMMENDED
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{releaseDateText}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                  Windows Native Installer (Lite)
                </h3>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Installs in seconds and uses the Microsoft Edge WebView2 display engine already built into Windows 10
                  and 11. Includes taskbar integration, clean window chrome, and full offline EPSG database.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <button
                    onClick={handleDownloadExe}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <svg className="w-6 h-6 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-extrabold">Download Windows Installer</div>
                      <div className="text-xs font-normal text-blue-100">
                        ExcelToKMLPro-Lite-Setup.exe &bull; {fileSizeText}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadSampleCsv}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer"
                    title="Download a test CSV dataset with coordinates"
                  >
                    <svg className="w-4 h-4 text-blue-600 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <span>Download Sample CSV</span>
                  </button>
                </div>
              </div>

              {/* Metadata Box Right */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-400">Version</span>
                  <span className="font-mono font-bold text-slate-800">{versionTag}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-400">Operating System</span>
                  <span className="font-medium text-slate-800">Windows 10 / 11 (64-bit)</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-400">File Size</span>
                  <span className="font-mono font-bold text-slate-800">{bytesText}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-400">License</span>
                  <span className="font-bold text-emerald-600">Open Source / Free</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                    <span>SHA-256 Checksum:</span>
                    <span className="text-emerald-600">Verified Binary</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <code className="text-[11px] font-mono text-slate-700 truncate mr-2 select-all">
                      {sha256Hash}
                    </code>
                    <button
                      onClick={handleCopyHash}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                      title="Copy SHA-256 hash"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Download Alternatives */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Web App */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-5 h-5 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">In-Browser Web App</h4>
                    <span className="text-[11px] font-bold text-emerald-600">Zero Installation</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Runs directly in any modern browser on macOS, Linux, ChromeOS, and Windows. Same full EPSG coordinate engine.
                </p>
              </div>
              <a
                href="/app"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>Launch Web Tool</span> &rarr;
              </a>
            </div>

            {/* Portable Version */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <svg className="w-5 h-5 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Portable USB Edition</h4>
                    <span className="text-[11px] font-bold text-amber-600">No Setup Required</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Single standalone executable. Copy to a thumb drive and run directly on any field laptop without administrator privileges.
                </p>
              </div>
              <a
                href={releaseNotesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>View Releases on GitHub</span> &rarr;
              </a>
            </div>

            {/* Mobile & PWA */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Android &amp; iOS PWA</h4>
                    <span className="text-[11px] font-bold text-purple-600">Mobile Friendly</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Android APK and iOS Progressive Web App (PWA). Add to home screen in Safari or Chrome for offline surveying in the field.
                </p>
              </div>
              <a
                href="https://github.com/chaudaryyabdullah03-collab/kml-convertor/tree/main/android"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>Mobile Build Instructions</span> &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
