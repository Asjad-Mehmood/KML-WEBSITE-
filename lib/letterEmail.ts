// Every email the site sends to its users, written as a short letter: how a person's email
// looks, so Gmail files it under Primary (or Updates) rather than Promotions, and spam filters
// see nothing of an advert. The rules, from what landed where in Gmail:
//   - no pictures, coloured blocks, buttons, tables or hidden preview text
//   - few links (one is best), written out as the address itself
//   - no sales words ("free", "new", "now", "!"), a plain subject
//   - light styling only: text colour and weight, one thin line above the footer
// lib/releaseEmail.ts (new versions and new programs), lib/reviewEmail.ts, lib/downloadEmail.ts,
// lib/emailVerify.ts and the password reset all use it.
import { SITE_NAME } from "@/lib/site";

export const escHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type LetterBlock =
  /** a paragraph; `bold` lists words shown in bold (product names) */
  | { p: string; bold?: string[] }
  /** a short heading line above a list */
  | { heading: string }
  /** a numbered list */
  | { steps: string[] }
  /** a bulleted list; "Title: text" items show the title in bold */
  | { bullets: string[] }
  /** a code to type, large and spaced */
  | { code: string }
  /** a link written out as its address (or `label`) */
  | { link: string; label?: string };

export interface Letter {
  subject: string;
  /** the first name, or "" for a plain "Hi," */
  first: string;
  blocks: LetterBlock[];
  /** "Thanks," by default */
  signOff?: string;
  /** why they get it, under a thin line */
  footer: string;
  /** e.g. "Stop these emails" and its address, after the footer */
  footerLink?: { label: string; url: string };
}

const BLUE = "#0b63ce";
const INK = "#111111";

function boldWords(text: string, words: string[] = []): string {
  let html = escHtml(text);
  for (const w of [...words].sort((a, b) => b.length - a.length)) {
    const e = escHtml(w);
    html = html.split(e).join(`<b style="color:${INK}">${e}</b>`);
  }
  return html;
}

function item(s: string): { head: string; text: string } {
  const i = s.indexOf(": ");
  return i > 0 && i < 60 ? { head: s.slice(0, i), text: s.slice(i + 2) } : { head: "", text: s };
}

export function letterEmail(l: Letter): { subject: string; text: string; html: string } {
  const hi = l.first ? `Hi ${l.first},` : "Hi,";
  const signOff = l.signOff ?? "Thanks,";

  // ---------- plain text ----------
  const t: string[] = [hi, ""];
  for (const b of l.blocks) {
    if ("p" in b) t.push(b.p, "");
    else if ("heading" in b) t.push(b.heading);
    else if ("steps" in b) t.push(...b.steps.map((s, i) => `${i + 1}. ${s}`), "");
    else if ("bullets" in b) t.push(...b.bullets.map((s) => `- ${s}`), "");
    else if ("code" in b) t.push(`    ${b.code}`, "");
    else if ("link" in b) t.push(b.link, "");
  }
  t.push(signOff, `The ${SITE_NAME} team`, "", "--", l.footer + (l.footerLink ? ` ${l.footerLink.label}: ${l.footerLink.url}` : ""));
  const text = t.join("\n");

  // ---------- HTML ----------
  const para = (inner: string, style = "") => `<p style="margin:0 0 14px${style ? `;${style}` : ""}">${inner}</p>`;
  const h: string[] = [];
  for (const b of l.blocks) {
    if ("p" in b) h.push(para(boldWords(b.p, b.bold)));
    else if ("heading" in b) h.push(`<p style="margin:20px 0 8px;font-weight:700;color:${INK}">${escHtml(b.heading)}</p>`);
    else if ("steps" in b)
      h.push(
        ...b.steps.map(
          (s, i) =>
            `<p style="margin:0 0 8px;padding-left:26px;text-indent:-26px"><span style="display:inline-block;width:26px;text-indent:0;font-weight:700;color:${BLUE}">${i + 1}.</span>${escHtml(s)}</p>`
        ),
        `<p style="margin:0 0 6px"></p>`
      );
    else if ("bullets" in b)
      h.push(
        `<ul style="margin:0 0 14px;padding-left:22px">${b.bullets
          .map((s) => {
            const it = item(s);
            return `<li style="margin:0 0 6px">${it.head ? `<b style="color:${INK}">${escHtml(it.head)}:</b> ` : ""}${escHtml(it.text)}</li>`;
          })
          .join("")}</ul>`
      );
    else if ("code" in b)
      h.push(para(escHtml(b.code), `font-size:30px;letter-spacing:6px;font-weight:700;color:${INK};font-family:Consolas,Menlo,monospace`));
    else if ("link" in b)
      h.push(
        para(
          `<a href="${escHtml(b.link)}" style="color:${BLUE};font-weight:700;text-decoration:underline">${escHtml(b.label ?? b.link.replace(/^https:\/\//, ""))}</a>`
        )
      );
  }
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(l.subject)}</title></head>
<body style="margin:0;padding:20px 16px;font-family:'Segoe UI',Roboto,Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#2b2b2b">
<div style="max-width:560px">
<p style="margin:0 0 18px;font-size:13px;font-weight:700;letter-spacing:.04em;color:${BLUE}">${escHtml(SITE_NAME)}</p>
${para(escHtml(hi))}
${h.join("\n")}
${para(`${escHtml(signOff)}<br><b style="color:${INK}">The ${escHtml(SITE_NAME)} team</b>`)}
<p style="margin:26px 0 0;padding-top:12px;border-top:1px solid #e3e3e3;font-size:12px;line-height:1.5;color:#808080">${escHtml(l.footer)}${
    l.footerLink ? ` <a href="${escHtml(l.footerLink.url)}" style="color:#808080">${escHtml(l.footerLink.label)}</a>` : ""
  }</p>
</div>
</body></html>`;
  return { subject: l.subject, text, html };
}
