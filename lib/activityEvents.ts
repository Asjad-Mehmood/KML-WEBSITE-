import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { appOfRequest, tagActivity, type ActivityTags } from "@/lib/activityTags";

type Action = Parameters<typeof db.recordActivity>[0]["action"];
type Who = { id: string; email: string; name?: string | null } | null;

/**
 * Notes something an account did on the server's side (signed in, saved a Slope calculation …) in
 * the activity log, with the app it came from (lib/activityTags.ts). Written after the answer has
 * gone where possible, and never throws: a log line must not fail what it records.
 */
export async function logEvent(
  req: NextRequest | null,
  who: Who,
  action: string,
  title: string,
  extra: { details?: string; status?: "success" | "warning" | "error"; errorMessage?: string; tags?: ActivityTags; fileName?: string; fileSize?: string } = {}
): Promise<void> {
  try {
    const tags = { ...(await appOfRequest(req)), ...(extra.tags ?? {}) };
    const a = await db.recordActivity({
      userId: who?.id ?? null,
      userEmail: who?.email ?? null,
      userName: who?.name ?? null,
      action: action as Action,
      title: title.slice(0, 300),
      details: extra.details,
      fileName: extra.fileName,
      fileSize: extra.fileSize,
      status: extra.status ?? "success",
      ipAddress: req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req?.headers.get("x-real-ip") || undefined,
      userAgent: req?.headers.get("user-agent") || undefined,
    });
    await tagActivity(a.id, { ...tags, errorMessage: extra.errorMessage });
  } catch (err) {
    console.error("[activity] not written:", action, err);
  }
}
