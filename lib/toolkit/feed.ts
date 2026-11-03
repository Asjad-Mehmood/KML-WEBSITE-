// Survey Toolkit (beta test): the version feed at /api/toolkit/feed. For each of the five tools:
// the latest version, where to download it, its size and SHA-256, and how to install it.
//   The Windows programs (Excel to KML, Traverse & Level, Slope Calculator and, from version 7,
//   Project Folder Manager): their latest.json (the same file their own update check reads) and
//   their latest GitHub release.
//   RoadPro: the version in lib/roadpro.ts and the zip on this website, downloaded once by the
//   server and hashed.
// A tool whose source can't be read, or whose SHA-256 sources disagree, gets no download and
// a problem instead, so the Toolkit never installs anything it can't check.
import crypto from "crypto";
import { unstable_cache } from "next/cache";
import { SITE_URL } from "@/lib/site";
import { TOOLKIT_TOOLS, type InstallerTool, type ToolkitTool, type ZipTool } from "@/lib/toolkit/tools";

export const TOOLKIT_FEED_SCHEMA = 1;

export interface FeedDownload {
  url: string;
  file: string;
  /** null when GitHub's release details can't be read just now */
  size: number | null;
  sha256: string;
}

export interface FeedTool {
  id: string;
  name: string;
  platform: string;
  page: string;
  webApp: string | null;
  /** null when it can't be read just now: the Toolkit shows "Can't check just now" */
  version: string | null;
  released: string | null;
  notes: string | null;
  download: FeedDownload | null;
  install: Record<string, unknown>;
  problems: string[];
}

export interface Feed {
  schema: number;
  generated: string;
  tools: FeedTool[];
}

const GH_HEADERS: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "exceltokml.com" };
const ghToken = () => (process.env.APP_SOURCE_TOKEN || process.env.GITHUB_TOKEN || "").trim();
const isSha = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f]{64}$/.test(s);
const abs = (path: string) => new URL(path, SITE_URL).toString();

type GhAsset = { name?: string; size?: number; browser_download_url?: string; digest?: string };
type GhRelease = { tag_name?: string; html_url?: string; published_at?: string; assets?: GhAsset[] };

