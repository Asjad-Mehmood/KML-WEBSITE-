// The site's totals (part of db, lib/db/index.ts)
import { prisma } from "@/lib/prisma";
import type { DownloadRecord } from "./core";

export const statsRepo = {
  async getStats() {
    const [totalRegisteredUsers, totalDownloads, totalConversions, recentDownloads] = await Promise.all([
      prisma.user.count(),
      prisma.download.count(),
      prisma.conversion.count(),
      prisma.download.findMany({ orderBy: { timestamp: "desc" }, take: 10 }),
    ]);

    return {
      totalRegisteredUsers,
      totalDownloads,
      totalConversions,
      recentDownloads: recentDownloads.map((d) => ({
        id: d.id,
        userId: d.userId,
        userEmail: d.userEmail,
        userName: d.userName,
        assetType: d.assetType as DownloadRecord["assetType"],
        fileName: d.fileName,
        version: d.version,
        timestamp: d.timestamp.toISOString(),
      })),
    };
  },
};
