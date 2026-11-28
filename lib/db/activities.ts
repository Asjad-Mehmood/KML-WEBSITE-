// What accounts did (the activity log) (part of db, lib/db/index.ts)
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { activityWhere } from "./core";
import type { UserActivityRecord } from "./core";

export const activitiesRepo = {
  /**
   * A user's own activity for their dashboard. Matched on the verified user id
   * only (not email), newest first, without request metadata.
   */
  async getOwnActivities(userId: string, limit = 1000) {
    return prisma.activity.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        title: true,
        details: true,
        fileName: true,
        pointsCount: true,
        crs: true,
        exportFormat: true,
        status: true,
        timestamp: true,
      },
    });
  },

  async recordActivity(entry: {
    userId: string | null;
    userEmail: string | null;
    userName?: string | null;
    action: UserActivityRecord["action"];
    title: string;
    details?: string;
    fileName?: string;
    fileSize?: string;
    pointsCount?: number;
    linesCount?: number;
    polygonsCount?: number;
    crs?: string;
    exportFormat?: string;
    photosCount?: number;
    durationMs?: number;
    status?: "success" | "warning" | "error";
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserActivityRecord> {
    const a = await prisma.activity.create({
      data: {
        id: "act_" + crypto.randomBytes(8).toString("hex"),
        userId: entry.userId,
        userEmail: entry.userEmail,
        userName: entry.userName ?? null,
        action: entry.action,
        title: entry.title,
        details: entry.details,
        fileName: entry.fileName,
        fileSize: entry.fileSize,
        pointsCount: entry.pointsCount,
        linesCount: entry.linesCount,
        polygonsCount: entry.polygonsCount,
        crs: entry.crs,
        exportFormat: entry.exportFormat,
        photosCount: entry.photosCount,
        durationMs: entry.durationMs,
        status: entry.status || "success",
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });

    return {
      id: a.id,
      userId: a.userId,
      userEmail: a.userEmail,
      userName: a.userName ?? null,
      action: a.action as UserActivityRecord["action"],
      title: a.title,
      details: a.details ?? undefined,
      fileName: a.fileName ?? undefined,
      fileSize: a.fileSize ?? undefined,
      pointsCount: a.pointsCount ?? undefined,
      linesCount: a.linesCount ?? undefined,
      polygonsCount: a.polygonsCount ?? undefined,
      crs: a.crs ?? undefined,
      exportFormat: a.exportFormat ?? undefined,
      photosCount: a.photosCount ?? undefined,
      durationMs: a.durationMs ?? undefined,
      status: (a.status as UserActivityRecord["status"]) ?? "success",
      ipAddress: a.ipAddress ?? undefined,
      userAgent: a.userAgent ?? undefined,
      timestamp: a.timestamp.toISOString(),
    };
  },

  async getUserActivities(identifier: string, limit = 50): Promise<UserActivityRecord[]> {
    const idLower = identifier.trim().toLowerCase();
    const rows = await prisma.activity.findMany({
      where: {
        OR: [
          { userId: idLower },
          { userEmail: idLower },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return rows.map((a) => ({
      id: a.id,
      userId: a.userId,
      userEmail: a.userEmail,
      userName: a.userName ?? null,
      action: a.action as UserActivityRecord["action"],
      title: a.title,
      details: a.details ?? undefined,
      fileName: a.fileName ?? undefined,
      fileSize: a.fileSize ?? undefined,
      pointsCount: a.pointsCount ?? undefined,
      crs: a.crs ?? undefined,
      exportFormat: a.exportFormat ?? undefined,
      status: (a.status as UserActivityRecord["status"]) ?? "success",
      ipAddress: a.ipAddress ?? undefined,
      userAgent: a.userAgent ?? undefined,
      timestamp: a.timestamp.toISOString(),
    }));
  },

  /** Newest first. action / user (id or email) filter in the database, before the limit. */
  async countActivities(opts: { action?: string; user?: string } = {}): Promise<number> {
    return prisma.activity.count({ where: await activityWhere(opts) });
  },

  async getAllActivities(
    limit = 100,
    opts: { action?: string; user?: string; skip?: number } = {}
  ): Promise<UserActivityRecord[]> {
    const rows = await prisma.activity.findMany({
      where: await activityWhere(opts),
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: opts.skip || 0,
    });

    return rows.map((a) => ({
      id: a.id,
      userId: a.userId,
      userEmail: a.userEmail,
      userName: a.userName ?? null,
      action: a.action as UserActivityRecord["action"],
      title: a.title,
      details: a.details ?? undefined,
      fileName: a.fileName ?? undefined,
      fileSize: a.fileSize ?? undefined,
      pointsCount: a.pointsCount ?? undefined,
      crs: a.crs ?? undefined,
      exportFormat: a.exportFormat ?? undefined,
      status: (a.status as UserActivityRecord["status"]) ?? "success",
      timestamp: a.timestamp.toISOString(),
    }));
  },

  async getUserStats(identifier: string) {
    const idLower = identifier.trim().toLowerCase();
    const acts = await prisma.activity.findMany({
      where: { OR: [{ userId: idLower }, { userEmail: idLower }] },
      orderBy: { timestamp: "desc" },
    });

    let totalConversions = 0, totalPointsProcessed = 0, totalExports = 0, totalUploads = 0;
    const formatBreakdown: Record<string, number> = {};
    const crsMap: Record<string, number> = {};
    let lastActive: string | null = null;

    for (const a of acts) {
      const ts = a.timestamp.toISOString();
      if (!lastActive || ts > lastActive) lastActive = ts;
      if (a.action === "conversion") totalConversions++;
      if (a.action === "export" || a.action === "tl_export") {
        totalExports++;
        if (a.exportFormat) {
          const fmt = a.exportFormat.toUpperCase();
          formatBreakdown[fmt] = (formatBreakdown[fmt] || 0) + 1;
        }
      }
      if (a.action === "file_upload" || a.action === "tl_import") totalUploads++;
      if (a.pointsCount) totalPointsProcessed += a.pointsCount;
      if (a.crs?.trim()) {
        const c = a.crs.trim();
        crsMap[c] = (crsMap[c] || 0) + 1;
      }
    }

    let topCrs = "WGS84 / UTM";
    let maxCrsCount = 0;
    for (const [crsName, count] of Object.entries(crsMap)) {
      if (count > maxCrsCount) { maxCrsCount = count; topCrs = crsName; }
    }

    return { totalConversions, totalPointsProcessed, totalExports, totalUploads, formatBreakdown, topCrs, lastActive, totalActivities: acts.length };
  },

  async clearActivities(userId?: string): Promise<void> {
    if (!userId) {
      await prisma.activity.deleteMany({});
    } else {
      const idLower = userId.trim().toLowerCase();
      await prisma.activity.deleteMany({
        where: { OR: [{ userId: idLower }, { userEmail: idLower }] },
      });
    }
  },

  /** Every point counted in the activity log */
  async totalPointsProcessed(): Promise<number> {
    const r = await prisma.activity.aggregate({ _sum: { pointsCount: true } });
    return r._sum.pointsCount ?? 0;
  },
};
