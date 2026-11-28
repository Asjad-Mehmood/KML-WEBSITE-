// Accounts: finding, creating and changing users, passwords, and the admin helpers (part of db, lib/db/index.ts)
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { isAdminUser } from "@/lib/auth/adminRole";
import { generateSalt, hashPassword, mapUser, randomSecret, seedDefaultUsersIfEmpty } from "./core";
import type { UserRecord } from "./core";

export const usersRepo = {
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    await seedDefaultUsersIfEmpty();
    const u = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return u ? mapUser(u) : null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? mapUser(u) : null;
  },

  async createUser(params: {
    name: string;
    email: string;
    password?: string;
    organization?: string;
    role?: string;
    ipAddress?: string;
    location?: string;
    hasFullAccess?: boolean;
    customMaxPoints?: number;
  }): Promise<UserRecord> {
    const cleanEmail = params.email.trim().toLowerCase();
    const salt = generateSalt();
    const passwordHash = hashPassword(params.password || randomSecret(), salt);

    const u = await prisma.user.create({
      data: {
        id: "usr_" + crypto.randomBytes(8).toString("hex"),
        name: params.name.trim(),
        email: cleanEmail,
        passwordHash,
        salt,
        organization: params.organization?.trim() || "Independent Surveyor",
        role: params.role || "Surveyor",
        downloadCount: 0,
        ipAddress: params.ipAddress,
        location: params.location,
        hasFullAccess: params.hasFullAccess ?? (params.role === "ADMIN"),
        customMaxPoints: params.customMaxPoints,
      },
    });

    return mapUser(u);
  },

  verifyPassword(storedUser: UserRecord, candidatePassword: string): boolean {
    if (!storedUser || !candidatePassword) return false;

    // 1. Cryptographic scrypt comparison
    try {
      const candidateHash = hashPassword(candidatePassword, storedUser.salt);
      const candBuf = Buffer.from(candidateHash, "hex");
      const storedBuf = Buffer.from(storedUser.passwordHash, "hex");
      if (candBuf.length === storedBuf.length && crypto.timingSafeEqual(candBuf, storedBuf)) {
        return true;
      }
    } catch {
      // malformed stored hash
    }

    return false;
  },

  /** Sign a user out everywhere (e.g. after a password reset). */
  async deleteUserSessions(userId: string): Promise<number> {
    const { count } = await prisma.session.deleteMany({ where: { userId } });
    return count;
  },

  async touchUserLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  sanitizeUser(user: UserRecord) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      organization: user.organization,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      downloadCount: user.downloadCount,
      ipAddress: user.ipAddress || null,
      location: user.location || null,
      hasFullAccess: user.hasFullAccess ?? (user.role === "ADMIN"),
      customMaxPoints: user.customMaxPoints || null,
    };
  },

  isAdmin(user: { role?: string; email?: string } | null | undefined): boolean {
    return isAdminUser(user);
  },

  async getAllUsers(query?: string, limit?: number) {
    await seedDefaultUsersIfEmpty();
    const where = query?.trim()
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { organization: { contains: query, mode: "insensitive" as const } },
            { role: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, ...(limit ? { take: limit } : {}) });
    return users.map(mapUser).map(this.sanitizeUser);
  },

  async updateUser(
    id: string,
    updates: Partial<{
      name: string;
      email: string;
      organization: string;
      role: string;
      password?: string;
      hasFullAccess?: boolean;
      customMaxPoints?: number;
    }>
  ): Promise<UserRecord> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (updates.name !== undefined) data.name = updates.name.trim();
    if (updates.email !== undefined) data.email = updates.email.trim().toLowerCase();
    if (updates.organization !== undefined) data.organization = updates.organization.trim();
    if (updates.role !== undefined) data.role = updates.role.trim();
    if (updates.hasFullAccess !== undefined) data.hasFullAccess = updates.hasFullAccess;
    if (updates.customMaxPoints !== undefined) data.customMaxPoints = updates.customMaxPoints;
    if (updates.password?.trim()) {
      data.salt = generateSalt();
      data.passwordHash = hashPassword(updates.password.trim(), data.salt);
    }

    const u = await prisma.user.update({ where: { id }, data });
    return mapUser(u);
  },

  /**
   * A user closing their own account: their files, activity history and
   * conversions go, download records are kept as anonymous counts, and the
   * user row goes last (sessions cascade). All in one transaction.
   */
  async deleteOwnAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const mine = { OR: [{ userId }, { userEmail: user.email.toLowerCase() }] };
    await prisma.$transaction([
      prisma.userFile.deleteMany({ where: mine }),
      prisma.activity.deleteMany({ where: mine }),
      prisma.conversion.deleteMany({ where: { userId } }),
      prisma.download.updateMany({
        where: mine,
        data: { userId: null, userEmail: null, userName: null, ipAddress: null, location: null, userAgent: null },
      }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
  },

  async deleteUser(id: string): Promise<boolean> {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return false;
    if (target.email === "admin@exceltokml.com") {
      throw new Error("Cannot delete master administrator account.");
    }
    await prisma.conversion.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    return true;
  },

  /** Counted in the database: every account, and per role */
  async userCounts(): Promise<{ total: number; byRole: Record<string, number> }> {
    await seedDefaultUsersIfEmpty();
    const [total, roles] = await Promise.all([prisma.user.count(), prisma.user.groupBy({ by: ["role"], _count: { _all: true } })]);
    const byRole: Record<string, number> = {};
    for (const r of roles) {
      const k = r.role || "Surveyor";
      byRole[k] = (byRole[k] || 0) + r._count._all;
    }
    return { total, byRole };
  },
};
