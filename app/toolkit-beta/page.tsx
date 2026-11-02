import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sessionForToken } from "@/lib/serverSession";
import { isTester } from "@/lib/toolkit/store";
import { toolkitDownloads } from "@/lib/toolkit/downloads";
import ToolkitBeta, { ToolkitBetaClosed } from "@/components/toolkit/ToolkitBeta";

// Survey Toolkit (beta test): the product page and the Download button, for testers only. Never in
// search engines, the sitemap or the menu: testers get the address from us. Signed out goes to the
// sign-in and comes back; signed in but not on the beta list sees that the beta is closed.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Survey Toolkit (beta)",
  description: "Every Excel to KML survey tool in one Windows program, kept up to date by itself. Private beta.",
  robots: { index: false, follow: false },
};

export default async function ToolkitBetaPage({ searchParams }: { searchParams: Promise<{ download?: string }> }) {
  const jar = await cookies();
  const session = await sessionForToken(jar.get("surveyor_auth_token")?.value || jar.get("surveyor_session")?.value);
  if (!session?.user) redirect("/login?next=%2Ftoolkit-beta");
  const user = session.user;
  const allowed = db.isAdmin(user) || (await isTester(user.email).catch(() => false));
  if (!allowed) return <ToolkitBetaClosed email={user.email} />;
  const latest = (await toolkitDownloads().catch(() => null))?.latest ?? null;
  const { download } = await searchParams;
  return <ToolkitBeta latest={latest} name={user.name || ""} problem={download === "none" || download === "error" ? download : null} />;
}
