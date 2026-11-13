import { prisma } from "@/lib/prisma";

// Admin → Surveyors → an account → Controls: block sign-in, and remember the job title an
// account had before it was made an admin (users.role holds both the title and "ADMIN").
// Its own table, created on first use, so no migration.
//   account_controls  userId, blocked, reason, blockedBy, blockedAt, roleBeforeAdmin
//
// A blocked account can't sign in (lib/loginResponse.ts, the Google sign-in, db.createSession)
// and is signed out everywhere when it is blocked, so its old sessions stop working at once.

export class AccountBlocked extends Error {
  constructor() {
    super("This account is blocked. Contact us if you think this is a mistake.");
  }
}

export const BLOCKED_MESSAGE = "This account is blocked. Contact us if you think this is a mistake.";

export interface AccountControl {
  blocked: boolean;
  reason: string;
  blockedBy: string;
  blockedAt: Date | null;
  roleBeforeAdmin: string;
}

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "account_controls" (
        "userId" TEXT NOT NULL,
        "blocked" BOOLEAN NOT NULL DEFAULT false,
        "reason" TEXT NOT NULL DEFAULT '',
        "blockedBy" TEXT NOT NULL DEFAULT '',
        "blockedAt" TIMESTAMP(3),
        "roleBeforeAdmin" TEXT NOT NULL DEFAULT '',
        CONSTRAINT "account_controls_pkey" PRIMARY KEY ("userId")
      )`);
      await prisma.$executeRawUnsafe(`DO $$ BEGIN
        ALTER TABLE "account_controls" ADD CONSTRAINT "account_controls_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const NONE: AccountControl = { blocked: false, reason: "", blockedBy: "", blockedAt: null, roleBeforeAdmin: "" };

export async function controlOf(userId: string): Promise<AccountControl> {
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<AccountControl[]>(
    `SELECT "blocked","reason","blockedBy","blockedAt","roleBeforeAdmin" FROM "account_controls" WHERE "userId" = $1`,
    userId
  );
  return rows[0] ?? NONE;
}

/** Is this account blocked? A database error counts as not blocked: sign-in must not fail for everyone. */
export async function isBlocked(userId: string): Promise<boolean> {
  try {
    return (await controlOf(userId)).blocked;
  } catch (err) {
    console.error("[account controls] couldn't check a block:", err);
    return false;
  }
}

/** The ids of every blocked account (for the Surveyors list) */
export async function blockedIds(): Promise<Set<string>> {
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<{ userId: string }[]>(`SELECT "userId" FROM "account_controls" WHERE "blocked"`);
  return new Set(rows.map((r) => r.userId));
}

export async function setBlocked(userId: string, blocked: boolean, reason: string, by: string): Promise<void> {
  await ensureTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "account_controls" ("userId","blocked","reason","blockedBy","blockedAt") VALUES ($1,$2,$3,$4,${blocked ? "CURRENT_TIMESTAMP" : "NULL"})
     ON CONFLICT ("userId") DO UPDATE SET "blocked"=$2,"reason"=$3,"blockedBy"=$4,"blockedAt"=${blocked ? "CURRENT_TIMESTAMP" : "NULL"}`,
    userId,
    blocked,
    reason.slice(0, 500),
    by.slice(0, 200)
  );
}

/** Keeps the job title an account had, before its role becomes "ADMIN" */
export async function rememberRole(userId: string, role: string): Promise<void> {
  await ensureTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "account_controls" ("userId","roleBeforeAdmin") VALUES ($1,$2)
     ON CONFLICT ("userId") DO UPDATE SET "roleBeforeAdmin"=$2`,
    userId,
    role.slice(0, 100)
  );
}

/** How many sessions (browsers, apps, the Toolkit) an account is signed in on now */
export async function activeSessions(userId: string): Promise<number> {
  return prisma.session.count({ where: { userId, expiresAt: { gt: new Date() } } });
}
