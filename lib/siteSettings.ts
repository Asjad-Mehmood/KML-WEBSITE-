import { db, type AppSettings } from "@/lib/db";
import { DEFAULT_PUBLIC_SETTINGS, type PublicSettings } from "@/lib/publicSettings";

export { DEFAULT_PUBLIC_SETTINGS, type PublicSettings };

export function toPublic(s: AppSettings): PublicSettings {
  return {
    appVersion: s.appVersion,
    installerFileName: s.installerFileName,
    installerFileSize: s.installerFileSize,
    requireAuthForDownload: s.requireAuthForDownload,
    maintenanceMode: s.maintenanceMode,
    announcement: s.announcementActive ? s.announcementBanner.trim() : "",
  };
}

/** The settings, or the defaults when the database cannot be reached: the site never fails over them. */
export async function readSettings(): Promise<AppSettings | null> {
  try {
    return await db.getSettings();
  } catch (e) {
    console.error("[settings] read", e);
    return null;
  }
}

/**
 * The fields of a settings update that are known and of the right kind, cleaned up.
 * Anything else is left out; a value of the wrong kind is an error.
 */
export function cleanSettingsUpdate(body: unknown): { ok: true; value: Partial<AppSettings> } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Send the settings as JSON." };
  const b = body as Record<string, unknown>;
  const out: Partial<AppSettings> = {};
  const text = (k: "appVersion" | "installerFileName" | "installerFileSize" | "announcementBanner", max: number) => {
    if (b[k] === undefined) return null;
    if (typeof b[k] !== "string") return `${k} must be text.`;
    out[k] = (b[k] as string).trim().slice(0, max);
    return null;
  };
  const flag = (k: "requireAuthForDownload" | "maintenanceMode" | "announcementActive" | "webAppRestricted" | "webWatermarkKml" | "webDisableReports") => {
    if (b[k] === undefined) return null;
    if (typeof b[k] !== "boolean") return `${k} must be true or false.`;
    out[k] = b[k] as boolean;
    return null;
  };
  const errs = [
    text("appVersion", 40),
    text("installerFileName", 120),
    text("installerFileSize", 40),
    text("announcementBanner", 300),
    flag("requireAuthForDownload"),
    flag("maintenanceMode"),
    flag("announcementActive"),
    flag("webAppRestricted"),
    flag("webWatermarkKml"),
    flag("webDisableReports"),
  ].filter(Boolean);
  if (b.webMaxPoints !== undefined) {
    const n = typeof b.webMaxPoints === "number" ? b.webMaxPoints : parseInt(String(b.webMaxPoints), 10);
    if (!Number.isFinite(n) || n < 1 || n > 1_000_000) errs.push("The web points limit must be a number from 1 to 1,000,000.");
    else out.webMaxPoints = Math.round(n);
  }
  if (out.installerFileName !== undefined && !/^[\w .()+-]+\.(exe|msi|zip)$/i.test(out.installerFileName)) {
    errs.push("The installer file name must end in .exe, .msi or .zip, with no slashes.");
  }
  if (out.announcementActive && out.announcementBanner === "") errs.push("Write the announcement before switching it on.");
  return errs.length ? { ok: false, error: errs.join(" ") } : { ok: true, value: out };
}
