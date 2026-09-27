// The maths behind the free tools at /tools. Pure functions, no React, so they can be tested
// on their own. Everything is on WGS 84 unless a function says otherwise.
import proj4 from "proj4";

/* ───────────────────────── degrees, minutes, seconds ───────────────────────── */

/**
 * A coordinate typed as decimal degrees or as degrees, minutes and seconds, as decimal degrees.
 * Reads 25.193, -25.193, 25°11'35.1"N, N 25°11'35.1", 25 11 35.1 N, 25°11.585'N, 25d11m35s N,
 * 25:11:35.1. S and W (or a leading minus) make it negative. null when it can't be read.
 */
export function parseDms(input: string): number | null {
  let t = String(input ?? "")
    .trim()
    .replace(/[′’´`]/g, "'")
    .replace(/[″”“]|''/g, '"')
    .replace(/,/g, ".")
    .toUpperCase();
  if (!t) return null;
  let hemi = "";
  const lead = t.match(/^([NSEW])\s*/);
  if (lead) {
    hemi = lead[1];
    t = t.slice(lead[0].length);
  }
  const tail = t.match(/\s*([NSEW])$/);
  // "25D11M35S": that S is seconds, not south
  if (tail && tail[1] === "S" && /\d\s*M\s*\d+(\.\d+)?\s*S$/.test(t)) {
    t = t.slice(0, -1);
  } else if (tail) {
    if (hemi) return null;
    hemi = tail[1];
    t = t.slice(0, t.length - tail[0].length);
  }
  let sign = 1;
  if (/^[+-]/.test(t)) {
    if (t[0] === "-") sign = -1;
    if (hemi) return null;
    t = t.slice(1).trim();
  }
  if (/^\d+(\.\d+)?$/.test(t)) {
    const v = parseFloat(t);
    return finish(v, sign, hemi);
  }
  const m = t.match(
    /^(\d+(?:\.\d+)?)\s*(?:°|º|D|:|\s)\s*(?:(\d+(?:\.\d+)?)\s*(?:'|M|:|\s)?\s*(?:(\d+(?:\.\d+)?)\s*(?:"|S)?)?)?$/
  );
  if (!m) return null;
  const d = parseFloat(m[1]);
  const mi = m[2] ? parseFloat(m[2]) : 0;
  const s = m[3] ? parseFloat(m[3]) : 0;
  if (mi >= 60 || s >= 60) return null;
  if (m[3] && m[2] && m[2].includes(".")) return null; // decimal minutes followed by seconds
  if (m[2] && m[1].includes(".")) return null; // decimal degrees followed by minutes
  return finish(d + mi / 60 + s / 3600, sign, hemi);
}

function finish(v: number, sign: number, hemi: string): number | null {
  if (!Number.isFinite(v)) return null;
  const neg = sign < 0 || hemi === "S" || hemi === "W";
  return neg ? -v : v;
}

/** Decimal degrees as 25°11'35.10" N. `kind` picks N/S or E/W; none gives a signed value. */
export function formatDms(deg: number, kind?: "lat" | "lon", secDecimals = 2): string {
  const a = Math.abs(deg);
  let d = Math.floor(a);
  let m = Math.floor((a - d) * 60);
  let s = (a - d - m / 60) * 3600;
  // 59.9999" rounds up to 60.00": carry it
  if (Number(s.toFixed(secDecimals)) >= 60) {
    s = 0;
    m += 1;
  }
  if (m >= 60) {
    m = 0;
    d += 1;
  }
  const body = `${d}°${String(m).padStart(2, "0")}'${s.toFixed(secDecimals).padStart(secDecimals ? secDecimals + 3 : 2, "0")}"`;
  if (!kind) return (deg < 0 ? "-" : "") + body;
  const h = kind === "lat" ? (deg < 0 ? "S" : "N") : deg < 0 ? "W" : "E";
  return `${body} ${h}`;
}

/** Decimal degrees as degrees and decimal minutes, the way handheld GPS units show them: 25°11.5848' N. */
export function formatDdm(deg: number, kind?: "lat" | "lon", minDecimals = 4): string {
  const a = Math.abs(deg);
  let d = Math.floor(a);
  let m = (a - d) * 60;
  if (Number(m.toFixed(minDecimals)) >= 60) {
    m = 0;
    d += 1;
  }
  const body = `${d}°${m.toFixed(minDecimals).padStart(minDecimals + 3, "0")}'`;
  if (!kind) return (deg < 0 ? "-" : "") + body;
  const h = kind === "lat" ? (deg < 0 ? "S" : "N") : deg < 0 ? "W" : "E";
  return `${body} ${h}`;
}

/**
 * One line of a pasted list as latitude and longitude. Takes tabs (from Excel), semicolons,
 * "lat, lon", "lat,lon" and DMS pairs like 25°11'35"N 55°28'08"E. Latitude comes first, unless
 * the hemisphere letters say the longitude does. null when the line isn't a pair.
 */
export function parsePair(line: string): { lat: number; lon: number } | null {
  const t = String(line ?? "").trim();
  if (!t) return null;
  let parts: string[] | null = null;
  if (/[\t;]/.test(t)) parts = t.split(/[\t;]+/);
  else if (/,\s+/.test(t)) parts = t.split(/,\s+/);
  else if (/^[+-]?\d+(\.\d+)?,[+-]?\d+(\.\d+)?$/.test(t)) parts = t.split(",");
  else {
    const m = t.match(/^(.+?[NSEWnsew])\s*,?\s+(.+)$/) || t.match(/^([NSEWnsew].+?)\s+([NSEWnsew].+)$/);
    if (m) parts = [m[1], m[2]];
    else if (/^\S+\s+\S+$/.test(t)) parts = t.split(/\s+/);
  }
  if (!parts) return null;
  parts = parts.map((p) => p.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  let [a, b] = parts;
  const lonFirst = /[EW]\s*$|^[EW]/i.test(a) || /[NS]\s*$|^[NS]/i.test(b);
  if (lonFirst) [a, b] = [b, a];
  const lat = parseDms(a), lon = parseDms(b);
  if (!validLat(lat) || !validLon(lon)) return null;
  return { lat, lon };
}

export const validLat = (v: number | null): v is number => v !== null && Number.isFinite(v) && Math.abs(v) <= 90;
export const validLon = (v: number | null): v is number => v !== null && Number.isFinite(v) && Math.abs(v) <= 180;

/* ───────────────────────────────── UTM ───────────────────────────────── */

export interface Utm {
  zone: number;
  hemisphere: "N" | "S";
  /** MGRS latitude band, C to X */
  band: string;
  easting: number;
  northing: number;
  epsg: number;
}

/** The UTM zone for a point, with the Norway and Svalbard exceptions. */
export function utmZone(lat: number, lon: number): number {
  const L = ((((lon + 180) % 360) + 360) % 360) - 180;
  let z = Math.floor((L + 180) / 6) + 1;
  if (z > 60) z = 60;
  if (lat >= 56 && lat < 64 && L >= 3 && L < 12) z = 32;
  if (lat >= 72 && lat < 84) {
    if (L >= 0 && L < 9) z = 31;
    else if (L >= 9 && L < 21) z = 33;
    else if (L >= 21 && L < 33) z = 35;
    else if (L >= 33 && L < 42) z = 37;
  }
  return z;
}

export function latitudeBand(lat: number): string {
  if (lat < -80 || lat > 84) return "";
  const bands = "CDEFGHJKLMNPQRSTUVWX";
  return bands[Math.min(19, Math.floor((lat + 80) / 8))];
}

const utmDef = (zone: number, south: boolean) =>
  `+proj=utm +zone=${zone}${south ? " +south" : ""} +datum=WGS84 +units=m +no_defs`;

/** Latitude and longitude to UTM on WGS 84. `forceZone` converts into a neighbouring zone. */
export function toUtm(lat: number, lon: number, forceZone?: number): Utm {
  const zone = forceZone ?? utmZone(lat, lon);
  const south = lat < 0;
  const [easting, northing] = proj4("WGS84", utmDef(zone, south), [lon, lat]);
  return { zone, hemisphere: south ? "S" : "N", band: latitudeBand(lat), easting, northing, epsg: (south ? 32700 : 32600) + zone };
}

/** UTM on WGS 84 to latitude and longitude. */
export function fromUtm(easting: number, northing: number, zone: number, hemisphere: "N" | "S"): { lat: number; lon: number } {
  const [lon, lat] = proj4(utmDef(zone, hemisphere === "S"), "WGS84", [easting, northing]);
  return { lat, lon };
}

/* ─────────────────────────── distance and bearing ─────────────────────────── */

const WGS84 = { a: 6378137, f: 1 / 298.257223563 };
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

export interface Inverse {
  /** metres along the ellipsoid */
  distance: number;
  /** degrees from true north, at the start */
  initialBearing: number;
  /** degrees from true north, arriving at the end */
  finalBearing: number;
}

/**
 * Distance and bearings between two points on the WGS 84 ellipsoid (Vincenty's inverse
 * formula, accurate to well under a millimetre). Falls back to a sphere for the rare nearly
 * antipodal pair where the formula does not converge.
 */
export function inverse(lat1: number, lon1: number, lat2: number, lon2: number): Inverse {
  const { a, f } = WGS84;
  const b = a * (1 - f);
  const L = rad(lon2 - lon1);
  const U1 = Math.atan((1 - f) * Math.tan(rad(lat1)));
  const U2 = Math.atan((1 - f) * Math.tan(rad(lat2)));
  const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1), sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
  let lambda = L, prev: number, iter = 0;
  let sinSigma = 0, cosSigma = 0, sigma = 0, cos2Alpha = 0, cos2SigmaM = 0, sinLambda = 0, cosLambda = 0;
  do {
    sinLambda = Math.sin(lambda);
    cosLambda = Math.cos(lambda);
    sinSigma = Math.sqrt((cosU2 * sinLambda) ** 2 + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2);
    if (sinSigma === 0) return { distance: 0, initialBearing: 0, finalBearing: 0 };
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cos2Alpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cos2Alpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cos2Alpha : 0;
    const C = (f / 16) * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
    prev = lambda;
    lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
  } while (Math.abs(lambda - prev) > 1e-12 && ++iter < 200);
  if (iter >= 200) return sphereInverse(lat1, lon1, lat2, lon2);
  const uSq = (cos2Alpha * (a * a - b * b)) / (b * b);
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const dSigma =
    B * sinSigma * (cos2SigmaM + (B / 4) * (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
      (B / 6) * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2)));
  const distance = b * A * (sigma - dSigma);
  const a1 = Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda);
  const a2 = Math.atan2(cosU1 * sinLambda, -sinU1 * cosU2 + cosU1 * sinU2 * cosLambda);
  return { distance, initialBearing: norm360(deg(a1)), finalBearing: norm360(deg(a2)) };
}

