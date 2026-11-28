// Teams: colleagues who share their work. Anyone can make a team and invite others with its link
// (/t/<code>). A member shares any job they keep in their account (Excel to KML jobs, Traverse &
// Level jobs, Slope calculations) with the team; the others see it on their dashboard, can download
// it, or copy it into their own account, where it then opens in the app like their own job.
//
// A share points to the job itself, so the team always sees its latest version; deleting the job,
// unsharing it or leaving the team takes it away. A copy is the member's own from then on.
// Server only.
import { randomInt, randomUUID } from "crypto";
import { attachment } from "@/lib/http/attachment";
import { prisma } from "@/lib/db/prisma";
import { db } from "@/lib/db";
import { checkLimit } from "@/lib/billing/billing";
import { getJob, jobFileResponse, putJob, countJobs } from "@/lib/account/userJobs";
import { MAX_USER_JOBS, MAX_USER_STORAGE_BYTES, formatBytes } from "@/lib/account/uploadLimits";
import * as traverse from "@/lib/products/traverseJobs";
import * as slope from "@/lib/products/slopeJobs";

export type ShareKind = "kml" | "traverse" | "slope";
export const SHARE_KINDS: ShareKind[] = ["kml", "traverse", "slope"];
export const KIND_LABEL: Record<ShareKind, string> = { kml: "Excel to KML", traverse: "Traverse & Level", slope: "Slope Calculator" };

export const MAX_OWNED_TEAMS = 5;
export const MAX_MEMBERSHIPS = 20;
export const MAX_MEMBERS = 50;
export const MAX_SHARES = 500;

export class TeamError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

let ready: Promise<void> | null = null;
function ensureTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "teams" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "ownerId" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "teams_code_key" ON "teams"("code")`);
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "team_members" (
        "teamId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'member',
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "team_members_pkey" PRIMARY KEY ("teamId", "userId")
      )`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "team_members_userId_idx" ON "team_members"("userId")`);
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "team_shares" (
        "id" TEXT NOT NULL,
        "teamId" TEXT NOT NULL,
        "kind" TEXT NOT NULL,
        "itemId" TEXT NOT NULL,
        "ownerId" TEXT NOT NULL,
        "note" TEXT NOT NULL DEFAULT '',
        "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "team_shares_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "team_shares_item_key" ON "team_shares"("teamId", "kind", "itemId")`);
      const fk = async (t: string, col: string, ref: string) =>
        prisma.$executeRawUnsafe(`DO $$ BEGIN
          ALTER TABLE "${t}" ADD CONSTRAINT "${t}_${col}_fkey" FOREIGN KEY ("${col}") REFERENCES "${ref}"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await fk("teams", "ownerId", "users");
      await fk("team_members", "teamId", "teams");
      await fk("team_members", "userId", "users");
      await fk("team_shares", "teamId", "teams");
      await fk("team_shares", "ownerId", "users");
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
export const cleanTeamCode = (v: unknown) => (typeof v === "string" ? v.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) : "");
const cleanName = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 60) : "");

async function roleIn(teamId: string, userId: string): Promise<"owner" | "member" | null> {
  const r = await prisma.$queryRawUnsafe<{ role: string }[]>(`SELECT "role" FROM "team_members" WHERE "teamId" = $1 AND "userId" = $2`, teamId, userId);
  return r[0] ? (r[0].role === "owner" ? "owner" : "member") : null;
}

async function mustBe(teamId: string, userId: string, need: "member" | "owner") {
  await ensureTables();
  const role = await roleIn(teamId, userId);
  if (!role) throw new TeamError("You aren't in this team.", 404);
  if (need === "owner" && role !== "owner") throw new TeamError("Only the team's owner can do that.", 403);
  return role;
}

// ---------------------------------------------------------------- teams and members

export async function createTeam(userId: string, name: string) {
  await ensureTables();
  const n = cleanName(name);
  if (!n) throw new TeamError("Give the team a name.");
  const [owned] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM "teams" WHERE "ownerId" = $1`, userId);
  if (Number(owned?.n ?? 0) >= MAX_OWNED_TEAMS) throw new TeamError(`You can have up to ${MAX_OWNED_TEAMS} teams of your own.`);
  const [mine] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM "team_members" WHERE "userId" = $1`, userId);
  if (Number(mine?.n ?? 0) >= MAX_MEMBERSHIPS) throw new TeamError(`You can be in up to ${MAX_MEMBERSHIPS} teams.`);
  const id = randomUUID();
  for (let i = 0; i < 5; i++) {
    const ok = await prisma.$executeRawUnsafe(
      `INSERT INTO "teams" ("id", "name", "ownerId", "code") VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      id,
      n,
      userId,
      newCode()
    );
    if (ok) break;
  }
  await prisma.$executeRawUnsafe(`INSERT INTO "team_members" ("teamId", "userId", "role") VALUES ($1, $2, 'owner')`, id, userId);
  return id;
}

