// Converted points (Excel to KML) (part of db, lib/db/index.ts)
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { ensureElevationOptional } from "./core";
import type { ConversionRecord } from "./core";

export const conversionsRepo = {
  async recordConversion(entry: {
    userId: string | null;
    station: string;
    featureCode: string;
    easting: number;
    northing: number;
    elevation: number | null;
    coordSystem: string;
    lat: string;
    lon: string;
  }): Promise<ConversionRecord> {
    const c = await prisma.conversion.create({
      data: {
        id: "conv_" + crypto.randomBytes(8).toString("hex"),
        ...entry,
      },
    });
    return {
      id: c.id,
      userId: c.userId,
      station: c.station,
      featureCode: c.featureCode,
      easting: c.easting,
      northing: c.northing,
      elevation: c.elevation,
      coordSystem: c.coordSystem,
      lat: c.lat,
      lon: c.lon,
      timestamp: c.timestamp.toISOString(),
    };
  },

  /**
   * The points of one saved file. Each row's id carries the file it came from
   * (cv_<fileId>_<n>), so points and file stay linked without a schema change,
   * and sending the same points again cannot make duplicates.
   */
  async recordConversions(entry: {
    userId: string;
    fileId: string;
    coordSystem: string;
    offset: number;
    points: {
      station: string;
      featureCode: string;
      easting: number;
      northing: number;
      elevation: number | null;
      lat: string;
      lon: string;
    }[];
  }): Promise<number> {
    await ensureElevationOptional();
    const when = new Date();
    const r = await prisma.conversion.createMany({
      data: entry.points.map((pt, i) => ({
        id: `cv_${entry.fileId}_${entry.offset + i}`,
        userId: entry.userId,
        coordSystem: entry.coordSystem,
        timestamp: when,
        ...pt,
      })),
      skipDuplicates: true,
    });
    return r.count;
  },

  /** Joins each point row to the file it came from and, when asked, to its owner. */
  async withConversionLinks(
    rows: {
      id: string; userId: string | null; station: string; featureCode: string; easting: number;
      northing: number; elevation: number | null; coordSystem: string; lat: string; lon: string; timestamp: Date;
    }[],
    withOwner = false
  ): Promise<ConversionRecord[]> {
    const fileOf = (id: string) => {
      const m = /^cv_(.+)_\d+$/.exec(id);
      return m ? m[1] : null;
    };
    const fileIds = Array.from(new Set(rows.map((c) => fileOf(c.id)).filter((x): x is string => Boolean(x))));
    const files = fileIds.length
      ? await prisma.userFile.findMany({ where: { id: { in: fileIds } }, select: { id: true, fileName: true } })
      : [];
    const names = new Map(files.map((f) => [f.id, f.fileName]));
    let owners = new Map<string, string>();
    if (withOwner) {
      const userIds = Array.from(new Set(rows.map((c) => c.userId).filter((x): x is string => Boolean(x))));
      const users = userIds.length
        ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } })
        : [];
      owners = new Map(users.map((u) => [u.id, u.email]));
    }
    // Newest save first; within a save, the points in the order of the file
    const seq = (id: string) => parseInt(id.slice(id.lastIndexOf("_") + 1), 10) || 0;
    const sorted = [...rows].sort(
      (a, b) =>
        b.timestamp.getTime() - a.timestamp.getTime() ||
        (fileOf(a.id) || "").localeCompare(fileOf(b.id) || "") ||
        seq(a.id) - seq(b.id)
    );
    return sorted.map((c) => {
      const fileId = fileOf(c.id);
      return {
        id: c.id,
        userId: c.userId,
        userEmail: c.userId ? owners.get(c.userId) ?? null : null,
        fileId,
        fileName: fileId ? names.get(fileId) ?? null : null,
        station: c.station,
        featureCode: c.featureCode,
        easting: c.easting,
        northing: c.northing,
        elevation: c.elevation,
        coordSystem: c.coordSystem,
        lat: c.lat,
        lon: c.lon,
        timestamp: c.timestamp.toISOString(),
      };
    });
  },

  async getUserConversions(
    userId: string,
    opts: { fileId?: string; limit?: number } = {}
  ): Promise<{ total: number; conversions: ConversionRecord[] }> {
    const where = opts.fileId ? { userId, id: { startsWith: `cv_${opts.fileId}_` } } : { userId };
    const [total, rows] = await Promise.all([
      prisma.conversion.count({ where }),
      prisma.conversion.findMany({ where, orderBy: [{ timestamp: "desc" }, { id: "asc" }], take: opts.limit ?? 2000 }),
    ]);
    return { total, conversions: await this.withConversionLinks(rows) };
  },

  async deleteUserConversions(userId: string, fileId?: string): Promise<number> {
    const where = fileId ? { userId, id: { startsWith: `cv_${fileId}_` } } : { userId };
    const r = await prisma.conversion.deleteMany({ where });
    return r.count;
  },

  async getAllConversions(limit = 1000): Promise<{ total: number; conversions: ConversionRecord[] }> {
    const [total, rows] = await Promise.all([
      prisma.conversion.count(),
      prisma.conversion.findMany({ orderBy: [{ timestamp: "desc" }, { id: "asc" }], take: limit }),
    ]);
    return { total, conversions: await this.withConversionLinks(rows, true) };
  },

  async clearConversions(): Promise<void> {
    await prisma.conversion.deleteMany({});
  },
};
