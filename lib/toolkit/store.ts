import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Survey Toolkit (beta test): who may use it, their PCs, and what it did on them. Three tables of
// its own, created on first use like slope_jobs, so no migration and no change to any other table.
// Deleting them (and lib/toolkit, app/api/toolkit) removes the test without a trace.
//   toolkit_testers  emails allowed in the beta (admins always are)
//   toolkit_devices  one row per PC: its name, Windows, Toolkit version and installed tools
//   toolkit_events   installed / updated / uninstalled / failed, newest kept
//   toolkit_handoffs single-use codes that sign the Toolkit's built-in web app window in

export const TOOLKIT_ACTIONS = ["installed", "updated", "uninstalled", "failed", "opened"] as const;
export type ToolkitAction = (typeof TOOLKIT_ACTIONS)[number];
const MAX_EVENTS_PER_DEVICE = 1000;

let ready: Promise<void> | null = null;
export function ensureToolkitTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const run = (sql: string) => prisma.$executeRawUnsafe(sql);
      await run(`CREATE TABLE IF NOT EXISTS "toolkit_testers" (
        "email" TEXT NOT NULL,
        "note" TEXT NOT NULL DEFAULT '',
        "addedBy" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "toolkit_testers_pkey" PRIMARY KEY ("email")
      )`);
      await run(`CREATE TABLE IF NOT EXISTS "toolkit_devices" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL DEFAULT '',
        "windows" TEXT NOT NULL DEFAULT '',
        "toolkitVersion" TEXT NOT NULL DEFAULT '',
        "tools" TEXT NOT NULL DEFAULT '{}',
        "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "toolkit_devices_pkey" PRIMARY KEY ("id")
      )`);
      await run(`CREATE INDEX IF NOT EXISTS "toolkit_devices_userId_idx" ON "toolkit_devices"("userId")`);
      await run(`DO $$ BEGIN
        ALTER TABLE "toolkit_devices" ADD CONSTRAINT "toolkit_devices_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await run(`CREATE TABLE IF NOT EXISTS "toolkit_events" (
        "id" BIGSERIAL NOT NULL,
        "deviceId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "tool" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "fromVersion" TEXT NOT NULL DEFAULT '',
        "toVersion" TEXT NOT NULL DEFAULT '',
        "message" TEXT NOT NULL DEFAULT '',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "toolkit_events_pkey" PRIMARY KEY ("id")
      )`);
      await run(`CREATE INDEX IF NOT EXISTS "toolkit_events_deviceId_idx" ON "toolkit_events"("deviceId", "createdAt")`);
      await run(`CREATE INDEX IF NOT EXISTS "toolkit_events_createdAt_idx" ON "toolkit_events"("createdAt")`);
      await run(`DO $$ BEGIN
        ALTER TABLE "toolkit_events" ADD CONSTRAINT "toolkit_events_deviceId_fkey" FOREIGN KEY ("deviceId")
          REFERENCES "toolkit_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await run(`CREATE TABLE IF NOT EXISTS "toolkit_handoffs" (
        "codeHash" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "next" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "toolkit_handoffs_pkey" PRIMARY KEY ("codeHash")
      )`);
      await run(`DO $$ BEGIN
        ALTER TABLE "toolkit_handoffs" ADD CONSTRAINT "toolkit_handoffs_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const normEmail = (e: string) => e.trim().toLowerCase();
export const isEmail = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e.trim());

export async function isTester(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  await ensureToolkitTables();
  const r = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) AS n FROM "toolkit_testers" WHERE "email" = $1`, normEmail(email));
  return Number(r[0]?.n ?? 0) > 0;
}

export async function listTesters() {
  await ensureToolkitTables();
  return prisma.$queryRawUnsafe<{ email: string; note: string; addedBy: string; createdAt: Date }[]>(
    `SELECT "email","note","addedBy","createdAt" FROM "toolkit_testers" ORDER BY "createdAt" DESC`
  );
}

export async function addTester(email: string, note: string, addedBy: string) {
  await ensureToolkitTables();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "toolkit_testers" ("email","note","addedBy") VALUES ($1,$2,$3)
     ON CONFLICT ("email") DO UPDATE SET "note" = $2`,
    normEmail(email),
    note.slice(0, 200),
    addedBy.slice(0, 200)
  );
}

export async function removeTester(email: string): Promise<boolean> {
  await ensureToolkitTables();
  return (await prisma.$executeRawUnsafe(`DELETE FROM "toolkit_testers" WHERE "email" = $1`, normEmail(email))) > 0;
}

