import { toolkitDownloads } from "@/lib/toolkit/downloads";
import { toolkitFeed } from "@/lib/toolkit/feed";
import { TOOLKIT_TOOLS } from "@/lib/toolkit/tools";
import type { OptionTool } from "@/components/toolkit/home-options/options";

// Survey Toolkit: what the front page and its options show, with the real versions from the feed.
// The feed and GitHub are only extras: without them the page shows [version] placeholders.

// How each tool runs, as the product pages say it
const PLATFORM: Record<string, string> = {
  "excel-to-kml": "Windows 64-bit",
  roadpro: "AutoCAD plugin",
  traverse: "Web app and Windows",
  "folder-manager": "Windows",
  slope: "Web app and Windows",
};

export async function frontPageData(): Promise<{ tools: OptionTool[]; toolkitVersion: string | null }> {
  const [feed, downloads] = await Promise.all([toolkitFeed().catch(() => null), toolkitDownloads().catch(() => null)]);
  return {
    tools: TOOLKIT_TOOLS.map((t) => ({
      id: t.id,
      name: t.name,
      platform: PLATFORM[t.id] ?? t.platform,
      version: feed?.tools.find((f) => f.id === t.id)?.version ?? null,
    })),
    toolkitVersion: downloads?.latest?.version ?? null,
  };
}
