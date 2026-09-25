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
  CheckCircle2,
  FolderDown,
  Settings,
  PlayCircle,
  AlertCircle,
  Cpu,
  Monitor,
  MemoryStick,
  HardDrive,
  PackageCheck,
  Terminal,
  WifiOff,
  ArrowRight,
  MapPinned,
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

const INSTALLER_NAME = "ExcelToKMLPro-Lite-Setup.exe";

const REQUIREMENTS = [
  { icon: Monitor, label: "Operating System", value: "Windows 10 / 11", note: "64-bit architecture" },
  { icon: MemoryStick, label: "System Memory", value: "4 GB RAM", note: "8 GB for 50k+ points" },
  { icon: HardDrive, label: "Storage Space", value: "~120 MB free", note: "Includes full EPSG database" },
  { icon: PackageCheck, label: "Dependencies", value: "None", note: "Self-contained, no CAD license" },
];

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
  const [copied, setCopied] = useState<"hash" | "command" | null>(null);

  // Tag may or may not carry a leading "v" depending on the GitHub release
  const displayVersion = versionTag.startsWith("v") ? versionTag : `v${versionTag}`;
  const verifyCommand = `Get-FileHash .\\${INSTALLER_NAME} -Algorithm SHA256`;

  const handleDownloadExe = () => {
    requireAuth(() => {
      trackDownload("windows_installer", INSTALLER_NAME, versionTag);
      onToast(`Starting download for ${INSTALLER_NAME} (${versionTag})`);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = INSTALLER_NAME;
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

  const handleCopy = (kind: "hash" | "command") => {
    const text = kind === "hash" ? sha256Hash : verifyCommand;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      onToast(kind === "hash" ? "SHA-256 hash copied to clipboard" : "PowerShell command copied to clipboard");
      setTimeout(() => setCopied((prev) => (prev === kind ? null : prev)), 2500);
    });
  };

  const steps = [
    {
      icon: FolderDown,
      title: "Download the installer",
      body: (
        <>
          Click <b className="text-slate-800">Download for Windows</b> to get{" "}
          <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] whitespace-nowrap">
            {INSTALLER_NAME}
          </code>{" "}
          ({fileSizeText}).
        </>
      ),
    },
    {
      icon: Settings,
      title: "Run the setup wizard",
      body: <>Double-click the file and follow the on-screen steps. The local EPSG database is configured automatically.</>,
      note: (
        <>
          If SmartScreen appears on first run, click <b>More info</b> &rarr; <b>Run anyway</b>.
        </>
      ),
    },
    {
      icon: PlayCircle,
      title: "Launch & convert",
      body: (
        <>
          Open <b className="text-slate-800">Excel to KML Pro</b> from the Start Menu, drop in your survey CSV or Excel sheet, pick a grid, and export 3D KML to Google Earth.
        </>
      ),
      done: true,
    },
  ];

  return (
    <section
      className="relative py-20 lg:py-28 bg-white border-b border-slate-100 overflow-hidden"
      id="download"
      aria-labelledby="download-heading"
    >
      {/* Soft background glow */}
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(0,113,227,0.08),transparent)] pointer-events-none"
      />

      <div className="relative max-w-[1140px] mx-auto px-5 sm:px-8">

        {/* ── Section Header ── */}
        <div className="text-center max-w-[620px] mx-auto mb-12 lg:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-[11px] font-semibold uppercase tracking-wider mb-4">
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Download &amp; Installation</span>
          </div>
          <h2
            id="download-heading"
            className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.15]"
          >
            Get Excel to KML Pro for Windows
          </h2>
          <p className="text-sm sm:text-[15px] text-slate-500 leading-relaxed max-w-[500px] mx-auto">
            A free, fully offline survey converter. Install in under two minutes, or grab the sample dataset to try a conversion first.
          </p>
        </div>

        {/* ── Primary Download Card ── */}
        <div className="rounded-[28px] bg-white border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-12px_rgba(15,23,42,0.12)] overflow-hidden mb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12">

            {/* Left: product + actions */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10">
              <div className="flex items-start gap-4 sm:gap-5 mb-6">
                <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#0a84ff] to-[#0058b0] shadow-[0_8px_20px_-6px_rgba(0,113,227,0.55)] flex items-center justify-center">
                  <MapPinned className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                      {displayVersion}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Latest stable
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Windows Desktop Installer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{releaseDateText}</p>
                </div>
              </div>

              <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed mb-5 max-w-[520px]">
                Native app for Windows 10 and 11 with 5,800+ EPSG coordinate systems, local Helmert calibration, and Google Earth 3D export built in.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-7">
                {[
                  { icon: WifiOff, text: "Runs 100% offline" },
                  { icon: ShieldCheck, text: "Digitally signed binary" },
                  { icon: CheckCircle2, text: "No admin rights needed" },
                  { icon: CheckCircle2, text: "Free for registered users" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2 text-[13px] text-slate-700">
                    <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={handleDownloadExe}
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] active:translate-y-0.5 text-white text-sm font-semibold rounded-xl shadow-[0_4px_14px_rgba(0,113,227,0.28)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.38)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <Download className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  <span>Download for Windows</span>
                  <span className="text-white text-xs font-normal">· {fileSizeText}</span>
                </button>

                <button
                  onClick={handleDownloadSampleCsv}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Sample CSV</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-3">
                Free account required · Web version available at{" "}
                <a href="/app" className="text-slate-500 underline underline-offset-2 hover:text-[#0071e3]">
                  /app
                </a>
              </p>
            </div>

            {/* Right: build details + verification */}
            <div className="lg:col-span-5 bg-white border-t lg:border-t-0 lg:border-l border-slate-200/80 p-6 sm:p-8 flex flex-col">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Build details
              </h4>
              <dl className="text-[13px] divide-y divide-slate-200/70 mb-6">
                {[
                  { k: "Version", v: <span className="font-mono font-semibold text-slate-900">{displayVersion}</span> },
                  { k: "File", v: <span className="font-mono text-slate-800 text-xs truncate">{INSTALLER_NAME}</span> },
                  { k: "Size", v: <span className="text-slate-800" title={bytesText}>{fileSizeText}</span> },
                  { k: "Platform", v: <span className="text-slate-800">Windows 10 / 11 · x64</span> },
                ].map(({ k, v }) => (
                  <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-slate-500 shrink-0">{k}</dt>
                    <dd className="min-w-0 text-right truncate">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Verify your download
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    SHA-256
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-1.5 py-1.5 mb-2">
                  <code className="flex-1 min-w-0 text-[11px] font-mono text-slate-700 truncate select-all">
                    {sha256Hash}
                  </code>
                  <button
                    onClick={() => handleCopy("hash")}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Copy SHA-256 hash"
                    aria-label="Copy SHA-256 hash"
                  >
                    {copied === "hash" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 rounded-xl pl-3 pr-1.5 py-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <code className="flex-1 min-w-0 text-[11px] font-mono text-slate-200 truncate">
                    {verifyCommand}
                  </code>
                  <button
                    onClick={() => handleCopy("command")}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Copy PowerShell command"
                    aria-label="Copy PowerShell verification command"
                  >
                    {copied === "command" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-snug">
                  Run in PowerShell from your Downloads folder — the output should match the hash above.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Installation Steps ── */}
        <div className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Installation guide
              </h3>
              <p className="text-[13px] sm:text-sm text-slate-500 mt-1">
                Three steps, under two minutes.
              </p>
            </div>
          </div>

          <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Connecting line (desktop) */}
            <div
              aria-hidden
              className="hidden md:block absolute top-[27px] left-[calc(16.66%+20px)] right-[calc(16.66%+20px)] h-px bg-gradient-to-r from-blue-200 via-blue-200 to-emerald-200"
            />

            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="relative flex md:flex-col md:items-center gap-4 md:gap-0 md:text-center">
                  {/* Connecting line (mobile) */}
                  {i < steps.length - 1 && (
                    <div aria-hidden className="md:hidden absolute left-[27px] top-14 bottom-[-16px] w-px bg-blue-100" />
                  )}

                  <div
                    className={`relative z-10 shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.08),0_4px_12px_-4px_rgba(15,23,42,0.12)] ${
                      s.done ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-[#0071e3]"
                    }`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.8} />
                    <span
                      className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold font-mono text-white flex items-center justify-center ring-2 ring-white ${
                        s.done ? "bg-emerald-500" : "bg-[#0071e3]"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </div>

                  <div className="flex-1 md:mt-5 pb-2 md:pb-0 md:max-w-[300px]">
                    <h4 className="font-bold text-slate-900 text-[15px] mb-1.5">{s.title}</h4>
                    <p className="text-[13px] text-slate-600 leading-relaxed">{s.body}</p>
                    {s.note && (
                      <div className="mt-3 p-2.5 bg-amber-50/80 border border-amber-200/70 rounded-lg text-[11.5px] text-amber-900 leading-normal flex items-start gap-1.5 text-left">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{s.note}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── System Requirements ── */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 sm:p-6 mb-14">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>System requirements</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {REQUIREMENTS.map(({ icon: Icon, label, value, note }) => (
              <div key={label} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200/70">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500">{label}</div>
                  <div className="text-[13px] font-bold text-slate-900">{value}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Secondary Options (Web App & GitHub) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <a
            href="/app"
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-200 hover:shadow-[0_8px_24px_-12px_rgba(0,113,227,0.25)] transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0071e3] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                <h4 className="font-bold text-slate-900 text-[15px]">Online web converter</h4>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  No install
                </span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Convert coordinates in Chrome, Edge, or Firefox on any device.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0071e3] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
          </a>

          <a
            href={releaseNotesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                <h4 className="font-bold text-slate-900 text-[15px]">Release notes &amp; updates</h4>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  GitHub
                </span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Changelogs, commit signatures, and previous builds.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
          </a>
        </div>

      </div>
    </section>
  );
}
