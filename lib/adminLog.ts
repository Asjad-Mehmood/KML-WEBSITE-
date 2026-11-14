import { prisma } from "@/lib/prisma";

// Admin → Admin log: every change an admin makes (blocked an account, deleted a file, changed a
// setting, sent an email…): who, what, to what, when, and from where. Its own table, created on
// first use like the others, so no migration. Kept for a year (the nightly cleanup, or the next
// write after a year, removes older rows).
//   admin_log  id, at, adminEmail, action, target, details, ip

export interface AdminLogRow {
  id: string;
  at: Date;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  ip: string;
}

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "admin_log" (
        "id" BIGSERIAL NOT NULL,
        "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "adminEmail" TEXT NOT NULL DEFAULT '',
        "action" TEXT NOT NULL,
        "target" TEXT NOT NULL DEFAULT '',
        "details" TEXT NOT NULL DEFAULT '',
        "ip" TEXT NOT NULL DEFAULT '',
        CONSTRAINT "admin_log_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "admin_log_at_idx" ON "admin_log"("at")`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

/** What admins can be seen doing, with the words the Admin log shows */
export const ADMIN_ACTIONS: Record<string, string> = {
  "account.block": "Blocked an account",
  "account.unblock": "Unblocked an account",
  "account.signout": "Signed an account out everywhere",
  "account.reset-email": "Sent a password reset email",
  "account.make-admin": "Made an account an admin",
  "account.remove-admin": "Removed an admin",
  "account.update": "Changed an account",
  "account.delete": "Deleted an account",
  "account.create": "Created an account",
  "account.email": "Emailed an account",
  "account.clear-activity": "Cleared an account's activity",
  "file.delete": "Deleted a file",
  "settings.update": "Changed settings",
  "release.save": "Saved a release",
  "release.delete": "Deleted a release",
  "release.send": "Sent a release email",
  "release.retry": "Sent a release email again to the people it failed for",
  "release.optin": "Let someone get release emails again",
  "review.moderate": "Published or hid a review",
  "message.update": "Changed a message",
  "toolkit.tester": "Changed the Toolkit testers",
  "toolkit.device": "Removed a Toolkit PC",
  "cleanup.run": "Ran the cleanup",
  "data.delete": "Deleted a record",
  "data.clear": "Cleared records",
  "data.export": "Exported kept files as CSV",
  "traverse.access": "Changed Traverse & Level access",
  "admin.trusted-browsers": "Removed trusted browsers",
};

/**
 * Notes a change an admin made. Never throws: the change itself has happened, and a log that
 * can't be written must not turn it into an error.
 */
export async function logAdmin(
  admin: { email: string },
  action: string,
  target: string,
  details = "",
  req?: { headers: Headers }
): Promise<void> {
  try {
    await ensureTable();
    const ip = (req?.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req?.headers.get("x-real-ip") || "";
    await prisma.$executeRawUnsafe(
      `INSERT INTO "admin_log" ("adminEmail","action","target","details","ip") VALUES ($1,$2,$3,$4,$5)`,
      admin.email.slice(0, 200),
      action.slice(0, 60),
      target.slice(0, 300),
      details.slice(0, 4000),
      ip.slice(0, 64)
    );
    // keep a year; cheap, on the "at" index
    if (Math.random() < 0.02) await prisma.$executeRawUnsafe(`DELETE FROM "admin_log" WHERE "at" < NOW() - interval '365 days'`);
  } catch (err) {
    console.error("[admin log] not written:", action, target, err);
  }
}

export async function listAdminLog(opts: { limit?: number; before?: string } = {}): Promise<AdminLogRow[]> {
  await ensureTable();
  const limit = Math.max(1, Math.min(2000, Math.floor(opts.limit ?? 1000)));
  const rows = await prisma.$queryRawUnsafe<(Omit<AdminLogRow, "id"> & { id: bigint })[]>(
    `SELECT "id","at","adminEmail","action","target","details","ip" FROM "admin_log"
      ${opts.before ? `WHERE "id" < $2` : ""} ORDER BY "id" DESC LIMIT $1`,
    limit,
    ...(opts.before ? [BigInt(opts.before)] : [])
  );
  return rows.map((r) => ({ ...r, id: r.id.toString() }));
}

/** The year's log is pruned with the other housekeeping (app/api/cron/cleanup) */
export async function pruneAdminLog(): Promise<number> {
  await ensureTable();
  return prisma.$executeRawUnsafe(`DELETE FROM "admin_log" WHERE "at" < NOW() - interval '365 days'`);
}