async function getJson<T>(url: string, headers: Record<string, string>): Promise<T | null> {
  const res = await fetch(url, { headers, cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

// With the site's token when there is one; if GitHub refuses the token, once more without it
async function releaseOf(repo: string, token: string): Promise<GhRelease | null> {
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  try {
    if (token) {
      const r = await getJson<GhRelease>(url, { ...GH_HEADERS, Authorization: `Bearer ${token}` });
      if (r) return r;
    }
    return await getJson<GhRelease>(url, GH_HEADERS);
  } catch {
    return null;
  }
}

function base(t: ToolkitTool): Omit<FeedTool, "version" | "released" | "notes" | "download" | "install" | "problems"> {
  return { id: t.id, name: t.name, platform: t.platform, page: abs(t.page), webApp: t.webApp ? abs(t.webApp) : null };
}

async function installerTool(t: ToolkitTool, s: InstallerTool): Promise<FeedTool> {
  const problems: string[] = [];
  const install = {
    kind: s.kind,
    registryKey: s.registryKey,
    exe: s.exe,
    silentArgs: s.silentArgs,
    opensAfterSilentInstall: s.opensAfterSilentInstall,
    closesOpenCopy: s.closesOpenCopy,
  };
  const token = ghToken();
  const [rel, manifest] = await Promise.all([
    releaseOf(s.repo, token),
    getJson<{ version?: unknown; sha256?: unknown }>(`https://github.com/${s.repo}/releases/latest/download/latest.json`, { "User-Agent": "exceltokml.com" }).catch(() => null),
  ]);
  if (!rel) {
    // GitHub's API is busy or over its limit: latest.json alone still gives the version and
    // SHA-256, and the installer's address follows from the version (tags are v<version>)
    const v = manifest && typeof manifest.version === "string" && /^[0-9A-Za-z.+-]{1,40}$/.test(manifest.version) ? manifest.version : null;
    if (v && isSha(manifest?.sha256)) {
      return {
        ...base(t),
        version: v,
        released: null,
        notes: `https://github.com/${s.repo}/releases/tag/v${v}`,
        download: { url: `https://github.com/${s.repo}/releases/download/v${v}/${s.installer}`, file: s.installer, size: null, sha256: manifest.sha256 },
        install,
        problems: [],
      };
    }
    return { ...base(t), version: null, released: null, notes: null, download: null, install, problems: ["The latest release can't be read just now."] };
  }
  const asset = (rel.assets || []).find((a) => a.name === s.installer);
  const tagVersion = (rel.tag_name || "").replace(/^v/i, "") || null;
  const digest = asset?.digest?.startsWith("sha256:") ? asset.digest.slice(7) : null;
  const listed = manifest && typeof manifest.version === "string" ? manifest.version : null;
  if (!manifest) problems.push(`latest.json is missing from release ${rel.tag_name}, so the program's own update check can't see it.`);
  else if (listed !== tagVersion) problems.push(`latest.json says ${listed} but the release is ${rel.tag_name}.`);
  const sha = manifest && isSha(manifest.sha256) ? manifest.sha256 : isSha(digest) ? digest : null;
  let download: FeedDownload | null = null;
  if (!asset?.browser_download_url || !asset.size) problems.push(`Release ${rel.tag_name} has no ${s.installer}.`);
  else if (!sha) problems.push("No SHA-256 for the installer, so it can't be checked.");
  else if (digest && isSha(digest) && digest !== sha) problems.push("The SHA-256 in latest.json differs from GitHub's, so the installer is held back.");
  else download = { url: asset.browser_download_url, file: s.installer, size: asset.size, sha256: sha };
  return {
    ...base(t),
    version: listed && listed === tagVersion ? listed : tagVersion,
    released: rel.published_at || null,
    notes: rel.html_url || null,
    download,
    install,
    problems,
  };
}

// The zip's hash, kept for an hour: a zip changes only when the site is deployed with a new one,
// and then with a new version. The version is part of the cache key (and of the address read), so
// a new version is never offered with the hash of the zip before it.
const zipFacts = unstable_cache(
  async (url: string, version: string): Promise<{ sha256: string; size: number } | null> => {
    const res = await fetch(`${url}?v=${encodeURIComponent(version)}`, { headers: { "User-Agent": "exceltokml.com" }, cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { sha256: crypto.createHash("sha256").update(buf).digest("hex"), size: buf.length };
  },
  ["toolkit-zip-sha256-v1"],
  { revalidate: 3600 }
);

async function zipTool(t: ToolkitTool, s: ZipTool): Promise<FeedTool> {
  const url = abs(s.href);
  const install = { kind: s.kind, files: s.files, keep: s.keep, main: s.main, ...(s.needs ? { needs: s.needs } : {}) };
  const facts = await zipFacts(url, s.version).catch(() => null);
  return {
    ...base(t),
    version: s.version,
    released: s.released,
    notes: abs(t.page),
    download: facts ? { url, file: s.file, size: facts.size, sha256: facts.sha256 } : null,
    install,
    problems: facts ? [] : [`${s.file} can't be downloaded just now.`],
  };
}

async function readFeed(): Promise<Feed> {
  const tools = await Promise.all(
    TOOLKIT_TOOLS.map((t) => (t.source.kind === "installer" ? installerTool(t, t.source) : zipTool(t, t.source)))
  );
  return { schema: TOOLKIT_FEED_SCHEMA, generated: new Date().toISOString(), tools };
}

/** The feed, kept for ten minutes */
export const toolkitFeed = unstable_cache(readFeed, ["toolkit-feed-v1"], { revalidate: 600 });
