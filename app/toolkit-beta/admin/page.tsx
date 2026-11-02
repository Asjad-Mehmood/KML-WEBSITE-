import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import ToolkitAdmin from "@/components/toolkit/ToolkitAdmin";

// Survey Toolkit (beta test), Admin: the testers, their PCs and what the Toolkits did. Kept apart
// from the main Admin (app/admin) so the test can be removed without touching it; signed in the
// same way. Never in search engines, the sitemap or the menu.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Survey Toolkit (beta) · Admin", robots: { index: false, follow: false } };

const LOGIN_URL = "/login?next=%2Ftoolkit-beta%2Fadmin";

async function visitor(): Promise<"signed-out" | "admin" | "other"> {
  const jar = await cookies();
  const token = jar.get("surveyor_auth_token")?.value || jar.get("surveyor_session")?.value;
  if (!token) return "signed-out";
  try {
    const session = await db.validateSession(token);
    if (!session) return "signed-out";
    return db.isAdmin(session.user) ? "admin" : "other";
  } catch (err) {
    console.error("Toolkit admin: session check failed:", err);
    throw new Error("The admin page couldn't check your sign-in. Please try again.");
  }
}

// Anyone not signed in goes to the sign-in and comes back; anyone else signed in gets "not found"
export default async function ToolkitAdminPage() {
  const who = await visitor();
  if (who === "signed-out") redirect(LOGIN_URL);
  if (who !== "admin") notFound();
  return <ToolkitAdmin />;
}
