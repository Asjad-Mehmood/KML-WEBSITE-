import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { GRID_PAGES } from "@/lib/gridPages";
import { GUIDES } from "@/lib/guides";

// Public, indexable pages only (the web app and dashboard need a sign-in, so they are left out)
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/convert`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    ...GRID_PAGES.map((g) => ({
      url: `${SITE_URL}/convert/${g.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/guides`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    ...GUIDES.map((g) => ({
      url: `${SITE_URL}/guides/${g.slug}`,
      lastModified: new Date(g.published),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/faq`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
