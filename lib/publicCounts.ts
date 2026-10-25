// The home page's public counts: the shape and the "1,200+" rounding, safe for the browser.
// They are counted on the server by lib/publicStats.ts.

export interface PublicStats {
  /** accounts, not counting admin and demo accounts */
  accounts: number;
  /** downloads of our programs (installers, plug-ins and zips) */
  downloads: number;
  /** countries the accounts signed up from */
  countries: number;
}

/** A count rounded down to a friendly "1,200+" (exact below 100) */
export function roundedCount(n: number): string {
  if (n < 100) return String(n);
  const step = n < 1000 ? 50 : n < 10000 ? 100 : 1000;
  return `${(Math.floor(n / step) * step).toLocaleString("en-US")}+`;
}