export interface DeviceReport {
  id: string;
  name: string;
  windows: string;
  toolkitVersion: string;
  /** tool id → installed version ("" when not installed) */
  tools: Record<string, string>;
}

/** Records the PC as seen now. A PC that signs in to another account moves to that account. */
export async function seeDevice(userId: string, d: DeviceReport) {
  await ensureToolkitTables();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "toolkit_devices" ("id","userId","name","windows","toolkitVersion","tools")
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT ("id") DO UPDATE SET "userId"=$2,"name"=$3,"windows"=$4,"toolkitVersion"=$5,"tools"=$6,"lastSeen"=CURRENT_TIMESTAMP`,
    d.id,
    userId,
    d.name,
    d.windows,
    d.toolkitVersion,
    JSON.stringify(d.tools)
  );
}

export interface EventReport {
  tool: string;
  action: ToolkitAction;
  fromVersion: string;
  toVersion: string;
  message: string;
}

export async function addEvent(userId: string, deviceId: string, e: EventReport) {
  await ensureToolkitTables();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "toolkit_events" ("deviceId","userId","tool","action","fromVersion","toVersion","message") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    deviceId,
    userId,
    e.tool,
    e.action,
    e.fromVersion,
    e.toVersion,
    e.message
  );
  // keep the newest events of each PC only
  await prisma.$executeRawUnsafe(
    `DELETE FROM "toolkit_events" WHERE "deviceId" = $1 AND "id" NOT IN (
       SELECT "id" FROM "toolkit_events" WHERE "deviceId" = $1 ORDER BY "createdAt" DESC, "id" DESC LIMIT ${MAX_EVENTS_PER_DEVICE})`,
    deviceId
  );
}

// ---------------------------------------------------------------- sign-in handover
//
// The Toolkit shows the web apps (Excel to KML, Traverse & Level, Slope Calculator) inside its own
// window. So the user doesn't sign in a second time there, the Toolkit, already signed in, asks for
// a code (POST /api/toolkit/handoff) and opens /api/toolkit/handoff?code=… in that window, which
// signs it in and goes on to the app. The code works once, for 60 seconds, only for those three
// addresses, and only its SHA-256 is stored. The long-lived sign-in never goes into an address.

/** The pages the handover may go on to: the three web apps */
export const HANDOFF_PAGES = ["/app", "/traverse/app", "/slope-calculation/app"] as const;
const HANDOFF_SECONDS = 60;
const hashOf = (code: string) => crypto.createHash("sha256").update(code).digest("hex");

export async function createHandoff(userId: string, next: string): Promise<string> {
  await ensureToolkitTables();
  const code = crypto.randomBytes(32).toString("hex");
  await prisma.$executeRawUnsafe(`DELETE FROM "toolkit_handoffs" WHERE "expiresAt" < NOW()`);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "toolkit_handoffs" ("codeHash","userId","next","expiresAt") VALUES ($1,$2,$3,NOW() + ($4 || ' seconds')::interval)`,
    hashOf(code),
    userId,
    next,
    String(HANDOFF_SECONDS)
  );
  return code;
}

