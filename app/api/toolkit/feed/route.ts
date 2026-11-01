import { NextResponse } from "next/server";
import { toolkitFeed } from "@/lib/toolkit/feed";

// Survey Toolkit (beta test): the five tools' latest versions, downloads and SHA-256 sums, and how
// each is installed (lib/toolkit/feed.ts). Public: everything in it is already on the product pages.
export async function GET() {
  try {
    return NextResponse.json(await toolkitFeed(), {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch (e) {
    console.error("[toolkit feed]", e);
    return NextResponse.json({ error: "The tool list can't be read just now." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
