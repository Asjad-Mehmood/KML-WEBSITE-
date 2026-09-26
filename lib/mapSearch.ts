import proj4 from "proj4";

// Dubai Local TM (EPSG:3997), the grid the showcase map's stations are on
const DLTM = "+proj=tmerc +lat_0=0 +lon_0=55.3333333333333 +k=1 +x_0=500000 +y_0=0 +datum=WGS84 +units=m";

// Area of use of DLTM (EPSG dataset): outside it the grid numbers mean nothing
const DLTM_AREA = { south: 24.85, north: 25.34, west: 54.84, east: 55.55 };

export type CoordinateHit =
  | { kind: "latlng"; lat: number; lng: number }
  | { kind: "dltm"; lat: number; lng: number; easting: number; northing: number };

const NUM = String.raw`[-+]?\d+(?:\.\d+)?`;
const PAIR = new RegExp(`^\\s*(${NUM})\\s*[,;\\s]\\s*(${NUM})\\s*$`);

/**
 * Two numbers typed into the search box:
 * - "25.1972, 55.2744" → latitude, longitude
 * - "494060, 2787900" → Dubai DLTM easting, northing (either order: the
 *   northing is the one in the millions)
 * Returns null for anything else, which is then searched as a place name.
 */
export function parseCoordinates(query: string): CoordinateHit | null {
  const m = PAIR.exec(query.replace(/[°]/g, ""));
  if (!m) return null;
  const a = parseFloat(m[1]);
  const b = parseFloat(m[2]);

  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { kind: "latlng", lat: a, lng: b };

  // DLTM eastings run about 420,000–570,000 m and northings 2,750,000–2,805,000 m
  const [easting, northing] = a > 1_000_000 && b < 1_000_000 ? [b, a] : [a, b];
  if (easting < 100_000 || easting > 900_000 || northing < 2_000_000 || northing > 3_500_000) return null;
  const [lng, lat] = proj4(DLTM, "WGS84", [easting, northing]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { kind: "dltm", lat, lng, easting, northing };
}

/** Dubai DLTM easting/northing for a point, or null outside the grid's area of use. */
export function toDltm(lat: number, lng: number): { easting: number; northing: number } | null {
  if (lat < DLTM_AREA.south || lat > DLTM_AREA.north || lng < DLTM_AREA.west || lng > DLTM_AREA.east) return null;
  const [easting, northing] = proj4("WGS84", DLTM, [lng, lat]);
  return { easting, northing };
}

export interface PlaceHit {
  label: string;
  detail: string;
  lat: number;
  lng: number;
  /** [south, north, west, east] */
  bounds?: [number, number, number, number];
}

let lastPlaceSearch = 0;

/** False when a place search ran less than a second ago (Nominatim's limit). */
export function placeSearchAllowed(): boolean {
  const now = Date.now();
  if (now - lastPlaceSearch < 1100) return false;
  lastPlaceSearch = now;
  return true;
}

/**
 * Place names via OpenStreetMap Nominatim. Its usage policy allows light,
 * user-initiated use (at most one request a second, no autocomplete), so this
 * only runs when the user submits the search.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=" +
    encodeURIComponent(query.trim());
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const rows: { display_name: string; lat: string; lon: string; boundingbox?: string[]; name?: string }[] =
    await res.json();
  return rows.map((r) => {
    const parts = r.display_name.split(", ");
    const label = r.name || parts[0];
    const bb = r.boundingbox?.map(Number);
    return {
      label,
      detail: parts.filter((p) => p !== label).slice(0, 3).join(", "),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      bounds: bb && bb.length === 4 && bb.every(Number.isFinite) ? (bb as [number, number, number, number]) : undefined,
    };
  });
}

export function formatLatLng(lat: number, lng: number): string {
  return `${Math.abs(lat).toFixed(6)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(6)}° ${lng >= 0 ? "E" : "W"}`;
}
