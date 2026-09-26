// Public address of the site. exceltokml.com redirects to www.exceltokml.com, so
// www is the canonical host: links, canonicals and the sitemap must use it or
// search engines see every URL as a redirect. NEXT_PUBLIC_SITE_URL can point
// elsewhere (e.g. a staging domain); the bare domain is upgraded to www.
function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.exceltokml.com").trim().replace(/\/+$/, "");
  try {
    const url = new URL(raw);
    if (url.hostname === "exceltokml.com") url.hostname = "www.exceltokml.com";
    return url.origin;
  } catch {
    return "https://www.exceltokml.com";
  }
}

export const SITE_URL = siteUrl();

export const SITE_NAME = "Excel to KML Pro";

export const DEFAULT_TITLE = "Excel to KML Pro — Survey Coordinates to KML, KMZ & DXF";

export const SITE_DESCRIPTION =
  "Convert Excel & CSV survey coordinates on 5,800+ EPSG grids into Google Earth KML, KMZ and DXF, with site photos and PDF reports. Free for Windows and the web.";

export const OG_IMAGE = {
  url: "/assets/hero_geospatial.jpg",
  width: 1200,
  height: 630,
  alt: "Excel to KML Pro converting survey coordinates into Google Earth placemarks",
};

export const GITHUB_REPO_URL = "https://github.com/Asjad-Mehmood/kml-convertor";
export const INSTALLER_URL = `${GITHUB_REPO_URL}/releases/latest/download/ExcelToKMLPro-Lite-Setup.exe`;

/** JSON for a <script type="application/ld+json"> tag, with "<" escaped so it can't close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Open Graph block for a page. Next.js replaces (does not merge) a nested
 * `openGraph` object from the layout, so each page passes the full set.
 */
export function openGraphFor(path: string, title: string, description: string) {
  return {
    type: "website" as const,
    siteName: SITE_NAME,
    locale: "en_US",
    url: path,
    title,
    description,
    images: [OG_IMAGE],
  };
}

/** Public contact for support, privacy and legal questions (Privacy Policy, Terms) */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "exceltokml0@gmail.com";

/** Date shown as "Last updated" on the Privacy Policy and Terms */
export const LEGAL_UPDATED = "26 September 2026";
