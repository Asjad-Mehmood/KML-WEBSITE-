/**
 * Which of our apps each account opens, on which kind of device and at which version, so the
 * admin's user profile (and the user's own dashboard) can show "Excel to KML 4.2.1 on Windows,
 * last used today". Noted from requests the apps already make (sign-in check, activity, files):
 *
 *  - X-App-Name / X-App-Version / X-App-Platform headers, sent by apps that report themselves
 *    (Traverse & Level does);
 *  - otherwise the request's origin: the Excel to KML Windows program serves its page from
 *    127.0.0.1, the Android app from appassets.androidplatform.net, and the web apps live at
 *    /app and /traverse/app on this site. These don't say their version, so it stays unknown
 *    until a version of the app that reports it is installed.
 *
 * RoadPro and Project Folder Manager never contact the site, so for them (and as a fallback for
 * every program) the last version downloaded is shown instead. The table is created on first use.
 */
import { after, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { RELEASE_APPS, compareVersions, normVersion } from "@/lib/releases";

export type UsageApp = "excel-to-kml" | "traverse";

export interface AppUse {
  app: UsageApp;
  platform: string;
  version: string | null;
  firstSeen: string;
  lastSeen: string;
}

let ready: Promise<void> | null = null;
function ensure(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "app_usage" (
        "userId" TEXT NOT NULL,
        "app" TEXT NOT NULL,
        "platform" TEXT NOT NULL,
        "version" TEXT,
        "userAgent" TEXT,
        "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "app_usage_pkey" PRIMARY KEY ("userId", "app", "platform")
      )`);
      await prisma.$executeRawUnsafe(`DO $$ BEGIN
        ALTER TABLE "app_usage" ADD CONSTRAINT "app_usage_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const PLATFORMS: Record<string, string> = {
  windows: "Windows",
  "windows program": "Windows",
  "windows app": "Windows",
  android: "Android",
  web: "Web",
  "web browser": "Web",
  installed: "Installed app",
  "installed app": "Installed app",
};
const cleanVersion = (v: string | null) => {
  const t = normVersion(v || "").slice(0, 20);
  return /^\d+(\.\d+){0,3}([.-][\w]+)?$/.test(t) ? t : null;
};
const pathOf = (url: string | null) => {
  try {
    return url ? new URL(url).pathname : "";
  } catch {
    return "";
  }
};

/** Which app made this request, from where, and its version if it says; null for the website itself */
export function detectApp(req: NextRequest): { app: UsageApp; platform: string; version: string | null } | null {
  const name = (req.headers.get("x-app-name") || "").trim().toLowerCase();
  const version = cleanVersion(req.headers.get("x-app-version"));
  const platformHeader = (req.headers.get("x-app-platform") || "").trim().toLowerCase();
  if (name === "traverse" || name === "excel-to-kml") {
    return { app: name, platform: PLATFORMS[platformHeader] || "Web", version };
  }

  const origin = req.headers.get("origin") || "";
  const host = req.headers.get("host") || "";
  // the Windows program's page runs on this computer; the site itself in development doesn't count
  if (/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin) && !origin.endsWith(`//${host}`)) {
    return { app: "excel-to-kml", platform: "Windows", version };
  }
  if (origin === "https://appassets.androidplatform.net") return { app: "excel-to-kml", platform: "Android", version };
  // older Excel to KML copies say only which kind of device they are on, when saving a file
  if (platformHeader === "windows") return { app: "excel-to-kml", platform: "Windows", version };

  const ref = pathOf(req.headers.get("referer"));
  if (ref === "/traverse/app" || ref.startsWith("/traverse/app/")) {
    const viaProgram = /[?&]app=1(&|$)/.test(req.headers.get("referer") || "");
    return { app: "traverse", platform: viaProgram ? "Windows" : "Web", version };
  }
  if (ref === "/app" || ref.startsWith("/app/")) return { app: "excel-to-kml", platform: "Web", version };
  return null;
}

// One write per account, app and device every few minutes is plenty; a new version writes at once
const lastWrite = new Map<string, { at: number; version: string | null }>();
const QUIET_MS = 10 * 60_000;

