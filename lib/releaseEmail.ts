// The release announcement emailed from Admin → Releases, and the signed link in it
// that unsubscribes the reader from release emails. Uses the site's SMTP settings.
import crypto from "crypto";
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { TRAVERSE_APP } from "@/lib/traverse";

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

// ---------- how each app updates ----------
// People on the list have an account, so many already have the app. Each email says how to get
// the new version onto what they have, and how to start if they don't have it yet.
interface UpdateGuide {
  /** Where it runs, shown in the details row */
  platform: string;
  /** True when installed copies update themselves */
  automatic: boolean;
  /** For people who already have it */
  steps: string[];
  /** For people who don't have it yet */
  newUser: string;
  /** A second link, e.g. the release notes or the install guide */
  more: { label: string; href: string };
}

const UPDATE_GUIDES: Record<string, UpdateGuide> = {
  "excel-to-kml": {
    platform: "Windows, Android and web",
    automatic: true,
    steps: [
      "Windows: open Excel to KML while you're online. It checks for the new version when it starts; press Yes and it updates and restarts by itself.",
      "Your jobs, settings and symbol library are kept through the update.",
      "Android: install the new .apk from the download page over the one you have.",
      "In your browser: nothing to do, the web version is always the newest.",
    ],
    newUser: "Don't have it yet? Download it free for Windows or Android, or use it in your browser.",
    more: { label: "Full release notes", href: "/whats-new" },
  },
  traverse: {
    platform: "Web app and Windows",
    automatic: true,
    steps: [
      "Windows program: open it while you're online and it updates itself.",
      `Web app: nothing to do, ${SITE_URL.replace(/^https?:\/\//, "")}${TRAVERSE_APP} always runs the newest version.`,
      "Your account and saved jobs are the same in both.",
    ],
    newUser: "Don't have it yet? Open the web app with your account, or install the Windows program.",
    more: { label: "User manual (PDF)", href: "/traverse/Traverse-Level-User-Manual.pdf" },
  },
  roadpro: {
    platform: "AutoCAD, Civil 3D and Map 3D",
    automatic: false,
    steps: [
      "Download RoadPro.zip and unzip it.",
      "In AutoCAD, type APPLOAD and load the new RoadPro.lsp.",
      "In the Startup Suite, replace the old RoadPro.lsp with the new one so it loads every time.",
      "Your settings are kept, and roads drawn with earlier versions keep working.",
    ],
    newUser: "New to RoadPro? The download page has the plugin, a step-by-step install guide and the user manual.",
    more: { label: "Install guide", href: "/roadpro#install" },
  },
  "project-folder-manager": {
    platform: "Windows 10 and 11",
    automatic: false,
    steps: [
      "Download Project_Folder_Manager.zip.",
      "Replace only Project_Folder_Manager.hta in your program folder, next to the .exe.",
      "Your settings and search index are kept, since they're saved next to the program.",
    ],
    newUser: "New to Project Folder Manager? Unzip it anywhere, open the .exe and point it at your project folder.",
    more: { label: "Install guide", href: "/project-folder-manager#install" },
  },
};

const FALLBACK_GUIDE: UpdateGuide = {
  platform: "",
  automatic: false,
  steps: ["Download the new version from the link below and install it over the one you have."],
  newUser: "",
  more: { label: "", href: "" },
};

// ---------- the email ----------
export interface ReleaseForEmail {
  appId: string;
  appName: string;
  version: string;
  releasedAt: Date;
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
      if (!(i > 0 && i < 60)) return { head: "", text: l };
      const text = l.slice(i + 2);
      return { head: l.slice(0, i), text: text.charAt(0).toUpperCase() + text.slice(1) };
    });
}

