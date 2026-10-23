// The release announcement emailed from Admin → Releases, and the signed link in it
// that unsubscribes the reader from release emails. Uses the site's SMTP settings.
import crypto from "crypto";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// ---------- unsubscribe links ----------
// token = base64url(email) + "." + HMAC. It never expires: an old email's link still works.
const secret = () => process.env.AUTH_SECRET || process.env.DATABASE_URL || "excel-to-kml";
const sign = (email: string) => crypto.createHmac("sha256", secret()).update(`unsubscribe:${email}`).digest("base64url").slice(0, 22);

export function unsubscribeToken(email: string): string {
  const e = email.trim().toLowerCase();
  return `${Buffer.from(e).toString("base64url")}.${sign(e)}`;
}

/** The email address the token was made for, or null if it was changed or made up. */
export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  const [payload, mac] = String(token || "").split(".");
  if (!payload || !mac) return null;
  let email: string;
  try {
    email = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const want = sign(email);
  if (mac.length !== want.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(want))) return null;
  return email;
}

export const unsubscribePage = (email: string) => `${SITE_URL}/unsubscribe?t=${unsubscribeToken(email)}`;
/** For the List-Unsubscribe header: mail apps POST here for their own "Unsubscribe" button */
export const unsubscribeEndpoint = (email: string) => `${SITE_URL}/api/unsubscribe?t=${unsubscribeToken(email)}`;

// ---------- the email ----------
export interface ReleaseForEmail {
  appName: string;
  version: string;
  title: string;
  notes: string;
  link: string;
  linkLabel: string;
  /** The app's newest version on the site, when this release is an older one */
  newerVersion?: string | null;
}

/** "Title: text" lines become a bold title and its text */
function noteItems(notes: string): { head: string; text: string }[] {
  return notes
    .split("\n")
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf(": ");
      return i > 0 && i < 60 ? { head: l.slice(0, i), text: l.slice(i + 2) } : { head: "", text: l };
    });
}

export const absoluteLink = (link: string) => (/^https:\/\//.test(link) ? link : `${SITE_URL}${link.startsWith("/") ? link : `/${link}`}`);

export function releaseEmail(r: ReleaseForEmail, to: { name: string; email: string }) {
  const first = (to.name || "").trim().split(/\s+/)[0] || "there";
  const items = noteItems(r.notes);
  const url = absoluteLink(r.link);
  const label = r.linkLabel.trim() || `Download ${r.appName} ${r.version}`;
  const unsub = unsubscribePage(to.email);
  const subject = r.title.trim() || `${r.appName} ${r.version} is out`;
  const newer = r.newerVersion ? `The download page always has the newest version, now ${r.appName} ${r.newerVersion}.` : "";

  const text = [
    `Hi ${first},`,
    "",
    `${r.appName} ${r.version} is available.`,
    ...(items.length ? ["", "What's new:", ...items.map((i) => `- ${i.head ? `${i.head}: ` : ""}${i.text}`)] : []),
    "",
    `${label}: ${url}`,
    ...(newer ? ["", newer] : []),
    "",
    `Questions or ideas? Just reply, or write to ${SUPPORT_EMAIL}.`,
    "",
    "— The Excel to KML team",
    SITE_URL,
    "",
    "You're getting this because you have an account on exceltokml.com.",
    `Stop release emails: ${unsub}`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f5f7fa;font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0">
<tr><td style="padding:28px 28px 8px">
<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0071e3;letter-spacing:.04em;text-transform:uppercase">${esc(r.appName)} · version ${esc(r.version)}</p>
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3">${esc(subject)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155">Hi ${esc(first)}, ${esc(r.appName)} ${esc(r.version)} is available.</p>
${
  items.length
    ? `<h2 style="margin:20px 0 8px;font-size:16px">What's new</h2>
<ul style="margin:0 0 8px;padding-left:20px;font-size:14.5px;line-height:1.6;color:#334155">
${items.map((i) => `<li style="margin:0 0 6px">${i.head ? `<b style="color:#0f172a">${esc(i.head)}:</b> ` : ""}${esc(i.text)}</li>`).join("\n")}
</ul>`
    : ""
}
<p style="margin:22px 0 8px"><a href="${esc(url)}" style="display:inline-block;background:#0071e3;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:12px 22px;border-radius:10px">${esc(label)}</a></p>
${newer ? `<p style="margin:8px 0 0;font-size:13.5px;line-height:1.5;color:#64748b">${esc(newer)}</p>` : ""}
<p style="margin:18px 0 0;font-size:14.5px;line-height:1.55;color:#334155">Questions or ideas? Just reply, or write to <a href="mailto:${SUPPORT_EMAIL}" style="color:#0071e3">${SUPPORT_EMAIL}</a>.</p>
</td></tr>
<tr><td style="padding:18px 28px 26px;font-size:12.5px;line-height:1.5;color:#94a3b8">— The Excel to KML team · <a href="${SITE_URL}" style="color:#94a3b8">${SITE_URL.replace(/^https?:\/\//, "")}</a><br>You're getting this because you have an account on exceltokml.com. <a href="${esc(unsub)}" style="color:#94a3b8">Stop release emails</a>.</td></tr>
</table></td></tr></table></body></html>`;

  return {
    subject,
    text,
    html,
    // RFC 8058 one-click unsubscribe: Gmail and Outlook show their own "Unsubscribe" button
    list: { unsubscribe: { url: unsubscribeEndpoint(to.email), comment: "Stop release emails" } },
    headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}