/** Uses up a code: who it was for and where it goes, or null when unknown, used or expired */
export async function takeHandoff(code: string): Promise<{ userId: string; next: string } | null> {
  if (!/^[0-9a-f]{64}$/.test(code)) return null;
  await ensureToolkitTables();
  const rows = await prisma.$queryRawUnsafe<{ userId: string; next: string }[]>(
    `DELETE FROM "toolkit_handoffs" WHERE "codeHash" = $1 AND "expiresAt" > NOW() RETURNING "userId","next"`,
    hashOf(code)
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------- Admin (T6)
//
// What /toolkit-beta/admin shows: the testers (and whether they have an account yet), each PC
// with its tool versions, and what the Toolkits did. Read only, apart from removing a PC.

export interface TesterRow {
  email: string;
  note: string;
  addedBy: string;
  createdAt: Date;
  /** null until they create an account on the website */
  name: string | null;
  lastLogin: Date | null;
  devices: number;
}

export async function listTesterRows(): Promise<TesterRow[]> {
  await ensureToolkitTables();
  const rows = await prisma.$queryRawUnsafe<(Omit<TesterRow, "devices"> & { devices: bigint })[]>(
    `SELECT t."email", t."note", t."addedBy", t."createdAt", u."name", u."lastLoginAt" AS "lastLogin",
            (SELECT COUNT(*) FROM "toolkit_devices" d WHERE d."userId" = u."id") AS "devices"
       FROM "toolkit_testers" t LEFT JOIN "users" u ON LOWER(u."email") = t."email"
      ORDER BY t."createdAt" DESC`
  );
  return rows.map((r) => ({ ...r, devices: Number(r.devices ?? 0) }));
}

export interface DeviceRow {
  id: string;
  userId: string;
  email: string | null;
  userName: string | null;
  name: string;
  windows: string;
  toolkitVersion: string;
  tools: Record<string, string>;
  firstSeen: Date;
  lastSeen: Date;
}

export async function listDevices(): Promise<DeviceRow[]> {
  await ensureToolkitTables();
  const rows = await prisma.$queryRawUnsafe<(Omit<DeviceRow, "tools"> & { tools: string })[]>(
    `SELECT d."id", d."userId", u."email", u."name" AS "userName", d."name", d."windows", d."toolkitVersion", d."tools",
            d."firstSeen", d."lastSeen"
       FROM "toolkit_devices" d LEFT JOIN "users" u ON u."id" = d."userId"
      ORDER BY d."lastSeen" DESC LIMIT 500`
  );
  return rows.map((r) => {
    let tools: Record<string, string> = {};
    try {
      const t = JSON.parse(r.tools) as unknown;
      if (t && typeof t === "object") tools = t as Record<string, string>;
    } catch {
      // stored by seeDevice as JSON; anything else shows as no tools
    }
    return { ...r, tools };
  });
}

/** Forgets a PC and its events (it comes back the next time its Toolkit reports) */
export async function removeDevice(id: string): Promise<boolean> {
  await ensureToolkitTables();
  return (await prisma.$executeRawUnsafe(`DELETE FROM "toolkit_devices" WHERE "id" = $1`, id)) > 0;
}

export interface EventRow {
  id: string;
  deviceId: string;
  deviceName: string | null;
  email: string | null;
  tool: string;
  action: string;
  fromVersion: string;
  toVersion: string;
  message: string;
  createdAt: Date;
}

/** The newest events, all PCs */
export async function listEvents(limit = 300): Promise<EventRow[]> {
  await ensureToolkitTables();
  return prisma.$queryRawUnsafe<EventRow[]>(
    `SELECT e."id"::text AS "id", e."deviceId", d."name" AS "deviceName", u."email", e."tool", e."action",
            e."fromVersion", e."toVersion", e."message", e."createdAt"
       FROM "toolkit_events" e
       LEFT JOIN "toolkit_devices" d ON d."id" = e."deviceId"
       LEFT JOIN "users" u ON u."id" = e."userId"
      ORDER BY e."createdAt" DESC, e."id" DESC LIMIT $1`,
    Math.max(1, Math.min(1000, Math.floor(limit)))
  );
}

/** The last [days] days: how many of each action, and how many were automatic updates (T5) */
export async function eventCounts(days = 30): Promise<Record<string, { all: number; automatic: number }>> {
  await ensureToolkitTables();
  const rows = await prisma.$queryRawUnsafe<{ action: string; n: bigint; auto: bigint }[]>(
    `SELECT "action", COUNT(*) AS "n", COUNT(*) FILTER (WHERE "message" LIKE 'automatic%') AS "auto"
       FROM "toolkit_events" WHERE "createdAt" > NOW() - ($1 || ' days')::interval GROUP BY "action"`,
    String(Math.max(1, Math.floor(days)))
  );
  return Object.fromEntries(rows.map((r) => [r.action, { all: Number(r.n), automatic: Number(r.auto) }]));
}

// ---------------------------------------------------------------- Admin → Survey Toolkit
//
// The main Admin's Survey Toolkit tab: each account that uses the Toolkit, day by day what the
// Toolkits did, and each tool's installs, updates and failures.

export interface ToolkitUserRow {
  userId: string;
  email: string | null;
  name: string | null;
  organization: string | null;
  location: string | null;
  pcs: number;
  firstSeen: Date;
  lastSeen: Date;
  /** the Toolkit version on the PC seen last */
  toolkitVersion: string;
  events: number;
  installs: number;
  updates: number;
  failures: number;
  /** the last time this account downloaded the Toolkit from the website */
  lastDownload: Date | null;
}

export async function listToolkitUsers(): Promise<ToolkitUserRow[]> {
  await ensureToolkitTables();
  const rows = await prisma.$queryRawUnsafe<
    (Omit<ToolkitUserRow, "pcs" | "events" | "installs" | "updates" | "failures"> & {
      pcs: bigint;
      events: bigint;
      installs: bigint;
      updates: bigint;
      failures: bigint;
    })[]
  >(
    `SELECT d."userId", u."email", u."name", u."organization", u."location",
            COUNT(*) AS "pcs", MIN(d."firstSeen") AS "firstSeen", MAX(d."lastSeen") AS "lastSeen",
            (SELECT d2."toolkitVersion" FROM "toolkit_devices" d2 WHERE d2."userId" = d."userId" ORDER BY d2."lastSeen" DESC LIMIT 1) AS "toolkitVersion",
            (SELECT COUNT(*) FROM "toolkit_events" e WHERE e."userId" = d."userId") AS "events",
            (SELECT COUNT(*) FROM "toolkit_events" e WHERE e."userId" = d."userId" AND e."action" = 'installed') AS "installs",
            (SELECT COUNT(*) FROM "toolkit_events" e WHERE e."userId" = d."userId" AND e."action" = 'updated') AS "updates",
            (SELECT COUNT(*) FROM "toolkit_events" e WHERE e."userId" = d."userId" AND e."action" = 'failed') AS "failures",
            (SELECT MAX(w."timestamp") FROM "downloads" w WHERE w."userId" = d."userId" AND w."assetType" = 'toolkit') AS "lastDownload"
       FROM "toolkit_devices" d LEFT JOIN "users" u ON u."id" = d."userId"
      GROUP BY d."userId", u."email", u."name", u."organization", u."location"
      ORDER BY MAX(d."lastSeen") DESC LIMIT 1000`
  );
  return rows.map((r) => ({
    ...r,
    pcs: Number(r.pcs),
    events: Number(r.events),
    installs: Number(r.installs),
    updates: Number(r.updates),
    failures: Number(r.failures),
  }));
}

export interface ToolkitDay {
  day: string;
  /** PCs whose Toolkit did something that day */
  pcs: number;
  installed: number;
  updated: number;
  uninstalled: number;
  failed: number;
  opened: number;
}

/** The last [days] days, one row per day that had any event */
export async function dailyActivity(days = 30): Promise<ToolkitDay[]> {
  await ensureToolkitTables();
  const rows = await prisma.$queryRawUnsafe<{ day: Date; pcs: bigint; installed: bigint; updated: bigint; uninstalled: bigint; failed: bigint; opened: bigint }[]>(
    `SELECT date_trunc('day', "createdAt") AS "day", COUNT(DISTINCT "deviceId") AS "pcs",
            COUNT(*) FILTER (WHERE "action" = 'installed') AS "installed",
            COUNT(*) FILTER (WHERE "action" = 'updated') AS "updated",
            COUNT(*) FILTER (WHERE "action" = 'uninstalled') AS "uninstalled",
            COUNT(*) FILTER (WHERE "action" = 'failed') AS "failed",
            COUNT(*) FILTER (WHERE "action" = 'opened') AS "opened"
       FROM "toolkit_events" WHERE "createdAt" > NOW() - ($1 || ' days')::interval
      GROUP BY 1 ORDER BY 1`,
    String(Math.max(1, Math.floor(days)))
  );
  return rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    pcs: Number(r.pcs),
    installed: Number(r.installed),
    updated: Number(r.updated),
    uninstalled: Number(r.uninstalled),
    failed: Number(r.failed),
    opened: Number(r.opened),
  }));
}

