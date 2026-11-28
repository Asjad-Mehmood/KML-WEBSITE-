// Sign-in sessions (part of db, lib/db/index.ts)
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { AccountBlocked, isBlocked } from "@/lib/auth/accountControls";
import { ADMIN_SESSION_PREFIX } from "@/lib/auth/adminHost";
import { mapUser } from "./core";
import type { SessionRecord, UserRecord } from "./core";

export const sessionsRepo = {
  /** opts.admin: a session made on the admin address (lib/adminHost), the only kind with admin rights there */
  async createSession(userId: string, opts: { admin?: boolean } = {}): Promise<SessionRecord> {
    // a blocked account (Admin → Surveyors → Controls) gets no new session, whichever way it signs in
    if (await isBlocked(userId)) throw new AccountBlocked();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const s = await prisma.session.create({
      data: {
        id: (opts.admin ? ADMIN_SESSION_PREFIX : "sess_") + crypto.randomBytes(8).toString("hex"),
        token,
        userId,
        expiresAt,
      },
    });

    return {
      id: s.id,
      token: s.token,
      userId: s.userId,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    };
  },

  async validateSession(token: string): Promise<{ user: UserRecord; session: SessionRecord } | null> {
    if (!token) return null;

    const s = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!s) return null;

    if (s.expiresAt < new Date()) {
      await prisma.session.delete({ where: { token } });
      return null;
    }

    return {
      user: mapUser(s.user),
      session: {
        id: s.id,
        token: s.token,
        userId: s.userId,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      },
    };
  },

  async destroySession(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  },
};
