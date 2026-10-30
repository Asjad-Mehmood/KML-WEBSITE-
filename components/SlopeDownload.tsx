"use client";

import { useEffect, useState } from "react";
import { Clock, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SLOPE_FILES, SLOPE_INSTALLER, SLOPE_RELEASES, SLOPE_RELEASES_API, SLOPE_VERSION } from "@/lib/slope";

export interface SlopeRelease {
  /** "checking" until GitHub answers; "none" when the latest release has no installer yet */
  state: "checking" | "ready" | "none";
  versionTag: string;
  downloadUrl: string;
  releaseNotesUrl: string;
  fileSizeText: string;
  releaseDateText: string;
  sha256Hash: string;
}

const FALLBACK: SlopeRelease = {
  state: "checking",
  versionTag: "",
  downloadUrl: SLOPE_FILES.setup.href,
  releaseNotesUrl: `${SLOPE_RELEASES}/latest`,
  fileSizeText: "",
  releaseDateText: "",
  sha256Hash: "",
};

type Asset = { name?: string; size?: number; browser_download_url?: string; digest?: string };

// asked once per page, however many buttons show it
let asked: Promise<SlopeRelease> | null = null;
async function ask(): Promise<SlopeRelease> {
  try {
    const res = await fetch(SLOPE_RELEASES_API);
    // no release yet: nothing to download; GitHub can't be asked: the link to the newest installer
    if (!res.ok) return { ...FALLBACK, state: res.status === 404 ? "none" : "ready" };
    const data = await res.json();
    const assets: Asset[] = Array.isArray(data.assets) ? data.assets : [];
    const exe = assets.find((a) => a.name === SLOPE_INSTALLER);
    if (!exe?.browser_download_url) return { ...FALLBACK, state: "none" };
    return {
      state: "ready",
      versionTag: data.tag_name || "",
      downloadUrl: exe.browser_download_url,
      releaseNotesUrl: data.html_url || FALLBACK.releaseNotesUrl,
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

/** The latest release of the Slope Calculator Windows program on GitHub: version, installer, size, date, SHA-256 */
export function useSlopeRelease(): SlopeRelease {
  const [r, setR] = useState<SlopeRelease>(FALLBACK);
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
// recorded (Admin → Downloads, "slope") and the installer from the latest GitHub release starts.
// Until a release carries the installer it says the Windows program is coming soon.
export default function SlopeDownload({ className, label = "Download for Windows" }: { className?: string; label?: string }) {
  const { requireAuth, trackDownload } = useAuth();
  const release = useSlopeRelease();
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
    trackDownload("slope", SLOPE_INSTALLER, release.versionTag || `v${SLOPE_VERSION}`);
    const a = document.createElement("a");
    a.href = release.downloadUrl;
    a.download = SLOPE_INSTALLER;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <button type="button" onClick={() => requireAuth(start, "Sign in or create a free account to download Slope Calculator.")} className={cls}>
      <Download className="w-4 h-4" aria-hidden /> {label}
    </button>
  );
}

/** Version, size, date and SHA-256 of the latest installer, under the download button */
export function SlopeReleaseInfo({ className = "text-slate-500" }: { className?: string }) {
  const r = useSlopeRelease();
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
