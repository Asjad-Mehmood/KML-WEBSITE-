// Downloads of the programs (part of db, lib/db/index.ts)
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { DownloadRecord } from "./core";

export const downloadsRepo = {
  async recordDownload(entry: {
    userId: string | null;
    userEmail: string | null;
    userName?: string | null;
    assetType: "windows_installer" | "sample_csv" | "test_kml" | "web_app" | "roadpro" | "traverse" | "folder_manager" | "slope" | "auto_draft" | "toolkit";
    fileName: string;
    version: string;
    ipAddress?: string;
    location?: string;
    userAgent?: string;
  }): Promise<DownloadRecord> {
    const d = await prisma.download.create({
      data: {
        id: "dl_" + crypto.randomBytes(8).toString("hex"),
        userId: entry.userId,
        userEmail: entry.userEmail,
        userName: entry.userName || null,
        assetType: entry.assetType,
        fileName: entry.fileName,
        version: entry.version,
        ipAddress: entry.ipAddress,
        location: entry.location,
        userAgent: entry.userAgent,
      },
    });

    // Increment user download count
    if (entry.userId) {
      await prisma.user.update({
        where: { id: entry.userId },
        data: { downloadCount: { increment: 1 } },
      }).catch(() => {});
    }

    return {
      id: d.id,
      userId: d.userId,
      userEmail: d.userEmail,
      userName: d.userName,
      assetType: d.assetType as DownloadRecord["assetType"],
      fileName: d.fileName,
      version: d.version,
      ipAddress: d.ipAddress ?? undefined,
      location: d.location ?? undefined,
      userAgent: d.userAgent ?? undefined,
      timestamp: d.timestamp.toISOString(),
    };
  },

  async getAllDownloads(): Promise<DownloadRecord[]> {
    const rows = await prisma.download.findMany({ orderBy: { timestamp: "desc" } });
    return rows.map((d) => ({
      id: d.id,
      userId: d.userId,
      userEmail: d.userEmail,
      userName: d.userName,
      assetType: d.assetType as DownloadRecord["assetType"],
      fileName: d.fileName,
      version: d.version,
      ipAddress: d.ipAddress ?? undefined,
      location: d.location ?? undefined,
      userAgent: d.userAgent ?? undefined,
      timestamp: d.timestamp.toISOString(),
    }));
  },

  /** One user's own downloads, newest first (for their dashboard). */
  async getUserDownloads(userId: string, limit = 50): Promise<DownloadRecord[]> {
    const rows = await prisma.download.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return rows.map((d) => ({
      id: d.id,
      userId: d.userId,
      userEmail: d.userEmail,
      userName: d.userName,
      assetType: d.assetType as DownloadRecord["assetType"],
      fileName: d.fileName,
      version: d.version,
      timestamp: d.timestamp.toISOString(),
    }));
  },

  async deleteDownload(id: string): Promise<boolean> {
    try {
      await prisma.download.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async clearDownloads(): Promise<void> {
    await prisma.download.deleteMany({});
  },
};
