import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminClient from "./AdminClient";

// Checked on every request
export const dynamic = "force-dynamic";

const ADMIN_LOGIN_URL = "/login?next=%2Fadmin";

/** Who is asking: nobody signed in, a signed-in admin, or someone else signed in. */
async function visitor(): Promise<"signed-out" | "admin" | "other"> {
  const jar = await cookies();
  const token = jar.get("surveyor_auth_token")?.value || jar.get("surveyor_session")?.value;
  if (!token) return "signed-out";
  // Not sessionForToken, which reads a database error as "signed out": here that would
  // send a real admin back to the sign-in page for no visible reason. A visitor with a
  // session cookie sees the error page instead, and the cause goes to the logs.
  try {
    const session = await db.validateSession(token);
    if (!session) return "signed-out"; // expired or signed out elsewhere
    return db.isAdmin(session.user) ? "admin" : "other";
  } catch (err) {
    console.error("Admin page: session check failed:", err);
    throw new Error("The admin page couldn't check your sign-in. Please try again.");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return (await visitor()) === "admin" ? { title: "Admin", robots: { index: false, follow: false } } : {};
}

// Admins sign in on the regular login page: anyone not signed in is sent there and
// comes back here afterwards. Someone signed in who isn't an admin gets the site's
// normal "page not found".
export default async function AdminPage() {
  const who = await visitor();
  if (who === "signed-out") redirect(ADMIN_LOGIN_URL);
  if (who !== "admin") notFound();
  return <AdminClient />;
}
