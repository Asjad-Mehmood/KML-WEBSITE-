"use client";

import { Clock, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { TRAVERSE_FILES, TRAVERSE_VERSION } from "@/lib/traverse";
import { useTraverseRelease } from "@/lib/useTraverseRelease";

// "Download for Windows": the same sign-in gate as our other downloads, then the download is
// recorded and the installer from the latest GitHub release starts. While
// TRAVERSE_FILES.setup.href is null it shows "Coming soon" instead.
export default function TraverseDownload({ className, label = "Download for Windows" }: { className?: string; label?: string }) {
  const { requireAuth, trackDownload } = useAuth();
  const release = useTraverseRelease();
  const cls =
    className ??
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer";

  if (!TRAVERSE_FILES.setup.href) {
    return (
      <span className={`${cls} !bg-slate-200 !text-slate-600 !cursor-default`} aria-disabled="true">
        <Clock className="w-4 h-4" aria-hidden /> Windows setup coming soon
      </span>
    );
  }

  const start = () => {
    trackDownload("traverse", release.fileName, release.versionTag || `v${TRAVERSE_VERSION}`);
    const a = document.createElement("a");
    a.href = release.downloadUrl;
    a.download = release.fileName;
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

/** Version, size, date, SHA-256 and release notes of the latest Windows installer. */
export function TraverseReleaseInfo() {
  const r = useTraverseRelease();
  const facts = [r.versionTag && `Version ${r.versionTag.replace(/^v/, "")}`, r.fileSizeText, r.releaseDateText].filter(Boolean);
  return (
    <div className="mt-2 text-center text-[12.5px] text-slate-500">
      {facts.length > 0 && <p>{facts.join(" · ")}</p>}
      {r.sha256Hash && (
        <p className="mt-0.5 font-mono text-[11px] text-slate-400 break-all" title="SHA-256 of the installer">
          SHA-256 {r.sha256Hash}
        </p>
      )}
      <a href={r.releaseNotesUrl} target="_blank" rel="noopener" className="mt-1 inline-block text-[#0071e3] hover:underline">
        Release notes
      </a>
    </div>
  );
}
