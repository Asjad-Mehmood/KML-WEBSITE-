import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { ADMIN_EMAIL, isAdminUser } from "@/lib/adminRole";
import { activeSessions, controlOf, rememberRole, setBlocked } from "@/lib/accountControls";
import { logAdmin } from "@/lib/adminLog";
import { isMailConfigured } from "@/lib/mailer";
import { sendPasswordResetEmail } from "@/lib/resetEmail";

// Admin → Surveyors → an account → Controls
// GET                         → blocked or not (why, by whom, when), sessions signed in now, admin or not
// POST { action, reason? }    → block | unblock | signout | reset-email | make-admin | remove-admin
// No admin can block, sign out or demote themselves, and the site's own admin account can't be
// blocked or demoted at all. Every action goes into the Admin log.
type Ctx = { params: Promise<{ id: string }> };
const ACTIONS = ["block", "unblock", "signout", "reset-email", "make-admin", "remove-admin"] as const;
type Action = (typeof ACTIONS)[number];

async function state(userId: string) {
  const [c, sessions] = await Promise.all([controlOf(userId), activeSessions(userId)]);
  return { blocked: c.blocked, reason: c.reason, blockedBy: c.blockedBy, blockedAt: c.blockedAt, sessions };
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const { id } = await params;
  const user = await db.findUserById(id);
  if (!user) return NextResponse.json({ error: "No such account." }, { status: 404 });
  try {
    return NextResponse.json({ success: true, ...(await state(user.id)), isAdmin: isAdminUser(user), self: user.id === admin.user.id, owner: user.email.toLowerCase() === ADMIN_EMAIL });
  } catch (e) {
    console.error("[account controls]", e);
    return NextResponse.json({ error: "Couldn't read the account's controls." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { action?: unknown; reason?: unknown } | null;
  const action = body?.action as Action;
  if (!ACTIONS.includes(action)) return NextResponse.json({ error: "Which action?" }, { status: 400 });
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";

  const user = await db.findUserById(id);
  if (!user) return NextResponse.json({ error: "No such account." }, { status: 404 });
  const self = user.id === admin.user.id;
  const owner = user.email.toLowerCase() === ADMIN_EMAIL;
  if (self && ["block", "signout", "remove-admin"].includes(action)) {
    return NextResponse.json({ error: "You can't do that to your own account." }, { status: 400 });
  }
  if (owner && ["block", "remove-admin"].includes(action)) {
    return NextResponse.json({ error: "The site's own admin account can't be blocked or lose admin." }, { status: 400 });
  }
  const who = `${user.name || "?"} <${user.email}>`;

  try {
    let message = "";
    switch (action) {
      case "block": {
        await setBlocked(user.id, true, reason, admin.user.email);
        const n = await db.deleteUserSessions(user.id);
        message = `${user.email} is blocked and was signed out of ${n} ${n === 1 ? "session" : "sessions"}.`;
        await logAdmin(admin.user, "account.block", who, reason ? `Reason: ${reason}` : "", req);
        break;
      }
      case "unblock":
        await setBlocked(user.id, false, "", admin.user.email);
        message = `${user.email} can sign in again.`;
        await logAdmin(admin.user, "account.unblock", who, "", req);
        break;
      case "signout": {
        const n = await db.deleteUserSessions(user.id);
        message = `${user.email} was signed out of ${n} ${n === 1 ? "session" : "sessions"} (browsers, apps and the Toolkit).`;
        await logAdmin(admin.user, "account.signout", who, `${n} sessions`, req);
        break;
      }
      case "reset-email": {
        if (!isMailConfigured() || !process.env.AUTH_SECRET) {
          return NextResponse.json({ error: "Email isn't set up on the server, so the reset email can't be sent." }, { status: 503 });
        }
        const base = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
        await sendPasswordResetEmail(user, base);
        message = `A reset link went to ${user.email}. It works once, for an hour.`;
        await logAdmin(admin.user, "account.reset-email", who, "", req);
        break;
      }
      case "make-admin": {
        if (isAdminUser(user)) return NextResponse.json({ error: "Already an admin." }, { status: 400 });
        await rememberRole(user.id, user.role || "");
        await db.updateUser(user.id, { role: "ADMIN" });
        message = `${user.email} is now an admin. They see Admin after signing in again.`;
        await logAdmin(admin.user, "account.make-admin", who, `Role was: ${user.role || "none"}`, req);
        break;
      }
      case "remove-admin": {
        if (!isAdminUser(user)) return NextResponse.json({ error: "Not an admin." }, { status: 400 });
        const before = (await controlOf(user.id)).roleBeforeAdmin;
        await db.updateUser(user.id, { role: before && !/admin/i.test(before) ? before : "Surveyor" });
        // their admin sign-in stops now
        await db.deleteUserSessions(user.id);
        message = `${user.email} is no longer an admin and was signed out.`;
        await logAdmin(admin.user, "account.remove-admin", who, "", req);
        break;
      }
    }
    return NextResponse.json({ success: true, message, ...(await state(user.id)), isAdmin: isAdminUser((await db.findUserById(user.id)) ?? user) });
  } catch (e) {
    console.error("[account controls]", action, e);
    return NextResponse.json({ error: "That didn't work. Please try again." }, { status: 500 });
  }
}
