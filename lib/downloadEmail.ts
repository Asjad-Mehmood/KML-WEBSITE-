// "Thanks for downloading" email, sent once: the first time a signed-in user
// downloads the Windows app. Uses the site's SMTP settings (lib/mailer.ts).
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function downloadThanksEmail(name: string, version: string) {
  const first = (name || "there").split(" ")[0];
  const links: [string, string, string][] = [
    ["App tutorial", `${SITE_URL}/tutorial`, "Four steps from your sheet to Google Earth, with screenshots"],
    ["Guides", `${SITE_URL}/guides`, "Total station CSV to KMZ, finding your UTM zone, KML vs KMZ and more"],
    ["Grid converters", `${SITE_URL}/convert`, "A page for every coordinate system, with its parameters"],
    ["Web app", `${SITE_URL}/app`, "Convert in your browser, no install"],
    ["Your dashboard", `${SITE_URL}/dashboard`, "Your downloads, files and history"],
  ];
  const subject = "Thanks for downloading Excel to KML";
  const text = [
    `Hi ${first},`,
    "",
    `Thanks for downloading Excel to KML${version ? ` ${version}` : ""}!`,
    "",
    "Getting started:",
    "1. Run ExcelToKMLPro-Lite-Setup.exe and follow the installer.",
    "2. If Windows shows a SmartScreen message, click \"More info\", then \"Run anyway\".",
    "3. Open the app and click \"Try the sample\" to see a finished job in a minute.",
    "",
    ...links.map(([t, u, d]) => `${t}: ${u}\n   ${d}`),
    "",
    `Questions or ideas? Just reply, or write to ${SUPPORT_EMAIL}.`,
    "",
    "— The Excel to KML team",
    SITE_URL,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f5f7fa;font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0">
<tr><td style="padding:28px 28px 8px">
<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0071e3;letter-spacing:.04em;text-transform:uppercase">Excel to KML</p>
<h1 style="margin:0 0 12px;font-size:22px">Thanks for downloading, ${esc(first)}!</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155">You've got Excel to KML${version ? ` ${esc(version)}` : ""} — survey coordinates from Excel to Google Earth KML, KMZ and DXF, on any grid.</p>
<h2 style="margin:20px 0 8px;font-size:16px">Getting started</h2>
<ol style="margin:0 0 8px;padding-left:20px;font-size:14.5px;line-height:1.6;color:#334155">
<li>Run <b>ExcelToKMLPro-Lite-Setup.exe</b> and follow the installer.</li>
<li>If Windows shows a SmartScreen message, click <b>More info</b>, then <b>Run anyway</b>.</li>
<li>Open the app and click <b>Try the sample</b> to see a finished job in a minute.</li>
</ol>
<h2 style="margin:20px 0 8px;font-size:16px">Helpful links</h2>
${links
  .map(
    ([t, u, d]) =>
      `<p style="margin:0 0 10px;font-size:14.5px;line-height:1.45"><a href="${u}" style="color:#0071e3;font-weight:600;text-decoration:none">${t} →</a><br><span style="color:#64748b">${d}</span></p>`
  )
  .join("")}
<p style="margin:18px 0 0;font-size:14.5px;line-height:1.55;color:#334155">Questions or ideas? Just reply, or write to <a href="mailto:${SUPPORT_EMAIL}" style="color:#0071e3">${SUPPORT_EMAIL}</a>.</p>
</td></tr>
<tr><td style="padding:18px 28px 26px;font-size:12.5px;color:#94a3b8">— The Excel to KML team · <a href="${SITE_URL}" style="color:#94a3b8">${SITE_URL.replace(/^https?:\/\//, "")}</a><br>You're getting this one-time email because you downloaded the app with your account.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}
