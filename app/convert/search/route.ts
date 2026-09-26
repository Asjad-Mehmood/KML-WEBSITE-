import { NextRequest, NextResponse } from "next/server";
import { searchGrids } from "@/lib/gridSearch";

// Search box on the /convert pages: top matching grids for ?q=
export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").slice(0, 100);
  return NextResponse.json(
    { results: searchGrids(q, 10) },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
  );
}
