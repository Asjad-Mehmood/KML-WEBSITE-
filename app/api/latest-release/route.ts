import { NextResponse } from "next/server";
import { latestRelease } from "@/lib/latestReleaseServer";

// The latest Excel to KML release for the download buttons and page (lib/useLatestRelease.ts):
// GitHub's release details with the installer's SHA-256 always filled in
export async function GET() {
  const release = await latestRelease().catch((err) => {
    console.error("Couldn't read the latest release:", err);
    return null;
  });
  if (!release) return NextResponse.json({ error: "The release can't be read just now." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(release, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
}
