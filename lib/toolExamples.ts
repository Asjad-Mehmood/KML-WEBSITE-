// The worked example on each tool's landing page, calculated with the same maths the tool uses,
// so the page can never disagree with the tool.
import {
  AREA_UNITS, LENGTH_UNITS, compassPoint, convertUnit, fmt, formatBearing, formatDdm, formatDms, gridInverse, inverse,
  parseDms, planarArea, slopeFromRiseRun, toUtm, fromUtm, horizontalCurve, formatChainage,
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
      const lat = 25.295700, lon = 51.539000;
      const u = toUtm(lat, lon);
      return {
        title: "The Museum of Islamic Art, Doha",
        input: [["Clicked on the map", `${lat.toFixed(6)}, ${lon.toFixed(6)}`]],
        output: [
          ["DMS", `${formatDms(lat, "lat", 1)}  ${formatDms(lon, "lon", 1)}`],
          ["GPS style", `${formatDdm(lat, "lat", 3)}  ${formatDdm(lon, "lon", 3)}`],
          ["UTM", `${u.zone}${u.band}  ${u.easting.toFixed(1)} E  ${u.northing.toFixed(1)} N`],
        ],
      };
    }
    case "dms-to-decimal": {
      const lat = parseDms(`25°17'06.1"N`)!, lon = parseDms(`51°29'59.5"E`)!;
      return {
        title: "Doha, from a survey document",
        input: [["Typed", `25°17'06.1"N  51°29'59.5"E`]],
        output: [
          ["Decimal degrees", `${lat.toFixed(6)}, ${lon.toFixed(6)}`],
          ["GPS style", `${formatDdm(lat, "lat", 3)}  ${formatDdm(lon, "lon", 3)}`],
        ],
      };
    }
    case "latlong-to-utm": {
      const lat = 25.285028, lon = 51.499862;
      const u = toUtm(lat, lon);
      const back = fromUtm(u.easting, u.northing, u.zone, u.hemisphere);
      return {
        title: "Doha",
        input: [["Latitude, longitude", `${lat.toFixed(6)}, ${lon.toFixed(6)}`]],
        output: [
          ["Zone", `${u.zone}${u.band} (EPSG:${u.epsg})`],
          ["Easting, northing", `${u.easting.toFixed(3)} E, ${u.northing.toFixed(3)} N`],
          ["And back again", `${back.lat.toFixed(6)}, ${back.lon.toFixed(6)}`],
        ],
      };
    }
    case "distance-bearing": {
      const r = inverse(25.295700, 51.539000, 25.683900, 51.505800);
      const g = gridInverse(228600, 392450, 228700, 392350);
      return {
        title: "Doha to Al Khor, and a leg on the Qatar National Grid",
        input: [
          ["From", "Museum of Islamic Art, Doha  25.295700, 51.539000"],
          ["To", "Al Khor  25.683900, 51.505800"],
        ],
        output: [
          ["Distance", `${fmt(r.distance / 1000, 3)} km`],
          ["Bearing", `${formatBearing(r.initialBearing)} (${compassPoint(r.initialBearing)})`],
          ["QNG 228600, 392450 → 228700, 392350", `${g.distance.toFixed(3)} m at ${formatBearing(g.bearing)}`],
        ],
      };
    }
    case "plot-area": {
      const pts: [number, number][] = [[228600, 392450], [228645.25, 392452.1], [228647.8, 392480.6], [228601.5, 392478.9]];
      const a = planarArea(pts);
      return {
        title: "A four-corner plot in Doha, on the Qatar National Grid",
        input: [["Corners (E, N)", "228600.00 392450.00 · 228645.25 392452.10 · 228647.80 392480.60 · 228601.50 392478.90"]],
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
    case "horizontal-curve": {
      const c = horizontalCurve(300, parseDms(`35°24'30"`)!, 1245.6, 20);
      if (!c) return null;
      const first = c.pegs[0];
      return {
        title: "A 300 m radius bend on a site road",
        input: [["Curve", `R 300 m · Δ 35°24'30" · IP at 1+245.600 · pegs every 20 m`]],
        output: [
          ["Tangent · curve length", `T ${c.T.toFixed(3)} m · L ${c.L.toFixed(3)} m`],
          ["TC → CT", `${formatChainage(c.chTC)} → ${formatChainage(c.chCT)}`],
          ["First peg", `${formatChainage(first.ch)}: deflection ${formatDms(first.deflection, undefined, 1)}, chord ${first.subChord.toFixed(3)} m`],
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
