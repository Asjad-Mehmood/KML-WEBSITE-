import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { adminVisitor } from "@/lib/toolkit/access";
import { frontPageData } from "@/lib/toolkit/frontPage";
import ToolkitHome from "@/components/toolkit/home/ToolkitHome";

// Survey Toolkit: the front page in detail, in the style the owner chose (option C, the hub). A
// draft until the launch (T10): admins only, never indexed. At the launch it becomes the public
// page and its Download goes to the public installer.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Survey Toolkit: every survey tool, one download (draft)",
  robots: { index: false, follow: false },
};

export default async function ToolkitHomePage() {
  const who = await adminVisitor();
  if (who === "signed-out") redirect("/login?next=%2Ftoolkit-beta%2Fhome");
  if (who !== "admin") notFound();
  const { tools, toolkitVersion } = await frontPageData();
  return <ToolkitHome tools={tools} toolkitVersion={toolkitVersion} />;
}
