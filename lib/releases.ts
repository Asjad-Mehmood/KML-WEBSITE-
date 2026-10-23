import { prisma } from "@/lib/prisma";
import { mailFrom, mailTransport, isMailConfigured } from "@/lib/mailer";
import { releaseEmail, type ReleaseForEmail } from "@/lib/releaseEmail";
import { PRODUCTS } from "@/lib/products";
import { LATEST_VERSION, SITE_NAME } from "@/lib/site";

/**
 * Admin → Releases: every version of our software, grouped by app, and the emails that
 * announce one to everyone with an account. Sending runs in small batches that the admin
 * page asks for one after another, so it fits the server's time limit, survives a closed
 * tab (press Continue) and stops cleanly at the mail provider's daily limit.
 *
 * The tables match the models in prisma/schema.prisma and are created here on first use.
 */

// ---------- apps ----------
export interface ReleaseApp {
  id: string;
  name: string;
  /** Download page on this site */
  href: string;
  /** The newest version the site offers */
  current: string;
  /** Public GitHub repository whose releases can be imported */
  github?: string;
}

export const normVersion = (v: string) => String(v || "").trim().replace(/^v(?=\d)/i, "");

export const RELEASE_APPS: ReleaseApp[] = [
  { id: "excel-to-kml", name: SITE_NAME, href: "/download", current: normVersion(LATEST_VERSION), github: "Asjad-Mehmood/kml-convertor" },
  ...PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    href: p.href,
    current: normVersion(p.version),
    ...(p.id === "traverse" ? { github: "Asjad-Mehmood/Traiverse" } : {}),
  })),
];
export const appById = (id: string) => RELEASE_APPS.find((a) => a.id === id);

// Accounts the site creates itself (lib/db.ts, scripts/set-password.mjs): not real mailboxes
const NEVER_EMAIL = ["admin@exceltokml.com", "surveyor@geotech.com", "demo@surveyor.io", "surveyor.demo@geotech.com"];

