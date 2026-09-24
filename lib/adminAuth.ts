import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("surveyor_session")?.value;
    if (!token) return null;

    const sessionData = db.validateSession(token);
    if (!sessionData) return null;

    if (!db.isAdmin(sessionData.user)) {
      return null;
    }

    return sessionData;
  } catch (err) {
    console.error("Admin auth verification error", err);
    return null;
  }
}
