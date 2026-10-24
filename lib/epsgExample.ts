import proj4 from "proj4";
import type { EpsgSystem } from "@/lib/epsgCatalog";
// Systems whose proj4 result was not confirmed by PROJ (pyproj) within 25 units at these points,
// or that PROJ does not know: no check points are shown for them. Made with scripts/epsg-example-skip.
import skipList from "@/lib/data/epsg-example-skip.json";

const SKIP = new Set<number>(skipList as number[]);

export type ExamplePoint = { label: string; lat: number; lon: number; e: number; n: number };

/**
 * Check points for a grid page: the middle of the system's area of use and four points a little
 * inside its corners, in latitude/longitude (WGS 84) and in the grid's easting/northing. Every
 * EPSG page gets its own numbers, worked out with the same proj4 definition the converter uses,
 * so people can test their own conversion against them. Points that don't project are left out.
 */
export function examplePoints(s: EpsgSystem): ExamplePoint[] {
  if (SKIP.has(s.code)) return [];
  const [north, west, south, east] = s.bbox;
  if (![north, west, south, east].every(Number.isFinite)) return [];
  const wrapE = east < west ? east + 360 : east; // areas across the antimeridian
  const lon = (t: number) => {
    const v = west + (wrapE - west) * t;
    return v > 180 ? v - 360 : v;
  };
  const lat = (t: number) => south + (north - south) * t;
  const spots: [string, number, number][] = [
    ["Middle of the area of use", lat(0.5), lon(0.5)],
    ["Towards the north-west", lat(0.8), lon(0.2)],
    ["Towards the north-east", lat(0.8), lon(0.8)],
    ["Towards the south-west", lat(0.2), lon(0.2)],
    ["Towards the south-east", lat(0.2), lon(0.8)],
  ];
  let fwd: proj4.Converter;
  try {
    fwd = proj4("EPSG:4326", s.def);
  } catch {
    return [];
  }
  const out: ExamplePoint[] = [];
  for (const [label, la, lo] of spots) {
    try {
      const [e, n] = fwd.forward([lo, la]);
      if (Number.isFinite(e) && Number.isFinite(n) && Math.abs(e) < 1e9 && Math.abs(n) < 1e9) out.push({ label, lat: la, lon: lo, e, n });
    } catch {
      // outside what the projection can show
    }
  }
  return out;
}

export const fmtDeg = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(5)}° ${v >= 0 ? pos : neg}`;
export const fmtGrid = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
