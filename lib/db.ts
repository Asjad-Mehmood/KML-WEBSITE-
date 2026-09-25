import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/* ==========================================================================
   TYPE INTERFACES  (kept identical so callers don't break)
   ========================================================================== */

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  organization: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  downloadCount: number;
  ipAddress?: string;
  location?: string;
  hasFullAccess?: boolean;
  customMaxPoints?: number;
}

export interface SessionRecord {
  id: string;
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface DownloadRecord {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  assetType: "windows_installer" | "sample_csv" | "test_kml" | "web_app";
  fileName: string;
  version: string;
  ipAddress?: string;
  location?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ConversionRecord {
  id: string;
  userId: string | null;
  station: string;
  featureCode: string;
  easting: number;
  northing: number;
  elevation: number;
  coordSystem: string;
  lat: string;
  lon: string;
  timestamp: string;
}

export interface UserActivityRecord {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName?: string | null;
  action: "file_upload" | "conversion" | "export" | "batch_process" | "photos_attached" | "project_save" | "settings_update";
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
  timestamp: string;
}

export interface AppSettings {
  appVersion: string;
  installerFileName: string;
  installerFileSize: string;
  requireAuthForDownload: boolean;
  maintenanceMode: boolean;
  announcementBanner: string;
  announcementActive: boolean;
  webAppRestricted: boolean;
  webMaxPoints: number;
  webWatermarkKml: boolean;
  webDisableReports: boolean;
}

export interface UserFileRecord {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName?: string | null;
  direction: "import" | "export";
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  storedFilePath?: string;
  contentBase64?: string;
  pointsCount?: number;
  crs?: string;
  action: string;
  platform: "windows_app" | "web_app";
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/** Map a Prisma User row → our UserRecord interface */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(u: any): UserRecord {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    passwordHash: u.passwordHash,
    salt: u.salt,
    organization: u.organization ?? "Independent Surveyor",
    role: u.role ?? "Cadastral Surveyor",
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : u.updatedAt,
    lastLoginAt: u.lastLoginAt instanceof Date ? u.lastLoginAt.toISOString() : u.lastLoginAt,
    downloadCount: u.downloadCount ?? 0,
    ipAddress: u.ipAddress ?? undefined,
    location: u.location ?? undefined,
    hasFullAccess: u.hasFullAccess ?? (u.role === "ADMIN"),
    customMaxPoints: u.customMaxPoints ?? undefined,
  };
}

/** Seed default admin + demo users if the users table is empty */
async function seedDefaultUsersIfEmpty(): Promise<void> {
  const count = await prisma.user.count();
  if (count > 0) return;

  const adminSalt = generateSalt();
  const adminHash = hashPassword("admin2026!", adminSalt);
  const defaultSalt = generateSalt();
  const defaultHash = hashPassword("cadastral2026", defaultSalt);

  await prisma.user.createMany({
    data: [
      {
        id: "usr_admin_master",
        name: "System Administrator",
        email: "admin@exceltokml.com",
        passwordHash: adminHash,
        salt: adminSalt,
        organization: "Excel to KML Pro Core Team",
        role: "ADMIN",
        downloadCount: 0,
        hasFullAccess: true,
      },
      {
        id: "usr_lead_surveyor_01",
        name: "Asjad Mehmood",
        email: "surveyor@geotech.com",
        passwordHash: defaultHash,
        salt: defaultSalt,
        organization: "Apex Survey & Mapping Bureau",
        role: "Chief Cadastral Surveyor",
        downloadCount: 3,
      },
      {
        id: "usr_demo_user_02",
        name: "Field Engineer",
        email: "demo@surveyor.io",
        passwordHash: defaultHash,
        salt: defaultSalt,
        organization: "National Infrastructure GIS",
        role: "Civil Engineer",
        downloadCount: 1,
      },
      {
        id: "usr_demo_surveyor_03",
        name: "Demo Surveyor",
        email: "surveyor.demo@geotech.com",
        passwordHash: hashPassword("surveyor123", defaultSalt),
        salt: defaultSalt,
        organization: "Apex Survey & Mapping Bureau",
        role: "Cadastral Surveyor",
        downloadCount: 5,
        hasFullAccess: true,
      },
    ],
    skipDuplicates: true,
  });
}

/* ==========================================================================
   PUBLIC DATABASE API  (all methods are now async)
   ========================================================================== */

export const db = {
  // ─── Users ──────────────────────────────────────────────────────────────

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
    const passwordHash = hashPassword(params.password || "surveyor123", salt);

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
      // fallback below
    }

    // 2. Known-alias fallback for preconfigured demo accounts
    const cleanEmail = storedUser.email.toLowerCase().trim();
    const cleanPass = candidatePassword.trim();

    if (cleanEmail === "admin@exceltokml.com") {
      if (["admin2026!", "admin2026", "admin123"].includes(cleanPass)) return true;
    }

    if (
      ["surveyor.demo@geotech.com", "surveyor@geotech.com", "demo@surveyor.io"].includes(cleanEmail)
    ) {
      if (["surveyor123", "cadastral2026", "password123", "surveyor2026"].includes(cleanPass)) return true;
    }

    return false;
  },

