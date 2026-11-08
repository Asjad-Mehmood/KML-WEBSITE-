import nodemailer from "nodemailer";

// SMTP settings come from environment variables only — never hard-code credentials.
//   SMTP_HOST   e.g. smtp.gmail.com
//   SMTP_PORT   587 (STARTTLS, default) or 465 (TLS)
//   SMTP_USER   the mailbox login
//   SMTP_PASS   its password (for Gmail: an App Password)
//   MAIL_FROM   optional, e.g. "Excel to KML <hello@exceltokml.com>" (defaults to SMTP_USER)
//   MAIL_REPLY_TO optional, where replies go when MAIL_FROM isn't a mailbox you read
//   MAIL_GAP_MS optional, the pause between emails to many people (default 4000)
//
// Bulk email from a personal @gmail.com address tends to land in Spam. For emails to many
// users, send from your own domain through an email service (Brevo, Resend, Amazon SES...)
// with SPF, DKIM and DMARC set up in the domain's DNS; only these variables change.

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export const mailFrom = () => process.env.MAIL_FROM || process.env.SMTP_USER || "";
export const mailReplyTo = () => process.env.MAIL_REPLY_TO || undefined;

/** True while emails go out from a free mailbox (gmail.com, outlook.com...), which spam filters trust least */
export function sendsFromFreeMailbox(): boolean {
  const from = mailFrom().toLowerCase();
  const domain = (from.match(/@([a-z0-9.-]+)/) || [])[1] || "";
  return ["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com"].includes(domain);
}

/** The pause between emails to many people: a steady trickle looks less like spam than a burst */
export const mailGapMs = () => {
  const n = Number(process.env.MAIL_GAP_MS);
  if (Number.isFinite(n) && n >= 0 && process.env.MAIL_GAP_MS?.trim()) return Math.min(n, 20_000);
  // a sending service such as Brevo takes many emails a second; a mailbox (Gmail) wants a pause
  return /brevo|sendinblue|sendgrid|mailgun|postmark|amazonaws|resend/i.test(process.env.SMTP_HOST || "") ? 300 : 4000;
};

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  /** Extra headers, e.g. List-Unsubscribe-Post for one-click unsubscribe */
  headers?: Record<string, string>;
  /** List-* headers; list.unsubscribe becomes List-Unsubscribe */
  list?: { unsubscribe?: string | { url: string; comment: string } };
}

/**
 * A connection to the SMTP server. pool: true keeps one connection open for many messages
 * (release broadcasts); close it when the batch is done.
 */
export function mailTransport(pool = false) {
  if (!isMailConfigured()) throw new Error("Email is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS).");
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    ...(pool ? { pool: true, maxConnections: 1, maxMessages: 200 } : {}),
  });
}

export async function sendMail(opts: MailMessage) {
  const transport = mailTransport();
  await transport.sendMail({ from: mailFrom(), replyTo: mailReplyTo(), ...opts });
}
