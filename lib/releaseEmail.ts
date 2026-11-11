// The release announcement emailed from Admin → Releases, and the signed link in it
// that unsubscribes the reader from release emails. Uses the site's SMTP settings.
import crypto from "crypto";
import { SHOW_ANDROID, SITE_URL } from "@/lib/site";
import { letterEmail, type LetterBlock } from "@/lib/letterEmail";
import { TRAVERSE_APP } from "@/lib/traverse";
import { SLOPE_APP } from "@/lib/slope";

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

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
  /**
   * A new program: its first release in Admin → Releases is emailed as an introduction (what it
   * is, and how to start) instead of an update, since nobody has it yet
   */
  intro?: {
    /** What Admin → Releases → "Create the introduction email" fills in; also the email's subject */
    title: string;
    /** Subjects this introduction had before; a release still carrying one gets today's title */
    oldTitles?: string[];
    notes: string[];
    /** The letter: a few short paragraphs, then the steps to start */
    letter: string[];
    start: string[];
  };
}

const UPDATE_GUIDES: Record<string, UpdateGuide> = {
  "excel-to-kml": {
    platform: SHOW_ANDROID ? "Windows, Android and web" : "Windows and web",
    automatic: true,
    steps: [
      "Windows: open Excel to KML while you're online. It checks for the new version when it starts; press Yes and it updates and restarts by itself.",
      "Your jobs, settings and symbol library are kept through the update.",
      ...(SHOW_ANDROID ? ["Android: install the new .apk from the download page over the one you have."] : []),
      "In your browser: nothing to do, the web version is always the newest.",
    ],
    newUser: `Don't have it yet? Download it free for Windows${SHOW_ANDROID ? " or Android" : ""}, or use it in your browser.`,
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
  slope: {
    platform: "Web app and Windows",
    automatic: true,
    steps: [
      "Windows program: open it while you're online and it offers the update, then installs it and opens again.",
      `Web app: nothing to do, ${SITE_URL.replace(/^https?:\/\//, "")}${SLOPE_APP} always runs the newest version.`,
      "Your saved calculations are kept in your account.",
    ],
    newUser: "Don't have it yet? Open the web app, or install the Windows program.",
    more: { label: "What it does", href: "/slope-calculation" },
  },
  toolkit: {
    platform: "Windows 10 and 11",
    automatic: true,
    steps: [
      "Open the Survey Toolkit while you're online: it offers its own update and installs it, then opens again.",
      "Your tools, their settings and your sign-in are kept.",
    ],
    newUser: "New to the Survey Toolkit? Download it once, sign in with your free account and install any tool with one click.",
    more: { label: "What it does", href: "/toolkit" },
    // Written like a personal email, so Gmail files it under Primary rather than Promotions:
    // no pictures, colours, buttons or sales words ("free", "new", "download now"), one link
    intro: {
      title: "The Survey Toolkit is ready for your account",
      oldTitles: ["Meet the Survey Toolkit: every survey tool in one download"],
      notes: [
        "Five tools in one program: Excel to KML, RoadPro, Traverse & Level, Project Folder Manager and Slope Calculator",
        "Each tool keeps itself up to date",
        "Project Folder Manager runs inside the Toolkit's window",
        "The web apps open side by side, already signed in",
      ],
      letter: [
        "We've put Excel to KML, RoadPro, Traverse & Level, Project Folder Manager and Slope Calculator into one Windows program, the Survey Toolkit.",
        "You sign in once with the account you already have on our website, install the tools you use with one click each, and after that each one keeps itself up to date.",
      ],
      start: [
        "Get the Survey Toolkit from the link below and run it. It doesn't need administrator rights.",
        "Sign in with the same account you use on the website.",
        "Press Install next to the tools you want.",
      ],
    },
  },
  "folder-manager": {
    platform: "Windows 10 and 11",
    automatic: true,
    steps: [
      "Version 7 or later: open it while you're online and it offers the update, then installs it and opens again.",
      "Still on 6.2? Download the version 7 installer once; its start page offers to bring in your 6.2 settings.",
      "Your folders and settings are kept through every update.",
    ],
    newUser: "New to Project Folder Manager? Download the installer, open it, and choose a drive or a folder to start.",
    more: { label: "Install guide", href: "/project-folder-manager#install" },
  },
};

/** A new program's introduction email (its first release), or null when the app has none */
export function introductionOf(appId: string): { title: string; notes: string } | null {
  const i = UPDATE_GUIDES[appId]?.intro;
  return i ? { title: i.title, notes: i.notes.join("\n") } : null;
}

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
  /** The app's first release in the list (lib/releases.ts): a new program is introduced */
  introduces?: boolean;
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

// A new program's first release introduces it (what it is, how to start); every later one is an
// update (what changed, how to get it). Both are short letters (lib/letterEmail.ts), so Gmail
// keeps them out of Promotions: the designed versions, with a banner, pictures and a button,
// landed there.
const footerOf = (host: string) => `You're getting this because you have an account on ${host}. We email when there's a new version or a new program, nothing else.`;
const listHeaders = (email: string) => ({
  // RFC 8058 one-click unsubscribe, which Gmail asks of anyone emailing many people
  list: { unsubscribe: { url: unsubscribeEndpoint(email), comment: "Stop release emails" } },
  headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
});

export function releaseEmail(r: ReleaseForEmail, to: { name: string; email: string }) {
  const first = (to.name || "").trim().split(/\s+/)[0] || "";
  const guide = UPDATE_GUIDES[r.appId] || FALLBACK_GUIDE;
  const intro = r.introduces && !r.newerVersion ? guide.intro : undefined;
  const url = absoluteLink(r.link);
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const title = r.title.trim();
  const footer = footerOf(host);
  const footerLink = { label: "Stop these emails", url: unsubscribePage(to.email) };
  const reply: LetterBlock = { p: "If anything doesn't work on your PC, reply to this email and tell us what you see. We read every reply." };

  if (intro) {
    // a release still carrying an earlier subject of this introduction gets today's
    const subject = !title || (intro.oldTitles || []).includes(title) ? intro.title : title;
    return {
      ...letterEmail({
        subject,
        title: `The ${r.appName} is ready`,
        first,
        blocks: [
          ...intro.letter.map((l, i): LetterBlock => (i === 0 ? { p: l, bold: PRODUCT_NAMES } : { p: l })),
          { heading: "Start in three steps" },
          { steps: intro.start },
          { button: url, label: `Get the ${r.appName}` },
          reply,
        ],
        footer,
        footerLink,
      }),
      ...listHeaders(to.email),
    };
  }

  const items = noteItems(r.notes);
  const released = longDate(r.releasedAt);
  const lead = r.newerVersion
    ? `Here's a look back at ${r.appName} ${r.version}, released on ${released}. The newest version is now ${r.newerVersion}, and updating gets you everything below plus what came after.`
    : "Here's what changed, and how to get it.";
  const blocks: LetterBlock[] = [{ p: lead }];
  if (items.length) {
    blocks.push({ heading: `What changed in ${r.version}` }, { bullets: items.map((i) => (i.head ? `${i.head}: ${i.text}` : i.text)) });
  }
  blocks.push(
    { heading: guide.automatic ? "Already using it? It updates itself" : "Already using it? To update" },
    { steps: guide.steps }
  );
  if (guide.newUser) blocks.push({ p: guide.newUser });
  blocks.push({ button: url, label: r.linkLabel.trim() || (r.newerVersion ? `Get ${r.appName} ${r.newerVersion}` : `Get ${r.appName} ${r.version}`) }, reply);
  return {
    ...letterEmail({
      subject: title || `${r.appName} ${r.version}`,
      title: r.newerVersion ? `${r.appName} ${r.version}` : `${r.appName} ${r.version} is ready`,
      first,
      blocks,
      footer,
      footerLink,
    }),
    ...listHeaders(to.email),
  };
}

/** The programs' names, in bold where a letter lists them */
const PRODUCT_NAMES = ["Excel to KML", "RoadPro", "Traverse & Level", "Project Folder Manager", "Slope Calculator", "the Survey Toolkit"];
