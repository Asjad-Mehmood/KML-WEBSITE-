"use client";

import { announceDownload } from "@/lib/products/downloadNotice";
import { useRouter } from "next/navigation";
import ToolkitOnly from "@/components/ToolkitOnly";
import { directDownloadAllowed, useDirectDownload } from "@/lib/content/publicSettings";
import { Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PFM_FILES, PFM_VERSION } from "@/lib/products/folderManager";

// "Download Project Folder Manager": the same sign-in gate as the Windows app
// (Admin → Settings → Sign-in to download), then the download is recorded and starts
export default function FolderManagerDownload({ className, label = "Download Project Folder Manager" }: { className?: string; label?: string }) {
  const { requireAuth, trackDownload } = useAuth();
  const { href, name } = PFM_FILES.package;
  const offered = useDirectDownload("folder-manager");
  const router = useRouter();

  const start = async () => {
    // switched off since the page opened: the Survey Toolkit instead
    if (!(await directDownloadAllowed("folder-manager"))) {
      router.push("/toolkit");
      return;
    }
    trackDownload("folder_manager", name, `v${PFM_VERSION}`);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    announceDownload({ program: "Project Folder Manager", file: name, again: href, zip: /\.zip$/i.test(name) });
  };

  if (offered === false) return <ToolkitOnly className={className} name="Project Folder Manager" />;

  return (
    <button
      type="button"
      onClick={() => requireAuth(start, "Sign in or create a free account to download Project Folder Manager.")}
      className={
        className ??
        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer"
      }
    >
      <Download className="w-4 h-4" aria-hidden /> {label}
    </button>
  );
}
