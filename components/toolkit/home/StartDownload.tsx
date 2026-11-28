"use client";

import { announceDownload } from "@/lib/products/downloadNotice";
import { useEffect } from "react";

// After signing in to download (/toolkit?download=start): the download starts by itself, once.
// The address loses ?download=start first, so going back or reloading doesn't start it again.
export default function StartDownload({ href }: { href: string }) {
  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
    window.location.assign(href);
    announceDownload({ program: "Survey Toolkit", file: "SurveyToolkit-Setup.exe", again: href });
  }, [href]);
  return null;
}
