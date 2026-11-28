import { countryEntries, urlsetResponse } from "@/lib/content/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return urlsetResponse(countryEntries());
}
