"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Laptop,
  CheckCircle2,
  FolderDown,
  Settings,
  PlayCircle,
  AlertCircle,
  Cpu
} from "lucide-react";

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
  const [copied, setCopied] = useState(false);

  const handleDownloadExe = () => {
    requireAuth(() => {
      trackDownload("windows_installer", "ExcelToKMLPro-Lite-Setup.exe", versionTag);
      onToast(`Starting download for ExcelToKMLPro-Lite-Setup.exe (${versionTag})`);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "ExcelToKMLPro-Lite-Setup.exe";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, "Surveyor Authentication Required: Please sign in or register to download the Windows Installer.");
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
      onToast("Downloaded Survey_Sample_Coordinates_DLTM.csv");
    }, "Please sign in or register to download the sample survey coordinates dataset.");
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sha256Hash).then(() => {
      setCopied(true);
      onToast("SHA-256 hash copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <section className="py-20 lg:py-24 bg-white border-b border-slate-100" id="download">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">

        {/* ── Section Header ── */}
        <div className="text-center max-w-[640px] mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-3">
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download &amp; Installation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 mb-2.5">
            Download Excel to KML Pro — Free Windows Survey Converter
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Install the native Windows desktop application or download our sample survey dataset to test coordinate conversion.
          </p>
        </div>

        {/* ── Primary Download Card ── */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Column: Details & Actions (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                  <Laptop className="w-3.5 h-3.5" />
                  Windows 64-bit
                </span>
                <span className="text-xs text-slate-500 font-medium">Released: {releaseDateText}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  v{versionTag}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Windows Standalone Installer
              </h3>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Native desktop installer for Windows 10 and Windows 11. Includes all 6,864 EPSG datums, local Helmert calibration, and Google Earth 3D export. Runs 100% offline with zero external cloud dependencies.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadExe}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] active:translate-y-0.5 text-white text-sm font-semibold rounded-xl shadow-[0_4px_14px_rgba(0,113,227,0.28)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.38)] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download for Windows</span>
                  <span className="text-blue-100 text-xs font-normal">({fileSizeText})</span>
                </button>

                <button
                  onClick={handleDownloadSampleCsv}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Security & Verification Note */}
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Digitally signed binary · Virus-free · No admin rights required for standard install</span>
              </div>
            </div>

            {/* Right Column: Build Metadata Card (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 font-sans">
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                <span className="text-slate-500">Version</span>
                <span className="font-mono font-bold text-slate-900">{versionTag}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                <span className="text-slate-500">File Size</span>
                <span className="font-mono text-slate-800">{fileSizeText} <span className="text-slate-400 font-sans">({bytesText})</span></span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                <span className="text-slate-500">Supported OS</span>
                <span className="font-medium text-slate-800">Windows 10 / 11 (64-bit)</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                <span className="text-slate-500">License</span>
                <span className="font-semibold text-emerald-700">Free for Registered Users</span>
              </div>

              {/* SHA-256 Checksum */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span className="font-medium">SHA-256 File Checksum:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Hash
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <code className="text-[11px] font-mono text-slate-700 truncate mr-2 select-all">
                    {sha256Hash}
                  </code>
                  <button
                    onClick={handleCopyHash}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer shrink-0"
                    title="Copy SHA-256 hash"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Step-by-Step Installation Instructions ── */}
        <div className="mb-12">
          <div className="text-left mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Installation Instructions
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Setup takes less than 2 minutes. Follow these simple steps to install and start converting:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center font-bold font-mono text-sm border border-blue-100">
                  1
                </div>
                <FolderDown className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                Download the Installer
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click <b>Download for Windows</b> above to get <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">ExcelToKMLPro-Lite-Setup.exe</code> ({fileSizeText}).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center font-bold font-mono text-sm border border-blue-100">
                  2
                </div>
                <Settings className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                Run the Setup Wizard
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-2">
                Double-click the downloaded setup file and follow the on-screen steps. It configures the local EPSG database automatically.
              </p>
              <div className="p-2 bg-amber-50/80 border border-amber-200/70 rounded-lg text-[11px] text-amber-900 leading-normal flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>If Windows SmartScreen prompts on first run, click <b>More info</b> &rarr; <b>Run anyway</b>.</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold font-mono text-sm border border-emerald-100">
                  3
                </div>
                <PlayCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                Launch &amp; Convert
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Open <b>Excel to KML Pro</b> from your Start Menu. Drag &amp; drop your survey CSV or Excel spreadsheet, pick your grid, and export your 3D KML file directly into Google Earth.
              </p>
            </div>
          </div>
        </div>

        {/* ── System Requirements ── */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 mb-12">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>System Requirements</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-[11px] text-slate-500 mb-1">Operating System</div>
              <div className="text-xs font-bold text-slate-900">Windows 10 / 11</div>
              <div className="text-[10px] text-slate-400 mt-0.5">64-bit architecture</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-[11px] text-slate-500 mb-1">System Memory</div>
              <div className="text-xs font-bold text-slate-900">4 GB RAM</div>
              <div className="text-[10px] text-slate-400 mt-0.5">8 GB for 50k+ points</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-[11px] text-slate-500 mb-1">Storage Space</div>
              <div className="text-xs font-bold text-slate-900">~120 MB free</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Includes full EPSG database</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-[11px] text-slate-500 mb-1">Dependencies</div>
              <div className="text-xs font-bold text-emerald-700">None (Self-contained)</div>
              <div className="text-[10px] text-slate-400 mt-0.5">No CAD license needed</div>
            </div>
          </div>
        </div>

        {/* ── Secondary Options (Web App & GitHub) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Web App */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Online Web Converter</h4>
                  <span className="text-[11px] font-semibold text-blue-600 font-mono">No Install Required</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Need to convert coordinates quickly without installing software? Run the web edition in Chrome, Edge, or Firefox on any device.
              </p>
            </div>
            <a
              href="/app"
              className="text-xs font-semibold text-[#0071e3] hover:text-[#0077ed] inline-flex items-center gap-1.5"
            >
              <span>Open Online Web Converter</span> &rarr;
            </a>
          </div>

          {/* GitHub Releases */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Release Notes &amp; Updates</h4>
                  <span className="text-[11px] font-semibold text-slate-500 font-mono">GitHub Repository</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Read version changelogs, review commit signatures, or download previous release builds from GitHub.
              </p>
            </div>
            <a
              href={releaseNotesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-700 hover:text-[#0071e3] inline-flex items-center gap-1.5"
            >
              <span>View Releases on GitHub</span> &rarr;
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