// ---------- tables ----------
let ready: Promise<void> | null = null;
export function ensureReleaseTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const run = (sql: string) => prisma.$executeRawUnsafe(sql);
      await run(`CREATE TABLE IF NOT EXISTS "product_releases" (
        "id" TEXT NOT NULL,
        "app" TEXT NOT NULL,
        "version" TEXT NOT NULL,
        "releasedAt" TIMESTAMP(3) NOT NULL,
        "title" TEXT NOT NULL,
        "notes" TEXT NOT NULL,
        "link" TEXT NOT NULL,
        "linkLabel" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "product_releases_pkey" PRIMARY KEY ("id")
      )`);
      await run(`CREATE UNIQUE INDEX IF NOT EXISTS "product_releases_app_version_key" ON "product_releases"("app", "version")`);
      await run(`CREATE TABLE IF NOT EXISTS "release_broadcasts" (
        "id" TEXT NOT NULL,
        "releaseId" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'sending',
        "total" INTEGER NOT NULL DEFAULT 0,
        "sent" INTEGER NOT NULL DEFAULT 0,
        "failed" INTEGER NOT NULL DEFAULT 0,
        "lastError" TEXT,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "finishedAt" TIMESTAMP(3),
        CONSTRAINT "release_broadcasts_pkey" PRIMARY KEY ("id")
      )`);
      await run(`CREATE INDEX IF NOT EXISTS "release_broadcasts_releaseId_idx" ON "release_broadcasts"("releaseId")`);
      await run(`DO $$ BEGIN
        ALTER TABLE "release_broadcasts" ADD CONSTRAINT "release_broadcasts_releaseId_fkey" FOREIGN KEY ("releaseId")
          REFERENCES "product_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await run(`CREATE TABLE IF NOT EXISTS "release_recipients" (
        "id" TEXT NOT NULL,
        "broadcastId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "error" TEXT,
        "claimedAt" TIMESTAMP(3),
        "sentAt" TIMESTAMP(3),
        CONSTRAINT "release_recipients_pkey" PRIMARY KEY ("id")
      )`);
      await run(`CREATE INDEX IF NOT EXISTS "release_recipients_broadcastId_status_idx" ON "release_recipients"("broadcastId", "status")`);
      await run(`CREATE UNIQUE INDEX IF NOT EXISTS "release_recipients_broadcastId_email_key" ON "release_recipients"("broadcastId", "email")`);
      await run(`DO $$ BEGIN
        ALTER TABLE "release_recipients" ADD CONSTRAINT "release_recipients_broadcastId_fkey" FOREIGN KEY ("broadcastId")
          REFERENCES "release_broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await run(`CREATE TABLE IF NOT EXISTS "email_optouts" (
        "email" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "email_optouts_pkey" PRIMARY KEY ("email")
      )`);
      await seedIfEmpty();
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

// The releases already on the site when this was built, so they can be announced too.
// Excel to KML's own notes come from its GitHub releases (Import from GitHub).
const SEED: { app: string; version: string; releasedAt: string; title: string; notes: string[] }[] = [
  {
    app: "roadpro",
    version: "3.4",
    releasedAt: "2026-10-23",
    title: "RoadPro 3.4: lanes, median, sidewalks and LandXML for Civil 3D",
    notes: [
      "The full corridor: single or dual carriageway, lanes by hand or automatic, a flush or raised median, sidewalks and walkways, drains and utility corridors (RDC / RDU)",
      "Interlocking paver hatch: an I-shape paver (RP_PAVER) on sidewalks and walkways that turns with the road",
      "Edit the radius later: RDER changes any curve radius after the road is built; RDB rebuilds after you edit the centre line by hand",
      "Civil 3D and LandXML: export the centre line as LandXML 1.2 (RDLX), import LandXML alignments (RDLXI), or select a Civil 3D alignment in RDP",
    ],
  },
  {
    app: "roadpro",
    version: "3.3",
    releasedAt: "2026-10-12",
    title: "RoadPro 3.3: a single line of barricades, cones or kerb",
    notes: [
      "RDL, a single line: one run of barricades, traffic cones or kerb stone along any line, polyline, arc, spline, circle or ellipse, with a quantity label",
      "Junction corner treatment: RDJ lines the kerb returns with barricades, traffic cones or kerb stone, or the same as the main road",
      "Cones and kerb follow changes: lane widening (RDW) and road tapers (RDT) now move traffic cones and kerb stone to the new edge",
      "Kerb units and cone band: kerb stone drawn as separate units, cones with their white band, and cones and kerb per side in the report",
    ],
  },
  {
    app: "roadpro",
    version: "3.2",
    releasedAt: "2026-10-09",
    title: "RoadPro 3.2: signs and markings to standard",
    notes: [
      "Signs and markings to standard: sign plate sizes and warning distances by speed limit, L1 / L2 / L2A centre lines, yellow L4 edge lines, stop and give-way lines, delineator posts on curves",
      "Auxiliary lane and island: RDJ can add a turning lane with tapers and storage, plus a kerbed or painted splitter island",
      "Cones, kerb and shoulder: edge with barricades, traffic cones or kerb stone, add a paved shoulder, and use barricades or cones as a median",
      "Match the existing radius: the turning radius can match the existing road or be typed in",
    ],
  },
  {
    app: "traverse",
    version: "2.1",
    releasedAt: "2026-10-23",
    title: "Traverse & Level 2.1: angles and distances, explained step by step",
    notes: [
      "Updated user manual (41 pages) with a new Angles & distances section: the field book, side shots, the closing leg, least squares, Qatar National Grid and the PDF, CSV and Google Earth exports",
      "Field book angle and distance cells are wide enough for DDD.MMSS values",
      "Side-shot labels on the plan and in the PDF sketch no longer cover the station's label",
      "New field book samples: CSV, PDF report, KML and a Field book sheet in sample-data.xlsx",
    ],
  },
  {
    app: "folder-manager",
    version: "6.2",
    releasedAt: "2026-10-16",
    title: "Project Folder Manager 6.2: one screen for any project's folders",
    notes: [
      "Made for any project: no project name built in. Click the title at the top left to name it for yours",
      "Every module at a glance, by discipline, with instant search after one INDEX",
      "Copy, move and rename in bulk; delete goes to the Recycle Bin",
      "Six layouts (Alt+1 to Alt+6) and the free space on every drive",
      "To update, replace only the .hta file. Settings are now Project_Folder_Manager_config.txt, so set the root path once",
    ],
  },
  {
    app: "excel-to-kml",
    version: normVersion(LATEST_VERSION),
    releasedAt: new Date().toISOString().slice(0, 10),
    title: `${SITE_NAME} ${normVersion(LATEST_VERSION)} is out`,
    notes: [],
  },
];

async function seedIfEmpty() {
  if ((await prisma.productRelease.count()) > 0) return;
  for (const s of SEED) {
    const app = appById(s.app);
    if (!app) continue;
    await prisma.productRelease.upsert({
      where: { app_version: { app: s.app, version: s.version } },
      update: {},
      create: { app: s.app, version: s.version, releasedAt: new Date(s.releasedAt), title: s.title, notes: s.notes.join("\n"), link: app.href },
    });
  }
}

// ---------- releases ----------
export interface ReleaseInput {
  app: string;
  version: string;
  releasedAt: string;
  title: string;
  notes: string;
  link: string;
  linkLabel: string;
}

/** The cleaned-up input, or an error message to show */
export function checkRelease(b: Partial<Record<keyof ReleaseInput, unknown>>): { ok: true; data: ReleaseInput } | { ok: false; error: string } {
  const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const app = str(b.app, 40);
  const a = appById(app);
  if (!a) return { ok: false, error: "Choose the app." };
  const version = normVersion(str(b.version, 20));
  if (!/^[0-9A-Za-z][0-9A-Za-z._-]*$/.test(version)) return { ok: false, error: "Type a version such as 3.4 or 4.2.1." };
  const date = str(b.releasedAt, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) return { ok: false, error: "Pick the release date." };
  const title = str(b.title, 150) || `${a.name} ${version} is out`;
  const notes = String(b.notes ?? "").replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 25).join("\n").slice(0, 6000);
  const link = str(b.link, 300) || a.href;
  if (!/^\/[\w\-./#?=&%]*$/.test(link) && !/^https:\/\/[^\s"<>]+$/.test(link)) return { ok: false, error: "The link must be a site path such as /roadpro or an https:// address." };
  const linkLabel = str(b.linkLabel, 60);
  return { ok: true, data: { app, version, releasedAt: date, title, notes, link, linkLabel } };
}

export async function createRelease(d: ReleaseInput) {
  await ensureReleaseTables();
  const exists = await prisma.productRelease.findUnique({ where: { app_version: { app: d.app, version: d.version } } });
  if (exists) throw new Error(`${appById(d.app)!.name} ${d.version} is already in the list.`);
  return prisma.productRelease.create({ data: { ...d, releasedAt: new Date(d.releasedAt) } });
}

export async function updateRelease(id: string, d: ReleaseInput) {
  await ensureReleaseTables();
  const clash = await prisma.productRelease.findUnique({ where: { app_version: { app: d.app, version: d.version } } });
  if (clash && clash.id !== id) throw new Error(`${appById(d.app)!.name} ${d.version} is already in the list.`);
  return prisma.productRelease.update({ where: { id }, data: { ...d, releasedAt: new Date(d.releasedAt) } });
}

export async function deleteRelease(id: string) {
  await ensureReleaseTables();
  await prisma.productRelease.delete({ where: { id } });
}

function forEmail(r: { app: string; version: string; releasedAt: Date; title: string; notes: string; link: string; linkLabel: string }): ReleaseForEmail {
  const app = appById(r.app);
  const name = app?.name || r.app;
  const newer = app && app.current && normVersion(app.current) !== normVersion(r.version) && compareVersions(app.current, r.version) > 0 ? app.current : null;
  return { appId: r.app, appName: name, version: r.version, releasedAt: r.releasedAt, title: r.title, notes: r.notes, link: r.link, linkLabel: r.linkLabel, newerVersion: newer };
}

/** 3.10 > 3.9 > 3.4.1 > 3.4; letters compare as text */
export function compareVersions(a: string, b: string): number {
  const pa = normVersion(a).split(/[.\-_]/);
  const pb = normVersion(b).split(/[.\-_]/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? "0";
    const y = pb[i] ?? "0";
    const nx = Number(x), ny = Number(y);
    const c = !isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y);
    if (c) return c;
  }
  return 0;
}

// ---------- who gets the email ----------
const eligibleSql = `
  SELECT DISTINCT ON (lower(trim(u."email"))) lower(trim(u."email")) AS email, coalesce(u."name", '') AS name
  FROM "users" u
  WHERE u."email" ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'
    AND lower(trim(u."email")) <> ALL($1::text[])
    AND NOT EXISTS (SELECT 1 FROM "email_optouts" o WHERE o."email" = lower(trim(u."email")))`;

// people who already have this release from an earlier broadcast
const alreadySentSql = `
    AND NOT EXISTS (
      SELECT 1 FROM "release_recipients" r JOIN "release_broadcasts" b ON b."id" = r."broadcastId"
      WHERE b."releaseId" = $2 AND r."status" = 'sent' AND r."email" = lower(trim(u."email")))`;

export async function audience(releaseId?: string) {
  await ensureReleaseTables();
  const [all] = await prisma.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM (${eligibleSql}) e`, NEVER_EMAIL);
  const [optedOut] = await prisma.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM "email_optouts"`);
  let notYet: number | null = null;
  if (releaseId) {
    const [r] = await prisma.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM (${eligibleSql}${alreadySentSql}) e`, NEVER_EMAIL, releaseId);
    notYet = r.n;
  }
  return { everyone: all.n, notYet, optedOut: optedOut.n };
}

