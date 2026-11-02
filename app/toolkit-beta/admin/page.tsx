import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { adminVisitor } from "@/lib/toolkit/access";
import ToolkitAdmin from "@/components/toolkit/ToolkitAdmin";

// Survey Toolkit (beta test), Admin: the testers, their PCs and what the Toolkits did. Kept apart
// from the main Admin (app/admin) so the test can be removed without touching it; signed in the
// same way. Never in search engines, the sitemap or the menu.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Survey Toolkit (beta) · Admin", robots: { index: false, follow: false } };

const LOGIN_URL = "/login?next=%2Ftoolkit-beta%2Fadmin";

// Anyone not signed in goes to the sign-in and comes back; anyone else signed in gets "not found"
export default async function ToolkitAdminPage() {
  const who = await adminVisitor();
  if (who === "signed-out") redirect(LOGIN_URL);
  if (who !== "admin") notFound();
  return <ToolkitAdmin />;
}
