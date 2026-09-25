// Builds public/data/epsg-projected.json for the hero Quick Coordinate Converter.
// Source: the `epsg-index` package (all EPSG coordinate systems with proj4 strings).
// Only projected systems that proj4 can round-trip at the centre of their area
// of use are kept. Run with: npm run build:epsg
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import proj4 from "proj4";

const require = createRequire(import.meta.url);
const all = require("epsg-index/all.json");

const UNIT_LABELS = { m: "m", "us-ft": "US ft", ft: "ft" };

function unitLabel(def) {
  const m = def.match(/\+units=([^ ]+)/);
  if (m) return UNIT_LABELS[m[1]] || m[1];
  return def.includes("+to_meter") ? "units" : "m";
}

// Definitions whose EPSG proj4 string needs an NTv2 grid file that browsers
// don't have. Fall back to the published 7-parameter Helmert shift instead.
const OVERRIDES = {
  // OSGB36 / British National Grid — EPSG transformation 1314 (~2 m)
  27700:
    "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m",
};

const round = (n, d) => Number(n.toFixed(d));
// proj4 logs a warning for every definition whose NTv2 grid file is missing;
// those systems are skipped below, so keep the build output readable.
const log = console.log;
console.log = () => {};
const rows = [];
let skipped = 0;

for (const crs of Object.values(all)) {
  if (crs.kind !== "CRS-PROJCRS" || !crs.proj4 || !Array.isArray(crs.bbox)) continue;
  const def =
    OVERRIDES[crs.code] || crs.proj4.replace(/ \+no_defs/g, "").replace(/ \+type=crs/g, "").trim();
  const [north, west, south, east] = crs.bbox;
  // Centre of the area of use (handles boxes that cross the antimeridian)
  const lat = (north + south) / 2;
  let lon = west <= east ? (west + east) / 2 : (west + east + 360) / 2;
  if (lon > 180) lon -= 360;

  try {
    const [x, y] = proj4("WGS84", def, [lon, lat]);
    const [lon2, lat2] = proj4(def, "WGS84", [x, y]);
    if (![x, y, lon2, lat2].every(Number.isFinite) || Math.abs(lat2 - lat) > 1e-4 || Math.abs(lon2 - lon) > 1e-4) {
      skipped++;
      continue;
    }
    rows.push([
      Number(crs.code),
      crs.name,
      def,
      [round(north, 2), round(west, 2), round(south, 2), round(east, 2)],
      unitLabel(def),
    ]);
  } catch {
    skipped++;
  }
}

console.log = log;
rows.sort((a, b) => a[0] - b[0]);
const out = path.resolve(process.cwd(), "public/data/epsg-projected.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(rows));
console.log(`Wrote ${rows.length} projected systems to ${path.relative(process.cwd(), out)} (${skipped} skipped)`);