// ---------- the list for the admin page ----------
export async function listReleases() {
  await ensureReleaseTables();
  const releases = await prisma.productRelease.findMany({
    include: { broadcasts: { orderBy: { createdAt: "desc" } } },
  });
  const notYet = await prisma.$queryRawUnsafe<{ releaseId: string; n: number }[]>(
    `SELECT pr."id" AS "releaseId", (SELECT count(*)::int FROM (${eligibleSql}
      AND NOT EXISTS (SELECT 1 FROM "release_recipients" r JOIN "release_broadcasts" b ON b."id" = r."broadcastId"
        WHERE b."releaseId" = pr."id" AND r."status" = 'sent' AND r."email" = lower(trim(u."email")))) e) AS n
     FROM "product_releases" pr`,
    NEVER_EMAIL
  );
  const notYetBy = Object.fromEntries(notYet.map((r) => [r.releaseId, r.n]));
  const aud = await audience();
  const groups = RELEASE_APPS.map((app) => ({
    app,
    releases: releases
      .filter((r) => r.app === app.id)
      .sort((x, y) => compareVersions(y.version, x.version) || y.releasedAt.getTime() - x.releasedAt.getTime())
      .map((r) => ({ ...r, notYet: notYetBy[r.id] ?? 0 })),
  }));
  return {
    groups,
    audience: aud,
    mail: { configured: isMailConfigured(), from: mailFrom() },
  };
}

