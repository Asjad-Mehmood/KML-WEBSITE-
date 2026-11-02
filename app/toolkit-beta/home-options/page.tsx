import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { adminVisitor } from "@/lib/toolkit/access";
import { toolkitFeed } from "@/lib/toolkit/feed";
import { toolkitDownloads } from "@/lib/toolkit/downloads";
import { TOOLKIT_TOOLS } from "@/lib/toolkit/tools";
import HomeOptions from "@/components/toolkit/home-options/HomeOptions";
import type { OptionTool } from "@/components/toolkit/home-options/options";

// Survey Toolkit (beta test): five animated front-page options for the Toolkit, side by side, so
// the owner can pick one for the launch (T10). Admins only; never indexed. The versions are the
// real ones, from the Toolkit's feed.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Survey Toolkit · Front page options", robots: { index: false, follow: false } };

// How each tool runs, as the product pages say it
const PLATFORM: Record<string, string> = {
  "excel-to-kml": "Windows 64-bit",
  roadpro: "AutoCAD plugin",
  traverse: "Web app and Windows",
  "folder-manager": "Windows",
  slope: "Web app and Windows",
};

export default async function HomeOptionsPage() {
  const who = await adminVisitor();
  if (who === "signed-out") redirect("/login?next=%2Ftoolkit-beta%2Fhome-options");
  if (who !== "admin") notFound();
  const [feed, downloads] = await Promise.all([toolkitFeed().catch(() => null), toolkitDownloads().catch(() => null)]);
  const tools: OptionTool[] = TOOLKIT_TOOLS.map((t) => ({
    id: t.id,
    name: t.name,
    platform: PLATFORM[t.id] ?? t.platform,
    version: feed?.tools.find((f) => f.id === t.id)?.version ?? null,
  }));
  return <HomeOptions tools={tools} toolkitVersion={downloads?.latest?.version ?? null} />;
}
