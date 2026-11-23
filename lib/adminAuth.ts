import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sessionHasAdminPower } from "@/lib/adminHost";

export async function getAdminSession(req?: NextRequest | Request) {
  try {
    let token: string | undefined;

    // 1. Check req if provided
    if (req) {
      // Check cookies on NextRequest
      if ("cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
        token =
          (req as NextRequest).cookies.get("surveyor_session")?.value ||
          (req as NextRequest).cookies.get("surveyor_auth_token")?.value;
      }

      // Check Authorization & X-Admin-Token headers
      if (!token && req.headers) {
        const authHeader = req.headers.get("authorization");
        if (authHeader) {
          token = authHeader.replace(/^Bearer\s+/i, "").trim();
        }
        if (!token) {
          token = req.headers.get("x-admin-token") || undefined;
        }

        // Direct cookie header parsing fallback
        if (!token) {
          const cookieHeader = req.headers.get("cookie");
          if (cookieHeader) {
            const sessionMatch = cookieHeader.match(/(?:^|;\s*)surveyor_session=([^;]+)/);
            const authMatch = cookieHeader.match(/(?:^|;\s*)surveyor_auth_token=([^;]+)/);
            token = (sessionMatch && sessionMatch[1]) || (authMatch && authMatch[1]) || undefined;
          }
        }
      }
    }

    // 2. Fallback to cookies() from next/headers
    if (!token) {
      try {
        const cookieStore = await cookies();
        token =
          cookieStore.get("surveyor_session")?.value ||
          cookieStore.get("surveyor_auth_token")?.value;
      } catch {
        // cookies() may throw outside request scope
      }
    }

    if (!token) return null;

    const sessionData = await db.validateSession(token);
    if (!sessionData) return null;

    // an admin account, signed in on the admin address once it has one (lib/adminHost)
    if (!sessionHasAdminPower(sessionData.session, db.isAdmin(sessionData.user))) {
      return null;
    }

    return sessionData;
  } catch (err) {
    console.error("Admin auth verification error", err);
    return null;
  }
}