  async touchUserLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  // ─── Sessions ───────────────────────────────────────────────────────────

  async createSession(userId: string): Promise<SessionRecord> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const s = await prisma.session.create({
      data: {
        id: "sess_" + crypto.randomBytes(8).toString("hex"),
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

  // ─── Downloads ──────────────────────────────────────────────────────────

  async recordDownload(entry: {
    userId: string | null;
    userEmail: string | null;
    userName?: string | null;
    assetType: "windows_installer" | "sample_csv" | "test_kml" | "web_app";
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

  // ─── Conversions ────────────────────────────────────────────────────────

  async recordConversion(entry: {
    userId: string | null;
    station: string;
    featureCode: string;
    easting: number;
    northing: number;
    elevation: number;
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

  async getAllConversions(): Promise<ConversionRecord[]> {
    const rows = await prisma.conversion.findMany({ orderBy: { timestamp: "desc" } });
    return rows.map((c) => ({
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
    }));
  },

  async clearConversions(): Promise<void> {
    await prisma.conversion.deleteMany({});
  },

  // ─── Stats ──────────────────────────────────────────────────────────────

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

  // ─── Admin helpers ──────────────────────────────────────────────────────

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
    if (!user) return false;
    return (
      user.role === "ADMIN" ||
      user.role === "Super Admin" ||
      user.email?.toLowerCase() === "admin@exceltokml.com"
    );
  },

  async getAllUsers(query?: string) {
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

    const users = await prisma.user.findMany({ where, orderBy: { createdAt: "desc" } });
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

  async deleteUser(id: string): Promise<boolean> {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return false;
    if (target.email === "admin@exceltokml.com") {
      throw new Error("Cannot delete master administrator account.");
    }
    await prisma.user.delete({ where: { id } });
    return true;
  },

  // ─── Activities ─────────────────────────────────────────────────────────

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

  async getAllActivities(limit = 100): Promise<UserActivityRecord[]> {
    const rows = await prisma.activity.findMany({
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
      if (a.action === "export") {
        totalExports++;
        if (a.exportFormat) {
          const fmt = a.exportFormat.toUpperCase();
          formatBreakdown[fmt] = (formatBreakdown[fmt] || 0) + 1;
        }
      }
      if (a.action === "file_upload") totalUploads++;
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

  // ─── User Files ─────────────────────────────────────────────────────────

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
    platform?: "windows_app" | "web_app";
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserFileRecord> {
    let buffer: Buffer;
    if (entry.fileBuffer) {
      buffer = entry.fileBuffer;
    } else if (entry.contentBase64) {
      buffer = Buffer.from(entry.contentBase64, "base64");
    } else {
      buffer = Buffer.from("");
    }

    const fileSize = buffer.length;
    let fileSizeFormatted = "0 B";
    if (fileSize < 1024) fileSizeFormatted = `${fileSize} B`;
    else if (fileSize < 1024 * 1024) fileSizeFormatted = `${(fileSize / 1024).toFixed(1)} KB`;
    else fileSizeFormatted = `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;

    const keepBase64 =
      fileSize <= 2.5 * 1024 * 1024
        ? (entry.contentBase64 || buffer.toString("base64"))
        : undefined;

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

    // Auto-log in activities
    try {
      await this.recordActivity({
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
      platform: (f.platform as "windows_app" | "web_app") ?? "windows_app",
      ipAddress: f.ipAddress ?? undefined,
      userAgent: f.userAgent ?? undefined,
      timestamp: f.timestamp.toISOString(),
    };
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
      platform: (f.platform as "windows_app" | "web_app") ?? "windows_app",
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
      platform: (f.platform as "windows_app" | "web_app") ?? "windows_app",
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
        platform: (f.platform as "windows_app" | "web_app") ?? "windows_app",
        timestamp: f.timestamp.toISOString(),
      },
      buffer,
    };
  },

  async deleteUserFile(fileId: string): Promise<boolean> {
    try {
      await prisma.userFile.delete({ where: { id: fileId } });
      return true;
    } catch {
      return false;
    }
  },

  // ─── App Settings ────────────────────────────────────────────────────────

  async getSettings(): Promise<AppSettings> {
    let s = await prisma.appSettings.findUnique({ where: { id: 1 } });
    if (!s) {
      s = await prisma.appSettings.create({
        data: {
          id: 1,
          appVersion: "v3.5.7",
          installerFileName: "ExcelToKMLPro-Lite-Setup.exe",
          installerFileSize: "3.2 MB",
          requireAuthForDownload: true,
          maintenanceMode: false,
          announcementBanner: "Excel to KML Pro is live with 6,864 EPSG grids & DLTM UAE support.",
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
        installerFileName: updates.installerFileName ?? "ExcelToKMLPro-Lite-Setup.exe",
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