function sphereInverse(lat1: number, lon1: number, lat2: number, lon2: number): Inverse {
  const R = 6371008.8;
  const p1 = rad(lat1), p2 = rad(lat2), dl = rad(lon2 - lon1);
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const distance = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  const brg = (x1: number, y1: number, x2: number, y2: number) =>
    norm360(deg(Math.atan2(Math.sin(rad(y2 - y1)) * Math.cos(rad(x2)), Math.cos(rad(x1)) * Math.sin(rad(x2)) - Math.sin(rad(x1)) * Math.cos(rad(x2)) * Math.cos(rad(y2 - y1)))));
  return { distance, initialBearing: brg(lat1, lon1, lat2, lon2), finalBearing: norm360(brg(lat2, lon2, lat1, lon1) + 180) };
}

/** The point reached from a start point along a bearing for a distance (Vincenty's direct formula). */
export function direct(lat1: number, lon1: number, bearing: number, distance: number): { lat: number; lon: number; finalBearing: number } {
  const { a, f } = WGS84;
  const b = a * (1 - f);
  const alpha1 = rad(bearing);
  const sinAlpha1 = Math.sin(alpha1), cosAlpha1 = Math.cos(alpha1);
  const tanU1 = (1 - f) * Math.tan(rad(lat1));
  const cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1), sinU1 = tanU1 * cosU1;
  const sigma1 = Math.atan2(tanU1, cosAlpha1);
  const sinAlpha = cosU1 * sinAlpha1;
  const cos2Alpha = 1 - sinAlpha * sinAlpha;
  const uSq = (cos2Alpha * (a * a - b * b)) / (b * b);
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  let sigma = distance / (b * A), prev: number, iter = 0;
  let cos2SigmaM = 0, sinSigma = 0, cosSigma = 0;
  do {
    cos2SigmaM = Math.cos(2 * sigma1 + sigma);
    sinSigma = Math.sin(sigma);
    cosSigma = Math.cos(sigma);
    const dSigma =
      B * sinSigma * (cos2SigmaM + (B / 4) * (cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
        (B / 6) * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2)));
    prev = sigma;
    sigma = distance / (b * A) + dSigma;
  } while (Math.abs(sigma - prev) > 1e-12 && ++iter < 200);
  const x = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
  const lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha + x * x));
  const lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
  const C = (f / 16) * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
  const L = lambda - (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
  const lon2 = ((deg(rad(lon1) + L) + 540) % 360) - 180;
  return { lat: deg(lat2), lon: lon2, finalBearing: norm360(deg(Math.atan2(sinAlpha, -x))) };
}

