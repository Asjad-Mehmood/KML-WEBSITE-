import { NextResponse } from "next/server";
import { DEFAULT_PUBLIC_SETTINGS, readSettings, toPublic } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

// GET: the admin settings every page needs (announcement, maintenance, downloads). Public.
export async function GET() {
  const s = await readSettings();
  return NextResponse.json(
    { success: true, settings: s ? toPublic(s) : DEFAULT_PUBLIC_SETTINGS },
    // a change in the admin page reaches visitors within half a minute
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=30" } }
  );
}
