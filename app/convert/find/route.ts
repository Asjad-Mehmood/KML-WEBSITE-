import { NextRequest, NextResponse } from "next/server";
import { GRID_PAGES } from "@/lib/gridPages";
import { systemByCode } from "@/lib/epsgCatalog";

// "Go to EPSG code" box on /convert: send the visitor to that system's page
export function GET(req: NextRequest) {
  const code = Number((req.nextUrl.searchParams.get("code") || "").replace(/^\s*(epsg|esri)\s*:?\s*/i, "").trim());
  const curated = GRID_PAGES.find((g) => g.code === code);
  if (curated) return NextResponse.redirect(new URL(`/convert/${curated.slug}`, req.url));
  if (Number.isInteger(code) && systemByCode(code)) return NextResponse.redirect(new URL(`/convert/epsg/${code}`, req.url));
  return NextResponse.redirect(new URL(`/convert?notfound=1#find`, req.url));
}
