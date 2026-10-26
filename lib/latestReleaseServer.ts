// The latest Excel to KML release, read by the server so the download page always has the
// installer's SHA-256 to compare against. GitHub lists the hash ("digest") for files uploaded
// since mid-2025; for an older file the server downloads it once and works the hash out. Each
// visitor's browser then asks this site (/api/latest-release) instead of GitHub, which also keeps
// visitors clear of GitHub's 60-requests-an-hour limit per address.
import crypto from "crypto";
import { unstable_cache } from "next/cache";
import { RELEASES_API_URL } from "@/lib/site";

export type ReleaseAsset = { id?: number; name?: string; size?: number; browser_download_url?: string; digest?: string; updated_at?: string };
export interface ReleaseInfo {
  tag_name?: string;
  name?: string;
  html_url?: string;
  published_at?: string;
  body?: string;
  assets: ReleaseAsset[];
}

const GH_HEADERS: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "exceltokml.com" };
const ghToken = () => (process.env.APP_SOURCE_TOKEN || process.env.GITHUB_TOKEN || "").trim();

// A file never changes under the same id and upload time, so its hash is kept for good
// (the arguments are the cache key: a re-uploaded file gets a new upload time)
const hashOf = unstable_cache(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (url: string, uploaded: string): Promise<string> => {
    const res = await fetch(url, { headers: { "User-Agent": "exceltokml.com" }, cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(45_000) });
    if (!res.ok) throw new Error(`Download for hashing answered ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return crypto.createHash("sha256").update(buf).digest("hex");
  },
  ["installer-sha256-v1"],
  { revalidate: false }
);

async function readLatest(): Promise<ReleaseInfo | null> {
  const token = ghToken();
  const res = await fetch(RELEASES_API_URL, {
    headers: token ? { ...GH_HEADERS, Authorization: `Bearer ${token}` } : GH_HEADERS,
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as ReleaseInfo;
  const assets = Array.isArray(data.assets) ? data.assets : [];
  // fill in the hash of each Windows installer that GitHub doesn't give one for
  const filled = await Promise.all(
    assets.map(async (a) => {
      if (a.digest?.startsWith("sha256:") || !a.name?.toLowerCase().endsWith(".exe") || !a.browser_download_url) return a;
      try {
        return { ...a, digest: `sha256:${await hashOf(a.browser_download_url, `${a.id ?? ""}-${a.updated_at ?? ""}`)}` };
      } catch (err) {
        console.error("Couldn't work out the installer's SHA-256:", err);
        return a;
      }
    })
  );
  return {
    tag_name: data.tag_name,
    name: data.name,
    html_url: data.html_url,
    published_at: data.published_at,
    body: typeof data.body === "string" ? data.body.slice(0, 4000) : undefined,
    assets: filled.map(({ name, size, browser_download_url, digest }) => ({ name, size, browser_download_url, digest })),
  };
}

/** The latest release with the installer's SHA-256, kept for ten minutes */
export const latestRelease = unstable_cache(readLatest, ["latest-release-v1"], { revalidate: 600 });
