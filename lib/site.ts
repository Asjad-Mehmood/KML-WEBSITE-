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

export const SITE_NAME = "Excel to KML";

export const DEFAULT_TITLE = "Excel to KML — Survey Coordinates to KML, KMZ & DXF";

export const SITE_DESCRIPTION =
  "Convert Excel & CSV survey coordinates on 5,800+ EPSG grids into Google Earth KML, KMZ and DXF, with site photos and PDF reports. Free for Windows and the web.";

export const OG_IMAGE = {
  url: "/assets/og-image.png",
  width: 1200,
  height: 630,
  alt: "Excel to KML: convert geospatial coordinate tables into Google Earth KML, KMZ and DXF",
};

/**
 * The public releases repository: downloads and release notes only. The program's code is in
 * the private repository Asjad-Mehmood/kml-convertor-src; each release is published here, and
 * installed copies update from here.
 */
/** The newest release, shown until the live release details load. */
export const LATEST_VERSION = "v4.2.1";

export const GITHUB_REPO_URL = "https://github.com/Asjad-Mehmood/kml-convertor";

// The official Facebook Page (SurveyX Digital). Linked from the footer and
// listed in the site's structured data, so Facebook and Google can tie
// exceltokml.com to the Page. NEXT_PUBLIC_FACEBOOK_URL in Vercel overrides it;
// only a facebook.com address is accepted.
export const FACEBOOK_URL = (() => {
  const raw = (process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/RealAm025/").trim();
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && /^(www\.|m\.|web\.)?facebook\.com$/.test(u.hostname) && u.pathname.length > 1
      ? `https://www.facebook.com${u.pathname.replace(/\/+$/, "")}${u.search}`
      : "";
  } catch {
    return "";
  }
})();

// The SurveyX Digital Page's numeric ID, sent as <meta property="fb:pages"> so
// Facebook knows which Page is the official one for exceltokml.com
export const FACEBOOK_PAGE_ID = "302259400276782";

// Meta's domain verification code (FACEBOOK_DOMAIN_VERIFICATION in Vercel):
// the content="…" part of the meta tag Meta Business Suite gives you.
export const FACEBOOK_DOMAIN_VERIFICATION = (process.env.FACEBOOK_DOMAIN_VERIFICATION || "").trim().replace(/[^A-Za-z0-9]/g, "");
/** The latest release, read by the home page for its version, size and SHA-256. */
export const RELEASES_API_URL = "https://api.github.com/repos/Asjad-Mehmood/kml-convertor/releases/latest";
/** The Windows installer's name since 4.3.1. */
export const INSTALLER_NAME = "ExcelToKML-Setup.exe";
/**
 * Its name before 4.3.1. Every release still carries the installer under this name too, for
 * older versions' automatic updates, so a link to it always works — before and after 4.3.1.
 */
export const LEGACY_INSTALLER_NAME = "ExcelToKMLPro-Lite-Setup.exe";
/** A link to the latest installer that always works; pages that ask GitHub use the new name. */
export const INSTALLER_URL = `${GITHUB_REPO_URL}/releases/latest/download/${LEGACY_INSTALLER_NAME}`;

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

/** Date shown as "Last updated" on the Terms (they now cover every program on the site) */
export const LEGAL_UPDATED = "24 October 2026";
/** Date shown as "Last updated" on the Privacy Policy (Traverse & Level jobs, reviews) */
export const PRIVACY_UPDATED = "24 October 2026";
