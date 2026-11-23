// Every email the site sends to its users, in one clean layout: a white card with the name of the
// site, a title, short paragraphs, numbered steps and one button. It is styled with text and
// colour only, as a well-made account email is, so Gmail files it under Primary or Updates rather
// than Promotions. What sent mail there (seen in Gmail): a picture banner, product tiles, sales
// words ("Meet", "New", "Free"), hidden preview text. So, never here:
//   - no pictures but the small logo in the header (the site's own icon), no banner or background picture
//   - no hidden preview text, no sales words, no "!"
//   - one button at most, and few links
// lib/releaseEmail.ts (new versions and new programs), lib/reviewEmail.ts, lib/downloadEmail.ts,
// lib/emailVerify.ts and the password reset all use it.
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const escHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type LetterBlock =
  /** a paragraph; `bold` lists words shown in bold (product names) */
  | { p: string; bold?: string[] }
  /** a small heading above a list */
  | { heading: string }
  /** numbered steps */
  | { steps: string[] }
  /** a list with ticks; "Title: text" items show the title in bold */
  | { bullets: string[] }
  /** a code to type, large and spaced */
  | { code: string }
  /** the email's one button, with its address written under it */
  | { button: string; label: string }
  /** a plain link written out (or `label`) */
  | { link: string; label?: string };

export interface Letter {
  subject: string;
  /** the large title at the top of the card */
  title: string;
  /** the first name, or "" for a plain "Hi," */
  first: string;
  blocks: LetterBlock[];
  /** "Thanks," by default */
  signOff?: string;
  /** why they get it, under the card */
  footer: string;
  /** e.g. "Stop these emails" and its address, after the footer */
  footerLink?: { label: string; url: string };
}