// ---------- preview and test ----------
export async function previewRelease(id: string, to: { name: string; email: string }) {
  await ensureReleaseTables();
  const r = await prisma.productRelease.findUnique({ where: { id } });
  if (!r) return null;
  const m = releaseEmail(forEmail(r), to);
  return { subject: m.subject, html: m.html, text: m.text };
}

export async function sendTest(id: string, to: { name: string; email: string }) {
  await ensureReleaseTables();
  const r = await prisma.productRelease.findUnique({ where: { id } });
  if (!r) throw new Error("That release no longer exists.");
  const m = releaseEmail(forEmail(r), to);
  const t = mailTransport();
  await t.sendMail({ from: mailFrom(), to: to.email, subject: `[Test] ${m.subject}`, text: m.text, html: m.html, list: m.list, headers: m.headers });
}

// ---------- broadcasts ----------
/** Start announcing a release; onlyNew skips people who already got it. Reuses an unfinished one. */
export async function startBroadcast(releaseId: string, onlyNew: boolean, createdBy: string) {
  await ensureReleaseTables();
  const release = await prisma.productRelease.findUnique({ where: { id: releaseId } });
  if (!release) throw new Error("That release no longer exists.");
  const open = await prisma.releaseBroadcast.findFirst({ where: { releaseId, status: { in: ["sending", "paused"] } } });
  if (open) {
    await prisma.releaseBroadcast.update({ where: { id: open.id }, data: { status: "sending", lastError: null } });
    return open.id;
  }
  const subject = release.title;
  const b = await prisma.releaseBroadcast.create({ data: { releaseId, subject, createdBy } });
  const inserted = await prisma.$executeRawUnsafe(
    `INSERT INTO "release_recipients" ("id", "broadcastId", "email", "name", "status")
     SELECT gen_random_uuid()::text, $3, e.email, e.name, 'pending' FROM (${eligibleSql}${onlyNew ? alreadySentSql : ` AND $2::text IS NOT NULL`}) e
     ON CONFLICT ("broadcastId", "email") DO NOTHING`,
    NEVER_EMAIL,
    releaseId,
    b.id
  );
  if (!inserted) {
    await prisma.releaseBroadcast.delete({ where: { id: b.id } });
    throw new Error(onlyNew ? "Everyone with an account already has this release." : "There's nobody to send to yet.");
  }
  await prisma.releaseBroadcast.update({ where: { id: b.id }, data: { total: inserted } });
  return b.id;
}