/** Distance and grid bearing between two points on a flat grid (eastings and northings). */
export function gridInverse(e1: number, n1: number, e2: number, n2: number): { distance: number; bearing: number; dE: number; dN: number } {
  const dE = e2 - e1, dN = n2 - n1;
  return { distance: Math.hypot(dE, dN), bearing: norm360(deg(Math.atan2(dE, dN))), dE, dN };
}

/** A bearing as 306°52'05.4" (degrees, minutes, seconds; always 0 to 360). */
export function formatBearing(b: number, secDecimals = 1): string {
  return formatDms(norm360(b), undefined, secDecimals);
}

/** The 16-point compass name of a bearing: N, NNE, NE, … */
export function compassPoint(b: number): string {
  const names = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return names[Math.round(norm360(b) / 22.5) % 16];
}

/* ──────────────────────────────── areas ──────────────────────────────── */

/** Area (always positive) and perimeter of a closed shape on a flat grid, corners in order. */
export function planarArea(pts: [number, number][]): { area: number; perimeter: number } {
  let s = 0, p = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
    p += Math.hypot(x2 - x1, y2 - y1);
  }
  return { area: Math.abs(s) / 2, perimeter: pts.length > 1 ? p : 0 };
}

/**
 * Area and perimeter of a plot given by latitude and longitude corners. The corners are put on
 * the UTM zone of the plot's centre and measured there, which is how a surveyor would measure it
 * on the ground; the perimeter is measured along the ellipsoid.
 */
