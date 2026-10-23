import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Signing in an app window with a short code (Traverse & Level's Windows program): the app asks
 * for a code, the person enters it at exceltokml.com/link in their usual browser, where they are
 * already signed in (Google, email or an admin's email code), and the app picks up a session.
 * Codes last 10 minutes and work once. The app proves it started the link with a secret only it
 * holds (kept here as a hash). The table is created on first use, so no migration is needed.
 */
export const LINK_MINUTES = 10;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

let ready: Promise<void> | null = null;
function ensure(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "device_links" (
        "code" TEXT NOT NULL,
        "pollHash" TEXT NOT NULL,
        "app" TEXT NOT NULL DEFAULT '',
        "ip" TEXT,
        "userAgent" TEXT,
        "userId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "approvedAt" TIMESTAMP(3),
        "usedAt" TIMESTAMP(3),
        CONSTRAINT "device_links_pkey" PRIMARY KEY ("code")
      )`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "device_links_pollHash_idx" ON "device_links"("pollHash")`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
/** "K7PQ-4MXA": what people type; dashes and case don't matter */
export const normCode = (s: unknown) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
export const showCode = (c: string) => `${c.slice(0, 4)}-${c.slice(4)}`;

function newCode(): string {
  const b = crypto.randomBytes(8);
  return Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");
}

/** A new link for an app window; null when this address asked for too many lately. */
export async function startLink(app: string, ip: string | null, userAgent: string | null) {
  await ensure();
  await prisma.$executeRawUnsafe(`DELETE FROM "device_links" WHERE "expiresAt" < NOW() - INTERVAL '1 day'`);
  if (ip) {
    const r = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT COUNT(*) AS n FROM "device_links" WHERE "ip" = $1 AND "createdAt" > NOW() - INTERVAL '1 hour'`, ip
    );
    if (Number(r[0]?.n ?? 0) >= 30) return null;
  }
  const poll = crypto.randomBytes(32).toString("base64url");
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "device_links" ("code","pollHash","app","ip","userAgent","expiresAt")
         VALUES ($1,$2,$3,$4,$5, NOW() + INTERVAL '${LINK_MINUTES} minutes')`,
        code, sha(poll), app.slice(0, 60), ip, (userAgent || "").slice(0, 300)
      );
      return { code: showCode(code), poll, expiresIn: LINK_MINUTES * 60 };
    } catch {
      // the same code twice: try another
    }
  }
  throw new Error("Couldn't make a sign-in code");
}

type LinkRow = { code: string; app: string; userAgent: string | null; userId: string | null; expiresAt: Date; approvedAt: Date | null; usedAt: Date | null; createdAt: Date };

/** A code someone typed at /link: still waiting, not expired. */
export async function findOpen(code: string): Promise<LinkRow | null> {
  await ensure();
  const c = normCode(code);
  if (c.length !== 8) return null;
  const r = await prisma.$queryRawUnsafe<LinkRow[]>(
    `SELECT "code","app","userAgent","userId","expiresAt","approvedAt","usedAt","createdAt" FROM "device_links"
     WHERE "code" = $1 AND "expiresAt" > NOW() AND "usedAt" IS NULL AND "approvedAt" IS NULL`, c
  );
  return r[0] ?? null;
}

/** The signed-in person confirms the code: the app may now sign in as them. */
export async function approve(code: string, userId: string): Promise<boolean> {
  await ensure();
  const n = await prisma.$executeRawUnsafe(
    `UPDATE "device_links" SET "userId" = $2, "approvedAt" = NOW()
     WHERE "code" = $1 AND "expiresAt" > NOW() AND "usedAt" IS NULL AND "approvedAt" IS NULL`,
    normCode(code), userId
  );
  return n === 1;
}

/** The app asks whether its code was confirmed. "approved" hands back the account once. */
export async function poll(secret: string): Promise<{ state: "pending" | "expired" } | { state: "approved"; userId: string; app: string }> {
  await ensure();
  if (typeof secret !== "string" || secret.length < 20 || secret.length > 100) return { state: "expired" };
  const h = sha(secret);
  const r = await prisma.$queryRawUnsafe<LinkRow[]>(
    `SELECT "code","app","userAgent","userId","expiresAt","approvedAt","usedAt","createdAt" FROM "device_links" WHERE "pollHash" = $1`, h
  );
  const row = r[0];
  if (!row || row.usedAt || new Date(row.expiresAt).getTime() < Date.now()) return { state: "expired" };
  if (!row.approvedAt || !row.userId) return { state: "pending" };
  // used once: whoever marks it first gets the session
  const n = await prisma.$executeRawUnsafe(`UPDATE "device_links" SET "usedAt" = NOW() WHERE "pollHash" = $1 AND "usedAt" IS NULL`, h);
  if (n !== 1) return { state: "expired" };
  return { state: "approved", userId: row.userId, app: row.app };
}
