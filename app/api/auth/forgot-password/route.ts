import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { createResetToken } from "@/lib/passwordReset";

// Same reply whether or not the email has an account, so this can't be used to find accounts
const GENERIC_REPLY = {
  success: true,
  message: "If an account exists for that email, a reset link is on its way. It expires in 1 hour.",
};

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!isMailConfigured() || !process.env.AUTH_SECRET) {
    console.error("Password reset requested but SMTP_* / AUTH_SECRET are not configured");
    return NextResponse.json({ error: "Password reset is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  try {
    const user = await db.findUserByEmail(email.trim().toLowerCase());
    if (user) {
      // Build the link from the configured site URL, not the request's Host header
      const base = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/+$/, "");
      const link = `${base}/reset-password?token=${encodeURIComponent(createResetToken(user))}`;
      await sendMail({
        to: user.email,
        subject: "Reset your Excel to KML password",
        text: `Hi ${user.name},\n\nUse this link to choose a new password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.`,
        html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#0f172a;line-height:1.5">
<p>Hi ${user.name.replace(/[<>&"]/g, "")},</p>
<p>Use the button below to choose a new password. The link is valid for 1 hour.</p>
<p><a href="${link}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#0071e3;color:#fff;text-decoration:none;font-weight:600">Reset password</a></p>
<p style="color:#64748b;font-size:13px">If you didn't ask for this, ignore this email — your password won't change.</p>
</div>`,
      });
    }
  } catch (err) {
    // Log, but still answer generically
    console.error("Password reset email failed:", err);
  }
  return NextResponse.json(GENERIC_REPLY);
}