/** Errors that mean "slow down / try later" rather than "this address is bad" */
function isTemporary(err: unknown): boolean {
  const e = err as { responseCode?: number; code?: string; message?: string };
  if (e?.code && ["EAUTH", "ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ECONNRESET"].includes(e.code)) return true;
  if (e?.responseCode && [421, 450, 451, 452, 454].includes(e.responseCode)) return true;
  return /quota|rate limit|too many|try again|temporar|daily|limit exceeded/i.test(e?.message || "");
}

async function refreshCounts(id: string) {
  const rows = await prisma.releaseRecipient.groupBy({ by: ["status"], where: { broadcastId: id }, _count: { _all: true } });
  const c = Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
  const left = (c.pending || 0) + (c.sending || 0);
  const b = await prisma.releaseBroadcast.findUnique({ where: { id } });
  return prisma.releaseBroadcast.update({
    where: { id },
    data: {
      sent: c.sent || 0,
      failed: c.failed || 0,
      ...(left === 0 && b?.status !== "done" ? { status: "done", finishedAt: new Date() } : {}),
    },
  });
}

/**
 * Send the next few emails of a broadcast, within budgetMs. Returns the broadcast with its
 * counts; status stays "sending" while some are left, becomes "done" at the end, or "paused"
 * when the mail server says to stop (daily limit, sign-in problem).
 */
export async function sendNextBatch(id: string, budgetMs = 40_000, batch = 25) {
  await ensureReleaseTables();
  const b = await prisma.releaseBroadcast.findUnique({ where: { id }, include: { release: true } });
  if (!b) throw new Error("That broadcast no longer exists.");
  if (b.status !== "sending") return b;
  if (!isMailConfigured()) {
    return prisma.releaseBroadcast.update({ where: { id }, data: { status: "paused", lastError: "Email isn't set up (SMTP_HOST, SMTP_USER, SMTP_PASS)." } });
  }

  // claim a batch; a claim older than 10 minutes was left by a request that died
  const claimed = await prisma.$queryRawUnsafe<{ id: string; email: string; name: string }[]>(
    `UPDATE "release_recipients" SET "status" = 'sending', "claimedAt" = now()
     WHERE "id" IN (
       SELECT "id" FROM "release_recipients"
       WHERE "broadcastId" = $1 AND ("status" = 'pending' OR ("status" = 'sending' AND "claimedAt" < now() - interval '10 minutes'))
       ORDER BY "email" LIMIT $2 FOR UPDATE SKIP LOCKED)
     RETURNING "id", "email", "name"`,
    id,
    batch
  );

  const started = Date.now();
  const release = forEmail(b.release);
  const transport = claimed.length ? mailTransport(true) : null;
  let stopWith: string | null = null;
  try {
    for (let i = 0; i < claimed.length; i++) {
      const r = claimed[i];
      if (stopWith || Date.now() - started > budgetMs) {
        await prisma.releaseRecipient.updateMany({ where: { id: { in: claimed.slice(i).map((x) => x.id) } }, data: { status: "pending", claimedAt: null } });
        break;
      }
      // someone may have unsubscribed after the broadcast started
      const out = await prisma.emailOptOut.findUnique({ where: { email: r.email } });
      if (out) {
        await prisma.releaseRecipient.update({ where: { id: r.id }, data: { status: "failed", error: "Unsubscribed" } });
        continue;
      }
      const m = releaseEmail(release, { name: r.name, email: r.email });
      try {
        await transport!.sendMail({ from: mailFrom(), to: r.email, subject: m.subject, text: m.text, html: m.html, list: m.list, headers: m.headers });
        await prisma.releaseRecipient.update({ where: { id: r.id }, data: { status: "sent", sentAt: new Date(), error: null } });
      } catch (err) {
        const msg = (err as Error)?.message?.slice(0, 300) || "Sending failed";
        if (isTemporary(err)) {
          stopWith = msg;
          await prisma.releaseRecipient.update({ where: { id: r.id }, data: { status: "pending", claimedAt: null } });
        } else {
          await prisma.releaseRecipient.update({ where: { id: r.id }, data: { status: "failed", error: msg } });
        }
      }
    }
  } finally {
    transport?.close();
  }

  if (stopWith) await prisma.releaseBroadcast.update({ where: { id }, data: { status: "paused", lastError: stopWith } });
  return refreshCounts(id);
}

