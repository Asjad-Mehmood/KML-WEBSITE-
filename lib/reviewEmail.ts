// The email from Admin → Releases → Ask for reviews: a short note to people who downloaded or
// used a program, with five star links that open the review form already set to that rating.
// It shares the release emails' look and their "stop" link (one opt-out list for both).
import { C, FONT, esc, unsubscribeEndpoint, unsubscribePage } from "@/lib/releaseEmail";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

export interface ReviewAsk {
  appName: string;
  /** the product id the review is saved under (lib/reviews.ts) */
  product: string;
}

export const reviewLink = (product: string, stars?: number) => `${SITE_URL}/review/${product}${stars ? `?stars=${stars}` : ""}`;
const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function reviewRequestEmail(r: ReviewAsk, to: { name: string; email: string }) {
  const first = (to.name || "").trim().split(/\s+/)[0] || "there";
  const subject = `How is ${r.appName} working for you?`;
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const unsub = unsubscribePage(to.email);
  const intro = `You downloaded or used ${r.appName} with your ${host} account. Would you rate it? It takes ten seconds, it helps other surveyors and engineers decide, and it tells us what to make better.`;
  const why = "Pick a star below. You can add a sentence or two on the next page if you like.";

  const text = [
    subject,
    "",
    `Hi ${first},`,
    "",
    intro,
    "",
    ...[5, 4, 3, 2, 1].map((n) => `${"★".repeat(n)}${"☆".repeat(5 - n)} ${LABELS[n]}: ${reviewLink(r.product, n)}`),
    "",
    `Write a review: ${reviewLink(r.product)}`,
    "",
    `Something not working? Reply to this email or write to ${SUPPORT_EMAIL}; we'd rather fix it than read about it in a review.`,
    "",
    "Thank you,",
    `The ${SITE_NAME} team`,
    SITE_URL,
    "",
    "---",
    `You're getting this because you downloaded or used ${r.appName} with your account on ${host}. We only email about our programs.`,
    `Stop these emails: ${unsub}`,
  ].join("\n");

  const p = (html: string, extra = "") => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${C.body};${extra}">${html}</p>`;
  const stars = [1, 2, 3, 4, 5]
    .map(
      (n) => `<td align="center" width="20%" style="width:20%;padding:0 3px"><a href="${esc(reviewLink(r.product, n))}" title="${n} star${n === 1 ? "" : "s"}: ${LABELS[n]}" style="display:block;padding:10px 0 8px;border-radius:12px;border:1px solid ${C.line};background:#ffffff;text-decoration:none">
<div style="font-size:26px;line-height:1;color:#f59e0b">&#9733;</div>
<div style="margin-top:6px;font-size:13px;font-weight:700;color:${C.ink}">${n}</div>
<div style="margin-top:1px;font-size:10.5px;color:${C.muted}">${LABELS[n]}</div></a></td>`
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${FONT};color:${C.ink};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page}">Rate ${esc(r.appName)} in ten seconds&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}"><tr><td align="center" style="padding:28px 12px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">

<tr><td style="padding:0 4px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle"><img src="${SITE_URL}/assets/icon-192.png" width="34" height="34" alt="" style="display:block;border:0;border-radius:8px"></td>
<td valign="middle" style="padding-left:10px;font-size:16px;font-weight:700;color:${C.ink}">${esc(SITE_NAME)}</td>
</tr></table>
</td></tr>

<tr><td bgcolor="#ffffff" style="border-radius:16px;border:1px solid ${C.line}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:30px 30px 6px">
<div style="display:inline-block;padding:4px 10px;border-radius:999px;background:${C.tint};font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.blue}">${esc(r.appName)}</div>
<h1 style="margin:14px 0 18px;font-size:24px;line-height:1.3;font-weight:800;color:${C.ink}">${esc(subject)}</h1>
${p(`Hi ${esc(first)},`)}
${p(esc(intro))}
${p(esc(why), `color:${C.muted};font-size:14px`)}
</td></tr>
<tr><td style="padding:4px 27px 6px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
${stars}
</tr></table>
</td></tr>
<tr><td align="center" style="padding:18px 30px 8px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="${C.blue}" style="border-radius:10px"><a href="${esc(reviewLink(r.product))}" style="display:inline-block;padding:13px 24px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">Write a review &rarr;</a></td>
</tr></table>
</td></tr>
<tr><td style="padding:20px 30px 28px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line}"><tr><td style="padding-top:18px">
${p(`<b style="color:${C.ink}">Something not working?</b><br>Reply to this email or write to <a href="mailto:${SUPPORT_EMAIL}" style="color:${C.blue};text-decoration:none">${SUPPORT_EMAIL}</a>. We&rsquo;d rather fix it than read about it in a review.`)}
${p(`Thank you,<br><b style="color:${C.ink}">The ${esc(SITE_NAME)} team</b>`, "margin:0")}
</td></tr></table>
</td></tr>
</table>
</td></tr>

<tr><td align="center" style="padding:22px 20px 0;font-size:12px;line-height:1.6;color:${C.faint}">
<a href="${SITE_URL}" style="color:${C.muted};text-decoration:none;font-weight:600">${esc(host)}</a><br>
You're getting this because you downloaded or used ${esc(r.appName)} with your account on ${esc(host)}. We only email about our programs.<br>
<a href="${esc(unsub)}" style="color:${C.muted};text-decoration:underline">Stop these emails</a>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

  return {
    subject,
    text,
    html,
    list: { unsubscribe: { url: unsubscribeEndpoint(to.email), comment: "Stop emails about our programs" } },
    headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}
