import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { adminVisitor } from "@/lib/toolkit/access";
import { frontPageData } from "@/lib/toolkit/frontPage";
import HomeOptions from "@/components/toolkit/home-options/HomeOptions";

// Survey Toolkit (beta test): the five animated front-page options side by side. The owner chose C
// (the hub), now the full page at /toolkit-beta/home; the others stay here to compare. Admins only;
// never indexed.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Survey Toolkit · Front page options", robots: { index: false, follow: false } };

export default async function HomeOptionsPage() {
  const who = await adminVisitor();
  if (who === "signed-out") redirect("/login?next=%2Ftoolkit-beta%2Fhome-options");
  if (who !== "admin") notFound();
  const { tools, toolkitVersion } = await frontPageData();
  return <HomeOptions tools={tools} toolkitVersion={toolkitVersion} />;
}
