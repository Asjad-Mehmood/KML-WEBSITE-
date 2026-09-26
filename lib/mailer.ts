import nodemailer from "nodemailer";

// SMTP settings come from environment variables only — never hard-code credentials.
//   SMTP_HOST   e.g. smtp.gmail.com
//   SMTP_PORT   587 (STARTTLS, default) or 465 (TLS)
//   SMTP_USER   the mailbox login
//   SMTP_PASS   its password (for Gmail: an App Password)
//   MAIL_FROM   optional, e.g. "Excel to KML <no-reply@exceltokml.com>" (defaults to SMTP_USER)

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(opts: { to: string; subject: string; text: string; html: string; replyTo?: string }) {
  if (!isMailConfigured()) throw new Error("Email is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS).");
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    ...opts,
  });
}