export const absoluteLink = (link: string) => (/^https:\/\//.test(link) ? link : `${SITE_URL}${link.startsWith("/") ? link : `/${link}`}`);

const longDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// colours and fonts, inline because email apps drop <style>
const C = { blue: "#0071e3", ink: "#0f172a", body: "#334155", muted: "#64748b", faint: "#94a3b8", line: "#e2e8f0", page: "#f1f5f9", tint: "#f0f7ff" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function releaseEmail(r: ReleaseForEmail, to: { name: string; email: string }) {
  const first = (to.name || "").trim().split(/\s+/)[0] || "there";
  const items = noteItems(r.notes);
  const guide = UPDATE_GUIDES[r.appId] || FALLBACK_GUIDE;
  const url = absoluteLink(r.link);
  const label = r.linkLabel.trim() || (r.newerVersion ? `Get ${r.appName} ${r.newerVersion}` : `Download ${r.appName} ${r.version}`);
  const more = guide.more.href ? { label: guide.more.label, url: absoluteLink(guide.more.href) } : null;
  const unsub = unsubscribePage(to.email);
  const subject = r.title.trim() || `${r.appName} ${r.version} is out`;
  const released = longDate(r.releasedAt);
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const intro = r.newerVersion
    ? `Here's a look back at ${r.appName} ${r.version}, released on ${released}. The newest version is now ${r.newerVersion}, and updating gets you everything below plus what came after.`
    : `${r.appName} ${r.version} is now available. Here's what's new, and how to get it.`;
  const updateHead = guide.automatic ? `Already using ${r.appName}? It updates itself` : `Already using ${r.appName}? Update in a minute`;
  const preheader = items.length ? `${items.map((i) => i.head || i.text).slice(0, 3).join(" · ")}` : intro;
  const details = [
    ["Version", r.version],
    ["Released", released],
    ...(guide.platform ? [["Works on", guide.platform]] : []),
    ["Price", "Free"],
  ];

  // ---------- plain text ----------
  const text = [
    `${r.appName.toUpperCase()} ${r.version}`,
    subject,
    "",
    `Hi ${first},`,
    "",
    intro,
    ...(items.length ? ["", `WHAT'S NEW IN ${r.version}`, ...items.map((i) => `- ${i.head ? `${i.head}: ` : ""}${i.text}`)] : []),
    "",
    updateHead.toUpperCase(),
    ...guide.steps.map((s, i) => `${i + 1}. ${s}`),
    ...(guide.newUser ? ["", guide.newUser] : []),
    "",
    `${label}: ${url}`,
    ...(more ? [`${more.label}: ${more.url}`] : []),
    "",
    details.map(([k, v]) => `${k}: ${v}`).join(" | "),
    "",
    `Questions, or something not working? Reply to this email or write to ${SUPPORT_EMAIL}. We read every message.`,
    "",
    "Thanks for using our software,",
    `The ${SITE_NAME} team`,
    SITE_URL,
    "",
    "---",
    `You're getting this because you have an account on ${host}. We email when there's a new version, nothing else.`,
    `Stop release emails: ${unsub}`,
  ].join("\n");

  // ---------- HTML ----------
  const p = (html: string, extra = "") => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${C.body};${extra}">${html}</p>`;
  const h2 = (t: string) => `<h2 style="margin:28px 0 12px;font-size:13px;line-height:1.4;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.muted}">${esc(t)}</h2>`;

  const whatsNew = items.length
    ? `${h2(`What's new in ${r.version}`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${items
  .map(
    (i) => `<tr>
<td width="28" valign="top" style="padding:2px 0 12px"><div style="width:20px;height:20px;border-radius:10px;background:${C.tint};color:${C.blue};font-size:12px;font-weight:700;line-height:20px;text-align:center">&#10003;</div></td>
<td valign="top" style="padding:0 0 12px;font-size:14.5px;line-height:1.6;color:${C.body}">${i.head ? `<b style="color:${C.ink}">${esc(i.head)}</b><br>` : ""}${esc(i.text)}</td>
</tr>`
  )
  .join("\n")}
</table>`
    : "";

  const steps = guide.steps
    .map(
      (s, i) => `<tr>
<td width="30" valign="top" style="padding:0 0 10px"><div style="width:22px;height:22px;border-radius:11px;background:${C.blue};color:#ffffff;font-size:12px;font-weight:700;line-height:22px;text-align:center">${i + 1}</div></td>
<td valign="top" style="padding:1px 0 10px;font-size:14.5px;line-height:1.55;color:${C.body}">${esc(s)}</td>
</tr>`
    )
    .join("\n");

  const button = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 6px"><tr>
<td bgcolor="${C.blue}" style="border-radius:10px"><a href="${esc(url)}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px">${esc(label)} &rarr;</a></td>
</tr></table>
${more ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.5"><a href="${esc(more.url)}" style="color:${C.blue};text-decoration:none;font-weight:600">${esc(more.label)}</a></p>` : ""}`;

  const detailRow = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}"><tr>
${details
  .map(
    ([k, v]) =>
      `<td valign="top" style="padding:12px 8px 12px 0"><div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${C.faint}">${esc(k)}</div><div style="margin-top:3px;font-size:13.5px;font-weight:600;color:${C.ink}">${esc(v)}</div></td>`
  )
  .join("\n")}
