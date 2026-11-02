import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Survey Toolkit (beta test): who is looking at one of its pages. Not sessionForToken, which reads a
// database error as "signed out": that would send a real admin to the sign-in for no visible
// reason. A database error shows the error page instead, and the cause goes to the logs.
export async function adminVisitor(): Promise<"signed-out" | "admin" | "other"> {
  const jar = await cookies();
  const token = jar.get("surveyor_auth_token")?.value || jar.get("surveyor_session")?.value;
  if (!token) return "signed-out";
  try {
    const session = await db.validateSession(token);
    if (!session) return "signed-out";
    return db.isAdmin(session.user) ? "admin" : "other";
  } catch (err) {
    console.error("Toolkit page: session check failed:", err);
    throw new Error("The page couldn't check your sign-in. Please try again.");
  }
}
