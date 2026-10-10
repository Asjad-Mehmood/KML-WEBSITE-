"use client";

import { Clock, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { TRAVERSE_FILES, TRAVERSE_VERSION } from "@/lib/traverse";

// "Download for Windows": the same sign-in gate as our other downloads, then
// the download is recorded and starts. Until the setup file is on the site
// (TRAVERSE_FILES.setup.href is null) it shows "Coming soon" instead.
export default function TraverseDownload({ className, label = "Download for Windows" }: { className?: string; label?: string }) {
  const { requireAuth, trackDownload } = useAuth();
  const { href, name } = TRAVERSE_FILES.setup;
  const cls =
    className ??
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer";

  if (!href) {
    return (
      <span className={`${cls} !bg-slate-200 !text-slate-600 !cursor-default`} aria-disabled="true">
        <Clock className="w-4 h-4" aria-hidden /> Windows setup coming soon
      </span>
    );
  }

  const start = () => {
    trackDownload("traverse", name, `v${TRAVERSE_VERSION}`);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <button
      type="button"
      onClick={() => requireAuth(start, "Sign in or create a free account to download the Traverse & Level Adjustment Software.")}
      className={cls}
    >
      <Download className="w-4 h-4" aria-hidden /> {label}
    </button>
  );
}
