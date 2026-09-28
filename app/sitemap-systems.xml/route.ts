import { systemEntries, urlsetResponse } from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return urlsetResponse(systemEntries());
}
