import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/adminAuth";
import { db, type AppSettings } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/loginThrottle";
import { browserLabel } from "@/lib/adminOtp";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/site";
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
  verifyEmails: "Confirm new accounts' email",
  verifyOldAccounts: "Older accounts confirm their email",
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
  adminTwoFactor: "Admin two-factor sign-in",
  toolkitPublic: "Survey Toolkit open to everyone",
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
    // the Toolkit's page and the home page show or hide it
    if ("toolkitPublic" in extra) {
      revalidatePath("/");
      revalidatePath("/toolkit");
      revalidatePath("/sitemap.xml");
    }
    // a security alert to the admin: switching two-factor off is what someone with a stolen session would do
    if ("adminTwoFactor" in extra) await twoFactorNotice(admin.user.email, extra.adminTwoFactor === true, clientIp(req), req.headers.get("user-agent"));

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

async function twoFactorNotice(to: string, on: boolean, ip: string, ua: string | null) {
  if (!isMailConfigured()) return;
  const when = new Date().toUTCString();
  const where = `${browserLabel(ua)}${ip !== "unknown" ? `, IP ${ip}` : ""}`;
  const state = on ? "switched on" : "switched off";
  const what = on
    ? "Browsers new to admin must enter a 6-digit code emailed to you again."
    : "Admin sign-in is now password only: no emailed code is asked for.";
  const text = [
    `Two-factor sign-in for Excel to KML admin was ${state}.`,
    what,
    "",
    `When: ${when}`,
    `From: ${where}`,
    "",
    "If this wasn't you, change your admin password now and switch it back in Admin → Settings → Security:",
    `${SITE_URL}/forgot-password`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1d1d1f">
  <h2 style="margin:0 0 8px">Two-factor sign-in ${state}</h2>
  <p style="margin:0 0 16px;color:#555">${what}</p>
  <p style="margin:0 0 16px;color:#555;font-size:13px">When: ${when}<br>From: ${where.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>
  <p style="color:#b42318;font-size:13px">If this wasn't you, <a href="${SITE_URL}/forgot-password">change your admin password now</a> and switch it back in Admin → Settings → Security.</p>
</div>`;
  await sendMail({ to, subject: `Excel to KML admin: two-factor sign-in ${state}`, text, html }).catch((e) =>
    console.error("Couldn't send the two-factor notice:", e)
  );
}

// Only known settings, with the right types and sane ranges
function cleanSettings(body: Record<string, unknown>): Partial<AllSettings> | { error: string } {
  const out: Record<string, string | number | boolean> = {};
  const bools = [
    "requireAuthForDownload", "maintenanceMode", "announcementActive", "allowSignups", "googleSignInEnabled",
    "verifyEmails", "verifyOldAccounts",
    "traverseEnabled", "tlEnabled", "tlSharing", "tlKeepFiles", "signupPrompt", "reviewPrompt", "adminTwoFactor",
    "toolkitPublic",
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
