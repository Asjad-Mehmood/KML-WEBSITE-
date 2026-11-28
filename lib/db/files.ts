// Files kept in accounts (the file vault) (part of db, lib/db/index.ts)
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { jobBytes } from "@/lib/account/userJobs";
import { asPlatform } from "./core";
import type { FilePlatform, UserFileRecord } from "./core";
import { activitiesRepo } from "./activities";

export const filesRepo = {
  /**
   * A user's own saved files for their dashboard, matched on user id only.
   * File contents are not loaded; hasContent says whether one can be downloaded.
   */
  async getOwnFileList(userId: string, limit = 500) {
    const [rows, withContent] = await Promise.all([
      prisma.userFile.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: limit,
        select: {
          id: true,
          direction: true,
          fileName: true,
          fileSizeFormatted: true,
          pointsCount: true,
          crs: true,
          platform: true,
          timestamp: true,
        },
      }),
      prisma.userFile.findMany({
        where: { userId, contentBase64: { not: null } },
        select: { id: true },
        take: limit,
      }),
    ]);
    const stored = new Set(withContent.map((r) => r.id));
    return rows.map((r) => ({ ...r, hasContent: stored.has(r.id) }));
  },

  async saveUserFile(entry: {
    userId: string | null;
    userEmail: string | null;
    userName?: string | null;
    direction: "import" | "export";
    fileName: string;
    fileBuffer?: Buffer;
    contentBase64?: string;
    mimeType?: string;
    pointsCount?: number;
    crs?: string;
    action?: string;
    platform?: FilePlatform;
    ipAddress?: string;
    userAgent?: string;
    /** Keep only the name and size: the file was too big to store. */
    metaOnly?: boolean;
    metaSize?: number;
    /** false when the app has already logged this in the activity history. */
    logActivity?: boolean;
  }): Promise<UserFileRecord> {
    let buffer: Buffer;
    if (entry.fileBuffer) {
      buffer = entry.fileBuffer;
    } else if (entry.contentBase64) {
      buffer = Buffer.from(entry.contentBase64, "base64");
    } else {
      buffer = Buffer.from("");
    }

    const fileSize = entry.metaOnly ? Math.max(0, Math.round(entry.metaSize || 0)) : buffer.length;
    let fileSizeFormatted = "0 B";
    if (fileSize < 1024) fileSizeFormatted = `${fileSize} B`;
    else if (fileSize < 1024 * 1024) fileSizeFormatted = `${(fileSize / 1024).toFixed(1)} KB`;
    else fileSizeFormatted = `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;

    // The route has already checked the size against MAX_FILE_BYTES, so the
    // whole file is kept and can always be downloaded again.
    const keepBase64 = entry.metaOnly ? undefined : entry.contentBase64 || buffer.toString("base64");

    const f = await prisma.userFile.create({
      data: {
        id: "file_" + crypto.randomBytes(8).toString("hex"),
        userId: entry.userId,
        userEmail: entry.userEmail,
        userName: entry.userName ?? null,
        direction: entry.direction,
        fileName: entry.fileName,
        fileSize,
        fileSizeFormatted,
        mimeType: entry.mimeType || "application/octet-stream",
        contentBase64: keepBase64,
        pointsCount: entry.pointsCount,
        crs: entry.crs,
        action: entry.action || (entry.direction === "import" ? "file_import" : "file_export"),
        platform: entry.platform || "windows_app",
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });

    // Auto-log in activities, unless the app has logged it already
    if (entry.logActivity !== false) try {
      await activitiesRepo.recordActivity({
        userId: entry.userId,
        userEmail: entry.userEmail,
        userName: entry.userName,
        action: entry.direction === "import" ? "file_upload" : "export",
        title: entry.direction === "import" ? `Imported ${entry.fileName}` : `Exported ${entry.fileName}`,
        fileName: entry.fileName,
        fileSize: fileSizeFormatted,
        pointsCount: entry.pointsCount,
        crs: entry.crs,
        exportFormat:
          entry.direction === "export"
            ? entry.fileName.split(".").pop()?.toUpperCase()
            : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      });
    } catch {
      // ignore
    }

    return {
      id: f.id,
      userId: f.userId,
      userEmail: f.userEmail,
      userName: f.userName ?? null,
      direction: f.direction as "import" | "export",
      fileName: f.fileName,
      fileSize: f.fileSize,
      fileSizeFormatted: f.fileSizeFormatted,
      mimeType: f.mimeType,
      contentBase64: f.contentBase64 ?? undefined,
      pointsCount: f.pointsCount ?? undefined,
      crs: f.crs ?? undefined,
      action: f.action ?? "file_import",
      platform: asPlatform(f.platform),
      ipAddress: f.ipAddress ?? undefined,
      userAgent: f.userAgent ?? undefined,
      timestamp: f.timestamp.toISOString(),
    };
  },

  async countUserFiles(userId: string): Promise<number> {
    return prisma.userFile.count({ where: { userId } });
  },

  async countUserConversions(userId: string): Promise<number> {
    return prisma.conversion.count({ where: { userId } });
  },

  /** Files kept across all accounts, and the bytes of the copies stored. */
  async getFileTotals(): Promise<{ files: number; stored: number; bytes: number }> {
    const [files, agg] = await Promise.all([
      prisma.userFile.count(),
      prisma.userFile.aggregate({ where: { contentBase64: { not: null } }, _count: { _all: true }, _sum: { fileSize: true } }),
    ]);
    return { files, stored: agg._count._all, bytes: agg._sum.fileSize ?? 0 };
  },

  /** Bytes of files and jobs an account keeps, for the storage limit. */
  async getUserStorageBytes(userId: string): Promise<number> {
    const [r, jobs] = await Promise.all([
      prisma.userFile.aggregate({
        where: { userId, contentBase64: { not: null } },
        _sum: { fileSize: true },
      }),
      jobBytes(userId).catch(() => 0),
    ]);
    return (r._sum.fileSize ?? 0) + jobs;
  },

  async getUserFiles(identifier: string, limit = 100): Promise<UserFileRecord[]> {
    const idLower = identifier.trim().toLowerCase();
    const rows = await prisma.userFile.findMany({
      where: { OR: [{ userId: idLower }, { userEmail: idLower }] },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return rows.map((f) => ({
      id: f.id,
      userId: f.userId,
      userEmail: f.userEmail,
      userName: f.userName ?? null,
      direction: f.direction as "import" | "export",
      fileName: f.fileName,
      fileSize: f.fileSize,
      fileSizeFormatted: f.fileSizeFormatted,
      mimeType: f.mimeType,
      contentBase64: f.contentBase64 ?? undefined,
      pointsCount: f.pointsCount ?? undefined,
      crs: f.crs ?? undefined,
      action: f.action ?? "file_import",
      platform: asPlatform(f.platform),
      timestamp: f.timestamp.toISOString(),
    }));
  },

  async getAllFiles(limit = 200, direction?: string): Promise<UserFileRecord[]> {
    const where = direction && direction !== "all" ? { direction } : {};
    const rows = await prisma.userFile.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return rows.map((f) => ({
      id: f.id,
      userId: f.userId,
      userEmail: f.userEmail,
      userName: f.userName ?? null,
      direction: f.direction as "import" | "export",
      fileName: f.fileName,
      fileSize: f.fileSize,
      fileSizeFormatted: f.fileSizeFormatted,
      mimeType: f.mimeType,
      contentBase64: f.contentBase64 ?? undefined,
      pointsCount: f.pointsCount ?? undefined,
      crs: f.crs ?? undefined,
      action: f.action ?? "file_import",
      platform: asPlatform(f.platform),
      timestamp: f.timestamp.toISOString(),
    }));
  },

  async getFileForDownload(fileId: string): Promise<{ record: UserFileRecord; buffer: Buffer } | null> {
    const f = await prisma.userFile.findUnique({ where: { id: fileId } });
    if (!f || !f.contentBase64) return null;

    const buffer = Buffer.from(f.contentBase64, "base64");
    return {
      record: {
        id: f.id,
        userId: f.userId,
        userEmail: f.userEmail,
        userName: f.userName ?? null,
        direction: f.direction as "import" | "export",
        fileName: f.fileName,
        fileSize: f.fileSize,
        fileSizeFormatted: f.fileSizeFormatted,
        mimeType: f.mimeType,
        action: f.action ?? "file_import",
        platform: asPlatform(f.platform),
        timestamp: f.timestamp.toISOString(),
      },
      buffer,
    };
  },

  async deleteUserFile(fileId: string): Promise<boolean> {
    try {
      await prisma.conversion.deleteMany({ where: { id: { startsWith: `cv_${fileId}_` } } });
      await prisma.userFile.delete({ where: { id: fileId } });
      return true;
    } catch {
      return false;
    }
  },
};
