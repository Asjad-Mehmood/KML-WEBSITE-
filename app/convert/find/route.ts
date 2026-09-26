import { NextRequest, NextResponse } from "next/server";
import { GRID_PAGES } from "@/lib/gridPages";
import { systemByCode } from "@/lib/epsgCatalog";
import { searchGrids } from "@/lib/gridSearch";

// Grid search box on /convert (when submitted without picking a suggestion):
// a code goes straight to that system's page, a name to the best match.
export function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("q") ?? req.nextUrl.searchParams.get("code") ?? "").slice(0, 100);
  const code = Number(raw.replace(/^\s*(epsg|esri)\s*:?\s*/i, "").trim());
  const curated = GRID_PAGES.find((g) => g.code === code);
  if (curated) return NextResponse.redirect(new URL(`/convert/${curated.slug}`, req.url));
  if (Number.isInteger(code) && systemByCode(code)) return NextResponse.redirect(new URL(`/convert/epsg/${code}`, req.url));
  const [best] = searchGrids(raw, 1);
  if (best) return NextResponse.redirect(new URL(best.href, req.url));
  return NextResponse.redirect(new URL(`/convert?notfound=1#find`, req.url));
}
