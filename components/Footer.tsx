"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import WebAppLink from "./WebAppLink";

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 pb-12 border-b border-slate-100">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
                <Image src="/assets/icon.png" alt="Excel to KML — Geomatics Coordinate Software" width={20} height={20} className="object-contain" />
              </div>
              <span className="text-base font-bold text-slate-900">
                Excel to KML
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-[300px]">
              Survey benchmark &amp; coordinate spreadsheet converter for Google Earth and GIS workflows.
            </p>
            <p className="text-xs text-slate-500">
              Built and maintained by Asjad Mehmood for geomatics professionals.
            </p>
          </div>

          {/* Product Links */}
          <nav aria-label="Product">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">Product</h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              {["/features:Features", "/how-it-works:How It Works", "/formats:File Formats", "/whats-new:What's New"].map((item) => {
                const [href, label] = item.split(":");
                return (
                  <li key={label}>
                    <Link href={href} className="hover:text-blue-600 transition-colors">
                      {label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <WebAppLink className="hover:text-blue-600 transition-colors">Web App</WebAppLink>
              </li>
            </ul>
          </nav>

          {/* Downloads Links */}
          <nav aria-label="Downloads">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">Downloads</h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li>
                <button onClick={onDownloadClick} className="hover:text-blue-600 transition-colors text-left cursor-pointer">
                  Windows Installer (.exe)
                </button>
              </li>
              <li>
                <a href={releaseNotesUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                  Release Notes ({versionTag})
                  <ArrowUpRight className="inline w-3 h-3 ml-0.5 text-slate-400" aria-hidden />
                </a>
              </li>
              <li>
                <Link href="/download" className="hover:text-blue-600 transition-colors">
                  All Downloads (Windows, Android)
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources Links */}
          <nav aria-label="Resources">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">Resources</h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              {[
                ["https://github.com/Asjad-Mehmood/kml-convertor/releases", "Releases on GitHub"],
                ["https://github.com/Asjad-Mehmood/kml-convertor/issues", "Report a Problem"],
                ["/convert", "Grid Converters"],
                ["/tutorial", "App Tutorial"],
                ["/guides", "Guides"],
                ["/faq", "Common Questions"],
                ["/about", "About"],
                ["/contact", "Contact & Support"],
                ["https://epsg.io", "EPSG Geodetic Registry"],
              ].map(([href, label]) => (
                <li key={label}>
                  {href.startsWith("http") ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                      {label}
                      <ArrowUpRight className="inline w-3 h-3 ml-0.5 text-slate-400" aria-hidden />
                    </a>
                  ) : (
                    <Link href={href} className="hover:text-blue-600 transition-colors">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            Copyright &copy; {new Date().getFullYear()} Asjad Mehmood. All rights reserved.
            <span className="block sm:inline sm:ml-1.5 mt-1 sm:mt-0">
              Managed by{" "}
              <a
                href="https://github.com/Chaudaryabdullah89"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-700 hover:text-blue-600 underline underline-offset-2 decoration-slate-300 hover:decoration-blue-600 transition-colors"
              >
                Abdullah
              </a>
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-slate-600">
            <a href="https://github.com/Asjad-Mehmood/kml-convertor/releases" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Releases</a>
            <button onClick={onDownloadClick} className="hover:text-blue-600 transition-colors cursor-pointer">Download</button>
            <WebAppLink className="hover:text-blue-600 transition-colors">Web App</WebAppLink>
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
