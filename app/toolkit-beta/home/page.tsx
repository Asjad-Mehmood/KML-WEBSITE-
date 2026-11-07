import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { adminVisitor, toolkitIsPublic } from "@/lib/toolkit/access";
import { frontPageData } from "@/lib/toolkit/frontPage";
import ToolkitHome from "@/components/toolkit/home/ToolkitHome";

// Survey Toolkit: the front page in the style the owner chose (option C, the hub), for admins, never
// indexed. The public page is /toolkit; this one stays as the admins' preview next to the options.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Survey Toolkit: every survey tool, one download (draft)",
  robots: { index: false, follow: false },
};

export default async function ToolkitHomePage() {
  const who = await adminVisitor();
  if (who === "signed-out") redirect("/login?next=%2Ftoolkit-beta%2Fhome");
  if (who !== "admin") notFound();
  const [{ tools, toolkitVersion }, open] = await Promise.all([frontPageData(), toolkitIsPublic()]);
  return <ToolkitHome tools={tools} toolkitVersion={toolkitVersion} draft={!open} />;
}
