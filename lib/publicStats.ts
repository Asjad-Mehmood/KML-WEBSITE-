// Real numbers for the home page ("Used in 32 countries", "Downloaded 150+ times"), so a
// first-time visitor sees that other people use the programs. Counted from the database; the
// page is rebuilt every few minutes (app/page.tsx), so this runs rarely.
import { prisma } from "@/lib/prisma";
import type { PublicStats } from "@/lib/publicCounts";

export type { PublicStats };

// Seeded and staff accounts that aren't real users
const NOT_USERS = ["admin@exceltokml.com", "surveyor@geotech.com", "demo@surveyor.io", "surveyor.demo@geotech.com"];
const PROGRAM_FILES = ["windows_installer", "roadpro", "traverse", "folder_manager"];

/** The country at the end of a stored location ("Lahore, Pakistan" → "Pakistan"); null when unknown */
export function countryOf(location: string | null | undefined): string | null {
  const last = (location || "").split(",").pop()?.trim() || "";
  if (!last || /^(unknown|localhost)/i.test(last) || /\(dev\)/i.test(last)) return null;
  return last;
}

export async function publicStats(): Promise<PublicStats | null> {
  try {
    const [accounts, downloads, places] = await Promise.all([
      prisma.user.count({ where: { email: { notIn: NOT_USERS }, role: { not: "ADMIN" } } }),
      prisma.download.count({ where: { assetType: { in: PROGRAM_FILES } } }),
      prisma.user.findMany({ where: { location: { not: null } }, select: { location: true }, distinct: ["location"] }),
    ]);
    const countries = new Set(places.map((p) => countryOf(p.location)).filter(Boolean)).size;
    return { accounts, downloads, countries };
  } catch (err) {
    console.error("Couldn't count the public stats:", err);
    return null;
  }
}
