// Admin → Email: an email the admin writes, to one person, people they pick, everyone who uses one
// app, or every account. The same letter layout as every other email of the site
// (lib/letterEmail.ts) and the same care as a release email (lib/releases.ts): sent on the server
// in batches with a pause between emails (lib/broadcastRunner.ts starts the steps), paused when
// the mail server says to slow down, and never to someone who stopped our emails.
//
//   audience  one       one account (its id)
//             selected  the accounts picked (their ids)
//             app       everyone who uses an app (as Admin → Releases decides it)
//             all       every account with a confirmed email
// "one" and "selected" reach an unconfirmed address too (the admin chose the person); "app" and
// "all" leave those out, as release emails do.
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isMailConfigured, mailFrom, mailGapMs, mailReplyTo, mailTransport } from "@/lib/mailer";
import { letterEmail, type LetterBlock } from "@/lib/letterEmail";
import { absoluteLink, unsubscribeEndpoint, unsubscribePage } from "@/lib/releaseEmail";
import { NEVER_EMAIL, appById, ensureReleaseTables, recipientsSql } from "@/lib/releases";
import { SITE_URL } from "@/lib/site";

export type MailAudience = "one" | "selected" | "app" | "all" | "inactive";
export const MAIL_AUDIENCES: MailAudience[] = ["one", "selected", "app", "all", "inactive"];
/** "Not seen lately": no sign-in, no app use and no work for this many days */
export const INACTIVE_DAYS = [30, 60, 90, 180] as const;

export interface MailDraft {
  subject: string;
  title: string;
  /** paragraphs, a blank line between them; {name} is the person's first name */
  body: string;
  buttonLabel: string;
  buttonUrl: string;
}

const MAX_PICKED = 5000;

let ready: Promise<void> | null = null;
export function ensureMailTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      // the opt-out list and the email-status table live with the release emails
      await ensureReleaseTables();
      const run = (sql: string) => prisma.$executeRawUnsafe(sql);
      await run(`CREATE TABLE IF NOT EXISTS "custom_mails" (
        "id" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "buttonLabel" TEXT NOT NULL DEFAULT '',
        "buttonUrl" TEXT NOT NULL DEFAULT '',
        "audience" TEXT NOT NULL,
        "audienceLabel" TEXT NOT NULL DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'sending',
        "total" INTEGER NOT NULL DEFAULT 0,
        "sent" INTEGER NOT NULL DEFAULT 0,
        "failed" INTEGER NOT NULL DEFAULT 0,
        "lastError" TEXT,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "finishedAt" TIMESTAMP(3),
        CONSTRAINT "custom_mails_pkey" PRIMARY KEY ("id")
      )`);
      await run(`CREATE TABLE IF NOT EXISTS "custom_mail_recipients" (
        "id" TEXT NOT NULL,
        "mailId" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "error" TEXT,
        "claimedAt" TIMESTAMP(3),
        "sentAt" TIMESTAMP(3),
        CONSTRAINT "custom_mail_recipients_pkey" PRIMARY KEY ("id")
      )`);
      await run(`CREATE UNIQUE INDEX IF NOT EXISTS "custom_mail_recipients_mail_email_key" ON "custom_mail_recipients"("mailId", "email")`);
      await run(`CREATE INDEX IF NOT EXISTS "custom_mail_recipients_mail_status_idx" ON "custom_mail_recipients"("mailId", "status")`);
      await run(`DO $$ BEGIN
        ALTER TABLE "custom_mail_recipients" ADD CONSTRAINT "custom_mail_recipients_mailId_fkey" FOREIGN KEY ("mailId")
          REFERENCES "custom_mails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

/** The draft, checked and tidied; or what is wrong with it */
export function checkDraft(b: Partial<Record<keyof MailDraft, unknown>>): { ok: true; data: MailDraft } | { ok: false; error: string } {
  const s = (v: unknown, max: number) => String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
  const d: MailDraft = {
    subject: s(b.subject, 150).replace(/\s+/g, " "),
    title: s(b.title, 150).replace(/\s+/g, " "),
    body: s(b.body, 10_000),
    buttonLabel: s(b.buttonLabel, 40).replace(/\s+/g, " "),
    buttonUrl: s(b.buttonUrl, 500),
  };
  if (!d.subject) return { ok: false, error: "Write a subject." };
  if (!d.body) return { ok: false, error: "Write the message." };
  if (!d.title) d.title = d.subject;
  if (d.buttonLabel || d.buttonUrl) {
    if (!d.buttonLabel || !d.buttonUrl) return { ok: false, error: "A button needs both its text and its link." };
    if (!/^(https:\/\/|\/)/.test(d.buttonUrl)) return { ok: false, error: "The button's link must start with https:// or /." };
  }
  return { ok: true, data: d };
}

const firstName = (name: string) => (name || "").trim().split(/\s+/)[0] || "";

/** The email as it goes to one person */
export function customEmail(d: MailDraft, to: { name: string; email: string }) {
  const first = firstName(to.name);
  const fill = (t: string) => t.replace(/\{name\}/gi, first || "there");
  const blocks: LetterBlock[] = fill(d.body)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map((p) => ({ p }));
  if (d.buttonLabel && d.buttonUrl) blocks.push({ button: absoluteLink(d.buttonUrl), label: d.buttonLabel });
  const host = SITE_URL.replace(/^https?:\/\//, "");
  return {
    ...letterEmail({
      subject: fill(d.subject),
      title: fill(d.title),
      first,
      blocks,
      footer: `You're getting this because you have an account on ${host}.`,
      footerLink: { label: "Stop these emails", url: unsubscribePage(to.email) },
    }),
    list: { unsubscribe: { url: unsubscribeEndpoint(to.email), comment: "Stop these emails" } },
    headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}

