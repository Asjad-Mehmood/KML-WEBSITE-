"use client";

import React from "react";
import Image from "next/image";

interface FooterProps {
  versionTag: string;
  downloadUrl: string;
  releaseNotesUrl: string;
  onDownloadClick: () => void;
}

export default function Footer({
  versionTag,
  releaseNotesUrl,
  onDownloadClick,
}: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-100">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center p-1">
                <Image
                  src="/assets/icon.png"
                  alt="Excel to KML Pro Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Excel to KML <span className="text-blue-600 font-black">PRO</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
              The open-source survey benchmark coordinate converter for Google Earth. Designed for surveyors, civil engineers, and GIS professionals worldwide.
            </p>
            <div className="text-xs text-slate-400">
              Developed by <strong className="text-slate-700 font-semibold">Asjad Mehmood</strong> &bull; Maintained by{" "}
              <strong className="text-slate-700 font-semibold">chaudaryyabdullah03-collab</strong>
            </div>
          </div>

          {/* Product */}
          <div>
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-4">
              Product
            </h5>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500">
              <li>
                <a href="#features" className="hover:text-blue-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#showcase" className="hover:text-blue-600 transition-colors">
                  Live Playground
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-blue-600 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#specs" className="hover:text-blue-600 transition-colors">
                  Specifications
                </a>
              </li>
              <li>
                <a href="/app.html" target="_blank" className="hover:text-blue-600 transition-colors">
                  Full Web App
                </a>
              </li>
            </ul>
          </div>

          {/* Downloads */}
          <div>
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-4">
              Downloads
            </h5>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500">
              <li>
                <button
                  onClick={onDownloadClick}
                  className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                >
                  Windows Installer (.exe)
                </button>
              </li>
              <li>
                <a
                  href={releaseNotesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  Release Notes ({versionTag})
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/chaudaryyabdullah03-collab/kml-convertor/tree/main/android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  Android APK
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/chaudaryyabdullah03-collab/kml-convertor/tree/main/pwa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  iPhone PWA Package
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-4">
              Resources
            </h5>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-500">
              <li>
                <a
                  href="https://github.com/chaudaryyabdullah03-collab/kml-convertor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/chaudaryyabdullah03-collab/kml-convertor/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  Issue Tracker
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-blue-600 transition-colors">
                  FAQ &amp; Help
                </a>
              </li>
              <li>
                <a
                  href="https://epsg.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  EPSG Registry
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; 2026 Excel to KML Pro. Open-source software released under community license.
          </div>
          <div className="flex gap-4 font-semibold text-slate-600">
            <a
              href="https://github.com/chaudaryyabdullah03-collab/kml-convertor"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600"
            >
              GitHub
            </a>
            <button onClick={onDownloadClick} className="hover:text-blue-600 cursor-pointer">
              Download
            </button>
            <a href="/app.html" target="_blank" className="hover:text-blue-600">
              Online App
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