/** The team a code belongs to, for the join page */
export async function teamByCode(code: string) {
  const c = cleanTeamCode(code);
  if (!c) return null;
  await ensureTables();
  const r = await prisma.$queryRawUnsafe<{ id: string; name: string; ownerName: string; members: bigint }[]>(
    `SELECT t."id", t."name", u."name" AS "ownerName", (SELECT count(*) FROM "team_members" m WHERE m."teamId" = t."id") AS members
     FROM "teams" t JOIN "users" u ON u."id" = t."ownerId" WHERE t."code" = $1`,
    c
  );
  return r[0] ? { id: r[0].id, name: r[0].name, ownerName: r[0].ownerName, members: Number(r[0].members) } : null;
}

export async function joinTeam(userId: string, code: string) {
  const t = await teamByCode(code);
  if (!t) throw new TeamError("This invite link isn't valid any more. Ask for a new one.", 404);
  if (await roleIn(t.id, userId)) return t.id;
  if (t.members >= MAX_MEMBERS) throw new TeamError(`This team is full (${MAX_MEMBERS} people).`);
  const [mine] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM "team_members" WHERE "userId" = $1`, userId);
  if (Number(mine?.n ?? 0) >= MAX_MEMBERSHIPS) throw new TeamError(`You can be in up to ${MAX_MEMBERSHIPS} teams.`);
  await prisma.$executeRawUnsafe(`INSERT INTO "team_members" ("teamId", "userId") VALUES ($1, $2) ON CONFLICT DO NOTHING`, t.id, userId);
  return t.id;
}

export async function renameTeam(userId: string, teamId: string, name: string) {
  await mustBe(teamId, userId, "owner");
  const n = cleanName(name);
  if (!n) throw new TeamError("Give the team a name.");
  await prisma.$executeRawUnsafe(`UPDATE "teams" SET "name" = $2 WHERE "id" = $1`, teamId, n);
}

/** A new invite link; the old one stops working */
export async function newInviteCode(userId: string, teamId: string) {
  await mustBe(teamId, userId, "owner");
  for (let i = 0; i < 5; i++) {
    const ok = await prisma
      .$executeRawUnsafe(`UPDATE "teams" SET "code" = $2 WHERE "id" = $1`, teamId, newCode())
      .catch(() => 0);
    if (ok) return;
  }
  throw new TeamError("A new link couldn't be made. Try again.", 500);
}

/** Take someone out (owner), or leave (yourself). Their shares in the team go with them. */
export async function removeMember(userId: string, teamId: string, memberId: string) {
  const role = await mustBe(teamId, userId, "member");
  if (memberId !== userId && role !== "owner") throw new TeamError("Only the team's owner can do that.", 403);
  if (memberId === userId && role === "owner") throw new TeamError("You own this team: delete it instead, or it stays with you.");
  await prisma.$executeRawUnsafe(`DELETE FROM "team_shares" WHERE "teamId" = $1 AND "ownerId" = $2`, teamId, memberId);
  await prisma.$executeRawUnsafe(`DELETE FROM "team_members" WHERE "teamId" = $1 AND "userId" = $2 AND "role" <> 'owner'`, teamId, memberId);
}

/** The team goes for everyone. The jobs themselves stay with whoever keeps them. */
export async function deleteTeam(userId: string, teamId: string) {
  await mustBe(teamId, userId, "owner");
  await prisma.$executeRawUnsafe(`DELETE FROM "teams" WHERE "id" = $1`, teamId);
}

// ---------------------------------------------------------------- what can be shared

type Item = { kind: ShareKind; id: string; name: string; detail: string; updated: string };

/** Everything this account keeps that it could share */
export async function myItems(userId: string): Promise<Item[]> {
  await Promise.all([traverse.ensureTraverseTables(), slope.ensureSlopeTables()]);
  const [k, t, s] = await Promise.all([
    prisma.$queryRawUnsafe<{ jobId: string; name: string; points: number; grid: string; updatedAt: Date }[]>(
      `SELECT "jobId", "name", "points", "grid", "updatedAt" FROM "user_jobs" WHERE "userId" = $1 ORDER BY "updatedAt" DESC LIMIT 300`,
      userId
    ),
    prisma.$queryRawUnsafe<{ id: string; name: string; kind: string; updatedAt: Date }[]>(
      `SELECT "id", "name", "kind", "updatedAt" FROM "traverse_jobs" WHERE "ownerId" = $1 ORDER BY "updatedAt" DESC LIMIT 300`,
      userId
    ),
    prisma.$queryRawUnsafe<{ id: string; name: string; updatedAt: Date }[]>(
      `SELECT "id", "name", "updatedAt" FROM "slope_jobs" WHERE "ownerId" = $1 ORDER BY "updatedAt" DESC LIMIT 300`,
      userId
    ),
  ]);
  return [
    ...k.map((r) => ({ kind: "kml" as const, id: r.jobId, name: r.name, detail: `${r.points} points${r.grid ? ` · ${r.grid}` : ""}`, updated: r.updatedAt.toISOString() })),
    ...t.map((r) => ({ kind: "traverse" as const, id: r.id, name: r.name, detail: r.kind === "level" ? "Level run" : "Traverse", updated: r.updatedAt.toISOString() })),
    ...s.map((r) => ({ kind: "slope" as const, id: r.id, name: r.name, detail: "Slope calculation", updated: r.updatedAt.toISOString() })),
  ];
}

async function ownsItem(userId: string, kind: ShareKind, itemId: string): Promise<boolean> {
  if (kind === "kml") return Boolean(await getJob(userId, itemId));
  if (kind === "traverse") return (await traverse.ownerOf(itemId)) === userId;
  return (await slope.ownerOf(itemId)) === userId;
}

export async function shareItem(userId: string, teamId: string, kind: ShareKind, itemId: string, note = "") {
  await mustBe(teamId, userId, "member");
  if (!SHARE_KINDS.includes(kind) || !/^[A-Za-z0-9_-]{1,80}$/.test(itemId)) throw new TeamError("Not a job that can be shared.");
  if (!(await ownsItem(userId, kind, itemId))) throw new TeamError("You can share only jobs kept in your own account.", 404);
  const [n] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM "team_shares" WHERE "teamId" = $1`, teamId);
  if (Number(n?.n ?? 0) >= MAX_SHARES) throw new TeamError(`A team can have up to ${MAX_SHARES} shared jobs. Unshare some first.`);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "team_shares" ("id", "teamId", "kind", "itemId", "ownerId", "note") VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ("teamId", "kind", "itemId") DO UPDATE SET "note" = EXCLUDED."note"`,
    randomUUID(),
    teamId,
    kind,
    itemId,
    userId,
    String(note || "").slice(0, 200)
  );
}

type ShareRow = { id: string; teamId: string; kind: ShareKind; itemId: string; ownerId: string };

async function shareFor(userId: string, shareId: string): Promise<ShareRow & { role: "owner" | "member" }> {
  await ensureTables();
  const r = await prisma.$queryRawUnsafe<ShareRow[]>(`SELECT "id", "teamId", "kind", "itemId", "ownerId" FROM "team_shares" WHERE "id" = $1`, shareId);
  if (!r[0]) throw new TeamError("That shared job isn't there any more.", 404);
  const role = await roleIn(r[0].teamId, userId);
  if (!role) throw new TeamError("That shared job isn't there any more.", 404);
  return { ...r[0], role };
}

/** Whoever shared it, or the team's owner */
export async function unshare(userId: string, shareId: string) {
  const s = await shareFor(userId, shareId);
  if (s.ownerId !== userId && s.role !== "owner") throw new TeamError("Only whoever shared it, or the team's owner, can take it off.", 403);
  await prisma.$executeRawUnsafe(`DELETE FROM "team_shares" WHERE "id" = $1`, shareId);
}

/** The shared job as a file, for any member */
export async function downloadShare(userId: string, shareId: string): Promise<Response> {
  const s = await shareFor(userId, shareId);
  if (s.kind === "kml") {
    const job = await getJob(s.ownerId, s.itemId);
    if (!job) throw new TeamError("That job was deleted by its owner.", 404);
    return jobFileResponse(job);
  }
  const found = s.kind === "traverse" ? await traverse.jobForDownload(s.itemId) : null;
  const slopeJob =
    s.kind === "slope" ? (await slope.listOwn(s.ownerId)).find((j) => j.id === s.itemId) ?? null : null;
  const job = found?.job ?? slopeJob;
  if (!job || (found && found.ownerId !== s.ownerId)) throw new TeamError("That job was deleted by its owner.", 404);
  const body = JSON.stringify({ app: KIND_LABEL[s.kind], ...job }, null, 2);
  const file = `${String(job.name).replace(/[^\w.-]+/g, "_").slice(0, 80) || "job"}.json`;
  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "Content-Disposition": attachment(file) },
  });
}

/** A copy of the shared job in this member's own account (it then opens in the app) */
export async function copyShare(user: { id: string; role?: string | null; email?: string | null }, shareId: string): Promise<{ kind: ShareKind; name: string }> {
  const s = await shareFor(user.id, shareId);
  if (s.ownerId === user.id) throw new TeamError("This one is already yours.");
  const meter = s.kind === "kml" ? "jobs:kml" : s.kind === "traverse" ? "jobs:traverse" : "jobs:slope";
  const plan = await checkLimit(user, meter);
  if (!plan.ok) throw new TeamError(plan.error, 402);

  if (s.kind === "kml") {
    const job = await getJob(s.ownerId, s.itemId);
    if (!job) throw new TeamError("That job was deleted by its owner.", 404);
    if ((await countJobs(user.id)) >= MAX_USER_JOBS) throw new TeamError(`Your account already keeps ${MAX_USER_JOBS} jobs. Delete some first.`);
    if ((await db.getUserStorageBytes(user.id)) + job.size > MAX_USER_STORAGE_BYTES)
      throw new TeamError(`Your account is full (${formatBytes(MAX_USER_STORAGE_BYTES)}). Delete files or jobs first.`);
    await putJob(user.id, `team-${randomUUID().slice(0, 18)}`, {
      name: job.name.slice(0, 110) + " (copy)",
      points: job.points,
      photos: job.photos,
      photosLeft: job.photosLeft,
      grid: job.grid,
      survey: job.survey,
      state: job.state,
      updated: Date.now(),
    });
    return { kind: s.kind, name: job.name };
  }
  if (s.kind === "traverse") {
    const found = await traverse.jobForDownload(s.itemId);
    if (!found || found.ownerId !== s.ownerId) throw new TeamError("That job was deleted by its owner.", 404);
    if ((await traverse.countOwn(user.id)) >= traverse.MAX_TRAVERSE_JOBS) throw new TeamError("You keep the most jobs Traverse & Level allows. Delete some first.");
    const j = found.job;
    await traverse.upsert(user.id, randomUUID(), {
      kind: j.kind,
      name: String(j.name).slice(0, 190) + " (copy)",
      data: JSON.stringify(j.data),
      summary: JSON.stringify(j.summary || {}),
      updated: new Date().toISOString(),
    });
    return { kind: s.kind, name: j.name };
  }
  const j = (await slope.listOwn(s.ownerId)).find((x) => x.id === s.itemId);
  if (!j) throw new TeamError("That calculation was deleted by its owner.", 404);
  if ((await slope.countOwn(user.id)) >= slope.MAX_SLOPE_JOBS) throw new TeamError("You keep the most calculations Slope Calculator allows. Delete some first.");
  await slope.upsert(user.id, randomUUID(), {
    name: String(j.name).slice(0, 190) + " (copy)",
    data: JSON.stringify(j.data),
    summary: JSON.stringify(j.summary || {}),
    updated: new Date().toISOString(),
  });
  return { kind: s.kind, name: j.name };
}

// ---------------------------------------------------------------- the dashboard view

export async function myTeams(userId: string) {
  await ensureTables();
  await Promise.all([traverse.ensureTraverseTables(), slope.ensureSlopeTables()]);
  const teams = await prisma.$queryRawUnsafe<{ id: string; name: string; code: string; role: string; ownerId: string }[]>(
    `SELECT t."id", t."name", t."code", m."role", t."ownerId" FROM "team_members" m JOIN "teams" t ON t."id" = m."teamId"
     WHERE m."userId" = $1 ORDER BY t."createdAt"`,
    userId
  );
  if (!teams.length) return [];
  const ids = teams.map((t) => t.id);
  const [members, shares] = await Promise.all([
    prisma.$queryRawUnsafe<{ teamId: string; userId: string; name: string; email: string; role: string }[]>(
      `SELECT m."teamId", m."userId", u."name", u."email", m."role" FROM "team_members" m JOIN "users" u ON u."id" = m."userId"
       WHERE m."teamId" = ANY($1::text[]) ORDER BY m."role" DESC, m."joinedAt"`,
      ids
    ),
    // the job's current name and date from its own table; a deleted job drops out
    prisma.$queryRawUnsafe<{ id: string; teamId: string; kind: ShareKind; itemId: string; ownerId: string; ownerName: string; note: string; sharedAt: Date; name: string | null; updatedAt: Date | null }[]>(
      `SELECT s."id", s."teamId", s."kind", s."itemId", s."ownerId", u."name" AS "ownerName", s."note", s."sharedAt",
              coalesce(k."name", tj."name", sj."name") AS "name", coalesce(k."updatedAt", tj."updatedAt", sj."updatedAt") AS "updatedAt"
       FROM "team_shares" s JOIN "users" u ON u."id" = s."ownerId"
       LEFT JOIN "user_jobs" k ON s."kind" = 'kml' AND k."userId" = s."ownerId" AND k."jobId" = s."itemId"
       LEFT JOIN "traverse_jobs" tj ON s."kind" = 'traverse' AND tj."id" = s."itemId" AND tj."ownerId" = s."ownerId"
       LEFT JOIN "slope_jobs" sj ON s."kind" = 'slope' AND sj."id" = s."itemId" AND sj."ownerId" = s."ownerId"
       WHERE s."teamId" = ANY($1::text[]) ORDER BY s."sharedAt" DESC`,
      ids
    ),
  ]);
  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role === "owner" ? ("owner" as const) : ("member" as const),
    code: t.code,
    members: members.filter((m) => m.teamId === t.id).map((m) => ({ id: m.userId, name: m.name, email: m.email, role: m.role, me: m.userId === userId })),
    shares: shares
      .filter((s) => s.teamId === t.id && s.name)
      .map((s) => ({
        id: s.id,
        kind: s.kind,
        app: KIND_LABEL[s.kind],
        name: s.name as string,
        by: s.ownerName,
        mine: s.ownerId === userId,
        /** only for your own shares: which of your jobs it is */
        itemId: s.ownerId === userId ? s.itemId : null,
        note: s.note,
        sharedAt: new Date(s.sharedAt).toISOString(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : null,
      })),
  }));
}
