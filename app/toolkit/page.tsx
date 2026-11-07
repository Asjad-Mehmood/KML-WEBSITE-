import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminVisitor, toolkitIsPublic } from "@/lib/toolkit/access";
import { frontPageData } from "@/lib/toolkit/frontPage";
import { openGraphFor } from "@/lib/site";
import ToolkitHome from "@/components/toolkit/home/ToolkitHome";

// Survey Toolkit: its public page. While the Toolkit is closed to the public (Admin → Settings →
// Survey Toolkit) only admins see it, as a preview; everyone else gets "not found".
export const dynamic = "force-dynamic";

const TITLE = "Survey Toolkit: every survey tool in one download";
const DESCRIPTION =
  "One free Windows program installs Excel to KML, RoadPro, Traverse & Level, Project Folder Manager and Slope Calculator, and keeps every one of them up to date by itself.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/toolkit" },
  openGraph: openGraphFor("/toolkit", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default async function ToolkitPage({ searchParams }: { searchParams: Promise<{ download?: string }> }) {
  const open = await toolkitIsPublic();
  if (!open && (await adminVisitor().catch(() => "other")) !== "admin") notFound();
  const [{ tools, toolkitVersion }, { download }] = await Promise.all([frontPageData(), searchParams]);
  return <ToolkitHome tools={tools} toolkitVersion={toolkitVersion} draft={!open} download={download ?? null} />;
}
