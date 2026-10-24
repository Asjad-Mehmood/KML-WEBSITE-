// Sitemaps, split by how much each group of pages matters. Google indexes a
// site that is mostly thousands of near-identical pages slowly, so the pages
// that matter most sit in their own small sitemap that is easy to submit and
// to watch in Search Console.
import { SITE_URL } from "@/lib/site";
import { GRID_PAGES } from "@/lib/gridPages";
import { GUIDES } from "@/lib/guides";
import { TOOLS } from "@/lib/tools";
import { PRODUCTS } from "@/lib/products";
import { BIG_COUNTRY, allSystems, countries, countryRegions } from "@/lib/epsgCatalog";

// Update this when the pages' content really changes. A date that changes on
// every request makes Google ignore lastmod for the whole site.
const CONTENT_UPDATED = "2026-10-24";

export interface Entry {
  path: string;
  lastmod?: string;
  freq: "weekly" | "monthly" | "yearly";
  priority: number;
}

const page = (path: string, priority: number, freq: Entry["freq"] = "monthly", lastmod = CONTENT_UPDATED): Entry => ({
  path,
  lastmod,
  freq,
  priority,
});

/** The pages that matter most: home, main pages, tools, guides, hand-written grid pages */
export function priorityEntries(): Entry[] {
  return [
    page("", 1, "weekly"),
    page("/download", 0.9),
    page("/features", 0.9),
    page("/tutorial", 0.9),
    ...PRODUCTS.map((p) => page(p.href, 0.9)),
    page("/how-it-works", 0.8),
    page("/formats", 0.8),
    page("/faq", 0.8),
    page("/tools", 0.8),
    page("/convert", 0.8),
    page("/guides", 0.8),
    page("/whats-new", 0.7, "weekly"),
    page("/about", 0.6),
    page("/contact", 0.5),
    ...TOOLS.map((t) => page(`/tools/${t.slug}`, 0.8)),
    ...GRID_PAGES.map((g) => page(`/convert/${g.slug}`, 0.8)),
    ...GUIDES.map((g) => page(`/guides/${g.slug}`, 0.7, "monthly", g.published)),
    page("/privacy", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
  ];
}

/** One page per country, and per region for countries with many systems */
export function countryEntries(): Entry[] {
  return [
    ...countries().map((c) => page(`/convert/country/${c.slug}`, 0.6)),
    ...countries()
      .filter((c) => c.count > BIG_COUNTRY)
      .flatMap((c) => countryRegions(c.slug).map((r) => page(`/convert/country/${c.slug}/${r.slug}`, 0.5))),
  ];
}

/** Every remaining EPSG system (those with a hand-written page redirect there) */
export function systemEntries(): Entry[] {
  return allSystems()
    .filter((s) => !GRID_PAGES.some((g) => g.code === s.code))
    .map((s) => page(`/convert/epsg/${s.code}`, 0.4, "yearly"));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const xml = (body: string) =>
  new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });

export function urlsetResponse(entries: Entry[]) {
  const urls = entries
    .map(
      (e) =>
        `<url><loc>${esc(SITE_URL + e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}<changefreq>${e.freq}</changefreq><priority>${e.priority}</priority></url>`
    )
    .join("");
  return xml(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
}

export const SITEMAP_FILES = ["sitemap-priority.xml", "sitemap-countries.xml", "sitemap-systems.xml"];

export function indexResponse() {
  const items = SITEMAP_FILES.map((f) => `<sitemap><loc>${SITE_URL}/${f}</loc><lastmod>${CONTENT_UPDATED}</lastmod></sitemap>`).join("");
  return xml(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`);
}
