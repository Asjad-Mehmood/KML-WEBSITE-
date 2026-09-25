import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** Session token from the auth cookie (set by /api/auth/login) or a Bearer header. */
export function tokenFromRequest(req: NextRequest): string | undefined {
  return (
    req.cookies.get("surveyor_auth_token")?.value ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    undefined
  );
}

/** Validated session for a token, or null. Database errors count as signed out. */
export async function sessionForToken(token: string | undefined) {
  if (!token) return null;
  try {
    return await db.validateSession(token);
  } catch (err) {
    console.warn("Session validation failed:", err);
    return null;
  }
}

/** The Windows desktop app loads the web app HTML without a browser session. */
export function isWindowsAppRequest(req: NextRequest): boolean {
  const userAgent = req.headers.get("user-agent") || "";
  return (
    req.headers.get("x-app-platform") === "windows" ||
    req.nextUrl.searchParams.get("platform") === "windows" ||
    userAgent.includes("ExcelToKML") ||
    userAgent.includes("WindowsApp") ||
    userAgent.includes("Go-http-client")
  );
}
