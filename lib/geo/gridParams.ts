// Turns a proj4 definition into the rows of a "grid parameters" table.
// The grid landing pages read definitions from the same EPSG index the
// converter uses, so the table always matches the maths.

const PROJECTIONS: Record<string, string> = {
  tmerc: "Transverse Mercator",
  utm: "Transverse Mercator (UTM)",
  lcc: "Lambert Conformal Conic",
  sterea: "Oblique Stereographic",
  somerc: "Swiss Oblique Mercator",
};

const ELLIPSOIDS: Record<string, string> = {
  WGS84: "WGS 84",
  GRS80: "GRS 1980",
  intl: "International 1924",
  airy: "Airy 1830",
  bessel: "Bessel 1841",
  clrk66: "Clarke 1866",
  clrk80: "Clarke 1880",
};

const US_FT = 1200 / 3937; // metres per US survey foot

function params(def: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of def.trim().split(/\s+/)) {
    const m = /^\+([a-z_0-9]+)(?:=(.*))?$/i.exec(part);
    if (m) out[m[1]] = m[2] ?? "true";
  }
  return out;
}

function dms(deg: number, pos: string, neg: string): string {
  const hemi = deg >= 0 ? pos : neg;
  let a = Math.abs(deg);
  let d = Math.floor(a);
  a = (a - d) * 60;
  let m = Math.floor(a);
  let s = Math.round((a - m) * 60 * 100) / 100;
  if (s >= 60) { s = 0; m += 1; }
  if (m >= 60) { m = 0; d += 1; }
  const sec = s ? `${Number.isInteger(s) ? s : s.toFixed(2)}″` : "";
  return `${d}°${m || sec ? ` ${m}′` : ""}${sec ? ` ${sec}` : ""} ${hemi}`;
}

const lat = (v: string) => dms(parseFloat(v), "N", "S");
const lon = (v: string) => dms(parseFloat(v), "E", "W");

export function unitLabel(def: string): string {
  const u = params(def).units || "m";
  return u === "us-ft" ? "US survey feet" : u === "ft" ? "international feet" : "metres";
}

/** How the grid's datum reaches WGS 84, which Google Earth uses */
export function datumTie(def: string): string {
  const p = params(def);
  if (p.datum === "WGS84") return "Defined on WGS 84 — no shift needed";
  const t = p.towgs84?.split(",").map(Number);
  if (!t || t.every((v) => v === 0)) return "Treated as WGS 84, no shift (the datums agree to about a metre or better)";
  if (t.length === 3 || t.slice(3).every((v) => v === 0)) return "Published 3-parameter shift (typically a few metres)";
  return "Published 7-parameter shift (typically 1–2 m)";
}

export function gridParameterRows(def: string): [string, string][] {
  const p = params(def);
  const rows: [string, string][] = [];
  const unitsFactor = p.units === "us-ft" ? US_FT : p.units === "ft" ? 0.3048 : 1;
  const len = (metres: number) =>
    `${(metres / unitsFactor).toLocaleString("en-US", { maximumFractionDigits: 3 })} ${p.units === "us-ft" ? "US ft" : p.units === "ft" ? "ft" : "m"}`;

  rows.push(["Projection", PROJECTIONS[p.proj] || p.proj]);
  if (p.proj === "utm") {
    const zone = parseInt(p.zone, 10);
    rows.push(["Zone", `${zone}${p.south ? "S" : "N"}`]);
    rows.push(["Central meridian", lon(String(zone * 6 - 183))]);
    rows.push(["Scale factor", "0.9996"]);
    rows.push(["False easting", len(500000)]);
    rows.push(["False northing", len(p.south ? 10000000 : 0)]);
  } else {
    if (p.lat_0) rows.push(["Latitude of origin", lat(p.lat_0)]);
    if (p.lon_0) rows.push([p.proj === "lcc" ? "Longitude of origin" : "Central meridian", lon(p.lon_0)]);
    if (p.lat_1 && p.lat_2) rows.push(["Standard parallels", `${lat(p.lat_1)} and ${lat(p.lat_2)}`]);
    const k = p.k ?? p.k_0;
    if (k) rows.push(["Scale factor", String(parseFloat(k))]);
    if (p.x_0) rows.push([p.axis === "wsu" ? "False westing" : "False easting", len(parseFloat(p.x_0))]);
    if (p.y_0) rows.push([p.axis === "wsu" ? "False southing" : "False northing", len(parseFloat(p.y_0))]);
  }
  const ellps = p.datum === "WGS84" ? "WGS 84" : ELLIPSOIDS[p.ellps] || p.ellps;
  if (ellps) rows.push(["Ellipsoid", ellps]);
  rows.push(["Units", unitLabel(def)]);
  rows.push(["Tie to WGS 84", datumTie(def)]);
  return rows;
}

/** "25.34°N–24.85°N, 54.84°E–55.55°E" from an EPSG [north, west, south, east] box */
export function areaBox([n, w, s, e]: [number, number, number, number]): string {
  const la = (v: number) => `${Math.abs(v)}°${v >= 0 ? "N" : "S"}`;
  const lo = (v: number) => `${Math.abs(v)}°${v >= 0 ? "E" : "W"}`;
  return `${la(s)} to ${la(n)}, ${lo(w)} to ${lo(e)}`;
}
