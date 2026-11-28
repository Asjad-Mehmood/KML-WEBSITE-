// The database layer's shared part: record types, password hashing, the seeded accounts and
// the helpers the repositories in lib/db/ use. Callers import { db } from "@/lib/db".
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ADMIN_EMAIL } from "@/lib/auth/adminRole";

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
  assetType: "windows_installer" | "sample_csv" | "test_kml" | "web_app" | "roadpro" | "traverse" | "folder_manager" | "slope" | "auto_draft" | "toolkit";
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
  userEmail?: string | null;
  fileId?: string | null;
  fileName?: string | null;
  station: string;
  featureCode: string;
  easting: number;
  northing: number;
  elevation: number | null;
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

import type { AppSettings } from "@/lib/admin/adminTypes";
export type { AppSettings };

/** Where a kept file came from: the Excel to KML Windows app, its web app, or Traverse & Level */
export type FilePlatform = "windows_app" | "web_app" | "traverse_app";
export const asPlatform = (p: unknown): FilePlatform => (p === "web_app" || p === "traverse_app" ? p : "windows_app");
/** The apps that keep files in the account, and which platform values are theirs (Admin → Files) */
export const FILE_APP_PLATFORMS: Record<string, FilePlatform[]> = {
  "excel-to-kml": ["windows_app", "web_app"],
  traverse: ["traverse_app"],
};

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
  platform: FilePlatform;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

/** Unguessable throwaway password for accounts that must not be signed into with a known value */
export function randomSecret(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/** Roles that grant admin rights; never accepted from public sign-up */
/** The filter shared by the activity list and its count. */
/** The admin accounts' ids and emails: what they do is in Admin → Admin log, not in Activity */
export async function adminAccounts(): Promise<{ ids: string[]; emails: string[] }> {
  const rows = await prisma.user.findMany({
    where: { OR: [{ role: { in: ["ADMIN", "Super Admin"] } }, { email: { equals: ADMIN_EMAIL, mode: "insensitive" } }] },
    select: { id: true, email: true },
  });
  return { ids: rows.map((r) => r.id), emails: [...new Set([ADMIN_EMAIL, ...rows.map((r) => r.email.toLowerCase())])] };
}

export async function activityWhere(opts: { action?: string; user?: string }) {
  const where: Prisma.ActivityWhereInput = {};
  if (opts.action && opts.action !== "all") where.action = opts.action;
  if (opts.user) {
    // one person's activity: theirs, admin or not
    where.OR = [{ userId: opts.user }, { userEmail: { equals: opts.user, mode: "insensitive" } }];
  } else {
    const admins = await adminAccounts();
    where.AND = [
      { OR: [{ userId: null }, { userId: { notIn: admins.ids } }] },
      { NOT: admins.emails.map((e) => ({ userEmail: { equals: e, mode: "insensitive" as const } })) },
    ];
  }
  return where;
}

/**
 * A point with no level is kept with no elevation (null), not 0. Databases made before
 * that have the column as NOT NULL; loosen it once, the first time points are saved.
 */
let elevationOptional: Promise<void> | null = null;
export function ensureElevationOptional(): Promise<void> {
  if (!elevationOptional) {
    elevationOptional = prisma
      .$executeRawUnsafe(`ALTER TABLE "conversions" ALTER COLUMN "elevation" DROP NOT NULL`)
      .then(() => undefined)
      .catch((err) => {
        elevationOptional = null;
        throw err;
      });
  }
  return elevationOptional;
}

export function isAdminRole(role: string | undefined | null): boolean {
  return /admin/i.test(role ?? "");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/** Map a Prisma User row → our UserRecord interface */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapUser(u: any): UserRecord {
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
export async function seedDefaultUsersIfEmpty(): Promise<void> {
  const count = await prisma.user.count();
  if (count > 0) return;

  // No well-known passwords: the admin gets ADMIN_INITIAL_PASSWORD or a random one
  // (set it afterwards with `npm run set-password`); demo accounts can't sign in.
  const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initialAdminPassword) {
    console.warn("Seeded admin@exceltokml.com with a random password. Set one with: npm run set-password -- admin@exceltokml.com");
  }
  const adminSalt = generateSalt();
  const adminHash = hashPassword(initialAdminPassword || randomSecret(), adminSalt);
  const defaultSalt = generateSalt();
  const defaultHash = hashPassword(randomSecret(), defaultSalt);

  await prisma.user.createMany({
    data: [
      {
        id: "usr_admin_master",
        name: "System Administrator",
        email: "admin@exceltokml.com",
        passwordHash: adminHash,
        salt: adminSalt,
        organization: "SurveyX Digital",
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
        passwordHash: hashPassword(randomSecret(), defaultSalt),
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
