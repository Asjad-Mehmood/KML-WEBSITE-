"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function Preloader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("kml_preloader_seen");
    const displayTime = hasSeen ? 400 : 800; // fast and crisp

    const timer = setTimeout(() => {
      sessionStorage.setItem("kml_preloader_seen", "true");
      setFadeOut(true);
      setTimeout(() => setVisible(false), 350);
    }, displayTime);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-350 ease-out select-none pointer-events-auto ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Simple Breathing / Blinking Logo */}
      <div className="relative animate-pulse flex items-center justify-center">
        <Image
          src="/assets/icon.png"
          alt="Excel to KML Pro"
          width={54}
          height={54}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
