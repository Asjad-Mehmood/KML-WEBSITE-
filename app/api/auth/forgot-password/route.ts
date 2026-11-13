import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMailConfigured } from "@/lib/mailer";
import { sendPasswordResetEmail } from "@/lib/resetEmail";

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
      await sendPasswordResetEmail(user, base);
    }
  } catch (err) {
    // Log, but still answer generically
    console.error("Password reset email failed:", err);
  }
  return NextResponse.json(GENERIC_REPLY);
}
