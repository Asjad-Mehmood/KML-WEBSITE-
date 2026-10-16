"use client";

import { Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CO2_FILES, CO2_VERSION } from "@/lib/co2dashboard";

// "Download the dashboard": the same sign-in gate as the Windows app (Admin →
// Settings → Sign-in to download), then the download is recorded and starts
export default function Co2DashboardDownload({ className, label = "Download the dashboard" }: { className?: string; label?: string }) {
  const { requireAuth, trackDownload } = useAuth();
  const { href, name } = CO2_FILES.package;

  const start = () => {
    trackDownload("co2_dashboard", name, `v${CO2_VERSION}`);
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
      onClick={() => requireAuth(start, "Sign in or create a free account to download the CO2 Project Dashboard.")}
      className={
        className ??
        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer"
      }
    >
      <Download className="w-4 h-4" aria-hidden /> {label}
    </button>
  );
}
