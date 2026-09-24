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
  Sparkles,
  Laptop
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
      onToast(`🚀 Starting download for ExcelToKMLPro-Lite-Setup.exe (${versionTag})`);
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
      setCopied(true);
      onToast("📋 SHA-256 hash copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <section className="py-20 lg:py-24 bg-white border-b border-slate-100" id="download">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        
        {/* Section Header (Meaningful, Clear, No Buzzwords) */}
        <div className="text-center max-w-[620px] mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Download &amp; Installation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 mb-3">
            Download Excel to KML Pro
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Install the desktop application on Windows or download our sample survey dataset to test coordinate conversion right away.
          </p>
        </div>

        {/* Primary Download Card */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-2xl bg-[#fafbfc] border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Details (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                  <Laptop className="w-3.5 h-3.5" />
                  Windows 64-bit
                </span>
                <span className="text-xs text-slate-500 font-medium">{releaseDateText}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Official Windows Desktop Application
              </h3>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Runs natively on Windows 10 and Windows 11. Includes all 6,800+ national EPSG coordinate grids pre-installed, allowing you to convert and verify total station files without needing CAD or expensive GIS desktop licenses.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadExe}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] active:translate-y-0.5 text-white text-sm font-semibold rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.28)] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Windows Installer</span>
                </button>

                <button
                  onClick={handleDownloadSampleCsv}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download Sample CSV</span>
                </button>
              </div>
            </div>

            {/* Right Metadata Card (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-3 font-sans">
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                <span className="text-slate-500">Current Release</span>
                <span className="font-mono font-bold text-slate-800">{versionTag}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                <span className="text-slate-500">Operating System</span>
                <span className="font-medium text-slate-800">Windows 10 / 11 (64-bit)</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                <span className="text-slate-500">License</span>
                <span className="font-semibold text-emerald-700">Free for Registered Users</span>
              </div>

              {/* SHA-256 Checksum */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span className="font-medium">SHA-256 Checksum:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Binary
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                  <code className="text-[11px] font-mono text-slate-700 truncate mr-2 select-all">
                    {sha256Hash}
                  </code>
                  <button
                    onClick={handleCopyHash}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
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

        {/* Secondary Options Cards (2 clean columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Web App */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Online Web Converter</h4>
                  <span className="text-[11px] font-semibold text-blue-600 font-mono">No Install Needed</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Convert single coordinates or test spreadsheets directly in your browser on any operating system.
              </p>
            </div>
            <a
              href="/app"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Launch Web Tool</span> &rarr;
            </a>
          </div>

          {/* GitHub Releases */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200/60">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Release Notes &amp; Updates</h4>
                  <span className="text-[11px] font-semibold text-slate-500 font-mono">GitHub Repository</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                View detailed version changelogs, build signatures, and open source release notes on GitHub.
              </p>
            </div>
            <a
              href={releaseNotesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-700 hover:text-blue-600 inline-flex items-center gap-1"
            >
              <span>View Releases on GitHub</span> &rarr;
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
