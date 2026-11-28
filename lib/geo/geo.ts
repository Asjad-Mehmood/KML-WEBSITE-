import { NextRequest } from "next/server";

export interface GeoLocation {
  ip: string;
  location: string;
  city: string;
  country: string;
  countryCode: string;
}

// In-memory cache for IP lookups to avoid redundant API calls
const ipGeoCache = new Map<string, GeoLocation>();

let regionNames: Intl.DisplayNames | null = null;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  // fallback if Intl not available
}

/**
 * Convert 2-letter ISO country code to full English country name
 * e.g. "PK" -> "Pakistan", "AE" -> "United Arab Emirates", "US" -> "United States"
 */
export function resolveCountryName(codeOrName: string): string {
  if (!codeOrName) return "Unknown Country";
  const clean = codeOrName.trim();
  if (clean.length === 2 && regionNames) {
    try {
      const resolved = regionNames.of(clean.toUpperCase());
      if (resolved) return resolved;
    } catch {
      // return fallback
    }
  }
  return clean;
}

/**
 * Get country flag emoji from 2-letter code
 * e.g. "PK" -> "🇵🇰", "AE" -> "🇦🇪"
 */
export function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  try {
    return code
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
  } catch {
    return "";
  }
}

/**
 * Format any raw location string (e.g. "PK" or "AE") into a readable location with country name
 */
export function formatLocation(loc?: string | null): string {
  if (!loc || loc.trim() === "") return "Unknown Origin";
  const clean = loc.trim();

  // If it's a 2-letter country code like "PK"
  if (clean.length === 2) {
    const fullName = resolveCountryName(clean);
    const flag = getCountryFlag(clean);
    return flag ? `${flag} ${fullName}` : fullName;
  }

  // If already formatted, return cleaned
  return clean;
}

/**
 * Extract client IP address from Next.js request headers
 */
export function getClientIp(req: Request | NextRequest): string {
  // Check Cloudflare header
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp.trim())) return normalizeIp(cfIp.trim());

  // Check standard real IP
  const realIp = req.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp.trim())) return normalizeIp(realIp.trim());

  // Check X-Forwarded-For (take the first client IP in the chain)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp && isValidIp(firstIp)) return normalizeIp(firstIp);
  }

  // Check True-Client-IP
  const trueClientIp = req.headers.get("true-client-ip");
  if (trueClientIp && isValidIp(trueClientIp.trim())) return normalizeIp(trueClientIp.trim());

  // Check NextRequest ip property
  if ("ip" in req && typeof (req as { ip?: string }).ip === "string" && (req as { ip?: string }).ip) {
    return normalizeIp((req as { ip: string }).ip);
  }

  return "127.0.0.1";
}

function normalizeIp(ip: string): string {
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.substring(7);
  return ip;
}

function isValidIp(ip: string): boolean {
  return typeof ip === "string" && ip.length > 0 && ip !== "unknown";
}

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const parts = ip.split(".");
    if (parts.length >= 2) {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
  }
  if (ip.startsWith("fc00:") || ip.startsWith("fe80:")) return true;
  return false;
}

/**
 * Resolve IP to geographic location (City, Country)
 */
export async function getIpGeoLocation(
  ip: string,
  req?: Request | NextRequest
): Promise<GeoLocation> {
  const cleanIp = normalizeIp(ip);

  // Check cache first
  if (ipGeoCache.has(cleanIp)) {
    return ipGeoCache.get(cleanIp)!;
  }

  // Handle local / private network IPs
  if (isPrivateIp(cleanIp)) {
    const localResult: GeoLocation = {
      ip: cleanIp,
      location: "Localhost (Dev)",
      city: "Localhost",
      country: "Local Network",
      countryCode: "LOC",
    };
    ipGeoCache.set(cleanIp, localResult);
    return localResult;
  }

  // Check CDN headers provided by Vercel or Cloudflare
  let headerCity = "";
  let headerCountryCode = "";

  if (req) {
    const vercelCity = req.headers.get("x-vercel-ip-city");
    const vercelCountry = req.headers.get("x-vercel-ip-country");
    const cfCountry = req.headers.get("cf-ipcountry");

    if (vercelCity) {
      headerCity = decodeURIComponent(vercelCity).trim();
    }
    if (vercelCountry) {
      headerCountryCode = vercelCountry.trim().toUpperCase();
    } else if (cfCountry) {
      headerCountryCode = cfCountry.trim().toUpperCase();
    }
  }

  // If we already have BOTH city and country code from edge headers, use them directly
  if (headerCity && headerCountryCode) {
    const fullCountry = resolveCountryName(headerCountryCode);
    const location = `${headerCity}, ${fullCountry}`;
    const result: GeoLocation = {
      ip: cleanIp,
      location,
      city: headerCity,
      country: fullCountry,
      countryCode: headerCountryCode,
    };
    ipGeoCache.set(cleanIp, result);
    return result;
  }

  // If city is missing from headers (e.g. only "PK" was provided), query ip-api.com to get the exact city!
  try {
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,regionName,city`, {
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const city = data.city || headerCity || "";
        const country = data.country || resolveCountryName(data.countryCode || headerCountryCode);
        const countryCode = data.countryCode || headerCountryCode || "INT";
        const location = city && country ? `${city}, ${country}` : country || city || "Unknown";

        const result: GeoLocation = {
          ip: cleanIp,
          location,
          city: city || "Unknown City",
          country: country || "Unknown Country",
          countryCode,
        };
        ipGeoCache.set(cleanIp, result);
        return result;
      }
    }
  } catch (err) {
    console.warn(`Geo lookup failed for IP ${cleanIp}:`, err);
  }

  // Fallback to header country code if available (convert "PK" to "Pakistan")
  if (headerCountryCode) {
    const fullCountry = resolveCountryName(headerCountryCode);
    const fallbackWithCountry: GeoLocation = {
      ip: cleanIp,
      location: fullCountry,
      city: headerCity || "Unknown City",
      country: fullCountry,
      countryCode: headerCountryCode,
    };
    ipGeoCache.set(cleanIp, fallbackWithCountry);
    return fallbackWithCountry;
  }

  // Final Fallback
  const fallbackResult: GeoLocation = {
    ip: cleanIp,
    location: "Unknown Origin",
    city: "Unknown",
    country: "Unknown",
    countryCode: "UNK",
  };
  ipGeoCache.set(cleanIp, fallbackResult);
  return fallbackResult;
}
