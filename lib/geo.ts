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
  if (req) {
    const vercelCity = req.headers.get("x-vercel-ip-city");
    const vercelCountry = req.headers.get("x-vercel-ip-country");
    const cfCountry = req.headers.get("cf-ipcountry");

    if (vercelCountry || cfCountry) {
      const city = vercelCity ? decodeURIComponent(vercelCity) : "";
      const country = vercelCountry || cfCountry || "Global";
      const location = city ? `${city}, ${country}` : country;

      const edgeResult: GeoLocation = {
        ip: cleanIp,
        location,
        city: city || "Unknown City",
        country,
        countryCode: country.length === 2 ? country.toUpperCase() : "INT",
      };
      ipGeoCache.set(cleanIp, edgeResult);
      return edgeResult;
    }
  }

  // Query free ip-api.com with 2s timeout
  try {
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,regionName,city`, {
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const city = data.city || "";
        const country = data.country || "";
        const countryCode = data.countryCode || "INT";
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

  // Fallback
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