/** People not seen for `days` days: an account at least that old, no sign-in, no work in an app and
 *  no program use since then (the usual "everyone" rules still apply: confirmed, not opted out) */
async function inactiveSql(days: number): Promise<string> {
  const since = `now() - interval '${Math.round(days)} days'`;
  const [t] = await prisma.$queryRawUnsafe<{ ok: boolean }[]>(`SELECT to_regclass('public."app_usage"') IS NOT NULL AS ok`);
  return `${await recipientsSql("", "all")}
    AND u."createdAt" < ${since}
    AND coalesce(u."lastLoginAt", u."createdAt") < ${since}
    AND NOT EXISTS (SELECT 1 FROM "activities" a WHERE a."userId" = u."id" AND a."timestamp" >= ${since})
    ${t?.ok ? `AND NOT EXISTS (SELECT 1 FROM "app_usage" x WHERE x."userId" = u."id" AND x."lastSeen" >= ${since})` : ""}
    AND $2::text[] IS NOT NULL`;
}

/** SQL for the people of an audience ($1: never-email list, $2: the picked ids) */
async function peopleSql(audience: MailAudience, app: string, days = 60): Promise<string> {
  if (audience === "inactive") return inactiveSql(days);
  // ($2 is unused there; named so the query keeps the same parameters)
  if (audience === "all") return `${await recipientsSql("", "all")}
    AND $2::text[] IS NOT NULL`;
  if (audience === "app") return `${await recipientsSql(app, "app")}
    AND $2::text[] IS NOT NULL`;
  // picked by the admin: an unconfirmed address too, but never someone who stopped our emails
  return `
    SELECT DISTINCT ON (lower(trim(u."email"))) lower(trim(u."email")) AS email, coalesce(u."name", '') AS name
    FROM "users" u
    WHERE u."id" = ANY($2::text[])
      AND u."email" ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'
      AND lower(trim(u."email")) <> ALL($1::text[])
      AND NOT EXISTS (SELECT 1 FROM "email_optouts" o WHERE o."email" = lower(trim(u."email")))`;
}

export interface AudienceInput {
  audience: MailAudience;
  userIds?: string[];
  app?: string;
  /** for "inactive": not seen for this many days */
  days?: number;
}

