import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Sign-in, account and web-app pages stay crawlable so search engines can read
// their noindex tag; only API routes are blocked. /admin is not listed: to
// anyone but a signed-in admin it is an ordinary "page not found".
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
