import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Sign-in, account and web-app pages stay crawlable so search engines can read
// their noindex tag; only API routes and the admin area are blocked.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