function checkAudience(a: AudienceInput): { ok: true; ids: string[]; app: string; days: number; label: string } | { ok: false; error: string } {
  if (!MAIL_AUDIENCES.includes(a.audience)) return { ok: false, error: "Choose who gets it." };
  const ids = [...new Set((a.userIds || []).filter((x) => typeof x === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(x)))];
  if (a.audience === "one" && ids.length !== 1) return { ok: false, error: "Choose the person." };
  if (a.audience === "selected" && !ids.length) return { ok: false, error: "Pick at least one person." };
  if (ids.length > MAX_PICKED) return { ok: false, error: `Pick at most ${MAX_PICKED} people, or send to everyone.` };
  const app = a.app || "";
  if (a.audience === "app" && !appById(app)) return { ok: false, error: "Choose the app." };
  const days = Number(a.days) || 60;
  if (a.audience === "inactive" && !(INACTIVE_DAYS as readonly number[]).includes(days)) return { ok: false, error: "Choose how long they've been away." };
  const label =
    a.audience === "all"
      ? "Everyone"
      : a.audience === "app"
        ? `Everyone who uses ${appById(app)?.name}`
        : a.audience === "inactive"
          ? `Not seen for ${days} days`
          : a.audience === "one"
            ? "One person"
            : `${ids.length} people picked`;
  return { ok: true, ids, app, days, label };
}

/** How many people an audience reaches now, and a few of them */
export async function countAudience(a: AudienceInput): Promise<{ count: number; sample: { email: string; name: string }[]; label: string } | { error: string }> {
  await ensureMailTables();
  const c = checkAudience(a);
  if (!c.ok) return { error: c.error };
  const sql = await peopleSql(a.audience, c.app, c.days);
  const [n] = await prisma.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM (${sql}) e`, NEVER_EMAIL, c.ids);
  const sample = await prisma.$queryRawUnsafe<{ email: string; name: string }[]>(`SELECT * FROM (${sql}) e ORDER BY e.email LIMIT 8`, NEVER_EMAIL, c.ids);
  return { count: n.n, sample, label: c.label };
}

/** Everyone an audience reaches now, by email (Admin → Email: "Show all") */
export async function audiencePeople(a: AudienceInput, limit = 5000): Promise<{ people: { email: string; name: string }[]; count: number } | { error: string }> {
  await ensureMailTables();
  const c = checkAudience(a);
  if (!c.ok) return { error: c.error };
  const sql = await peopleSql(a.audience, c.app, c.days);
  const people = await prisma.$queryRawUnsafe<{ email: string; name: string }[]>(`SELECT * FROM (${sql}) e ORDER BY e.email LIMIT $3`, NEVER_EMAIL, c.ids, limit);
  const [n] = await prisma.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM (${sql}) e`, NEVER_EMAIL, c.ids);
  return { people, count: n.n };
}

/** Who one email went to, and how it went for each (sent, failed, still to go) */
export async function recipientsOf(id: string, limit = 5000) {
  await ensureMailTables();
  const rows = await prisma.$queryRawUnsafe<{ email: string; name: string; status: string; error: string | null; sentAt: Date | null }[]>(
    `SELECT "email", "name", "status", "error", "sentAt" FROM "custom_mail_recipients" WHERE "mailId" = $1
     ORDER BY CASE "status" WHEN 'failed' THEN 0 WHEN 'sent' THEN 2 ELSE 1 END, "email" LIMIT $2`,
    id,
    limit
  );
  return rows.map((r) => ({ ...r, sentAt: r.sentAt ? new Date(r.sentAt).toISOString() : null }));
}

/** Start sending: the people are worked out now and kept with the email */
export async function startMail(d: MailDraft, a: AudienceInput, createdBy: string): Promise<string> {
  await ensureMailTables();
  const c = checkAudience(a);
  if (!c.ok) throw new Error(c.error);
  if (!isMailConfigured()) throw new Error("Email isn't set up (SMTP_HOST, SMTP_USER, SMTP_PASS).");
  const id = crypto.randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "custom_mails" ("id","subject","title","body","buttonLabel","buttonUrl","audience","audienceLabel","createdBy") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    id, d.subject, d.title, d.body, d.buttonLabel, d.buttonUrl, a.audience, c.label, createdBy
  );
  const sql = await peopleSql(a.audience, c.app, c.days);
  const inserted = await prisma.$executeRawUnsafe(
    `INSERT INTO "custom_mail_recipients" ("id","mailId","email","name","status")
     SELECT gen_random_uuid()::text, $3, e.email, e.name, 'pending' FROM (${sql}) e
     ON CONFLICT ("mailId","email") DO NOTHING`,
    NEVER_EMAIL, c.ids, id
  );
  if (!inserted) {
    await prisma.$executeRawUnsafe(`DELETE FROM "custom_mails" WHERE "id" = $1`, id);
    throw new Error(a.audience === "one" ? "This person can't be emailed (they stopped our emails, or have no valid address)." : "Nobody in this group can be emailed.");
  }
  await prisma.$executeRawUnsafe(`UPDATE "custom_mails" SET "total" = $2 WHERE "id" = $1`, id, inserted);
  return id;
}

