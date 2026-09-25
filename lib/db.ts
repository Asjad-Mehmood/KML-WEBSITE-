import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

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

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  downloads: DownloadRecord[];
  conversions: ConversionRecord[];
  activities: UserActivityRecord[];
  files: UserFileRecord[];
  settings: AppSettings;
  meta: {
    createdAt: string;
    version: string;
    totalDownloadsCount: number;
  };
}


function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function getInitialData(): DatabaseSchema {
  const defaultSalt = generateSalt();
  const defaultHash = hashPassword("cadastral2026", defaultSalt);
  const adminSalt = generateSalt();
  const adminHash = hashPassword("admin2026!", adminSalt);

  return {
    users: [
      {
        id: "usr_admin_master",
        name: "System Administrator",
        email: "admin@exceltokml.com",
        passwordHash: adminHash,
        salt: adminSalt,
        organization: "Excel to KML Pro Core Team",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        downloadCount: 0,
      },
      {
        id: "usr_lead_surveyor_01",
        name: "Asjad Mehmood",
        email: "surveyor@geotech.com",
        passwordHash: defaultHash,
        salt: defaultSalt,
        organization: "Apex Survey & Mapping Bureau",
        role: "Chief Cadastral Surveyor",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        downloadCount: 1,
      },
    ],
    sessions: [],
    downloads: [
      {
        id: "dl_sample_init_01",
        userId: "usr_lead_surveyor_01",
        userEmail: "surveyor@geotech.com",
        userName: "Asjad Mehmood",
        assetType: "windows_installer",
        fileName: "ExcelToKMLPro-Lite-Setup.exe",
        version: "v3.5.5",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    conversions: [],
    activities: [],
    files: [],
    settings: {
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
    meta: {
      createdAt: new Date().toISOString(),
      version: "1.0.0",
      totalDownloadsCount: 1420, // Historical community total
    },
  };
}

const globalForDb = globalThis as unknown as {
  __surveyor_db_cached?: DatabaseSchema;
};

let resolvedDbFile: string | null = null;
let resolvedDataDir: string | null = null;
let storageMode: "file" | "memory" = "file";

function isDirectoryWritable(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      return false;
    }
    fs.accessSync(dirPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function getStoragePaths(): { dataDir: string; dbFile: string; isMemory: boolean } {
  if (resolvedDbFile && resolvedDataDir) {
    return { dataDir: resolvedDataDir, dbFile: resolvedDbFile, isMemory: storageMode === "memory" };
  }

  const cwd = typeof process.cwd === "function" ? process.cwd() : "";
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    Boolean(process.env.NEXT_RUNTIME) ||
    cwd.startsWith("/var/task") ||
    cwd.startsWith("/var/") ||
    cwd.startsWith("/opt/");

  const candidates: string[] = [];

  if (process.env.DATA_DIR) {
    candidates.push(process.env.DATA_DIR);
  }

  // In serverless environments, /var/task is read-only; os.tmpdir() (/tmp) is the only writable directory
  if (isServerless) {
    candidates.push(path.join(os.tmpdir(), "exceltokml_data"));
  } else {
    // Only attempt process.cwd()/.data if cwd is verified writable and not in /var
    if (cwd && !cwd.startsWith("/var/") && isDirectoryWritable(cwd)) {
      candidates.push(path.join(cwd, ".data"));
    }
    candidates.push(path.join(os.tmpdir(), "exceltokml_data"));
  }

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Verify directory is truly writable
      const probeFile = path.join(dir, `.probe_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      fs.writeFileSync(probeFile, "probe", "utf-8");
      fs.unlinkSync(probeFile);

      resolvedDataDir = dir;
      resolvedDbFile = path.join(dir, "surveyor_db.json");
      storageMode = "file";
      return { dataDir: resolvedDataDir, dbFile: resolvedDbFile, isMemory: false };
    } catch {
      continue;
    }
  }

  // Graceful fallback to in-memory mode if no writable directory is available
  storageMode = "memory";
  resolvedDataDir = path.join(os.tmpdir(), "exceltokml_data");
  resolvedDbFile = path.join(os.tmpdir(), "exceltokml_data", "surveyor_db.json");
  return { dataDir: resolvedDataDir, dbFile: resolvedDbFile, isMemory: true };
}

function readDb(): DatabaseSchema {
  const { dataDir, dbFile, isMemory } = getStoragePaths();

  if (isMemory) {
    if (!globalForDb.__surveyor_db_cached) {
      globalForDb.__surveyor_db_cached = getInitialData();
    }
    return globalForDb.__surveyor_db_cached;
  }

  try {
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        storageMode = "memory";
        if (!globalForDb.__surveyor_db_cached) {
          globalForDb.__surveyor_db_cached = getInitialData();
        }
        return globalForDb.__surveyor_db_cached;
      }
    }

    if (!fs.existsSync(dbFile)) {
      // Check if a pre-populated surveyor_db.json is bundled in the deployment root
      let initial: DatabaseSchema = getInitialData();
      try {
        const bundledDbPath = path.join(process.cwd(), ".data", "surveyor_db.json");
        if (fs.existsSync(bundledDbPath)) {
          const raw = fs.readFileSync(bundledDbPath, "utf-8");
          initial = JSON.parse(raw);
        }
      } catch {
        initial = getInitialData();
      }

      try {
        fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), "utf-8");
      } catch {
        // Fallback to in-memory caching if write fails
        storageMode = "memory";
      }
      globalForDb.__surveyor_db_cached = initial;
      return initial;
    }

    const raw = fs.readFileSync(dbFile, "utf-8");
    const parsed = JSON.parse(raw);
    const initial = getInitialData();

    if (!parsed.activities) {
      parsed.activities = [];
    }
    if (!parsed.files) {
      parsed.files = [];
    }
    if (!parsed.settings) {
      parsed.settings = initial.settings;
    }
    if (parsed.settings.webAppRestricted === undefined) {
      parsed.settings.webAppRestricted = true;
      parsed.settings.webMaxPoints = parsed.settings.webMaxPoints || 50;
      parsed.settings.webWatermarkKml = parsed.settings.webWatermarkKml ?? true;
      parsed.settings.webDisableReports = parsed.settings.webDisableReports ?? true;
    }
    if (!parsed.users.some((u: UserRecord) => u.email === "admin@exceltokml.com" || u.role === "ADMIN")) {
      parsed.users.unshift(initial.users[0]);
    }
    globalForDb.__surveyor_db_cached = parsed;
    return parsed;
  } catch (err) {
    if (!globalForDb.__surveyor_db_cached) {
      globalForDb.__surveyor_db_cached = getInitialData();
    }
    return globalForDb.__surveyor_db_cached;
  }
}

function writeDb(data: DatabaseSchema): void {
  globalForDb.__surveyor_db_cached = data;
  const { dataDir, dbFile, isMemory } = getStoragePaths();

  if (isMemory) {
    return;
  }

  try {
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        storageMode = "memory";
        return;
      }
    }
    const tempFile = `${dbFile}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, dbFile);
  } catch {
    storageMode = "memory";
  }
}

/* ==========================================================================
   PUBLIC DATABASE API
   ========================================================================== */

export const db = {
  // Find User by email
  findUserByEmail(email: string): UserRecord | null {
    const data = readDb();
    const cleanEmail = email.trim().toLowerCase();
    return data.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  // Find User by ID
  findUserById(id: string): UserRecord | null {
    const data = readDb();
    return data.users.find((u) => u.id === id) || null;
  },

  // Create User
  createUser(params: {
    name: string;
    email: string;
    password?: string;
    organization?: string;
    role?: string;
    ipAddress?: string;
    location?: string;
    hasFullAccess?: boolean;
    customMaxPoints?: number;
  }): UserRecord {
    const data = readDb();
    const cleanEmail = params.email.trim().toLowerCase();

    const existing = data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(params.password || "surveyor123", salt);

    const newUser: UserRecord = {
      id: "usr_" + crypto.randomBytes(8).toString("hex"),
      name: params.name.trim(),
      email: cleanEmail,
      passwordHash,
      salt,
      organization: params.organization?.trim() || "Independent Surveyor",
      role: params.role || "Surveyor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      downloadCount: 0,
      ipAddress: params.ipAddress,
      location: params.location,
      hasFullAccess: params.hasFullAccess ?? (params.role === "ADMIN"),
      customMaxPoints: params.customMaxPoints,
    };

    data.users.push(newUser);
    writeDb(data);
    return newUser;
  },

  // Verify password
  verifyPassword(storedUser: UserRecord, candidatePassword: string): boolean {
    const candidateHash = hashPassword(candidatePassword, storedUser.salt);
    return crypto.timingSafeEqual(
      Buffer.from(candidateHash, "hex"),
      Buffer.from(storedUser.passwordHash, "hex")
    );
  },

  // Update user last login
  touchUserLogin(userId: string): void {
    const data = readDb();
    const user = data.users.find((u) => u.id === userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      writeDb(data);
    }
  },

  // Create Session
  createSession(userId: string): SessionRecord {
    const data = readDb();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const session: SessionRecord = {
      id: "sess_" + crypto.randomBytes(8).toString("hex"),
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    data.sessions.push(session);
    writeDb(data);
    return session;
  },

  // Validate Session Token
  validateSession(token: string): { user: UserRecord; session: SessionRecord } | null {
    if (!token) return null;
    const data = readDb();
    const session = data.sessions.find((s) => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      // Expired: prune it
      data.sessions = data.sessions.filter((s) => s.token !== token);
      writeDb(data);
      return null;
    }

    const user = data.users.find((u) => u.id === session.userId);
    if (!user) return null;

    return { user, session };
  },

  // Invalidate Session
  destroySession(token: string): void {
    const data = readDb();
    data.sessions = data.sessions.filter((s) => s.token !== token);
    writeDb(data);
  },

  // Record Download Event (Gate logging)
  recordDownload(entry: {
    userId: string | null;
    userEmail: string | null;
    userName?: string | null;
    assetType: "windows_installer" | "sample_csv" | "test_kml" | "web_app";
    fileName: string;
    version: string;
    ipAddress?: string;
    location?: string;
    userAgent?: string;
  }): DownloadRecord {
    const data = readDb();
    const record: DownloadRecord = {
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
      timestamp: new Date().toISOString(),
    };

    data.downloads.push(record);
    data.meta.totalDownloadsCount = (data.meta.totalDownloadsCount || 0) + 1;

    // Increment user download count if user exists
    if (entry.userId) {
      const u = data.users.find((user) => user.id === entry.userId);
      if (u) {
        u.downloadCount = (u.downloadCount || 0) + 1;
      }
    }

    writeDb(data);
    return record;
  },

  // Record Conversion
  recordConversion(entry: {
    userId: string | null;
    station: string;
    featureCode: string;
    easting: number;
    northing: number;
    elevation: number;
    coordSystem: string;
    lat: string;
    lon: string;
  }): ConversionRecord {
    const data = readDb();
    const record: ConversionRecord = {
      id: "conv_" + crypto.randomBytes(8).toString("hex"),
      ...entry,
      timestamp: new Date().toISOString(),
    };
    data.conversions.push(record);
    // Keep max 200 conversions in history
    if (data.conversions.length > 200) {
      data.conversions = data.conversions.slice(-200);
    }
    writeDb(data);
    return record;
  },

  // Get Community / System Stats
  getStats() {
    const data = readDb();
    return {
      totalRegisteredUsers: data.users.length,
      totalDownloads: data.meta.totalDownloadsCount + data.downloads.length,
      recentDownloads: data.downloads.slice(-10).reverse(),
      totalConversions: data.conversions.length,
    };
  },

  // Sanitize user for public/API return (exclude hash and salt)
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

  /* --------------------------------------------------------------------------
     ADMIN SPECIFIC OPERATIONS
     -------------------------------------------------------------------------- */

  // Check if a user record or object has admin privileges
  isAdmin(user: { role?: string; email?: string } | null | undefined): boolean {
    if (!user) return false;
    return (
      user.role === "ADMIN" ||
      user.role === "Super Admin" ||
      user.email?.toLowerCase() === "admin@exceltokml.com"
    );
  },

  // Get all users with optional search query
  getAllUsers(query?: string) {
    const data = readDb();
    let list = data.users;
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.organization && u.organization.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q))
      );
    }
    return list.map(this.sanitizeUser);
  },

  // Update user by ID
  updateUser(
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
  ): UserRecord {
    const data = readDb();
    const userIndex = data.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error("User not found");
    }

    const user = data.users[userIndex];

    if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      const duplicate = data.users.find(
        (u) => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase()
      );
      if (duplicate) {
        throw new Error("Another user already exists with this email address.");
      }
      user.email = updates.email.trim().toLowerCase();
    }

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.organization !== undefined) user.organization = updates.organization.trim();
    if (updates.role !== undefined) user.role = updates.role.trim();
    if (updates.hasFullAccess !== undefined) user.hasFullAccess = updates.hasFullAccess;
    if (updates.customMaxPoints !== undefined) user.customMaxPoints = updates.customMaxPoints;

    if (updates.password && updates.password.trim()) {
      user.salt = generateSalt();
      user.passwordHash = hashPassword(updates.password.trim(), user.salt);
    }

    user.updatedAt = new Date().toISOString();
    data.users[userIndex] = user;
    writeDb(data);
    return user;
  },

  // Delete user by ID
  deleteUser(id: string): boolean {
    const data = readDb();
    const target = data.users.find((u) => u.id === id);
    if (!target) return false;

    // Prevent deletion of master admin
    if (target.email === "admin@exceltokml.com") {
      throw new Error("Cannot delete master administrator account.");
    }

    data.users = data.users.filter((u) => u.id !== id);
    data.sessions = data.sessions.filter((s) => s.userId !== id);
    writeDb(data);
    return true;
  },

  // Get all downloads
  getAllDownloads() {
    const data = readDb();
    return [...data.downloads].reverse();
  },

  // Delete single download record
  deleteDownload(id: string): boolean {
    const data = readDb();
    const initialLen = data.downloads.length;
    data.downloads = data.downloads.filter((d) => d.id !== id);
    if (data.downloads.length !== initialLen) {
      writeDb(data);
      return true;
    }
    return false;
  },

  // Clear all download records
  clearDownloads(): void {
    const data = readDb();
    data.downloads = [];
    writeDb(data);
  },

  // Get all conversions
  getAllConversions() {
    const data = readDb();
    return [...data.conversions].reverse();
  },

  // Clear all conversions
  clearConversions(): void {
    const data = readDb();
    data.conversions = [];
    writeDb(data);
  },

  // Get app settings
  getSettings(): AppSettings {
    const data = readDb();
    return data.settings;
  },


  // Record user activity / telemetry event
  recordActivity(entry: {
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
  }): UserActivityRecord {
    const data = readDb();
    if (!data.activities) data.activities = [];

    const record: UserActivityRecord = {
      id: "act_" + crypto.randomBytes(8).toString("hex"),
      ...entry,
      status: entry.status || "success",
      timestamp: new Date().toISOString(),
    };

    data.activities.push(record);
    // Keep max 2,000 activities in database
    if (data.activities.length > 2000) {
      data.activities = data.activities.slice(-2000);
    }
    writeDb(data);
    return record;
  },

  // Get user activity feed
  getUserActivities(identifier: string, limit = 50): UserActivityRecord[] {
    const data = readDb();
    if (!data.activities) return [];
    const idLower = identifier.trim().toLowerCase();
    const userActs = data.activities.filter(
      (a) =>
        (a.userId && a.userId.toLowerCase() === idLower) ||
        (a.userEmail && a.userEmail.toLowerCase() === idLower)
    );
    return userActs.slice(-limit).reverse();
  },

  // Get aggregated user statistics
  getUserStats(identifier: string) {
    const data = readDb();
    if (!data.activities) {
      return {
        totalConversions: 0,
        totalPointsProcessed: 0,
        totalExports: 0,
        totalUploads: 0,
        formatBreakdown: {},
        topCrs: "WGS84",
        lastActive: null,
      };
    }

    const idLower = identifier.trim().toLowerCase();
    const userActs = data.activities.filter(
      (a) =>
        (a.userId && a.userId.toLowerCase() === idLower) ||
        (a.userEmail && a.userEmail.toLowerCase() === idLower)
    );

    let totalConversions = 0;
    let totalPointsProcessed = 0;
    let totalExports = 0;
    let totalUploads = 0;
    const formatBreakdown: Record<string, number> = {};
    const crsMap: Record<string, number> = {};
    let lastActive: string | null = null;

    for (const a of userActs) {
      if (!lastActive || new Date(a.timestamp) > new Date(lastActive)) {
        lastActive = a.timestamp;
      }
      if (a.action === "conversion") {
        totalConversions++;
      }
      if (a.action === "export") {
        totalExports++;
        if (a.exportFormat) {
          const fmt = a.exportFormat.toUpperCase();
          formatBreakdown[fmt] = (formatBreakdown[fmt] || 0) + 1;
        }
      }
      if (a.action === "file_upload") {
        totalUploads++;
      }
      if (a.pointsCount && typeof a.pointsCount === "number") {
        totalPointsProcessed += a.pointsCount;
      }
      if (a.crs && a.crs.trim()) {
        const c = a.crs.trim();
        crsMap[c] = (crsMap[c] || 0) + 1;
      }
    }

    let topCrs = "WGS84 / UTM";
    let maxCrsCount = 0;
    for (const [crsName, count] of Object.entries(crsMap)) {
      if (count > maxCrsCount) {
        maxCrsCount = count;
        topCrs = crsName;
      }
    }

    return {
      totalConversions,
      totalPointsProcessed,
      totalExports,
      totalUploads,
      formatBreakdown,
      topCrs,
      lastActive,
      totalActivities: userActs.length,
    };
  },

  // Get all activities (for admin portal)
  getAllActivities(limit = 100): UserActivityRecord[] {
    const data = readDb();
    if (!data.activities) return [];
    return [...data.activities].slice(-limit).reverse();
  },

  // Clear activities
  clearActivities(userId?: string): void {
    const data = readDb();
    if (!userId) {
      data.activities = [];
    } else {
      const idLower = userId.trim().toLowerCase();
      data.activities = (data.activities || []).filter(
        (a) => a.userId?.toLowerCase() !== idLower && a.userEmail?.toLowerCase() !== idLower
      );
    }
    writeDb(data);
  },

  // Save an imported or exported user file
  saveUserFile(entry: {
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
  }): UserFileRecord {
    const data = readDb();
    if (!data.files) data.files = [];

    const fileId = "file_" + crypto.randomBytes(8).toString("hex");
    const sanitizedName = (entry.fileName || "unnamed_file").replace(/[^a-zA-Z0-9._-]/g, "_");

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

    // Save to disk in user_files/ directory
    let storedFilePath: string | undefined = undefined;
    try {
      const { dataDir } = getStoragePaths();
      const filesDir = path.join(dataDir, "user_files");
      if (!fs.existsSync(filesDir)) {
        fs.mkdirSync(filesDir, { recursive: true });
      }
      const diskPath = path.join(filesDir, `${fileId}_${sanitizedName}`);
      fs.writeFileSync(diskPath, buffer);
      storedFilePath = diskPath;
    } catch (e) {
      console.warn("Could not write user file to disk:", e);
    }

    // Keep base64 in record if <= 2.5MB so it survives serverless recycles
    const keepBase64 = fileSize <= 2.5 * 1024 * 1024 ? (entry.contentBase64 || buffer.toString("base64")) : undefined;

    const record: UserFileRecord = {
      id: fileId,
      userId: entry.userId || null,
      userEmail: entry.userEmail || null,
      userName: entry.userName || null,
      direction: entry.direction,
      fileName: entry.fileName,
      fileSize,
      fileSizeFormatted,
      mimeType: entry.mimeType || "application/octet-stream",
      storedFilePath,
      contentBase64: keepBase64,
      pointsCount: entry.pointsCount,
      crs: entry.crs,
      action: entry.action || (entry.direction === "import" ? "file_import" : "file_export"),
      platform: entry.platform || "windows_app",
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      timestamp: new Date().toISOString(),
    };

    data.files.push(record);
    // Keep max 1,000 files metadata
    if (data.files.length > 1000) {
      data.files = data.files.slice(-1000);
    }
    writeDb(data);

    // Also automatically log in activities feed
    try {
      this.recordActivity({
        userId: entry.userId,
        userEmail: entry.userEmail,
        userName: entry.userName,
        action: entry.direction === "import" ? "file_upload" : "export",
        title: entry.direction === "import" ? `Imported ${entry.fileName}` : `Exported ${entry.fileName}`,
        fileName: entry.fileName,
        fileSize: fileSizeFormatted,
        pointsCount: entry.pointsCount,
        crs: entry.crs,
        exportFormat: entry.direction === "export" ? path.extname(entry.fileName).replace(".", "").toUpperCase() : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      });
    } catch {
      // ignore
    }

    return record;
  },

  // Get user files list
  getUserFiles(identifier: string, limit = 100): UserFileRecord[] {
    const data = readDb();
    if (!data.files) return [];
    const idLower = identifier.trim().toLowerCase();
    const list = data.files.filter(
      (f) =>
        (f.userId && f.userId.toLowerCase() === idLower) ||
        (f.userEmail && f.userEmail.toLowerCase() === idLower)
    );
    return list.slice(-limit).reverse();
  },

  // Get all files across all users (for admin)
  getAllFiles(limit = 200, direction?: string): UserFileRecord[] {
    const data = readDb();
    if (!data.files) return [];
    let list = [...data.files];
    if (direction && direction !== "all") {
      list = list.filter((f) => f.direction === direction);
    }
    return list.slice(-limit).reverse();
  },

  // Get file for download
  getFileForDownload(fileId: string): { record: UserFileRecord; buffer: Buffer } | null {
    const data = readDb();
    if (!data.files) return null;
    const record = data.files.find((f) => f.id === fileId);
    if (!record) return null;

    let buffer: Buffer | null = null;

    // 1. Try reading from stored path
    if (record.storedFilePath && fs.existsSync(record.storedFilePath)) {
      try {
        buffer = fs.readFileSync(record.storedFilePath);
      } catch {
        // fallback
      }
    }

    // 2. Try disk with standard convention
    if (!buffer) {
      try {
        const { dataDir } = getStoragePaths();
        const filesDir = path.join(dataDir, "user_files");
        const sanitizedName = record.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const candidate = path.join(filesDir, `${record.id}_${sanitizedName}`);
        if (fs.existsSync(candidate)) {
          buffer = fs.readFileSync(candidate);
        }
      } catch {
        // fallback
      }
    }

    // 3. Fallback to base64
    if (!buffer && record.contentBase64) {
      buffer = Buffer.from(record.contentBase64, "base64");
    }

    if (!buffer) return null;
    return { record, buffer };
  },

  // Delete a user file
  deleteUserFile(fileId: string): boolean {
    const data = readDb();
    if (!data.files) return false;
    const target = data.files.find((f) => f.id === fileId);
    if (!target) return false;

    if (target.storedFilePath && fs.existsSync(target.storedFilePath)) {
      try {
        fs.unlinkSync(target.storedFilePath);
      } catch {
        // ignore
      }
    }

    data.files = data.files.filter((f) => f.id !== fileId);
    writeDb(data);
    return true;
  },

  // Update app settings
  updateSettings(updates: Partial<AppSettings>): AppSettings {
    const data = readDb();
    data.settings = {
      ...data.settings,
      ...updates,
    };
    writeDb(data);
    return data.settings;
  },
};
