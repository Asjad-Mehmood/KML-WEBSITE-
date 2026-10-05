"use client";

import { Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROADPRO_FILES, ROADPRO_VERSION } from "@/lib/roadpro";

// "Download RoadPro": the same sign-in gate as the Windows app (Admin →
// Settings → Sign-in to download), then the download is recorded and starts
export default function RoadProDownload({ className, label = "Download RoadPro" }: { className?: string; label?: string }) {
  const { requireAuth, trackDownload } = useAuth();
  const { href, name } = ROADPRO_FILES.plugin;

  const start = () => {
    trackDownload("roadpro", name, `v${ROADPRO_VERSION}`);
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
      onClick={() => requireAuth(start, "Sign in or create a free account to download RoadPro for AutoCAD.")}
      className={
        className ??
        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer"
      }
    >
      <Download className="w-4 h-4" aria-hidden /> {label}
    </button>
  );
}
