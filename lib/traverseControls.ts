import { getExtraSettings, saveExtraSettings } from "@/lib/siteSettings";

/** What the admin allows in the Traverse & Level app (Admin → Settings and Admin → Traverse & Level). */
export type TraverseControls = {
  /** The app is open for this account (switched on and the account not blocked) */
  enabled: boolean;
  /** Why it is closed, when it is */
  message: string;
  sharing: boolean;
  keepFiles: boolean;
  maxJobs: number;
  blocked: boolean;
};

export const TL_CLOSED_TEXT = "Traverse & Level is closed for maintenance. Your jobs are safe; please try again later.";
export const TL_BLOCKED_TEXT = "Traverse & Level is not available for this account. Write to us from exceltokml.com/contact if you think this is a mistake.";

export const blockedIds = (csv: string) => csv.split(",").map((s) => s.trim()).filter(Boolean);

export async function traverseControls(userId?: string | null): Promise<TraverseControls> {
  const x = await getExtraSettings();
  const blocked = Boolean(userId && blockedIds(x.tlBlocked).includes(userId));
  const enabled = x.tlEnabled && !blocked;
  return {
    enabled,
    message: enabled ? "" : blocked ? TL_BLOCKED_TEXT : x.tlMessage.trim() || TL_CLOSED_TEXT,
    sharing: x.tlSharing,
    keepFiles: x.tlKeepFiles,
    maxJobs: x.tlMaxJobs > 0 ? x.tlMaxJobs : 500,
    blocked,
  };
}

/** Block or unblock one account; returns the new list. */
export async function setBlocked(userId: string, block: boolean): Promise<string[]> {
  const x = await getExtraSettings();
  const ids = new Set(blockedIds(x.tlBlocked));
  if (block) ids.add(userId); else ids.delete(userId);
  const list = [...ids];
  await saveExtraSettings({ tlBlocked: list.join(",") });
  return list;
}

export async function blockedList(): Promise<string[]> {
  return blockedIds((await getExtraSettings()).tlBlocked);
}
