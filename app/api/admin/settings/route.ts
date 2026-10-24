import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/adminAuth";
import { db, type AppSettings } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/loginThrottle";
import { EXTRA_DEFAULTS, HOME_HEROES, getExtraSettings, safeNoticeLink, saveExtraSettings, type ExtraSettings } from "@/lib/siteSettings";

type AllSettings = AppSettings & ExtraSettings;

// Names shown in the change history
const LABELS: Record<keyof AllSettings, string> = {
  appVersion: "Version",
  installerFileName: "Installer file",
  installerFileSize: "Installer size",
  requireAuthForDownload: "Sign-in to download",
  maintenanceMode: "Maintenance mode",
  maintenanceMessage: "Maintenance message",
  announcementBanner: "Announcement text",
  announcementActive: "Announcement shown",
  announcementTone: "Announcement colour",
  announcementLink: "Announcement link",
  announcementEndsAt: "Announcement end date",
  webAppRestricted: "Web app limits",
  webMaxPoints: "Web point limit",
  webWatermarkKml: "Web KML watermark",
  webDisableReports: "Web PDF reports locked",
  allowSignups: "New sign-ups",
  googleSignInEnabled: "Google sign-in",
  traverseEnabled: "Traverse adjust in the app",
  tlEnabled: "Traverse & Level app",
  tlMessage: "Traverse & Level closed message",
  tlSharing: "Traverse & Level sharing",
  tlKeepFiles: "Traverse & Level file copies",
  tlMaxJobs: "Traverse & Level jobs per account",
  tlBlocked: "Traverse & Level blocked accounts",
  signupPrompt: "Sign-up invitation",
  reviewPrompt: "Review after download",
  homeHero: "Home page",
};

async function allSettings(): Promise<AllSettings> {
  const [core, extra] = await Promise.all([db.getSettings(), getExtraSettings()]);
  return { ...core, ...extra };
}

async function history() {
  const rows = await prisma.activity.findMany({
    where: { action: "settings_changed" },
    orderBy: { timestamp: "desc" },
    take: 15,
    select: { id: true, userEmail: true, details: true, timestamp: true },
  });
  return rows.map((r) => ({ id: r.id, by: r.userEmail, changes: r.details, at: r.timestamp.toISOString() }));
}

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  return NextResponse.json({ success: true, settings: await allSettings(), history: await history().catch(() => []) });
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const clean = cleanSettings(body);
    if ("error" in clean) return NextResponse.json({ error: clean.error }, { status: 400 });

    const before = await allSettings();
    const core: Record<string, unknown> = {};
    const extra: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(clean)) {
      if (before[k as keyof AllSettings] === v) continue; // unchanged
      (k in EXTRA_DEFAULTS ? extra : core)[k] = v;
    }
    if (Object.keys(core).length) await db.updateSettings(core as Partial<AppSettings>);
    if (Object.keys(extra).length) await saveExtraSettings(extra as Partial<ExtraSettings>);
    // the home page is cached; build it again with the hero just chosen
    if ("homeHero" in extra) revalidatePath("/");

    const changed = [...Object.keys(core), ...Object.keys(extra)] as (keyof AllSettings)[];
    if (changed.length) {
      const show = (v: unknown) => (typeof v === "boolean" ? (v ? "on" : "off") : v === "" ? "(empty)" : String(v).slice(0, 60));
      await prisma.activity
        .create({
          data: {
            action: "settings_changed",
            title: `Settings changed: ${changed.map((k) => LABELS[k]).join(", ")}`.slice(0, 250),
            details: changed.map((k) => `${LABELS[k]}: ${show(before[k])} → ${show(clean[k])}`).join("\n"),
            userId: admin.user.id,
            userEmail: admin.user.email,
            userName: admin.user.name,
            ipAddress: clientIp(req),
          },
        })
        .catch((e) => console.error("Couldn't log the settings change:", e));
    }

    return NextResponse.json({
      success: true,
      settings: await allSettings(),
      history: await history().catch(() => []),
      changed: changed.length,
      message: changed.length ? "Settings saved" : "Nothing changed",
    });
  } catch (err: unknown) {
    console.error("Saving settings failed:", err);
    return NextResponse.json({ error: "Couldn't save the settings. Please try again." }, { status: 500 });
  }
}

// Only known settings, with the right types and sane ranges
function cleanSettings(body: Record<string, unknown>): Partial<AllSettings> | { error: string } {
  const out: Record<string, string | number | boolean> = {};
  const bools = [
    "requireAuthForDownload", "maintenanceMode", "announcementActive", "allowSignups", "googleSignInEnabled",
    "traverseEnabled", "tlEnabled", "tlSharing", "tlKeepFiles", "signupPrompt", "reviewPrompt",
  ];
  for (const k of bools) if (typeof body[k] === "boolean") out[k] = body[k] as boolean;
  const texts: [string, number][] = [
    ["appVersion", 30], ["installerFileName", 120], ["installerFileSize", 20], ["announcementBanner", 300], ["maintenanceMessage", 300], ["tlMessage", 300],
  ];
  for (const [k, max] of texts) if (typeof body[k] === "string") out[k] = (body[k] as string).trim().slice(0, max);

  if (typeof out.installerFileName === "string" && out.installerFileName && !/^[\w.-]+\.exe$/i.test(out.installerFileName)) {
    return { error: "Installer file must be a file name ending in .exe (letters, numbers, dots, dashes)." };
  }
  if (out.appVersion === "") return { error: "Version can't be empty." };
  if (body.tlMaxJobs !== undefined) {
    const n = Number(body.tlMaxJobs);
    if (!Number.isInteger(n) || n < 1 || n > 5000) return { error: "Jobs per account must be a whole number from 1 to 5000." };
    out.tlMaxJobs = n;
  }
  if (body.homeHero !== undefined) {
    if (!HOME_HEROES.includes(body.homeHero as (typeof HOME_HEROES)[number])) return { error: "Unknown home page." };
    out.homeHero = String(body.homeHero);
  }
  if (body.announcementTone !== undefined) {
    if (!["info", "success", "warning"].includes(String(body.announcementTone))) return { error: "Unknown announcement colour." };
    out.announcementTone = String(body.announcementTone);
  }
  if (typeof body.announcementLink === "string") {
    const raw = body.announcementLink.trim();
    const link = raw ? safeNoticeLink(raw) : "";
    if (raw && !link) return { error: "The announcement link must be a site page like /whats-new or a full https:// address." };
    out.announcementLink = link.slice(0, 300);
  }
  if (typeof body.announcementEndsAt === "string") {
    const d = body.announcementEndsAt.trim();
    if (d && (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(new Date(d).getTime()))) return { error: "The end date isn't a valid date." };
    out.announcementEndsAt = d;
  }
  if (out.announcementActive === true && typeof out.announcementBanner === "string" && !out.announcementBanner) {
    return { error: "Write the announcement text before switching it on." };
  }
  return out as Partial<AllSettings>;
}
