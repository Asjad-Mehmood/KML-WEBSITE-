// Settings added after the app_settings table, kept as key/value rows in
// site_settings. Production deploys don't run database migrations, so new
// settings live here instead of new app_settings columns; the table is created
// on first use. Every value has a default, so a missing row means "default".
import { prisma } from "@/lib/prisma";

export type NoticeTone = "info" | "success" | "warning";

export interface ExtraSettings {
  /** New accounts (email and Google). Off: existing users still sign in. */
  allowSignups: boolean;
  /** New email-and-password accounts confirm their email (code or link) before they can sign in */
  verifyEmails: boolean;
  /** Accounts made before confirmation existed must confirm too, the next time they sign in */
  verifyOldAccounts: boolean;
  /** "Continue with Google" button, when Google is configured */
  googleSignInEnabled: boolean;
  /** Shown instead of the standard maintenance text; empty = standard */
  maintenanceMessage: string;
  announcementTone: NoticeTone;
  /** Optional link after the announcement: a site path (/whats-new) or an https URL */
  announcementLink: string;
  /** ISO date (YYYY-MM-DD); the announcement hides itself after this day. Empty = no end */
  announcementEndsAt: string;
  /** Traverse adjust (control points, traverses, level runs) in the app. Off: hidden everywhere in it */
  traverseEnabled: boolean;
  /** The Traverse & Level app (/traverse/app and the Windows program). Off: signed-in users see tlMessage */
  tlEnabled: boolean;
  /** Shown in the Traverse & Level app while it is off or the user is blocked; empty = standard */
  tlMessage: string;
  /** Sharing jobs with other accounts by email */
  tlSharing: boolean;
  /** Keep a copy of every file imported into or exported from Traverse & Level in the account */
  tlKeepFiles: boolean;
  /** Jobs one account may keep in Traverse & Level */
  tlMaxJobs: number;
  /** Accounts that may not use Traverse & Level: user ids, comma separated (Admin → Traverse & Level) */
  tlBlocked: string;
  /** Invite signed-out visitors to create an account once they have looked around (pages, time, scrolling, using a tool) */
  signupPrompt: boolean;
  /** Ask for a review after someone downloads one of our programs */
  reviewPrompt: boolean;
  /** The home page: "new" (every program: hero tabs, a section for each, all downloads) or "classic" (the earlier one, about Excel to KML) */
  homeHero: HomeHero;
}

export type HomeHero = "new" | "classic";
export const HOME_HEROES: HomeHero[] = ["new", "classic"];

export const EXTRA_DEFAULTS: ExtraSettings = {
  allowSignups: true,
  verifyEmails: true,
  verifyOldAccounts: false,
  googleSignInEnabled: true,
  maintenanceMessage: "",
  announcementTone: "info",
  announcementLink: "",
  announcementEndsAt: "",
  traverseEnabled: true,
  tlEnabled: true,
  tlMessage: "",
  tlSharing: true,
  tlKeepFiles: true,
  tlMaxJobs: 500,
  tlBlocked: "",
  signupPrompt: true,
  reviewPrompt: true,
  homeHero: "new",
};

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ready) {
    ready = prisma
      .$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "site_settings" (
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
      )`)
      .then(() => undefined)
      .catch((e) => {
        ready = null;
        throw e;
      });
  }
  return ready;
}

export async function getExtraSettings(): Promise<ExtraSettings> {
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`SELECT "key", "value" FROM "site_settings"`;
    const out: ExtraSettings = { ...EXTRA_DEFAULTS };
    for (const { key, value } of rows) {
      if (!(key in EXTRA_DEFAULTS)) continue;
      try {
        const v = JSON.parse(value);
        if (typeof v === typeof EXTRA_DEFAULTS[key as keyof ExtraSettings]) (out as unknown as Record<string, unknown>)[key] = v;
      } catch {
        // a damaged value falls back to its default
      }
    }
    return out;
  } catch (err) {
    console.error("Couldn't read site settings, using defaults:", err);
    return { ...EXTRA_DEFAULTS };
  }
}

export async function saveExtraSettings(updates: Partial<ExtraSettings>): Promise<void> {
  await ensureTable();
  for (const [key, value] of Object.entries(updates)) {
    if (!(key in EXTRA_DEFAULTS)) continue;
    const json = JSON.stringify(value);
    await prisma.$executeRaw`
      INSERT INTO "site_settings" ("key", "value", "updatedAt") VALUES (${key}, ${json}, NOW())
      ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()`;
  }
}

/** The announcement still running today (its end date, if any, not passed) */
export function announcementLive(endsAt: string, today = new Date()): boolean {
  if (!endsAt) return true;
  const end = new Date(`${endsAt}T23:59:59Z`);
  return Number.isNaN(end.getTime()) || today <= end;
}

/** Only a site path or an https link is allowed as the announcement link */
export function safeNoticeLink(link: string): string {
  const s = link.trim();
  if (/^\/(?!\/)[\w\-./?=&#%]*$/.test(s)) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}