export async function pauseBroadcast(id: string) {
  await ensureReleaseTables();
  return prisma.releaseBroadcast.update({ where: { id }, data: { status: "paused", lastError: "Paused by an admin." } });
}

export async function resumeBroadcast(id: string) {
  await ensureReleaseTables();
  return prisma.releaseBroadcast.update({ where: { id }, data: { status: "sending", lastError: null } });
}

/** Stop for good: the people not reached yet are dropped from this broadcast */
export async function cancelBroadcast(id: string) {
  await ensureReleaseTables();
  await prisma.releaseRecipient.deleteMany({ where: { broadcastId: id, status: { in: ["pending", "sending"] } } });
  const b = await refreshCounts(id);
  const total = await prisma.releaseRecipient.count({ where: { broadcastId: id } });
  return prisma.releaseBroadcast.update({ where: { id }, data: { total, status: "done", finishedAt: b.finishedAt ?? new Date(), lastError: "Stopped before everyone was reached." } });
}

/** The addresses that failed, for the admin to check */
export async function failedRecipients(id: string) {
  await ensureReleaseTables();
  return prisma.releaseRecipient.findMany({ where: { broadcastId: id, status: "failed" }, select: { email: true, error: true }, take: 200 });
}

// ---------- unsubscribe ----------
export async function optOut(email: string) {
  await ensureReleaseTables();
  const e = email.trim().toLowerCase();
  await prisma.emailOptOut.upsert({ where: { email: e }, update: {}, create: { email: e } });
}
export async function optIn(email: string) {
  await ensureReleaseTables();
  await prisma.emailOptOut.deleteMany({ where: { email: email.trim().toLowerCase() } });
}
export async function isOptedOut(email: string) {
  await ensureReleaseTables();
  return Boolean(await prisma.emailOptOut.findUnique({ where: { email: email.trim().toLowerCase() } }));
}

// ---------- import from GitHub ----------
/** A release's Markdown notes as plain lines, one item each */
export function notesFromMarkdown(md: string): string[] {
  const clean = (s: string) =>
    s
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/(^|\s)[*_]([^*_]+)[*_](?=\s|$)/g, "$1$2")
      .replace(/\s+/g, " ")
      .trim();
  const lines = String(md || "").replace(/\r/g, "").split("\n").map((l) => l.trim());
  const skip = /full changelog|sha-?256|checksum|^<!--/i;
  const bullets = lines.filter((l) => /^([-*+]|\d+\.)\s+/.test(l)).map((l) => clean(l.replace(/^([-*+]|\d+\.)\s+/, ""))).filter((l) => l && !skip.test(l));
  const items = bullets.length ? bullets : lines.filter((l) => l && !l.startsWith("#") && !skip.test(l)).map(clean);
  return items.filter(Boolean).slice(0, 12).map((l) => l.slice(0, 300));
}

/** Add the app's GitHub releases that aren't in the list yet, and fill notes that are empty */
export async function importFromGitHub(appId: string) {
  await ensureReleaseTables();
  const app = appById(appId);
  if (!app?.github) throw new Error("This app has no GitHub releases to import.");
  const res = await fetch(`https://api.github.com/repos/${app.github}/releases?per_page=30`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "exceltokml.com" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}. Try again in a minute.`);
  const list = (await res.json()) as { tag_name: string; name: string | null; body: string | null; published_at: string; draft: boolean; prerelease: boolean }[];
  let added = 0;
  let filled = 0;
  for (const g of list) {
    if (g.draft || g.prerelease) continue;
    const version = normVersion(g.tag_name);
    if (!version) continue;
    const notes = notesFromMarkdown(g.body || "").join("\n");
    const existing = await prisma.productRelease.findUnique({ where: { app_version: { app: app.id, version } } });
    if (existing) {
      if (!existing.notes.trim() && notes) {
        await prisma.productRelease.update({ where: { id: existing.id }, data: { notes, releasedAt: new Date(g.published_at) } });
        filled++;
      }
      continue;
    }
    const named = (g.name || "").trim();
    const title = named && normVersion(named) !== version && !/^v?\d[\d.]*$/.test(named) ? named.slice(0, 150) : `${app.name} ${version} is out`;
    await prisma.productRelease.create({
      data: { app: app.id, version, releasedAt: new Date(g.published_at), title, notes, link: app.href },
    });
    added++;
  }
  return { added, filled };
}
