"use client";

import { useEffect, useState } from "react";
import { loadPublicSettings } from "@/lib/publicSettings";
import { GITHUB_REPO_URL, LATEST_VERSION, RELEASES_API_URL } from "@/lib/site";

export interface LatestRelease {
  versionTag: string;
  downloadUrl: string;
  /** The installer's file name, as the release lists it */
  fileName: string;
  releaseNotesUrl: string;
  fileSizeText: string;
  bytesText: string;
  releaseDateText: string;
  /** Empty until the release says what it is: never a made-up or old value */
  sha256Hash: string;
  /** The Android app in the same release, when there is one */
  apkUrl: string | null;
}

const INSTALLER = "ExcelToKMLPro-Lite-Setup.exe";

const FALLBACK: LatestRelease = {
  versionTag: LATEST_VERSION,
  downloadUrl: `${GITHUB_REPO_URL}/releases/latest/download/${INSTALLER}`,
  fileName: INSTALLER,
  releaseNotesUrl: `${GITHUB_REPO_URL}/releases/latest`,
  fileSizeText: "3.5 MB",
  bytesText: "3.5 MB",
  releaseDateText: "Latest release",
  sha256Hash: "",
  apkUrl: null,
};

type Asset = { name?: string; size?: number; browser_download_url?: string; digest?: string };

/**
 * The latest release of the program, for the download buttons and the download page.
 * The admin settings (version, installer file name, size) stand in until GitHub answers,
 * and whenever it can't be reached.
 */
export function useLatestRelease(): LatestRelease {
  const [r, setR] = useState<LatestRelease>(FALLBACK);

  useEffect(() => {
    let alive = true;
    (async () => {
      const settings = await loadPublicSettings();
      const wanted =
        settings?.installerFileName && /^[\w.-]+\.exe$/i.test(settings.installerFileName)
          ? settings.installerFileName
          : INSTALLER;
      if (alive && settings) {
        setR((x) => ({
          ...x,
          versionTag: settings.appVersion || x.versionTag,
          fileSizeText: settings.installerFileSize || x.fileSizeText,
          bytesText: settings.installerFileSize || x.bytesText,
          fileName: wanted,
          downloadUrl: `${GITHUB_REPO_URL}/releases/latest/download/${wanted}`,
        }));
      }
      try {
        const res = await fetch(RELEASES_API_URL);
        if (!res.ok) return;
        const data = await res.json();
        const assets: Asset[] = Array.isArray(data.assets) ? data.assets : [];
        const exe =
          assets.find((a) => a.name === wanted) || assets.find((a) => a.name?.toLowerCase().endsWith(".exe")) || null;
        const apk = assets.find((a) => a.name?.toLowerCase().endsWith(".apk")) || null;
        const mb = exe?.size ? (exe.size / (1024 * 1024)).toFixed(2) + " MB" : "";
        const hash =
          (exe?.digest?.startsWith("sha256:") ? exe.digest.slice(7) : "") ||
          (typeof data.body === "string" ? data.body.match(/[a-fA-F0-9]{64}/)?.[0] : "") ||
          "";
        if (!alive) return;
        setR((x) => ({
          ...x,
          versionTag: data.tag_name || data.name || x.versionTag,
          releaseNotesUrl: data.html_url || x.releaseNotesUrl,
          releaseDateText: data.published_at
            ? `Released ${new Date(data.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            : x.releaseDateText,
          downloadUrl: exe?.browser_download_url || x.downloadUrl,
          fileName: exe?.name || x.fileName,
          fileSizeText: mb || x.fileSizeText,
          bytesText: exe?.size ? `${mb} (${exe.size.toLocaleString("en-US")} bytes)` : x.bytesText,
          sha256Hash: hash,
          apkUrl: apk?.browser_download_url || null,
        }));
      } catch {
        // the admin settings stand in
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return r;
}