/**
 * Note that this account used an app. The request is read now and the database written after
 * the response has gone, so the app never waits for it. Never throws.
 */
export function trackAppUse(req: NextRequest, userId: string | null | undefined): void {
  if (!userId) return;
  const seen = detectApp(req);
  if (!seen) return;
  const key = `${userId}|${seen.app}|${seen.platform}`;
  const prev = lastWrite.get(key);
  if (prev && Date.now() - prev.at < QUIET_MS && (!seen.version || prev.version === seen.version)) return;
  lastWrite.set(key, { at: Date.now(), version: seen.version ?? prev?.version ?? null });
  if (lastWrite.size > 5000) lastWrite.clear();
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 300) || null;
  after(async () => {
    try {
      await ensure();
      // a request that doesn't say its version keeps the version noted before
      await prisma.$executeRawUnsafe(
        `INSERT INTO "app_usage" ("userId","app","platform","version","userAgent","lastSeen")
         VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
         ON CONFLICT ("userId","app","platform") DO UPDATE SET
           "version" = COALESCE(EXCLUDED."version", "app_usage"."version"),
           "userAgent" = EXCLUDED."userAgent",
           "lastSeen" = CURRENT_TIMESTAMP`,
        userId,
        seen.app,
        seen.platform,
        seen.version,
        userAgent
      );
    } catch (e) {
      console.error("[app-usage]", e);
    }
  });
}

/** Every app and device this account has used, newest first */
export async function appUsageFor(userId: string): Promise<AppUse[]> {
  await ensure();
  const rows = await prisma.$queryRawUnsafe<{ app: UsageApp; platform: string; version: string | null; firstSeen: Date; lastSeen: Date }[]>(
    `SELECT "app","platform","version","firstSeen","lastSeen" FROM "app_usage" WHERE "userId" = $1 ORDER BY "lastSeen" DESC`,
    userId
  );
  return rows.map((r) => ({ ...r, firstSeen: r.firstSeen.toISOString(), lastSeen: r.lastSeen.toISOString() }));
}

// The download records' asset types for each program
const ASSETS: Record<string, string[]> = {
  "excel-to-kml": ["windows_installer"],
  roadpro: ["roadpro"],
  traverse: ["traverse"],
  "folder-manager": ["folder_manager"],
};

export interface ProgramVersions {
  id: string;
  name: string;
  /** the newest version the site offers */
  latest: string;
  /** where and at which version the program was last opened (programs that contact the site) */
  uses: AppUse[];
  /** the last download of the program by this account */
  lastDownload: { version: string; at: string } | null;
  /** "current", "behind", or "unknown" when nothing says which version they have */
  status: "current" | "behind" | "unknown";
  /** the version the status is based on */
  version: string | null;
  /** where that version came from */
  source: "app" | "download" | null;
}

/** Each program with what this account has of it, for the user profile and the dashboard */
export async function programVersionsFor(
  userId: string,
  downloads: { assetType: string; version?: string | null; timestamp: string | Date }[]
): Promise<ProgramVersions[]> {
  const uses = await appUsageFor(userId).catch(() => [] as AppUse[]);
  return RELEASE_APPS.map((a) => {
    const mine = uses.filter((u) => u.app === a.id);
    const dl = downloads
      .filter((d) => ASSETS[a.id]?.includes(d.assetType) && d.version)
      .sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime())[0];
    const lastDownload = dl ? { version: normVersion(String(dl.version)), at: new Date(dl.timestamp).toISOString() } : null;
    // an installed copy that reported its version is the best evidence; then the last download.
    // (The web apps are always the latest, so they don't decide it.)
    const reported = mine.find((u) => u.version && u.platform !== "Web");
    const version = reported?.version ?? lastDownload?.version ?? null;
    const source = reported?.version ? "app" : lastDownload ? "download" : null;
    const status = !version ? "unknown" : compareVersions(version, a.current) >= 0 ? "current" : "behind";
    return { id: a.id, name: a.name, latest: a.current, uses: mine, lastDownload, status, version, source };
  });
}
