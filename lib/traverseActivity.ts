import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

type Action = Parameters<typeof db.recordActivity>[0]["action"];
type Who = { id: string; email: string; name?: string | null };

/**
 * Record something done in the Traverse & Level app in the account's activity log (the same log
 * Excel to KML writes to, shown on the account page and in the admin). Never throws: a failed log
 * line must not fail the request that caused it.
 */
export function logTraverseActivity(
  req: NextRequest,
  user: Who,
  action: string,
  title: string,
  extra: { details?: string; status?: "success" | "warning" | "error" } = {}
) {
  db.recordActivity({
    userId: user.id,
    userEmail: user.email,
    userName: user.name ?? null,
    action: action as Action,
    title: title.slice(0, 300),
    details: extra.details,
    status: extra.status ?? "success",
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  }).catch(() => {});
}
