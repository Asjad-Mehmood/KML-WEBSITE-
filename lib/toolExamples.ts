// The worked example on each tool's landing page, calculated with the same maths the tool uses,
// so the page can never disagree with the tool.
import {
  AREA_UNITS, LENGTH_UNITS, compassPoint, convertUnit, fmt, formatBearing, formatDdm, formatDms, gridInverse, inverse,
  parseDms, planarArea, slopeFromRiseRun, toUtm, fromUtm,
} from "@/lib/toolMath";
import { SURV, computeAll, exampleState } from "@/lib/traverseModel";

export interface Example {
  title: string;
  input: [string, string][];
  output: [string, string][];
}

const area = (id: string) => AREA_UNITS.find((u) => u.id === id)!;
const len = (id: string) => LENGTH_UNITS.find((u) => u.id === id)!;

export function toolExample(slug: string): Example | null {
  switch (slug) {
    case "coordinates-on-map": {
      const lat = 25.197197, lon = 55.274376;
      const u = toUtm(lat, lon);
      return {
        title: "The Burj Khalifa, Dubai",
        input: [["Clicked on the map", `${lat.toFixed(6)}, ${lon.toFixed(6)}`]],
        output: [
          ["DMS", `${formatDms(lat, "lat", 1)}  ${formatDms(lon, "lon", 1)}`],
          ["GPS style", `${formatDdm(lat, "lat", 3)}  ${formatDdm(lon, "lon", 3)}`],
          ["UTM", `${u.zone}${u.band}  ${u.easting.toFixed(1)} E  ${u.northing.toFixed(1)} N`],
        ],
      };
    }
    case "dms-to-decimal": {
      const lat = parseDms(`24°51'36.2"N`)!, lon = parseDms(`67°00'36.4"E`)!;
      return {
        title: "Karachi, from a survey document",
        input: [["Typed", `24°51'36.2"N  67°00'36.4"E`]],
        output: [
          ["Decimal degrees", `${lat.toFixed(6)}, ${lon.toFixed(6)}`],
          ["GPS style", `${formatDdm(lat, "lat", 3)}  ${formatDdm(lon, "lon", 3)}`],
        ],
      };
    }
    case "latlong-to-utm": {
      const lat = 31.520400, lon = 74.358700;
      const u = toUtm(lat, lon);
      const back = fromUtm(u.easting, u.northing, u.zone, u.hemisphere);
      return {
        title: "Lahore",
        input: [["Latitude, longitude", `${lat.toFixed(6)}, ${lon.toFixed(6)}`]],
        output: [
          ["Zone", `${u.zone}${u.band} (EPSG:${u.epsg})`],
          ["Easting, northing", `${u.easting.toFixed(3)} E, ${u.northing.toFixed(3)} N`],
          ["And back again", `${back.lat.toFixed(6)}, ${back.lon.toFixed(6)}`],
        ],
      };
    }
    case "distance-bearing": {
      const r = inverse(25.197197, 55.274376, 24.453884, 54.377344);
      const g = gridInverse(1000, 1000, 1100, 900);
      return {
        title: "Dubai to Abu Dhabi, and a grid leg",
        input: [
          ["From", "Burj Khalifa  25.197197, 55.274376"],
          ["To", "Abu Dhabi Corniche  24.453884, 54.377344"],
        ],
        output: [
          ["Distance", `${fmt(r.distance / 1000, 3)} km`],
          ["Bearing", `${formatBearing(r.initialBearing)} (${compassPoint(r.initialBearing)})`],
          ["Grid 1000,1000 → 1100,900", `${g.distance.toFixed(3)} m at ${formatBearing(g.bearing)}`],
        ],
      };
    }
    case "plot-area": {
      const pts: [number, number][] = [[1000, 1000], [1045.25, 1002.1], [1047.8, 1030.6], [1001.5, 1028.9]];
      const a = planarArea(pts);
      return {
        title: "A four-corner plot from a survey",
        input: [["Corners (E, N)", "1000.00 1000.00 · 1045.25 1002.10 · 1047.80 1030.60 · 1001.50 1028.90"]],
        output: [
          ["Area", `${fmt(a.area, 2)} m² · ${fmt(convertUnit(a.area, area("m2"), area("ft2")), 0)} ft²`],
          ["Kanal / marla", `${fmt(convertUnit(a.area, area("m2"), area("kanal")), 3)} kanal · ${fmt(convertUnit(a.area, area("m2"), area("marla")), 2)} marla`],
          ["Perimeter", `${fmt(a.perimeter, 3)} m`],
        ],
      };
    }
    case "slope-calculator": {
      const s = slopeFromRiseRun(-0.45, 30);
      return {
        title: "A drain run",
        input: [["Levels", "45.260 at the start, 44.810 at the end, 30 m apart"]],
        output: [
          ["Percent", `${fmt(s.percent, 3)} %`],
          ["Degrees", `${fmt(s.degrees, 3)}°`],
          ["1 in N", `1 in ${fmt(s.oneIn, 1)} (falling)`],
        ],
      };
    }
    case "traverse-adjustment": {
      const T = exampleState();
      const c = computeAll(T).CT[0];
      if (!c.ok) return null;
      const f3 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
      const r = c.res, cl = r.closure, ts = r.stations.find((s) => s.name === "TS-01")!;
      return {
        title: "A six-station closed loop, adjusted by least squares",
        input: [
          ["Control", "CP-01 228450.312 441203.845 · reference object CP-02"],
          ["Observed", "6 angles in d.mmss and 6 distances round CP-01 → TS-01 … TS-05 → CP-01"],
        ],
        output: [
          ["Angular misclosure", `${SURV.fmtSec(cl.angMis ?? 0, 1).replace('"', "″")} (allowed ±${cl.angAllow.toFixed(1)}″)`],
          ["Linear precision", `1 : ${fmt(Math.floor(cl.precision ?? 0), 0)}`],
          ["TS-01 adjusted", `E ${f3(ts.E)} · N ${f3(ts.N)}`],
        ],
      };
    }
    case "area-converter": {
      const v = 1;
      return {
        title: "One kanal",
        input: [["Typed", "1 kanal"]],
        output: [
          ["Marla", fmt(convertUnit(v, area("kanal"), area("marla")), 2)],
          ["Square feet · m²", `${fmt(convertUnit(v, area("kanal"), area("ft2")), 2)} ft² · ${fmt(convertUnit(v, area("kanal"), area("m2")), 2)} m²`],
          ["Acre", fmt(convertUnit(v, area("kanal"), area("acre")), 4)],
        ],
      };
    }
    case "length-converter": {
      return {
        title: "One chain from an old plan",
        input: [["Typed", "1 chain"]],
        output: [
          ["Feet · metres", `${fmt(convertUnit(1, len("chain"), len("ft")), 3)} ft · ${fmt(convertUnit(1, len("chain"), len("m")), 4)} m`],
          ["Links · karam", `${fmt(convertUnit(1, len("chain"), len("link")), 2)} links · ${fmt(convertUnit(1, len("chain"), len("karam")), 2)} karam`],
          ["Gaz (yards)", fmt(convertUnit(1, len("chain"), len("gaz")), 2)],
        ],
      };
    }
  }
  return null;
}
