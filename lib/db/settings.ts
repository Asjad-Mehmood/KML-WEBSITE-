// The site's settings (app_settings) (part of db, lib/db/index.ts)
import { prisma } from "@/lib/db/prisma";
import type { AppSettings } from "./core";

export const settingsRepo = {
  async getSettings(): Promise<AppSettings> {
    let s = await prisma.appSettings.findUnique({ where: { id: 1 } });
    if (!s) {
      s = await prisma.appSettings.create({
        data: {
          id: 1,
          appVersion: "v3.5.7",
          installerFileName: "ExcelToKML-Setup.exe",
          installerFileSize: "3.2 MB",
          requireAuthForDownload: true,
          maintenanceMode: false,
          announcementBanner: "Excel to KML is live with 5,800+ EPSG grids, the Qatar National Grid built in.",
          announcementActive: false,
          webAppRestricted: true,
          webMaxPoints: 50,
          webWatermarkKml: true,
          webDisableReports: true,
        },
      });
    }

    return {
      appVersion: s.appVersion,
      installerFileName: s.installerFileName,
      installerFileSize: s.installerFileSize,
      requireAuthForDownload: s.requireAuthForDownload,
      maintenanceMode: s.maintenanceMode,
      announcementBanner: s.announcementBanner,
      announcementActive: s.announcementActive,
      webAppRestricted: s.webAppRestricted,
      webMaxPoints: s.webMaxPoints,
      webWatermarkKml: s.webWatermarkKml,
      webDisableReports: s.webDisableReports,
    };
  },

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const s = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: updates,
      create: {
        id: 1,
        appVersion: updates.appVersion ?? "v3.5.7",
        installerFileName: updates.installerFileName ?? "ExcelToKML-Setup.exe",
        installerFileSize: updates.installerFileSize ?? "3.2 MB",
        requireAuthForDownload: updates.requireAuthForDownload ?? true,
        maintenanceMode: updates.maintenanceMode ?? false,
        announcementBanner: updates.announcementBanner ?? "",
        announcementActive: updates.announcementActive ?? false,
        webAppRestricted: updates.webAppRestricted ?? true,
        webMaxPoints: updates.webMaxPoints ?? 50,
        webWatermarkKml: updates.webWatermarkKml ?? true,
        webDisableReports: updates.webDisableReports ?? true,
      },
    });

    return {
      appVersion: s.appVersion,
      installerFileName: s.installerFileName,
      installerFileSize: s.installerFileSize,
      requireAuthForDownload: s.requireAuthForDownload,
      maintenanceMode: s.maintenanceMode,
      announcementBanner: s.announcementBanner,
      announcementActive: s.announcementActive,
      webAppRestricted: s.webAppRestricted,
      webMaxPoints: s.webMaxPoints,
      webWatermarkKml: s.webWatermarkKml,
      webDisableReports: s.webDisableReports,
    };
  },
};