export function geoArea(pts: { lat: number; lon: number }[]): { area: number; perimeter: number; zone: number } {
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lon = pts.reduce((s, p) => s + p.lon, 0) / pts.length;
  const zone = utmZone(lat, lon);
  const def = utmDef(zone, lat < 0);
  const xy = pts.map((p) => proj4("WGS84", def, [p.lon, p.lat]) as [number, number]);
  // UTM stretches distances by up to 0.1%; take that back out at the plot's own position
  const k = pointScale(lat, lon, zone);
  const { area } = planarArea(xy);
  let perimeter = 0;
  for (let i = 0; i < pts.length && pts.length > 1; i++) {
    const q = pts[(i + 1) % pts.length];
    perimeter += inverse(pts[i].lat, pts[i].lon, q.lat, q.lon).distance;
  }
  return { area: area / (k * k), perimeter, zone };
}

/** The UTM scale factor at a point (how much the grid stretches ground distances there). */
function pointScale(lat: number, lon: number, zone: number): number {
  const lon0 = zone * 6 - 183;
  const e2 = WGS84.f * (2 - WGS84.f);
  const ep2 = e2 / (1 - e2);
  const phi = rad(lat);
  const C = ep2 * Math.cos(phi) ** 2;
  const A = rad(lon - lon0) * Math.cos(phi);
  return 0.9996 * (1 + ((1 + C) * A * A) / 2 + ((5 - 4 * Math.tan(phi) ** 2 + 42 * C + 13 * C * C - 28 * ep2) * A ** 4) / 24);
}

/** True when two sides of the shape cross each other (corners out of order), which spoils its area. */
export function selfIntersects(pts: [number, number][]): boolean {
  const n = pts.length;
  if (n < 4) return false;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  for (let i = 0; i < n; i++) {
    const a1 = pts[i], a2 = pts[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      // sides that share a corner don't count
      if (j === i || (j + 1) % n === i || (i + 1) % n === j) continue;
      const b1 = pts[j], b2 = pts[(j + 1) % n];
      const d1 = cross(b1, b2, a1), d2 = cross(b1, b2, a2), d3 = cross(a1, a2, b1), d4 = cross(a1, a2, b2);
      if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
    }
  }
  return false;
}

/** One line of a corner list as [easting, northing] and an optional point name. */
export function parseCorner(line: string, order: "EN" | "NE"): { name: string; xy: [number, number] } | null {
  const parts = String(line ?? "").trim().split(/[\t;,]+\s*|\s+/).filter(Boolean);
  if (!parts.length) return null;
  let name = "";
  if (parseNumber(parts[0]) === null) name = parts.shift()!;
  const nums = parts.map(parseNumber);
  if (nums.length < 2 || nums.slice(0, 2).some((v) => v === null)) return null;
  const [a, b] = nums as number[];
  return { name, xy: order === "EN" ? [a, b] : [b, a] };
}

/* ─────────────────────────────── units ─────────────────────────────── */

export interface Unit {
  id: string;
  name: string;
  /** how many square metres (or metres) one of it is */
  factor: number;
  note?: string;
}

const FT = 0.3048;
const SQFT = FT * FT;