export interface MailRow {
  id: string;
  subject: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
  audience: MailAudience;
  audienceLabel: string;
  status: "sending" | "paused" | "done";
  total: number;
  sent: number;
  failed: number;
  lastError: string | null;
  createdBy: string;
  createdAt: Date;
  finishedAt: Date | null;
}

async function refresh(id: string): Promise<MailRow | null> {
  const [c] = await prisma.$queryRawUnsafe<{ sent: number; failed: number; left: number }[]>(
    `SELECT count(*) FILTER (WHERE "status" = 'sent')::int AS sent, count(*) FILTER (WHERE "status" = 'failed')::int AS failed,
            count(*) FILTER (WHERE "status" IN ('pending','sending'))::int AS "left"
     FROM "custom_mail_recipients" WHERE "mailId" = $1`,
    id
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "custom_mails" SET "sent" = $2, "failed" = $3,
       "status" = CASE WHEN $4 = 0 AND "status" <> 'done' THEN 'done' ELSE "status" END,
       "finishedAt" = CASE WHEN $4 = 0 AND "finishedAt" IS NULL THEN now() ELSE "finishedAt" END
     WHERE "id" = $1`,
    id, c.sent, c.failed, c.left
  );
  const [row] = await prisma.$queryRawUnsafe<MailRow[]>(`SELECT * FROM "custom_mails" WHERE "id" = $1`, id);
  return row ?? null;
}

export async function mailStatus(id: string) {
  await ensureMailTables();
  return refresh(id);
}

export async function listMails(limit = 50): Promise<MailRow[]> {
  await ensureMailTables();
  return prisma.$queryRawUnsafe<MailRow[]>(`SELECT * FROM "custom_mails" ORDER BY "createdAt" DESC LIMIT $1`, limit);
}

export async function failedOf(id: string) {
  await ensureMailTables();
  return prisma.$queryRawUnsafe<{ email: string; error: string | null }[]>(
    `SELECT "email", "error" FROM "custom_mail_recipients" WHERE "mailId" = $1 AND "status" = 'failed' ORDER BY "email" LIMIT 200`,
    id
  );
}

export async function setMailStatus(id: string, action: "pause" | "resume" | "stop") {
  await ensureMailTables();
  if (action === "pause") await prisma.$executeRawUnsafe(`UPDATE "custom_mails" SET "status" = 'paused', "lastError" = 'Paused by an admin.' WHERE "id" = $1 AND "status" = 'sending'`, id);
  if (action === "resume") await prisma.$executeRawUnsafe(`UPDATE "custom_mails" SET "status" = 'sending', "lastError" = NULL WHERE "id" = $1 AND "status" = 'paused'`, id);
  if (action === "stop") {
    await prisma.$executeRawUnsafe(`DELETE FROM "custom_mail_recipients" WHERE "mailId" = $1 AND "status" IN ('pending','sending')`, id);
    await prisma.$executeRawUnsafe(
      `UPDATE "custom_mails" SET "status" = 'done', "finishedAt" = coalesce("finishedAt", now()), "lastError" = 'Stopped before everyone was reached.',
         "total" = (SELECT count(*) FROM "custom_mail_recipients" WHERE "mailId" = $1) WHERE "id" = $1`,
      id
    );
  }
  return refresh(id);
}

/** Errors that mean "slow down / try later" rather than "this address is bad" */
function isTemporary(err: unknown): boolean {
  const e = err as { responseCode?: number; code?: string; message?: string };
  if (e?.code && ["EAUTH", "ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ECONNRESET"].includes(e.code)) return true;
  if (e?.responseCode && [421, 450, 451, 452, 454].includes(e.responseCode)) return true;
  return /quota|rate limit|too many|try again|temporar|daily|limit exceeded/i.test(e?.message || "");
}

/** One step: send the next batch within the time it has (lib/broadcastRunner.ts runs the steps) */
export async function sendMailStep(id: string, budgetMs = 45_000, batch = 200): Promise<{ mail: MailRow | null; claimed: number }> {
  await ensureMailTables();
  const [m] = await prisma.$queryRawUnsafe<MailRow[]>(`SELECT * FROM "custom_mails" WHERE "id" = $1`, id);
  if (!m) throw new Error("That email no longer exists.");
  if (m.status !== "sending") return { mail: m, claimed: 0 };
  if (!isMailConfigured()) {
    await prisma.$executeRawUnsafe(`UPDATE "custom_mails" SET "status" = 'paused', "lastError" = $2 WHERE "id" = $1`, id, "Email isn't set up (SMTP_HOST, SMTP_USER, SMTP_PASS).");
    return { mail: await refresh(id), claimed: 0 };
  }
  const claimed = await prisma.$queryRawUnsafe<{ id: string; email: string; name: string }[]>(
    `UPDATE "custom_mail_recipients" SET "status" = 'sending', "claimedAt" = now()
     WHERE "id" IN (
       SELECT "id" FROM "custom_mail_recipients"
       WHERE "mailId" = $1 AND ("status" = 'pending' OR ("status" = 'sending' AND "claimedAt" < now() - interval '10 minutes'))
       ORDER BY "email" LIMIT $2 FOR UPDATE SKIP LOCKED)
     RETURNING "id", "email", "name"`,
    id,
    batch
  );
  const started = Date.now();
  const transport = claimed.length ? mailTransport(true) : null;
  const gap = mailGapMs();
  let stopWith: string | null = null;
  const setRow = (rid: string, status: string, error: string | null, sent = false) =>
    prisma.$executeRawUnsafe(
      `UPDATE "custom_mail_recipients" SET "status" = $2, "error" = $3, "claimedAt" = CASE WHEN $2 = 'pending' THEN NULL ELSE "claimedAt" END, "sentAt" = CASE WHEN $4 THEN now() ELSE "sentAt" END WHERE "id" = $1`,
      rid, status, error, sent
    );
  try {
    for (let i = 0; i < claimed.length; i++) {
      const r = claimed[i];
      if (i > 0 && gap && !stopWith) {
        const wait = Math.round(gap * (0.75 + Math.random() * 0.5));
        if (Date.now() - started + wait <= budgetMs) await new Promise((res) => setTimeout(res, wait));
      }
      if (stopWith || Date.now() - started > budgetMs) {
        for (const rest of claimed.slice(i)) await setRow(rest.id, "pending", null);
        break;
      }
      // someone may have stopped our emails after this one started
      const [out] = await prisma.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM "email_optouts" WHERE "email" = $1`, r.email);
      if (out.n) {
        await setRow(r.id, "failed", "Unsubscribed");
        continue;
      }
      const e = customEmail(m, r);
      try {
        await transport!.sendMail({ from: mailFrom(), replyTo: mailReplyTo(), to: r.email, subject: e.subject, text: e.text, html: e.html, list: e.list, headers: e.headers });
        await setRow(r.id, "sent", null, true);
      } catch (err) {
        const msg = (err as Error)?.message?.slice(0, 300) || "Sending failed";
        if (isTemporary(err)) {
          stopWith = msg;
          await setRow(r.id, "pending", null);
        } else await setRow(r.id, "failed", msg);
      }
    }
  } finally {
    transport?.close();
  }
  if (stopWith) await prisma.$executeRawUnsafe(`UPDATE "custom_mails" SET "status" = 'paused', "lastError" = $2 WHERE "id" = $1`, id, stopWith);
  return { mail: await refresh(id), claimed: claimed.length };
}

/** Sending ones whose run stopped (no email claimed or sent for 90 s), for the nightly job */
export async function stalledMails(): Promise<string[]> {
  await ensureMailTables();
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT m."id" FROM "custom_mails" m
     WHERE m."status" = 'sending' AND m."createdAt" < now() - interval '60 seconds'
       AND NOT EXISTS (SELECT 1 FROM "custom_mail_recipients" r
         WHERE r."mailId" = m."id" AND (r."claimedAt" > now() - interval '90 seconds' OR r."sentAt" > now() - interval '90 seconds'))`
  );
  return rows.map((r) => r.id);
}

/** A test copy to the admin, as the first person would get it */
export async function sendTestMail(d: MailDraft, to: { name: string; email: string }) {
  const e = customEmail(d, to);
  const t = mailTransport();
  await t.sendMail({ from: mailFrom(), replyTo: mailReplyTo(), to: to.email, subject: `[Test] ${e.subject}`, text: e.text, html: e.html, list: e.list, headers: e.headers });
}
