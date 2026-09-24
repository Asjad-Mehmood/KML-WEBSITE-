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
    <footer className="bg-white border-t border-slate-100 pt-16 pb-12">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-100">
          
          {/* Brand */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
                <Image src="/assets/icon.png" alt="KML Pro" width={20} height={20} className="object-contain" />
              </div>
              <span className="text-base font-bold text-slate-900">
                Excel to KML <span className="text-blue-600">Pro</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-[300px]">
              Survey benchmark &amp; coordinate spreadsheet converter for Google Earth and GIS workflows.
            </p>
            <p className="text-xs text-slate-400">
              Open-source project maintained for geomatics professionals.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">Product</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              {["#showcase:Live Map Demo", "#features:Features", "#workflow:How It Works", "#specs:Specifications", "/app:Web App"].map((item) => {
                const [href, label] = item.split(":");
                return (
                  <li key={label}>
                    <a href={href} className="hover:text-blue-600 transition-colors">
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Downloads Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">Downloads</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li>
                <button onClick={onDownloadClick} className="hover:text-blue-600 transition-colors text-left cursor-pointer">
                  Windows Installer (.exe)
                </button>
              </li>
              <li>
                <a href={releaseNotesUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                  Release Notes ({versionTag})
                </a>
              </li>
              <li>
                <a href="#download" className="hover:text-blue-600 transition-colors">
                  Sample Survey CSV
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">Resources</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              {[
                ["https://github.com/chaudaryyabdullah03-collab/kml-convertor", "GitHub Repository"],
                ["https://github.com/chaudaryyabdullah03-collab/kml-convertor/issues", "Issue Tracker"],
                ["#faq", "Common Questions"],
                ["https://epsg.io", "EPSG Geodetic Registry"],
              ].map(([href, label]) => (
                <li key={label}>
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>Copyright &copy; 2026 Excel to KML Pro. Open-source geomatics software.</p>
          <div className="flex items-center gap-5 text-slate-600">
            <a href="https://github.com/chaudaryyabdullah03-collab/kml-convertor" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">GitHub</a>
            <button onClick={onDownloadClick} className="hover:text-blue-600 transition-colors cursor-pointer">Download</button>
            <a href="/app" className="hover:text-blue-600 transition-colors">Web App</a>
            <a href="/admin" className="hover:text-blue-600 transition-colors">Admin</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