const BLUE = "#0a66d8";
const NAVY = "#071a44";
const YELLOW = "#ffd21f";
const INK = "#0f172a";
const BODY = "#334155";
const MUTED = "#64748b";
const LINE = "#e6ebf2";
const SOFT = "#f2f5fa";
const TINT = "#eef4ff";
const GREEN = "#059669";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Dark mode for the mail apps that follow it (Apple Mail, Outlook apps); the rest show the light one
const DARK_CSS = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  .lt-bg { background:#0b1220 !important; }
  .lt-card { background:#111a2e !important; border-color:#1f2a44 !important; }
  .lt-ink { color:#f1f5f9 !important; }
  .lt-body { color:#cbd5e1 !important; }
  .lt-muted { color:#94a3b8 !important; }
  .lt-line { border-color:#1f2a44 !important; }
  .lt-tint { background:#16233f !important; border-color:#24355c !important; }
  .lt-step { background:#1d4ed8 !important; color:#ffffff !important; }
}`;

function boldWords(text: string, words: string[] = []): string {
  let html = escHtml(text);
  for (const w of [...words].sort((a, b) => b.length - a.length)) {
    const e = escHtml(w);
    html = html.split(e).join(`<b class="lt-ink" style="color:${INK};font-weight:600">${e}</b>`);
  }
  return html;
}

function item(s: string): { head: string; text: string } {
  const i = s.indexOf(": ");
  return i > 0 && i < 60 ? { head: s.slice(0, i), text: s.slice(i + 2) } : { head: "", text: s };
}

const shortUrl = (u: string) => u.replace(/^https?:\/\//, "").replace(/\?.*$/, "");

// The site's endpoints that an email may link to, and the clean address of each (middleware.ts
// answers the clean one with the endpoint). An address with /api/ in it is never written out.
const PRETTY_LINKS: [RegExp, string][] = [
  [/\/api\/auth\/verify-email(?=[?#]|$)/, "/confirm-email"],
  [/\/api\/toolkit\/download(?=[?#]|$)/, "/get/toolkit"],
];
export function prettyLink(url: string): string {
  let u = url;
  for (const [re, to] of PRETTY_LINKS) u = u.replace(re, to);
  return u;
}
/** The address as it may be shown in an email: the clean one, or null for an endpoint */
const shownUrl = (url: string): string | null => {
  const u = shortUrl(prettyLink(url));
  return /\/api\//.test(u) ? null : u;
};

export function letterEmail(raw: Letter): { subject: string; text: string; html: string } {
  // every link in its clean form
  const l: Letter = {
    ...raw,
    blocks: raw.blocks.map((b) => ("button" in b ? { ...b, button: prettyLink(b.button) } : "link" in b ? { ...b, link: prettyLink(b.link) } : b)),
  };
  const hi = l.first ? `Hi ${l.first},` : "Hi,";
  const signOff = l.signOff ?? "Thanks,";

  // ---------- plain text ----------
  const t: string[] = [l.title, "", hi, ""];
  for (const b of l.blocks) {
    if ("p" in b) t.push(b.p, "");
    else if ("heading" in b) t.push(b.heading.toUpperCase());
    else if ("steps" in b) t.push(...b.steps.map((s, i) => `${i + 1}. ${s}`), "");
    else if ("bullets" in b) t.push(...b.bullets.map((s) => `- ${s}`), "");
    else if ("code" in b) t.push(`    ${b.code}`, "");
    else if ("button" in b) t.push(`${b.label}: ${b.button}`, "");
    else if ("link" in b) t.push(b.link, "");
  }
  t.push(signOff, `The ${SITE_NAME} team`, "", "--", l.footer + (l.footerLink ? ` ${l.footerLink.label}: ${l.footerLink.url}` : ""));
  const text = t.join("\n");

  // ---------- HTML ----------
  const p = (inner: string, style = "") =>
    `<p class="lt-body" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${BODY}${style ? `;${style}` : ""}">${inner}</p>`;
  const h: string[] = [];
  for (const b of l.blocks) {
    if ("p" in b) h.push(p(boldWords(b.p, b.bold)));
    else if ("heading" in b)
      h.push(`<p class="lt-muted" style="margin:28px 0 12px;font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${MUTED}">${escHtml(b.heading)}</p>`);
    else if ("steps" in b)
      h.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px">${b.steps
          .map(
            (s, i) =>
              `<tr><td width="38" valign="top" style="padding:0 0 14px"><div class="lt-step" style="width:26px;height:26px;border-radius:13px;background:${NAVY};color:${YELLOW};font-size:12.5px;font-weight:800;line-height:26px;text-align:center">${i + 1}</div></td><td class="lt-body" valign="top" style="padding:3px 0 14px;font-size:15px;line-height:1.6;color:${BODY}">${escHtml(s)}</td></tr>`
          )
          .join("")}</table>`
      );
    else if ("bullets" in b)
      h.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px">${b.bullets
          .map((s) => {
            const it = item(s);
            return `<tr><td width="30" valign="top" style="padding:2px 0 12px"><div style="width:20px;height:20px;border-radius:10px;background:#d1fae5;color:${GREEN};font-size:12px;font-weight:800;line-height:20px;text-align:center">&#10003;</div></td><td class="lt-body" valign="top" style="padding:0 0 12px;font-size:15px;line-height:1.6;color:${BODY}">${
              it.head ? `<b class="lt-ink" style="color:${INK};font-weight:600">${escHtml(it.head)}.</b> ` : ""
            }${escHtml(it.text)}</td></tr>`;
          })
          .join("")}</table>`
      );
    else if ("code" in b)
      h.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px"><tr><td class="lt-tint" align="center" style="padding:20px 12px;border-radius:14px;background:${TINT};border:1px solid #d6e4ff">
<div class="lt-ink" style="font-size:34px;letter-spacing:10px;font-weight:800;color:${NAVY};font-family:'SF Mono',Consolas,Menlo,monospace;padding-left:10px">${escHtml(b.code)}</div>
<div class="lt-muted" style="margin-top:6px;font-size:12px;color:${MUTED}">Type this code where you were asked for it</div>
</td></tr></table>`
      );
    else if ("button" in b)
      h.push(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 12px"><tr>
<td bgcolor="${BLUE}" style="border-radius:999px;background:${BLUE}"><a href="${escHtml(b.button)}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${escHtml(b.label)} &rarr;</a></td>
</tr></table>
${
          shownUrl(b.button)
            ? `<p class="lt-muted" style="margin:0 0 22px;font-size:12.5px;line-height:1.5;color:${MUTED}">Button not working? Open <a href="${escHtml(b.button)}" style="color:${BLUE};text-decoration:none">${escHtml(shownUrl(b.button) as string)}</a></p>`
            : `<div style="height:12px"></div>`
        }`);
    else if ("link" in b)
      h.push(p(`<a href="${escHtml(b.link)}" style="color:${BLUE};font-weight:600;text-decoration:none">${escHtml(b.label ?? shownUrl(b.link) ?? "Open the link")} &rarr;</a>`));
  }

  const host = SITE_URL.replace(/^https?:\/\//, "");
  const footLink = (path: string, label: string) => `<a href="${escHtml(`${SITE_URL}${path}`)}" style="color:#8a94a6;text-decoration:none">${label}</a>`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escHtml(l.subject)}</title><style>${DARK_CSS}</style></head>
<body class="lt-bg" style="margin:0;padding:0;background:${SOFT};font-family:${FONT};-webkit-text-size-adjust:100%">
<table class="lt-bg" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${SOFT}"><tr><td align="center" style="padding:32px 12px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px">
<tr><td bgcolor="${NAVY}" style="background:${NAVY};border-radius:16px 16px 0 0;padding:18px 32px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle"><img src="${escHtml(`${SITE_URL}/assets/icon.png`)}" width="36" height="36" alt="" style="display:block;width:36px;height:36px;border:1px solid #3b5b8f;border-radius:9px"></td>
<td valign="middle" style="padding-left:11px;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-.01em">${escHtml(SITE_NAME)}</td>
</tr></table>
</td></tr>
<tr><td class="lt-card" bgcolor="#ffffff" style="background:#ffffff;border:1px solid ${LINE};border-top:0;border-radius:0 0 16px 16px;padding:30px 32px 10px">
<h1 class="lt-ink" style="margin:0 0 20px;font-size:24px;line-height:1.3;font-weight:800;color:${INK};letter-spacing:-.01em">${escHtml(l.title)}</h1>
${p(escHtml(hi))}
${h.join("\n")}
<p class="lt-body lt-line" style="margin:24px 0 22px;padding-top:20px;border-top:1px solid ${LINE};font-size:15px;line-height:1.6;color:${BODY}">${escHtml(signOff)}<br><b class="lt-ink" style="color:${INK};font-weight:700">The ${escHtml(SITE_NAME)} team</b></p>
</td></tr>
<tr><td align="center" style="padding:20px 16px 0;font-size:12px;line-height:1.7;color:#8a94a6">${escHtml(l.footer)}${
    l.footerLink ? `<br><a href="${escHtml(l.footerLink.url)}" style="color:#8a94a6;text-decoration:underline">${escHtml(l.footerLink.label)}</a>` : ""
  }<br><span style="display:inline-block;margin-top:8px">${footLink("/", escHtml(host))} &nbsp;·&nbsp; ${footLink("/contact", "Help")} &nbsp;·&nbsp; ${footLink("/privacy", "Privacy")}</span></td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { subject: l.subject, text, html };
}
