"use client";

import { announceDownload } from "@/lib/downloadNotice";
import { useEffect, useState } from "react";
import { Clock, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AUTO_DRAFT_FILES, AUTO_DRAFT_INSTALLER, AUTO_DRAFT_RELEASES_API, AUTO_DRAFT_VERSION } from "@/lib/autoDraft";

export interface AutoDraftRelease {
  /** "checking" until GitHub answers; "none" when the latest release has no installer yet */
  state: "checking" | "ready" | "none";
  versionTag: string;
  downloadUrl: string;
  releaseNotesUrl: string;
  fileSizeText: string;
  releaseDateText: string;
  sha256Hash: string;
}

const FALLBACK: AutoDraftRelease = {
  state: "checking",
  versionTag: "",
  downloadUrl: AUTO_DRAFT_FILES.setup.href,
  releaseNotesUrl: "/whats-new/auto-draft",
  fileSizeText: "",
  releaseDateText: "",
  sha256Hash: "",
};

type Asset = { name?: string; size?: number; browser_download_url?: string; digest?: string };

// asked once per page, however many buttons show it
let asked: Promise<AutoDraftRelease> | null = null;
async function ask(): Promise<AutoDraftRelease> {
  try {
    const res = await fetch(AUTO_DRAFT_RELEASES_API);
    // no release yet: nothing to download; GitHub can't be asked: the link to the newest installer
    if (!res.ok) return { ...FALLBACK, state: res.status === 404 ? "none" : "ready" };
    const data = await res.json();
    const assets: Asset[] = Array.isArray(data.assets) ? data.assets : [];
    const exe = assets.find((a) => a.name === AUTO_DRAFT_INSTALLER);
    if (!exe?.browser_download_url) return { ...FALLBACK, state: "none" };
    return {
      state: "ready",
      versionTag: data.tag_name || "",
      downloadUrl: exe.browser_download_url,
      releaseNotesUrl: FALLBACK.releaseNotesUrl,
      fileSizeText: exe.size ? (exe.size / (1024 * 1024)).toFixed(1) + " MB" : "",
      releaseDateText: data.published_at
        ? `Released ${new Date(data.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : "",
      sha256Hash: exe.digest?.startsWith("sha256:") ? exe.digest.slice(7) : "",
    };
  } catch {
    return { ...FALLBACK, state: "ready" };
  }
}

/** The latest release of the Auto Draft Windows program on GitHub: version, installer, size, date, SHA-256 */
export function useAutoDraftRelease(): AutoDraftRelease {
  const [r, setR] = useState<AutoDraftRelease>(FALLBACK);
  useEffect(() => {
    let alive = true;
    (asked ??= ask()).then((v) => alive && setR(v));
    return () => {
      alive = false;
    };
  }, []);
  return r;
}

// "Download for Windows": the same sign-in gate as our other downloads, then the download is
// recorded (Admin → Downloads, "auto_draft") and the installer from the latest GitHub release starts.
// Until a release carries the installer it says the Windows program is coming soon.
export default function AutoDraftDownload({ className, label = "Download for Windows" }: { className?: string; label?: string }) {
  const { requireAuth, trackDownload } = useAuth();
  const release = useAutoDraftRelease();
  const cls =
    className ??
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer";

  if (release.state === "none") {
    return (
      <span className={`${cls} opacity-70 !cursor-default`} aria-disabled="true">
        <Clock className="w-4 h-4" aria-hidden /> Windows program coming soon
      </span>
    );
  }

  const start = () => {
    trackDownload("auto_draft", AUTO_DRAFT_INSTALLER, release.versionTag || `v${AUTO_DRAFT_VERSION}`);
    const a = document.createElement("a");
    a.href = release.downloadUrl;
    a.download = AUTO_DRAFT_INSTALLER;
    document.body.appendChild(a);
    a.click();
    a.remove();
    announceDownload({ program: "Auto Draft", file: AUTO_DRAFT_INSTALLER, again: release.downloadUrl });
  };

  return (
    <button type="button" onClick={() => requireAuth(start, "Sign in or create a free account to download Auto Draft.")} className={cls}>
      <Download className="w-4 h-4" aria-hidden /> {label}
    </button>
  );
}

/** Version, size, date and SHA-256 of the latest installer, under the download button */
export function AutoDraftReleaseInfo({ className = "text-slate-500" }: { className?: string }) {
  const r = useAutoDraftRelease();
  if (r.state !== "ready") return null;
  const facts = [r.versionTag && `Version ${r.versionTag.replace(/^v/, "")}`, r.fileSizeText, r.releaseDateText].filter(Boolean);
  return (
    <div className={`text-[12.5px] ${className}`}>
      {facts.length > 0 && <p>{facts.join(" · ")}</p>}
      {r.sha256Hash && (
        <p className="mt-0.5 font-mono text-[11px] opacity-80 break-all" title="SHA-256 of the installer">
          SHA-256 {r.sha256Hash}
        </p>
      )}
      <a href={r.releaseNotesUrl} target="_blank" rel="noopener" className="mt-1 inline-block underline underline-offset-2 hover:opacity-80">
        Release notes
      </a>
    </div>
  );
}
