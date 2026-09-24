"use client";

import React from "react";
import Navbar from "../../components/Navbar";
import Faq from "../../components/Faq";
import CtaBanner from "../../components/CtaBanner";
import Footer from "../../components/Footer";

export default function FaqPage() {
  const handleDownload = () => {
    window.location.href = "/#download";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar onDownloadClick={handleDownload} />
      <div className="pt-20">
        <Faq />
      </div>
      <CtaBanner
        versionTag="v3.5.5"
        fileSizeText="3.14 MB"
        onDownloadClick={handleDownload}
      />
      <Footer
        versionTag="v3.5.5"
        downloadUrl="https://github.com/chaudaryyabdullah03-collab/kml-convertor/releases/latest"
        releaseNotesUrl="https://github.com/chaudaryyabdullah03-collab/kml-convertor/releases/latest"
        onDownloadClick={handleDownload}
      />
    </div>
  );
}
