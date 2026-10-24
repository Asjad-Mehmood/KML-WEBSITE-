import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Sign-in and register stay crawlable so search engines can read their noindex tag. Blocked:
// API routes; addresses that only redirect (grid search, account pages that send signed-out
// visitors to sign in, ?next= sign-in links, installer links that go on to GitHub), which
// otherwise fill Search Console with "Page with redirect" and "Redirect error". /admin is not
// listed: to anyone but a signed-in admin it is an ordinary "page not found".
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/convert/find",
          "/convert/search",
          "/dashboard",
          "/link",
          "/app-signin",
          "/welcome",
          "/unsubscribe",
          "/download/thanks",
          "/*?next=",
          "/*&next=",
          "/*.exe$",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
