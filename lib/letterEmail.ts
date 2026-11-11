// Every email the site sends to its users, in one clean layout: a white card with the name of the
// site, a title, short paragraphs, numbered steps and one button. It is styled with text and
// colour only, as a well-made account email is, so Gmail files it under Primary or Updates rather
// than Promotions. What sent mail there (seen in Gmail): a picture banner, product tiles, sales
// words ("Meet", "New", "Free"), hidden preview text. So, never here:
//   - no pictures (the logo is drawn with text), no banner or background picture
//   - no hidden preview text, no sales words, no "!"
//   - one button at most, and few links
// lib/releaseEmail.ts (new versions and new programs), lib/reviewEmail.ts, lib/downloadEmail.ts,
// lib/emailVerify.ts and the password reset all use it.
import { SITE_NAME } from "@/lib/site";

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

const BLUE = "#0b63ce";
const NAVY = "#0b1f44";
const INK = "#0f172a";
const BODY = "#334155";
const MUTED = "#64748b";
const LINE = "#e5e9f0";
const SOFT = "#f4f7fb";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function boldWords(text: string, words: string[] = []): string {
  let html = escHtml(text);
  for (const w of [...words].sort((a, b) => b.length - a.length)) {
    const e = escHtml(w);
    html = html.split(e).join(`<b style="color:${INK};font-weight:600">${e}</b>`);
  }
  return html;
}

function item(s: string): { head: string; text: string } {
  const i = s.indexOf(": ");
  return i > 0 && i < 60 ? { head: s.slice(0, i), text: s.slice(i + 2) } : { head: "", text: s };
}

const shortUrl = (u: string) => u.replace(/^https:\/\//, "").replace(/\?.*$/, "");

export function letterEmail(l: Letter): { subject: string; text: string; html: string } {
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
  const p = (inner: string, style = "") => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BODY}${style ? `;${style}` : ""}">${inner}</p>`;
  const h: string[] = [];
  for (const b of l.blocks) {
    if ("p" in b) h.push(p(boldWords(b.p, b.bold)));
    else if ("heading" in b)
      h.push(`<p style="margin:26px 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">${escHtml(b.heading)}</p>`);
    else if ("steps" in b)
      h.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px">${b.steps
          .map(
            (s, i) =>
              `<tr><td width="34" valign="top" style="padding:0 0 12px"><div style="width:24px;height:24px;border-radius:12px;background:${BLUE};color:#ffffff;font-size:12px;font-weight:700;line-height:24px;text-align:center">${i + 1}</div></td><td valign="top" style="padding:2px 0 12px;font-size:15px;line-height:1.55;color:${BODY}">${escHtml(s)}</td></tr>`
          )
          .join("")}</table>`
      );
    else if ("bullets" in b)
      h.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px">${b.bullets
          .map((s) => {
            const it = item(s);
            return `<tr><td width="28" valign="top" style="padding:1px 0 10px;font-size:15px;font-weight:700;color:${BLUE}">&#10003;</td><td valign="top" style="padding:0 0 10px;font-size:15px;line-height:1.55;color:${BODY}">${
              it.head ? `<b style="color:${INK};font-weight:600">${escHtml(it.head)}.</b> ` : ""
            }${escHtml(it.text)}</td></tr>`;
          })
          .join("")}</table>`
      );
    else if ("code" in b)
      h.push(
        `<p style="margin:0 0 18px;padding:16px;border-radius:10px;background:${SOFT};border:1px solid ${LINE};text-align:center;font-size:32px;letter-spacing:8px;font-weight:700;color:${INK};font-family:Consolas,Menlo,monospace">${escHtml(b.code)}</p>`
      );
    else if ("button" in b)
      h.push(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 10px"><tr>
<td bgcolor="${BLUE}" style="border-radius:8px"><a href="${escHtml(b.button)}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${escHtml(b.label)}</a></td>
</tr></table>
<p style="margin:0 0 20px;font-size:13px;line-height:1.5;color:${MUTED}">Or open <a href="${escHtml(b.button)}" style="color:${BLUE};text-decoration:none">${escHtml(shortUrl(b.button))}</a></p>`);
    else if ("link" in b)
      h.push(p(`<a href="${escHtml(b.link)}" style="color:${BLUE};font-weight:600;text-decoration:none">${escHtml(b.label ?? shortUrl(b.link))}</a>`));
  }

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escHtml(l.subject)}</title></head>
<body style="margin:0;padding:0;background:${SOFT};font-family:${FONT};-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${SOFT}"><tr><td align="center" style="padding:28px 12px 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td bgcolor="#ffffff" style="background:#ffffff;border:1px solid ${LINE};border-top:3px solid ${BLUE};border-radius:12px;padding:26px 30px 8px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px"><tr>
<td valign="middle"><div style="width:26px;height:26px;border-radius:7px;background:${NAVY};color:#ffd21f;font-size:13px;font-weight:800;line-height:26px;text-align:center">&#9678;</div></td>
<td valign="middle" style="padding-left:9px;font-size:15px;font-weight:700;color:${NAVY}">${escHtml(SITE_NAME)}</td>
</tr></table>
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:700;color:${INK}">${escHtml(l.title)}</h1>
${p(escHtml(hi))}
${h.join("\n")}
<p style="margin:22px 0 20px;padding-top:18px;border-top:1px solid ${LINE};font-size:15px;line-height:1.6;color:${BODY}">${escHtml(signOff)}<br><b style="color:${INK};font-weight:600">The ${escHtml(SITE_NAME)} team</b></p>
</td></tr>
<tr><td align="center" style="padding:18px 16px 0;font-size:12px;line-height:1.6;color:#8a94a6">${escHtml(l.footer)}${
    l.footerLink ? `<br><a href="${escHtml(l.footerLink.url)}" style="color:#8a94a6;text-decoration:underline">${escHtml(l.footerLink.label)}</a>` : ""
  }</td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { subject: l.subject, text, html };
}
