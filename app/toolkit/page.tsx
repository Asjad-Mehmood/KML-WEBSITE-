import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminVisitor, toolkitIsPublic } from "@/lib/toolkit/access";
import { frontPageData } from "@/lib/toolkit/frontPage";
import { openGraphFor } from "@/lib/site";
import ToolkitHome from "@/components/toolkit/home/ToolkitHome";
import ToolkitStructuredData from "@/components/toolkit/home/ToolkitStructuredData";
import { TOOLKIT_DESCRIPTION, TOOLKIT_TITLE } from "@/lib/toolkit/homeFaq";
import { getExtraSettings } from "@/lib/siteSettings";

// Survey Toolkit: its public page. While the Toolkit is closed to the public (Admin → Settings →
// Survey Toolkit) only admins see it, as a preview; everyone else gets "not found".
export const dynamic = "force-dynamic";

// When the home page shows the Toolkit too, the two pages are the same: the home page is the one to index
export async function generateMetadata(): Promise<Metadata> {
  const s = await getExtraSettings().catch(() => null);
  const canonical = s?.homeHero === "toolkit" && s.toolkitPublic ? "/" : "/toolkit";
  return {
    title: TOOLKIT_TITLE,
    description: TOOLKIT_DESCRIPTION,
    alternates: { canonical },
    openGraph: openGraphFor(canonical, `${TOOLKIT_TITLE} | Excel to KML`, TOOLKIT_DESCRIPTION),
  };
}

export default async function ToolkitPage({ searchParams }: { searchParams: Promise<{ download?: string }> }) {
  const open = await toolkitIsPublic();
  if (!open && (await adminVisitor().catch(() => "other")) !== "admin") notFound();
  const [{ tools, toolkitVersion }, { download }] = await Promise.all([frontPageData(), searchParams]);
  return (
    <>
      <ToolkitStructuredData path="/toolkit" version={toolkitVersion} />
      <ToolkitHome tools={tools} toolkitVersion={toolkitVersion} draft={!open} download={download ?? null} />
    </>
  );
}
