// The shapes of what the admin pages get from the admin APIs, shared by the pages, their
// components (SurveyorDetailModal, AppTab) and lib/db.ts. Types only, so any page may import them.

/** An account, as the admin lists show it */
export interface UserItem {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
  downloadCount: number;
  ipAddress?: string;
  location?: string;
  hasFullAccess?: boolean;
  customMaxPoints?: number;
  /** confirmed, waiting (signed up but never confirmed: maybe a fake address) or older (before confirmation started) */
  emailState?: "confirmed" | "waiting" | "older";
  blocked?: boolean;
}

/** One download of a program */
export interface DownloadItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  assetType: string;
  fileName: string;
  version: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
}

/** One converted point */
export interface ConversionItem {
  id: string;
  userEmail?: string | null;
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

/** One thing an account did */
export interface UserActivityItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName?: string | null;
  action: string;
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

/** The site's settings (Admin → Settings) */
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

/** The admin dashboard's numbers (/api/admin/stats) */
export interface AdminStats {
  totalUsers: number;
  totalDownloads: number;
  totalConversions: number;
  totalActivities?: number;
  totalPointsProcessed?: number;
  totalPointsKept?: number;
  totalFilesStored?: number;
  totalFilesWithCopy?: number;
  totalStorageBytes?: number;
  /** Traverse & Level jobs: null when their tables could not be read */
  traverse?: { jobs: number; traverses: number; levels: number; accepted: number; rejected: number; surveyors: number } | null;
  /** Slope Calculator: calculations kept in accounts; null when the table could not be read */
  slope?: { jobs: number; surveyors: number } | null;
  roleCounts: Record<string, number>;
  assetCounts: Record<string, number>;
  locationCounts?: Record<string, number>;
  settings: AppSettings;
  recentUsers: UserItem[];
  recentDownloads: DownloadItem[];
  recentConversions: ConversionItem[];
  recentActivities?: UserActivityItem[];
}
