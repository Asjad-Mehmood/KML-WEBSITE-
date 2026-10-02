import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { isGoogleConfigured } from "@/lib/googleAuth";
import { otpAvailable } from "@/lib/adminOtp";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

type Check = { id: string; label: string; ok: boolean; detail: string; fix?: string };

// Admin → Settings → System health: is each piece of the site's setup working?
// Reports only whether things are set, never their values.
export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const checks: Check[] = [];

  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ id: "db", label: "Database", ok: true, detail: `Connected (${Date.now() - t0} ms)` });
  } catch {
    checks.push({ id: "db", label: "Database", ok: false, detail: "Not reachable", fix: "Check DATABASE_URL in Vercel." });
  }

  const mail = isMailConfigured();
  checks.push({
    id: "email",
    label: "Email (SMTP)",
    ok: mail,
    detail: mail ? `Set up${process.env.MAIL_FROM ? `, sends as ${process.env.MAIL_FROM}` : ""}` : "Not set up: no download emails, password resets or admin sign-in codes",
    fix: mail ? undefined : "Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in Vercel, then redeploy.",
  });

  const otp = otpAvailable();
  checks.push({
    id: "otp",
    label: "Admin sign-in code",
    ok: otp,
    detail: otp ? "On: new browsers need an emailed code" : process.env.ADMIN_OTP === "off" ? "Switched off with ADMIN_OTP=off" : "Off until email is set up",
    fix: otp ? undefined : process.env.ADMIN_OTP === "off" ? "Remove ADMIN_OTP from Vercel and redeploy." : "Set up email (above).",
  });

  const secret = (process.env.AUTH_SECRET || "").length >= 32;
  checks.push({
    id: "secret",
    label: "AUTH_SECRET",
    ok: secret,
    detail: secret ? "Set" : "Missing or shorter than 32 characters: password-reset links can't be made",
    fix: secret ? undefined : "Set AUTH_SECRET to 32+ random characters in Vercel, then redeploy.",
  });

  const google = isGoogleConfigured();
  checks.push({
    id: "google",
    label: "Google sign-in",
    ok: google,
    detail: google ? "Set up" : "Not set up: the Google button is hidden",
    fix: google ? undefined : "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel, then redeploy.",
  });

  const cron = Boolean(process.env.CRON_SECRET);
  checks.push({
    id: "cron",
    label: "Nightly clean-up",
    ok: cron,
    detail: cron ? "Scheduled 02:30 UTC" : "CRON_SECRET missing: the nightly clean-up is refused",
    fix: cron ? undefined : "Set CRON_SECRET in Vercel, then redeploy.",
  });

  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  return NextResponse.json({
    checks,
    deployment: {
      site: SITE_URL,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      commit: sha ? sha.slice(0, 7) : null,
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0]?.slice(0, 100) || null,
    },
  });
}

// "Send test email" to the signed-in admin
export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isMailConfigured()) return NextResponse.json({ error: "Email isn't set up yet (SMTP settings missing)." }, { status: 400 });
  try {
    await sendMail({
      to: session.user.email,
      subject: "Excel to KML: test email",
      text: `This is a test from Admin → Settings → System health.\n\nIf you're reading it, the site can send email: download thank-yous, password resets and admin sign-in codes will arrive.\n\n${SITE_URL}`,
      html: `<p>This is a test from <strong>Admin → Settings → System health</strong>.</p><p>If you're reading it, the site can send email: download thank-yous, password resets and admin sign-in codes will arrive.</p><p><a href="${SITE_URL}">${SITE_URL}</a></p>`,
    });
    return NextResponse.json({ ok: true, to: session.user.email });
  } catch (err) {
    console.error("Test email failed:", err);
    const msg = err instanceof Error ? err.message : "";
    // the mail server's own reason helps fix the settings; it holds no secrets
    return NextResponse.json({ error: `Sending failed${msg ? `: ${msg.slice(0, 200)}` : ""}` }, { status: 502 });
  }
}
