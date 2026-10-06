import proj4 from "proj4";

// Qatar National Grid (EPSG:2932, QND95), the grid the showcase map's stations are on
const QNG =
  "+proj=tmerc +lat_0=24.45 +lon_0=51.2166666666667 +k=0.99999 +x_0=200000 +y_0=300000 +ellps=intl " +
  "+towgs84=-119.4248,-303.65872,-11.00061,1.164298,0.174458,1.096259,3.657065 +units=m";

// Area of use of QNG (EPSG dataset): outside it the grid numbers mean nothing
const QNG_AREA = { south: 24.55, north: 26.2, west: 50.69, east: 51.68 };

export type CoordinateHit =
  | { kind: "latlng"; lat: number; lng: number }
  | { kind: "qng"; lat: number; lng: number; easting: number; northing: number };

const NUM = String.raw`[-+]?\d+(?:\.\d+)?`;
const PAIR = new RegExp(`^\\s*(${NUM})\\s*[,;\\s]\\s*(${NUM})\\s*$`);

/**
 * Two numbers typed into the search box:
 * - "25.2867, 51.5332" → latitude, longitude
 * - "231957, 392643" → Qatar National Grid easting, northing (either order: in
 *   Qatar the northing is the larger one)
 * Returns null for anything else, which is then searched as a place name.
 */
export function parseCoordinates(query: string): CoordinateHit | null {
  const m = PAIR.exec(query.replace(/[°]/g, ""));
  if (!m) return null;
  const a = parseFloat(m[1]);
  const b = parseFloat(m[2]);

  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { kind: "latlng", lat: a, lng: b };

  // QNG eastings run about 150,000–270,000 m and northings 310,000–500,000 m
  const [easting, northing] = a > b ? [b, a] : [a, b];
  if (easting < 100_000 || easting > 320_000 || northing < 280_000 || northing > 540_000) return null;
  const [lng, lat] = proj4(QNG, "WGS84", [easting, northing]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { kind: "qng", lat, lng, easting, northing };
}

/** Qatar National Grid easting/northing for a point, or null outside the grid's area of use. */
export function toQng(lat: number, lng: number): { easting: number; northing: number } | null {
  if (lat < QNG_AREA.south || lat > QNG_AREA.north || lng < QNG_AREA.west || lng > QNG_AREA.east) return null;
  const [easting, northing] = proj4("WGS84", QNG, [lng, lat]);
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
