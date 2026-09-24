"use client";

import React from "react";
import Image from "next/image";

interface FooterProps {
  versionTag: string;
  downloadUrl: string;
  releaseNotesUrl: string;
  onDownloadClick: () => void;
}

export default function Footer({ versionTag, releaseNotesUrl, onDownloadClick }: FooterProps) {
  return (
    <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7] pt-16 pb-10">
      <div className="max-w-[980px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#d2d2d7]">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-[#0071e3] flex items-center justify-center">
                <Image src="/assets/icon.png" alt="KML Pro" width={20} height={20} className="object-contain" />
              </div>
              <span className="text-[15px] font-semibold text-[#1d1d1f]">
                Excel to KML <span className="text-[#0071e3] font-bold">Pro</span>
              </span>
            </div>
            <p className="text-[13px] text-[#6e6e73] leading-relaxed max-w-[280px]">
              The open-source survey benchmark coordinate converter for Google Earth.
            </p>
            <p className="text-[12px] text-[#aeaeb2]">
              By <span className="text-[#6e6e73]">Asjad Mehmood</span> &amp; <span className="text-[#6e6e73]">chaudaryyabdullah03-collab</span>
            </p>
          </div>

          {/* Product */}
          <div>
            <h5 className="text-[11px] font-semibold uppercase tracking-widest text-[#aeaeb2] mb-4">Product</h5>
            <ul className="space-y-3 text-[13px] text-[#6e6e73]">
              {["#features:Features", "#showcase:Live Demo", "#workflow:How It Works", "#specs:Specifications", "/app:Web App"].map((item) => {
                const [href, label] = item.split(":");
                return <li key={label}><a href={href} className="hover:text-[#0071e3] transition-colors">{label}</a></li>;
              })}
            </ul>
          </div>

          {/* Downloads */}
          <div>
            <h5 className="text-[11px] font-semibold uppercase tracking-widest text-[#aeaeb2] mb-4">Downloads</h5>
            <ul className="space-y-3 text-[13px] text-[#6e6e73]">
              <li><button onClick={onDownloadClick} className="hover:text-[#0071e3] transition-colors text-left">Windows Installer (.exe)</button></li>
              <li><a href={releaseNotesUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#0071e3] transition-colors">Release Notes ({versionTag})</a></li>
              <li><a href="https://github.com/chaudaryyabdullah03-collab/kml-convertor/tree/main/android" target="_blank" rel="noopener noreferrer" className="hover:text-[#0071e3] transition-colors">Android APK</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h5 className="text-[11px] font-semibold uppercase tracking-widest text-[#aeaeb2] mb-4">Resources</h5>
            <ul className="space-y-3 text-[13px] text-[#6e6e73]">
              {[
                ["https://github.com/chaudaryyabdullah03-collab/kml-convertor", "GitHub"],
                ["https://github.com/chaudaryyabdullah03-collab/kml-convertor/issues", "Issue Tracker"],
                ["#faq", "FAQ & Help"],
                ["https://epsg.io", "EPSG Registry"],
              ].map(([href, label]) => (
                <li key={label}><a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="hover:text-[#0071e3] transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#aeaeb2]">
          <p>Copyright © 2026 Excel to KML Pro. Open-source community license.</p>
          <div className="flex items-center gap-6 text-[#6e6e73]">
            <a href="https://github.com/chaudaryyabdullah03-collab/kml-convertor" target="_blank" rel="noopener noreferrer" className="hover:text-[#0071e3] transition-colors">GitHub</a>
            <button onClick={onDownloadClick} className="hover:text-[#0071e3] transition-colors">Download</button>
            <a href="/app" className="hover:text-[#0071e3] transition-colors">Web App</a>
            <a href="/admin" className="hover:text-[#0071e3] transition-colors">Admin Portal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