/** Land and floor area units, in square metres. */
export const AREA_UNITS: Unit[] = [
  { id: "m2", name: "Square metre (m²)", factor: 1 },
  { id: "km2", name: "Square kilometre (km²)", factor: 1e6 },
  { id: "ha", name: "Hectare (ha)", factor: 1e4 },
  { id: "acre", name: "Acre", factor: 4046.8564224 },
  { id: "ft2", name: "Square foot (ft²)", factor: SQFT },
  { id: "yd2", name: "Square yard (yd²)", factor: 0.83612736 },
  { id: "mi2", name: "Square mile", factor: 2589988.110336 },
  { id: "kanal", name: "Kanal (20 marla)", factor: 20 * 272.25 * SQFT, note: "5,445 ft², with the 272.25 ft² marla" },
  { id: "marla", name: "Marla (272.25 ft²)", factor: 272.25 * SQFT, note: "The standard (revenue) marla in Pakistan and Indian Punjab" },
  { id: "marla225", name: "Marla (225 ft²)", factor: 225 * SQFT, note: "The marla many housing societies use" },
  { id: "kanal225", name: "Kanal (20 × 225 ft² marla)", factor: 20 * 225 * SQFT, note: "4,500 ft²" },
  { id: "feddan", name: "Feddan", factor: 4200.83, note: "Egypt and Sudan" },
  { id: "dunam", name: "Dunam (metric)", factor: 1000, note: "Levant, Iraq, Turkey (dönüm)" },
  { id: "guntha", name: "Guntha", factor: 1089 * SQFT, note: "1,089 ft²; India" },
  { id: "cent", name: "Cent", factor: 435.6 * SQFT, note: "435.6 ft², 1/100 acre; South India" },
];

/** Length units, in metres. */
export const LENGTH_UNITS: Unit[] = [
  { id: "m", name: "Metre (m)", factor: 1 },
  { id: "km", name: "Kilometre (km)", factor: 1000 },
  { id: "cm", name: "Centimetre (cm)", factor: 0.01 },
  { id: "mm", name: "Millimetre (mm)", factor: 0.001 },
  { id: "ft", name: "Foot (international)", factor: FT },
  { id: "usft", name: "US survey foot", factor: 1200 / 3937, note: "Still used on many older US state plane grids" },
  { id: "in", name: "Inch", factor: 0.0254 },
  { id: "yd", name: "Yard", factor: 0.9144 },
  { id: "mi", name: "Mile", factor: 1609.344 },
  { id: "nmi", name: "Nautical mile", factor: 1852 },
  { id: "chain", name: "Chain (Gunter's)", factor: 20.1168, note: "66 ft, 100 links" },
  { id: "link", name: "Link", factor: 0.201168, note: "1/100 chain" },
  { id: "rod", name: "Rod (pole, perch)", factor: 5.0292, note: "16.5 ft" },
  { id: "karam", name: "Karam", factor: 5.5 * FT, note: "5.5 ft; land records in Pakistan and Indian Punjab" },
  { id: "gaz", name: "Gaz", factor: 0.9144, note: "1 yard" },
];

/** A value in one unit, in another. */
export function convertUnit(value: number, from: Unit, to: Unit): number {
  return (value * from.factor) / to.factor;
}

/* ─────────────────────────────── slope ─────────────────────────────── */

export interface Slope {
  percent: number;
  degrees: number;
  /** 1 in n: horizontal run for one unit of rise */
  oneIn: number;
}

export function slopeFromRiseRun(rise: number, run: number): Slope {
  return slopeFromRatio(rise / run);
}

export function slopeFromRatio(r: number): Slope {
  return { percent: r * 100, degrees: deg(Math.atan(r)), oneIn: r === 0 ? Infinity : 1 / Math.abs(r) };
}

export const slopeFromPercent = (p: number) => slopeFromRatio(p / 100);
export const slopeFromDegrees = (d: number) => slopeFromRatio(Math.tan(rad(d)));
export const slopeFromOneIn = (n: number) => slopeFromRatio(1 / n);

/* ─────────────────────────────── numbers ─────────────────────────────── */

/** A number the way a person types it: spaces and thousands commas ignored. null when it isn't one. */
export function parseNumber(s: string): number | null {
  const t = String(s ?? "").trim().replace(/[\s,](?=\d{3}(\D|$))/g, "").replace(/\s+/g, "");
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(t)) return null;
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : null;
}

/** A number for reading: grouped thousands, up to `dp` decimals, trailing zeros dropped. */
export function fmt(v: number, dp = 3): string {
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: dp, minimumFractionDigits: 0 });
}
