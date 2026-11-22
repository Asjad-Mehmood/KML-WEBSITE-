"use client";

import { announceDownload } from "@/lib/downloadNotice";
import { useRouter } from "next/navigation";
import ToolkitOnly from "@/components/ToolkitOnly";
import { directDownloadAllowed, useDirectDownload } from "@/lib/publicSettings";
import { Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROADPRO_FILES, ROADPRO_RELEASE, ROADPRO_VERSION } from "@/lib/roadpro";

// "Download RoadPro": the same sign-in gate as the Windows app (Admin →
// Settings → Sign-in to download), then the download is recorded and starts.
// RoadPro Setup (Hub and plugin, with automatic updates) unless the plugin zip is asked for.
export default function RoadProDownload({
  className,
  label = "Download RoadPro",
  file = "setup",
}: {
  className?: string;
  label?: string;
  file?: "setup" | "plugin";
}) {
  const { requireAuth, trackDownload } = useAuth();
  const { href, name } = ROADPRO_FILES[file];
  const offered = useDirectDownload("roadpro");
  const router = useRouter();

  const start = async () => {
    // switched off since the page opened: the Survey Toolkit instead
    if (!(await directDownloadAllowed("roadpro"))) {
      router.push("/toolkit");
      return;
    }
    // Setup is the release (Hub and plugin); the zip is the plugin alone
    trackDownload("roadpro", name, `v${file === "setup" ? ROADPRO_RELEASE : ROADPRO_VERSION}`);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    announceDownload({ program: file === "setup" ? "RoadPro Setup" : "RoadPro plugin", file: name, again: href, zip: /\.zip$/i.test(name) });
  };

  if (offered === false) return <ToolkitOnly className={className} name="RoadPro" />;

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
