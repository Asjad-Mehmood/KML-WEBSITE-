"use client";

import React from "react";
import { Download } from "lucide-react";

interface CtaBannerProps {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
}

export default function CtaBanner({ versionTag, fileSizeText, onDownloadClick }: CtaBannerProps) {
  return (
    <section className="py-24 bg-[#f5f5f7]">
      <div className="max-w-[720px] mx-auto px-5 sm:px-8 text-center">
        <h2 className="text-[40px] sm:text-[52px] font-bold tracking-tight text-[#1d1d1f] mb-5">
          Start converting your<br />survey files today.
        </h2>
        <p className="text-[17px] text-[#6e6e73] mb-10">
          Download Excel to KML Pro {versionTag} for Windows, completely free for registered surveyors.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onDownloadClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[17px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] rounded-full transition-all shadow-md"
          >
            <Download className="w-5 h-5" />
            Download for Windows
            <span className="text-[13px] text-blue-200 font-normal ml-1">({fileSizeText})</span>
          </button>

          <a href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-[17px] font-medium text-[#0071e3] bg-white hover:bg-[#f5f5f7] rounded-full border border-[#d2d2d7] transition-colors"
          >
            Launch Web App →
          </a>
        </div>
      </div>
    </section>
  );
}
