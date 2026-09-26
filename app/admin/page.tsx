import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sessionForToken } from "@/lib/serverSession";
import AdminClient from "./AdminClient";

// Checked on every request
export const dynamic = "force-dynamic";

async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get("surveyor_auth_token")?.value || jar.get("surveyor_session")?.value;
  const session = await sessionForToken(token);
  return Boolean(session && db.isAdmin(session.user));
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