/** Per tool and action, all time and the last 30 days */
export async function toolActionCounts(): Promise<Record<string, Record<string, { all: number; recent: number }>>> {
  await ensureToolkitTables();
  const rows = await prisma.$queryRawUnsafe<{ tool: string; action: string; n: bigint; recent: bigint }[]>(
    `SELECT "tool", "action", COUNT(*) AS "n", COUNT(*) FILTER (WHERE "createdAt" > NOW() - interval '30 days') AS "recent"
       FROM "toolkit_events" GROUP BY "tool", "action"`
  );
  const out: Record<string, Record<string, { all: number; recent: number }>> = {};
  for (const r of rows) (out[r.tool] ??= {})[r.action] = { all: Number(r.n), recent: Number(r.recent) };
  return out;
}

/** Every event of one PC, newest first (its whole kept history) */
export async function deviceEvents(deviceId: string): Promise<EventRow[]> {
  await ensureToolkitTables();
  return prisma.$queryRawUnsafe<EventRow[]>(
    `SELECT e."id"::text AS "id", e."deviceId", d."name" AS "deviceName", u."email", e."tool", e."action",
            e."fromVersion", e."toVersion", e."message", e."createdAt"
       FROM "toolkit_events" e
       LEFT JOIN "toolkit_devices" d ON d."id" = e."deviceId"
       LEFT JOIN "users" u ON u."id" = e."userId"
      WHERE e."deviceId" = $1
      ORDER BY e."createdAt" DESC, e."id" DESC LIMIT 1000`,
    deviceId
  );
}
