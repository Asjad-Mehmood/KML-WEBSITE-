import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import AdminClient from "./AdminClient";

// Checked on every request
export const dynamic = "force-dynamic";

async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get("surveyor_auth_token")?.value || jar.get("surveyor_session")?.value;
  if (!token) return false;
  // Not sessionForToken, which reads a database error as "signed out": here that would
  // turn a failing lookup into this page's "not found" even for a real admin. A visitor
  // with a session cookie sees the error page instead, and the cause goes to the logs.
  try {
    const session = await db.validateSession(token);
    return Boolean(session && db.isAdmin(session.user));
  } catch (err) {
    console.error("Admin page: session check failed:", err);
    throw new Error("The admin page couldn't check your sign-in. Please try again.");
  }
}

// Nothing in the tab title or page reveals an admin area to anyone else
export async function generateMetadata(): Promise<Metadata> {
  return (await isAdmin()) ? { title: "Admin", robots: { index: false, follow: false } } : {};
}

// Only a signed-in admin gets this page; everyone else gets the site's normal
// "page not found". Admins sign in on the regular login page.
export default async function AdminPage() {
  if (!(await isAdmin())) notFound();
  return <AdminClient />;
}
