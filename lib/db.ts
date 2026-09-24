import fs from "fs";
import path from "path";
import crypto from "crypto";

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

export interface AppSettings {
  appVersion: string;
  installerFileName: string;
  installerFileSize: string;
  requireAuthForDownload: boolean;
  maintenanceMode: boolean;
  announcementBanner: string;
  announcementActive: boolean;
}

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  downloads: DownloadRecord[];
  conversions: ConversionRecord[];
  settings: AppSettings;
  meta: {
    createdAt: string;
    version: string;
    totalDownloadsCount: number;
  };
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "surveyor_db.json");

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
    settings: {
      appVersion: "v3.5.5",
      installerFileName: "ExcelToKMLPro-Lite-Setup.exe",
      installerFileSize: "3.2 MB",
      requireAuthForDownload: true,
      maintenanceMode: false,
      announcementBanner: "Excel to KML Pro v3.5.5 is live with 6,864 EPSG grids & DLTM UAE support.",
      announcementActive: false,
    },
    meta: {
      createdAt: new Date().toISOString(),
      version: "1.0.0",
      totalDownloadsCount: 1420, // Historical community total
    },
  };
}

let cachedDb: DatabaseSchema | null = null;

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      cachedDb = initial;
      return initial;
    }

    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const initial = getInitialData();

    if (!parsed.settings) {
      parsed.settings = initial.settings;
    }
    if (!parsed.users.some((u: UserRecord) => u.email === "admin@exceltokml.com" || u.role === "ADMIN")) {
      parsed.users.unshift(initial.users[0]);
    }
    cachedDb = parsed;
    return cachedDb!;
  } catch (err) {
    console.error("Database read error, using fallback memory state", err);
    if (!cachedDb) {
      cachedDb = getInitialData();
    }
    return cachedDb;
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
    cachedDb = data;
  } catch (err) {
    console.error("Database write error", err);
    cachedDb = data;
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
