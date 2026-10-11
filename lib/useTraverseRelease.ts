"use client";

import { useEffect, useState } from "react";
import { TRAVERSE_INSTALLER, TRAVERSE_RELEASES, TRAVERSE_RELEASES_API } from "@/lib/traverse";

export interface TraverseRelease {
  /** "v2.0.1" once GitHub answers; empty until then */
  versionTag: string;
  downloadUrl: string;
  fileName: string;
  releaseNotesUrl: string;
  /** "2.32 MB", empty until GitHub answers */
  fileSizeText: string;
  /** "Released Oct 11, 2026", empty until GitHub answers */
  releaseDateText: string;
  /** The installer's SHA-256, empty until the release says what it is */
  sha256Hash: string;
}

// A link that always gets the newest installer, used until GitHub answers and if it can't be reached
const FALLBACK: TraverseRelease = {
  versionTag: "",
  downloadUrl: `${TRAVERSE_RELEASES}/latest/download/${TRAVERSE_INSTALLER}`,
  fileName: TRAVERSE_INSTALLER,
  releaseNotesUrl: `${TRAVERSE_RELEASES}/latest`,
  fileSizeText: "",
  releaseDateText: "",
  sha256Hash: "",
};

type Asset = { name?: string; size?: number; browser_download_url?: string; digest?: string };

/**
 * The latest release of the Traverse & Level Windows program (Asjad-Mehmood/Traiverse), for the
 * download buttons: version, installer link, size, date and SHA-256, the same way the Excel to
 * KML download reads its releases. Only TraverseLevel-Setup.exe counts: the older Traverse Pro
 * releases in that repository never stand in for it.
 */
export function useTraverseRelease(): TraverseRelease {
  const [r, setR] = useState<TraverseRelease>(FALLBACK);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(TRAVERSE_RELEASES_API);
        if (!res.ok) return;
        const data = await res.json();
        const assets: Asset[] = Array.isArray(data.assets) ? data.assets : [];
        const exe = assets.find((a) => a.name === TRAVERSE_INSTALLER);
        if (!exe?.browser_download_url || !alive) return;
        const mb = exe.size ? (exe.size / (1024 * 1024)).toFixed(2) + " MB" : "";
        setR({
          versionTag: data.tag_name || "",
          downloadUrl: exe.browser_download_url,
          fileName: exe.name || TRAVERSE_INSTALLER,
          releaseNotesUrl: data.html_url || FALLBACK.releaseNotesUrl,
          fileSizeText: mb,
          releaseDateText: data.published_at
            ? `Released ${new Date(data.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            : "",
          sha256Hash: exe.digest?.startsWith("sha256:") ? exe.digest.slice(7) : "",
        });
      } catch {
        // the fallback link still gets the newest installer
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return r;
}
