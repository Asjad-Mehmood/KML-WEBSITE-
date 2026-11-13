import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Which app, on which kind of device and at which version each activity came from, so Admin →
// Activity can show and filter everything across Excel to KML, Traverse & Level, Slope
// Calculator, RoadPro, Project Folder Manager, the Survey Toolkit and the website itself.
// Extra columns on "activities", added on first use (the Prisma model doesn't need them: they are
// written and read with SQL), so no migration:
//   app           excel-to-kml | traverse | slope | roadpro | folder-manager | toolkit | website
//   platform      Web | Windows | Android | Toolkit …
//   appVersion    the app's version when it says
//   errorMessage  what went wrong, for status "error"

export const ACTIVITY_APPS = ["excel-to-kml", "traverse", "slope", "roadpro", "folder-manager", "toolkit", "website"] as const;
export type ActivityApp = (typeof ACTIVITY_APPS)[number];

export interface ActivityTags {
  app?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  errorMessage?: string | null;
}

let ready: Promise<void> | null = null;
export function ensureActivityColumns(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "app" TEXT, ADD COLUMN IF NOT EXISTS "platform" TEXT,
           ADD COLUMN IF NOT EXISTS "appVersion" TEXT, ADD COLUMN IF NOT EXISTS "errorMessage" TEXT`
      );
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "activities_app_timestamp_idx" ON "activities"("app", "timestamp")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "activities_timestamp_idx" ON "activities"("timestamp")`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

const clean = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Notes the app, device and version on an activity just written. Never throws. */
export async function tagActivity(id: string, tags: ActivityTags): Promise<void> {
  const app = clean(tags.app, 40);
  const platform = clean(tags.platform, 40);
  const appVersion = clean(tags.appVersion, 30);
  const errorMessage = clean(tags.errorMessage, 1000);
  if (!app && !platform && !appVersion && !errorMessage) return;
  try {
    await ensureActivityColumns();
    await prisma.$executeRawUnsafe(
      `UPDATE "activities" SET "app" = COALESCE($2, "app"), "platform" = COALESCE($3, "platform"),
         "appVersion" = COALESCE($4, "appVersion"), "errorMessage" = COALESCE($5, "errorMessage") WHERE "id" = $1`,
      id,
      app,
      platform,
      appVersion,
      errorMessage
    );
  } catch (err) {
    console.error("[activity tags] not written:", err);
  }
}

/** The app a request came from (lib/appUsage.ts reads its headers, origin and page), or the website */
export async function appOfRequest(req: NextRequest | null | undefined): Promise<ActivityTags> {
  if (!req) return { app: "website", platform: "Web" };
  // imported here so lib/db.ts (which uses this file) and lib/appUsage.ts (which uses lib/db) don't loop
  const { detectApp } = await import("@/lib/appUsage");
  const seen = detectApp(req);
  const name = (req.headers.get("x-app-name") || "").trim().toLowerCase();
  if (seen) return { app: seen.app, platform: seen.platform, appVersion: seen.version };
  // apps the usage list doesn't know yet, which say who they are
  if (name === "toolkit") return { app: "toolkit", platform: "Windows", appVersion: clean(req.headers.get("x-app-version"), 30) };
  if (name === "folder-manager" || name === "roadpro") return { app: name, platform: "Windows", appVersion: clean(req.headers.get("x-app-version"), 30) };
  return { app: "website", platform: "Web" };
}