</tr></table>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${FONT};color:${C.ink};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page}">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}"><tr><td align="center" style="padding:28px 12px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">

<tr><td style="padding:0 4px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle"><img src="${SITE_URL}/assets/icon-192.png" width="34" height="34" alt="" style="display:block;border:0;border-radius:8px"></td>
<td valign="middle" style="padding-left:10px;font-size:16px;font-weight:700;color:${C.ink}">${esc(SITE_NAME)}</td>
</tr></table>
</td></tr>

<tr><td bgcolor="#ffffff" style="border-radius:16px;border:1px solid ${C.line};overflow:hidden">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td bgcolor="${C.blue}" style="background:${C.blue};background-image:linear-gradient(135deg,#0071e3,#2563eb 55%,#4f46e5);border-radius:16px 16px 0 0;padding:30px 32px 28px">
<div style="display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.18);font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ffffff">${r.newerVersion ? "Release notes" : "New version"}</div>
<div style="margin-top:14px;font-size:14px;font-weight:600;color:#dbeafe">${esc(r.appName)} ${esc(r.version)}</div>
<h1 style="margin:6px 0 0;font-size:25px;line-height:1.3;font-weight:800;color:#ffffff">${esc(subject)}</h1>
</td></tr>

<tr><td style="padding:28px 32px 8px">
${p(`Hi ${esc(first)},`)}
${p(esc(intro), "margin-bottom:0")}
${detailRow}
${whatsNew}

${h2(updateHead)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.tint}" style="border-radius:12px"><tr><td style="padding:18px 18px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${steps}
</table>
</td></tr></table>
${guide.newUser ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.55;color:${C.muted}">${esc(guide.newUser)}</p>` : ""}

${button}
</td></tr>

<tr><td style="padding:22px 32px 30px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line}"><tr><td style="padding-top:20px">
${p(`<b style="color:${C.ink}">Questions, or something not working?</b><br>Reply to this email or write to <a href="mailto:${SUPPORT_EMAIL}" style="color:${C.blue};text-decoration:none">${SUPPORT_EMAIL}</a>. We read every message.`)}
${p(`Thanks for using our software,<br><b style="color:${C.ink}">The ${esc(SITE_NAME)} team</b>`, "margin:0")}
</td></tr></table>
</td></tr>
</table>
</td></tr>

<tr><td align="center" style="padding:22px 20px 0;font-size:12px;line-height:1.6;color:${C.faint}">
<a href="${SITE_URL}" style="color:${C.muted};text-decoration:none;font-weight:600">${esc(host)}</a><br>
You're getting this because you have an account on ${esc(host)}. We email when there's a new version, nothing else.<br>
<a href="${esc(unsub)}" style="color:${C.muted};text-decoration:underline">Stop release emails</a>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

  return {
    subject,
    text,
    html,
    // RFC 8058 one-click unsubscribe: Gmail and Outlook show their own "Unsubscribe" button
    list: { unsubscribe: { url: unsubscribeEndpoint(to.email), comment: "Stop release emails" } },
    headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}
