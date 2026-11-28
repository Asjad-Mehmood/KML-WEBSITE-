// Which other addresses may call the API with the visitor's sign-in (cookies). Only the site's own
// addresses do: surveyxdigital.com and exceltokml.com with their subdomains, this deployment's own
// Vercel address, the computer the site runs on while developing, and any listed in CORS_ORIGINS
// (comma separated, e.g. "https://partner.example.com").
//
// Any other origin, the desktop programs' file:// pages ("null") included, still gets an answer
// it can read, but without credentials: the programs send their token in the Authorization
// header, and a browser never attaches the visitor's cookies to such a request.

const OWN_DOMAINS = ["surveyxdigital.com", "exceltokml.com"];

function listed(): string[] {
  const own = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter((h): h is string => Boolean(h))
    .map((h) => `https://${h}`);
  const extra = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return [...own, ...extra];
}

/** True when this origin may make credentialed requests (cookies) to the API */
export function trustedOrigin(origin: string | null | undefined): boolean {
  if (!origin || origin === "null") return false;
  let u: URL;
  try {
    u = new URL(origin);
  } catch {
    return false;
  }
  if (u.origin !== origin.replace(/\/+$/, "")) return false; // an origin has no path, query or user
  const host = u.hostname.toLowerCase();
  if (u.protocol === "https:" && OWN_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return true;
  if ((u.protocol === "http:" || u.protocol === "https:") && (host === "localhost" || host === "127.0.0.1")) return true;
  return listed().includes(u.origin);
}

export const CORS_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
export const CORS_HEADERS =
  "Content-Type, Authorization, X-Requested-With, Accept, X-Admin-Token, X-App-Platform, X-App-Name, X-App-Version";

/** The CORS headers for a request from this origin */
export function corsHeaders(origin: string | null | undefined): Record<string, string> {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Allow-Headers": CORS_HEADERS,
    Vary: "Origin",
  };
  if (trustedOrigin(origin)) {
    h["Access-Control-Allow-Origin"] = origin as string;
    h["Access-Control-Allow-Credentials"] = "true";
  } else {
    h["Access-Control-Allow-Origin"] = "*";
  }
  return h;
}
