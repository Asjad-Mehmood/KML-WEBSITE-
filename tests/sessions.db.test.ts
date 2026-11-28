// Sign-in sessions and the free plan's limit, against a real database. Runs when DATABASE_URL is
// set (e.g. DATABASE_URL=postgresql://kml:kml@localhost/kml npm test); skipped otherwise.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

const live = Boolean(process.env.DATABASE_URL);
const opts = { skip: live ? false : "DATABASE_URL is not set" };

type Db = typeof import("@/lib/db").db;
let db: Db;
let userId = "";
const email = `session-test-${Date.now()}@example.com`;

before(async () => {
  if (!live) return;
  db = (await import("@/lib/db")).db;
  const u = await db.createUser({ name: "Session Test", email, password: "a long password 123" });
  userId = u.id;
});

after(async () => {
  if (!live) return;
  if (userId) await db.deleteUser(userId).catch(() => {});
  const { prisma } = await import("@/lib/db/prisma");
  await prisma.$disconnect();
});

test("a new session signs the account in, and signing out ends it", opts, async () => {
  const s = await db.createSession(userId);
  const v = await db.validateSession(s.token);
  assert.equal(v?.user.id, userId);
  assert.equal(v?.user.email, email);
  await db.destroySession(s.token);
  assert.equal(await db.validateSession(s.token), null);
});

test("an expired session no longer signs in", opts, async () => {
  const { prisma } = await import("@/lib/db/prisma");
  const s = await db.createSession(userId);
  await prisma.session.update({ where: { token: s.token }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal(await db.validateSession(s.token), null);
});

test("unknown and empty tokens sign nobody in", opts, async () => {
  assert.equal(await db.validateSession("not-a-real-token"), null);
  assert.equal(await db.validateSession(""), null);
});

test("signing out everywhere ends every session of the account", opts, async () => {
  const a = await db.createSession(userId);
  const b = await db.createSession(userId);
  await db.deleteUserSessions(userId);
  assert.equal(await db.validateSession(a.token), null);
  assert.equal(await db.validateSession(b.token), null);
});

test("the password is checked, and only the right one passes", opts, async () => {
  const u = await db.findUserByEmail(email);
  assert.ok(u);
  assert.equal(db.verifyPassword(u!, "a long password 123"), true);
  assert.equal(db.verifyPassword(u!, "wrong password"), false);
});

test("with paid plans off, no limit ever stops work", opts, async () => {
  const prev = process.env.BILLING_FORCE_OFF;
  process.env.BILLING_FORCE_OFF = "1";
  try {
    const { checkLimit } = await import("@/lib/billing/billing");
    for (const m of ["monthlyWork", "jobs:kml", "jobs:traverse", "jobs:slope"] as const) {
      assert.deepEqual(await checkLimit({ id: userId, email }, m), { ok: true }, m);
    }
  } finally {
    if (prev === undefined) delete process.env.BILLING_FORCE_OFF;
    else process.env.BILLING_FORCE_OFF = prev;
  }
});
