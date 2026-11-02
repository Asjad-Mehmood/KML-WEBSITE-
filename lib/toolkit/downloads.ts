import { unstable_cache } from "next/cache";

// Survey Toolkit (beta test): how many times its installer was downloaded, from the download
// counts GitHub keeps for each release (Asjad-Mehmood/Survey-Toolkit, pre-releases while it is a
// test). Kept for 10 minutes. null when GitHub can't be read just now.

export const TOOLKIT_REPO = "Asjad-Mehmood/Survey-Toolkit";
const INSTALLER = "SurveyToolkit-Setup.exe";

export interface ToolkitDownloads {
  total: number;
  releases: { tag: string; published: string | null; prerelease: boolean; downloads: number }[];
  /** The newest release with the installer: what /toolkit-beta offers. null before the first one. */
  latest: { version: string; url: string; size: number; published: string | null } | null;
}

type GhRelease = {
  tag_name?: string;
  published_at?: string | null;
  prerelease?: boolean;
  draft?: boolean;
  assets?: { name?: string; download_count?: number; size?: number; browser_download_url?: string }[];
};

const HEADERS: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "exceltokml.com" };

async function readReleases(): Promise<ToolkitDownloads | null> {
  const url = `https://api.github.com/repos/${TOOLKIT_REPO}/releases?per_page=50`;
  const token = (process.env.APP_SOURCE_TOKEN || process.env.GITHUB_TOKEN || "").trim();
  const get = (headers: Record<string, string>) =>
    fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(10_000) }).then((r) => (r.ok ? (r.json() as Promise<GhRelease[]>) : null));
  try {
    // with the site's token when there is one; if GitHub refuses it, once more without
    const list = (token ? await get({ ...HEADERS, Authorization: `Bearer ${token}` }) : null) ?? (await get(HEADERS));
    if (!Array.isArray(list)) return null;
    const releases = list
      .filter((r) => !r.draft)
      .map((r) => ({
        tag: r.tag_name || "",
        published: r.published_at || null,
        prerelease: r.prerelease === true,
        downloads: (r.assets || []).filter((a) => a.name === INSTALLER).reduce((n, a) => n + (a.download_count || 0), 0),
      }));
    // newest first, as GitHub lists them; only the owner's own release files
    const newest = list
      .filter((r) => !r.draft)
      .map((r) => ({ r, a: (r.assets || []).find((a) => a.name === INSTALLER) }))
      .find(({ a }) => a?.browser_download_url?.startsWith(`https://github.com/${TOOLKIT_REPO}/releases/download/`));
    const latest = newest
      ? {
          version: (newest.r.tag_name || "").replace(/^v/i, ""),
          url: newest.a!.browser_download_url!,
          size: newest.a!.size || 0,
          published: newest.r.published_at || null,
        }
      : null;
    return { total: releases.reduce((n, r) => n + r.downloads, 0), releases, latest };
  } catch {
    return null;
  }
}

export const toolkitDownloads = unstable_cache(readReleases, ["toolkit-downloads-v2"], { revalidate: 600 });
