import { indexResponse } from "@/lib/content/sitemaps";

export const dynamic = "force-static";

// The sitemap index: submit this one address in Search Console
export function GET() {
  return indexResponse();
}
