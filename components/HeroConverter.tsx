"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import proj4 from "proj4";
import { parseSurveyRows, buildKml, MAX_ROWS, type ColumnOrder, type ConvertedPoint } from "../lib/surveyRows";
import {
  RefreshCw,
  Search,
  Copy,
  CheckCircle2,
  Download,
  ChevronDown,
  Globe,
  ClipboardPaste,
  AlertTriangle,
} from "lucide-react";

/* ─── Coordinate System Definition ─── */
interface CoordSystem {
  id: string;
  code: number;   // EPSG code
  grid: string;   // "EPSG:3997"
  name: string;
  flag: string;
  station: string;
  datum: string;
  accuracy: string;
  def: string;    // proj4 definition
  unit: string;   // linear unit of E/N: "m", "US ft", "ft"…
  defaultE: number;
  defaultN: number;
  defaultZ: number;
}

/* A row of public/data/epsg-projected.json: [code, name, proj4, [N, W, S, E] area of use, unit].
   Generated from the EPSG registry by scripts/build-epsg-index.mjs. */
export type EpsgRow = [number, string, string, [number, number, number, number], string];

/* ─── Curated systems (proj4 definitions from the EPSG registry) ───
   Each sample point is a real benchmark location; the comment gives its WGS84 lat, lon. */
const POPULAR_SYSTEMS: CoordSystem[] = [
  // → 25.1932, 55.4678
  { id: "dubai-dltm", code: 3997, grid: "EPSG:3997", name: "Dubai DLTM", flag: "🇦🇪", station: "BM-DUB-01", datum: "WGS-84 / DLTM", accuracy: "< 1 mm", def: "+proj=tmerc +lat_0=0 +lon_0=55.3333333333333 +k=1 +x_0=500000 +y_0=0 +datum=WGS84 +units=m", unit: "m", defaultE: 513556.612, defaultN: 2787467.856, defaultZ: 14.85 },
  // → 25.2846, 51.5291
  { id: "qatar-qng", code: 2932, grid: "EPSG:2932", name: "Qatar National Grid (QNG)", flag: "🇶🇦", station: "QNG-DOH-12", datum: "Qatar 1995", accuracy: "< 1 mm", def: "+proj=tmerc +lat_0=24.45 +lon_0=51.2166666666667 +k=0.99999 +x_0=200000 +y_0=300000 +ellps=intl +towgs84=-119.4248,-303.65872,-11.00061,1.164298,0.174458,1.096259,3.657065 +units=m", unit: "m", defaultE: 231540.25, defaultN: 392410.8, defaultZ: 11.2 },
  // → 24.8607, 67.0011
  { id: "pakistan-utm42n", code: 32642, grid: "EPSG:32642", name: "Pakistan Karachi (UTM 42N)", flag: "🇵🇰", station: "PAK-KHI-07", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=42 +datum=WGS84 +units=m", unit: "m", defaultE: 298038.084, defaultN: 2751004.904, defaultZ: 10 },
  // → 24.6886, 46.6925
  { id: "saudi-utm38n", code: 32638, grid: "EPSG:32638", name: "Saudi Arabia UTM 38N", flag: "🇸🇦", station: "KSA-RUH-03", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=38 +datum=WGS84 +units=m", unit: "m", defaultE: 671230.15, defaultN: 2731520.85, defaultZ: 612 },
  // → 51.5426, -0.0097
  { id: "uk-osgb36", code: 27700, grid: "EPSG:27700", name: "UK London OSGB36", flag: "🇬🇧", station: "TBM-LON-04", datum: "OSGB36", accuracy: "~2 m (Helmert)", def: "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m", unit: "m", defaultE: 538120, defaultN: 184510, defaultZ: 12.3 },
  // → 40.7580, -73.9855
  { id: "usa-nad83-nyc", code: 32118, grid: "EPSG:32118", name: "NYC Long Island (NAD83)", flag: "🇺🇸", station: "NYC-CTRL-22", datum: "NAD83", accuracy: "< 1 mm", def: "+proj=lcc +lat_0=40.1666666666667 +lon_0=-74 +lat_1=41.0333333333333 +lat_2=40.6666666666667 +x_0=300000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m", unit: "m", defaultE: 301224.407, defaultN: 65665.292, defaultZ: 34.2 },
];

const GULF_SYSTEMS: CoordSystem[] = [
  // → 24.1103, 52.7306
  { id: "uae-utm39n", code: 32639, grid: "EPSG:32639", name: "UAE Western Region (UTM 39N)", flag: "🇦🇪", station: "BM-RUW-04", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=39 +datum=WGS84 +units=m", unit: "m", defaultE: 675888.778, defaultN: 2667523.691, defaultZ: 8.5 },
  // → 25.3275, 55.4620
  { id: "uae-utm40n", code: 32640, grid: "EPSG:32640", name: "UAE Dubai / NE (UTM 40N)", flag: "🇦🇪", station: "BM-SHJ-09", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=40 +datum=WGS84 +units=m", unit: "m", defaultE: 345200, defaultN: 2802100, defaultZ: 12 },
  // → 21.5127, 39.2066
  { id: "saudi-utm37n", code: 32637, grid: "EPSG:32637", name: "Saudi Arabia West (UTM 37N)", flag: "🇸🇦", station: "KSA-JED-02", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=37 +datum=WGS84 +units=m", unit: "m", defaultE: 521400, defaultN: 2378900, defaultZ: 18 },
  // → 26.4106, 50.2159
  { id: "saudi-utm39n", code: 32639, grid: "EPSG:32639", name: "Saudi Arabia East (UTM 39N)", flag: "🇸🇦", station: "KSA-DMM-07", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=39 +datum=WGS84 +units=m", unit: "m", defaultE: 421800, defaultN: 2921400, defaultZ: 10.5 },
  // → 23.6320, 58.5117
  { id: "oman-utm40n", code: 32640, grid: "EPSG:32640", name: "Oman National Grid (UTM 40N)", flag: "🇴🇲", station: "OMN-MCT-05", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=40 +datum=WGS84 +units=m", unit: "m", defaultE: 654200, defaultN: 2614300, defaultZ: 45 },
  // → 29.3759, 47.9774
  { id: "kuwait-utm39n", code: 32638, grid: "EPSG:32638", name: "Kuwait City (UTM 38N)", flag: "🇰🇼", station: "KWT-CTY-01", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=38 +datum=WGS84 +units=m", unit: "m", defaultE: 789011.073, defaultN: 3253318.983, defaultZ: 15 },
  // → 26.2045, 50.5666
  { id: "bahrain-grid", code: 32639, grid: "EPSG:32639", name: "Bahrain State Grid (UTM 39N)", flag: "🇧🇭", station: "BHR-MNM-03", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=39 +datum=WGS84 +units=m", unit: "m", defaultE: 456700, defaultN: 2898400, defaultZ: 6 },
  // → 30.0544, 31.2521
  { id: "egypt-utm36n", code: 32636, grid: "EPSG:32636", name: "Egypt Red Belt (UTM 36N)", flag: "🇪🇬", station: "EGY-CAI-08", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=36 +datum=WGS84 +units=m", unit: "m", defaultE: 331500, defaultN: 3326100, defaultZ: 75 },
];

const ASIA_SYSTEMS: CoordSystem[] = [
  // → 30.1925, 64.9985
  { id: "pakistan-utm41n", code: 32641, grid: "EPSG:32641", name: "Pakistan West (UTM 41N)", flag: "🇵🇰", station: "PAK-QTA-02", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=41 +datum=WGS84 +units=m", unit: "m", defaultE: 692400, defaultN: 3341800, defaultZ: 1680 },
  // → 31.5919, 74.3265
  { id: "pakistan-utm43n", code: 32643, grid: "EPSG:32643", name: "Pakistan East & Kashmir (UTM 43N)", flag: "🇵🇰", station: "PAK-LHR-14", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=43 +datum=WGS84 +units=m", unit: "m", defaultE: 436100, defaultN: 3495400, defaultZ: 217 },
  // → 19.0926, 72.8985
  { id: "india-utm43n", code: 32643, grid: "EPSG:32643", name: "India West (UTM 43N)", flag: "🇮🇳", station: "IND-BOM-01", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=43 +datum=WGS84 +units=m", unit: "m", defaultE: 278900, defaultN: 2112400, defaultZ: 14 },
  // → 21.1458, 79.0882
  { id: "india-utm44n", code: 32644, grid: "EPSG:32644", name: "India Central (UTM 44N)", flag: "🇮🇳", station: "IND-NAG-05", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=44 +datum=WGS84 +units=m", unit: "m", defaultE: 301475.049, defaultN: 2339478.989, defaultZ: 310 },
  // → 22.5658, 88.3734
  { id: "india-utm45n", code: 32645, grid: "EPSG:32645", name: "India East (UTM 45N)", flag: "🇮🇳", station: "IND-CCU-09", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=45 +datum=WGS84 +units=m", unit: "m", defaultE: 641200, defaultN: 2496100, defaultZ: 9 },
  // → 1.3667, 103.8333
  { id: "singapore-svy21", code: 3414, grid: "EPSG:3414", name: "Singapore SVY21", flag: "🇸🇬", station: "SGP-CTRL-01", datum: "SVY21", accuracy: "< 1 mm", def: "+proj=tmerc +lat_0=1.36666666666667 +lon_0=103.833333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m", unit: "m", defaultE: 28001.642, defaultN: 38744.572, defaultZ: 22 },
  // → 1.4927, 103.7414
  { id: "malaysia-utm48n", code: 32648, grid: "EPSG:32648", name: "Malaysia Johor (UTM 48N)", flag: "🇲🇾", station: "MYS-JHB-02", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=48 +datum=WGS84 +units=m", unit: "m", defaultE: 359985.218, defaultN: 165028.639, defaultZ: 30 },
  // → 39.9069, 116.3940
  { id: "china-utm50n", code: 32650, grid: "EPSG:32650", name: "China CGCS2000 (UTM 50N)", flag: "🇨🇳", station: "CHN-BJS-01", datum: "CGCS2000", accuracy: "< 1 mm", def: "+proj=utm +zone=50 +datum=WGS84 +units=m", unit: "m", defaultE: 448200, defaultN: 4417600, defaultZ: 43 },
  // → 35.6977, 139.7002
  { id: "japan-utm54n", code: 32654, grid: "EPSG:32654", name: "Japan Tokyo (UTM 54N)", flag: "🇯🇵", station: "JPN-TYO-03", datum: "JGD2011", accuracy: "< 1 mm", def: "+proj=utm +zone=54 +datum=WGS84 +units=m", unit: "m", defaultE: 382400, defaultN: 3951200, defaultZ: 38 },
  // → -6.2175, 106.8447
  { id: "indonesia-utm48s", code: 32748, grid: "EPSG:32748", name: "Indonesia Jakarta (UTM 48S)", flag: "🇮🇩", station: "IDN-JKT-04", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=48 +south +datum=WGS84 +units=m", unit: "m", defaultE: 704100, defaultN: 9312400, defaultZ: 16 },
];

const EUROPE_SYSTEMS: CoordSystem[] = [
  // → 53.3489, -6.2607
  { id: "ireland-itm", code: 2157, grid: "EPSG:2157", name: "Irish Transverse Mercator (ITM)", flag: "🇮🇪", station: "IRL-DUB-01", datum: "IRENET95", accuracy: "< 1 mm", def: "+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=0.99982 +x_0=600000 +y_0=750000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m", unit: "m", defaultE: 715800, defaultN: 734600, defaultZ: 25 },
  // → 48.8584, 2.2945
  { id: "france-lambert93", code: 2154, grid: "EPSG:2154", name: "France Paris (Lambert-93)", flag: "🇫🇷", station: "FRA-PAR-06", datum: "RGF93", accuracy: "< 1 mm", def: "+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m", unit: "m", defaultE: 648237.302, defaultN: 6862271.682, defaultZ: 35 },
  // → 50.1207, 8.6755
  { id: "germany-utm32n", code: 32632, grid: "EPSG:32632", name: "Germany ETRS89 (UTM 32N)", flag: "🇩🇪", station: "DEU-FRA-02", datum: "ETRS89", accuracy: "< 1 mm", def: "+proj=utm +zone=32 +datum=WGS84 +units=m", unit: "m", defaultE: 476800, defaultN: 5552100, defaultZ: 112 },
  // → 52.3723, 4.8946
  { id: "netherlands-rdnew", code: 28992, grid: "EPSG:28992", name: "Netherlands Amersfoort (RD New)", flag: "🇳🇱", station: "NLD-AMS-01", datum: "RD New", accuracy: "< 1 mm", def: "+proj=sterea +lat_0=52.1561605555556 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.4171,50.3319,465.5524,1.9342,-1.6677,9.1019,4.0725 +units=m", unit: "m", defaultE: 121300, defaultN: 487200, defaultZ: -2 },
  // → 47.3785, 8.5404
  { id: "switzerland-lv95", code: 2056, grid: "EPSG:2056", name: "Switzerland CH1903+ (LV95)", flag: "🇨🇭", station: "CHE-ZRH-03", datum: "CH1903+", accuracy: "< 1 mm", def: "+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m", unit: "m", defaultE: 2683200, defaultN: 1248100, defaultZ: 408 },
  // → 40.4163, -3.7037
  { id: "spain-utm30n", code: 32630, grid: "EPSG:32630", name: "Spain Madrid (UTM 30N)", flag: "🇪🇸", station: "ESP-MAD-01", datum: "ETRS89", accuracy: "< 1 mm", def: "+proj=utm +zone=30 +datum=WGS84 +units=m", unit: "m", defaultE: 440300, defaultN: 4474200, defaultZ: 667 },
  // → 45.4642, 9.1900
  { id: "italy-utm32n", code: 32632, grid: "EPSG:32632", name: "Italy Milan (UTM 32N)", flag: "🇮🇹", station: "ITA-MIL-04", datum: "ETRS89", accuracy: "< 1 mm", def: "+proj=utm +zone=32 +datum=WGS84 +units=m", unit: "m", defaultE: 514853.496, defaultN: 5034536.796, defaultZ: 120 },
];

const AMERICAS_SYSTEMS: CoordSystem[] = [
  // → 37.7749, -122.4194
  { id: "usa-nad83-ca", code: 2227, grid: "EPSG:2227", name: "USA California Zone 3 (NAD83, US ft)", flag: "🇺🇸", station: "CAL-SFO-03", datum: "NAD83", accuracy: "< 1 mm", def: "+proj=lcc +lat_0=36.5 +lon_0=-120.5 +lat_1=38.4333333333333 +lat_2=37.0666666666667 +x_0=2000000.0001016 +y_0=500000.0001016 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft", unit: "US ft", defaultE: 6006957.098, defaultN: 2110309.181, defaultZ: 16 },
  // → 30.2672, -97.7431
  { id: "usa-nad83-tx", code: 2277, grid: "EPSG:2277", name: "USA Texas Central (NAD83, US ft)", flag: "🇺🇸", station: "TEX-ATX-05", datum: "NAD83", accuracy: "< 1 mm", def: "+proj=lcc +lat_0=29.6666666666667 +lon_0=-100.333333333333 +lat_1=31.8833333333333 +lat_2=30.1166666666667 +x_0=699999.999898399 +y_0=3000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft", unit: "US ft", defaultE: 3114226.214, defaultN: 10070436.131, defaultZ: 149 },
  // → 47.6093, -122.3294
  { id: "usa-utm10n", code: 32610, grid: "EPSG:32610", name: "USA Seattle / PNW (UTM 10N)", flag: "🇺🇸", station: "USA-SEA-09", datum: "WGS-84", accuracy: "< 1 mm", def: "+proj=utm +zone=10 +datum=WGS84 +units=m", unit: "m", defaultE: 550400, defaultN: 5273100, defaultZ: 42 },
  // → 43.6494, -79.3868
  { id: "canada-utm17n", code: 32617, grid: "EPSG:32617", name: "Canada Toronto (UTM 17N)", flag: "🇨🇦", station: "CAN-YYZ-01", datum: "NAD83 / WGS84", accuracy: "< 1 mm", def: "+proj=utm +zone=17 +datum=WGS84 +units=m", unit: "m", defaultE: 630100, defaultN: 4834200, defaultZ: 76 },
];

const OCEANIA_AFRICA_SYSTEMS: CoordSystem[] = [
  // → -37.8136, 144.9631
  { id: "aus-gda2020-55", code: 7855, grid: "EPSG:7855", name: "Australia Melbourne (MGA 55)", flag: "🇦🇺", station: "AUS-MEL-07", datum: "GDA2020", accuracy: "< 1 mm", def: "+proj=utm +zone=55 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m", unit: "m", defaultE: 320704.446, defaultN: 5812911.7, defaultZ: 21 },
  // → -27.4728, 153.0243
  { id: "aus-gda2020-56", code: 7856, grid: "EPSG:7856", name: "Australia Brisbane (MGA 56)", flag: "🇦🇺", station: "AUS-BNE-03", datum: "GDA2020", accuracy: "< 1 mm", def: "+proj=utm +zone=56 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m", unit: "m", defaultE: 502400, defaultN: 6961200, defaultZ: 14 },
  // → -41.2939, 174.7700
  { id: "nz-nztm2000", code: 2193, grid: "EPSG:2193", name: "New Zealand NZTM2000", flag: "🇳🇿", station: "NZL-WLG-01", datum: "NZGD2000", accuracy: "< 1 mm", def: "+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m", unit: "m", defaultE: 1748200, defaultN: 5427100, defaultZ: 19 },
  // → -23.5538, -46.6518
  { id: "brazil-utm23s", code: 31983, grid: "EPSG:31983", name: "Brazil São Paulo / Rio (UTM 23S)", flag: "🇧🇷", station: "BRA-SAO-01", datum: "SIRGAS 2000", accuracy: "< 1 mm", def: "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m", unit: "m", defaultE: 331400, defaultN: 7394200, defaultZ: 760 },
  // → -33.8949, 18.5330
  { id: "safrica-lo19", code: 2048, grid: "EPSG:2048", name: "South Africa Cape Town (Lo 19)", flag: "🇿🇦", station: "ZAF-CPT-01", datum: "Hartebeesthoek94", accuracy: "< 1 mm", def: "+proj=tmerc +axis=wsu +lat_0=0 +lon_0=19 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m", unit: "m", defaultE: 43200, defaultN: 3752100, defaultZ: 18 },
];

const CURATED_GROUPS: { label: string; systems: CoordSystem[] }[] = [
  { label: "Popular", systems: POPULAR_SYSTEMS },
  { label: "Middle East & Gulf", systems: GULF_SYSTEMS },
  { label: "Asia & Subcontinent", systems: ASIA_SYSTEMS },
  { label: "Europe & UK", systems: EUROPE_SYSTEMS },
  { label: "North America", systems: AMERICAS_SYSTEMS },
  { label: "Oceania, Africa & S. America", systems: OCEANIA_AFRICA_SYSTEMS },
];
const CURATED: CoordSystem[] = CURATED_GROUPS.flatMap((g) => g.systems);

/* proj4js ignores +axis. The southern African "Lo" grids count positive to the
   west and south (+axis=wsu / swu), so real Y/X values would land in the wrong
   hemisphere: flip those directions here. Easting field = Y (westing),
   northing field = X (southing), as surveyors there enter them. */
function axisSigns(def: string): [number, number] {
  const axis = /\+axis=(\w{3})/.exec(def)?.[1];
  if (!axis) return [1, 1];
  return [axis.includes("w") ? -1 : 1, axis.includes("s") ? -1 : 1];
}

/* Turn an EPSG index row into a usable system, with a sample point at the
   centre of the system's area of use. */
function systemFromRow([code, name, def, bbox, unit]: EpsgRow): CoordSystem {
  const [north, west, south, east] = bbox;
  const lat = (north + south) / 2;
  let lon = west <= east ? (west + east) / 2 : (west + east + 360) / 2;
  if (lon > 180) lon -= 360;
  let defaultE = 0;
  let defaultN = 0;
  try {
    const [sx, sy] = axisSigns(def);
    const [e, n] = proj4("WGS84", def, [lon, lat]);
    [defaultE, defaultN] = [e * sx, n * sy].map((v) => Number(v.toFixed(3)));
  } catch {
    // keep 0, 0 — the user can type their own coordinates
  }
  return {
    id: `epsg-${code}`,
    code,
    grid: `EPSG:${code}`,
    name,
    flag: "🌐",
    station: `EPSG${code}-PT01`,
    datum: name.split(" / ")[0],
    accuracy: "Per EPSG",
    def,
    unit,
    defaultE,
    defaultN,
    defaultZ: 0,
  };
}

/* Grid (E, N) → WGS84 (lat, lon); null when the input is outside what the projection can invert */
function gridToWgs84(sys: CoordSystem, easting: number, northing: number): { lat: number; lon: number } | null {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  try {
    const [sx, sy] = axisSigns(sys.def);
    const [lon, lat] = proj4(sys.def, "WGS84", [easting * sx, northing * sy]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    // Far outside a projection's domain the inverse returns garbage; it must round-trip
    const [e2, n2] = proj4("WGS84", sys.def, [lon, lat]);
    if (Math.hypot(e2 * sx - easting, n2 * sy - northing) > 1) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

function centralMeridian(def: string): number | null {
  const m = def.match(/\+lon_0=(-?[\d.]+)/) ?? def.match(/\+zone=(\d+)/);
  if (!m) return null;
  return def.includes("+zone=") && !def.includes("+lon_0=") ? Number(m[1]) * 6 - 183 : Number(m[1]);
}

/* ─── Radar Display Canvas ─── */
function RadarCanvas({ blipX, blipY }: { blipX: number; blipY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const frameRef = useRef(0);
  const blipRef = useRef({ x: blipX, y: blipY });

  useEffect(() => {
    blipRef.current = { x: blipX, y: blipY };
  }, [blipX, blipY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(cx, cy) * 0.88;

      ctx.clearRect(0, 0, w, h);

      // Radial background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.4);
      bgGrad.addColorStop(0, "rgba(3, 17, 35, 0.97)");
      bgGrad.addColorStop(1, "rgba(1, 5, 12, 1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle Grid
      ctx.strokeStyle = "rgba(0, 180, 255, 0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h / 8) * i);
        ctx.lineTo(w, (h / 8) * i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((w / 8) * i, 0);
        ctx.lineTo((w / 8) * i, h);
        ctx.stroke();
      }

      // Rings
      for (const frac of [0.25, 0.5, 0.75, 1.0]) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 180, 255, ${frac === 1 ? 0.15 : 0.07})`;
        ctx.lineWidth = frac === 1 ? 1 : 0.6;
        ctx.stroke();
      }

      // Sweep Beam
      const sweep = angleRef.current;
      const trail = Math.PI * 0.3;
      for (let i = 0; i < 30; i++) {
        const f = i / 30;
        const a2 = sweep - trail * f;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, a2 - 0.025, a2 + 0.025);
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 200, 255, ${0.15 * (1 - f)})`;
        ctx.fill();
      }

      // Leading line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR);
      ctx.strokeStyle = "rgba(0, 220, 255, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Blip
      const bx = cx + blipRef.current.x * maxR * 0.7;
      const by = cy - blipRef.current.y * maxR * 0.7;
      const blipAngle = Math.atan2(-blipRef.current.y, blipRef.current.x);
      const angleDiff = ((sweep - blipAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      let alpha = angleDiff < Math.PI * 0.5 ? 1 - angleDiff / (Math.PI * 0.5) : 0;
      alpha = Math.max(alpha, 0.15 + 0.08 * Math.sin(Date.now() / 400));

      const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 12);
      glow.addColorStop(0, `rgba(0, 255, 180, ${alpha * 0.6})`);
      glow.addColorStop(1, "rgba(0, 255, 180, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(bx, by, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 180, ${alpha})`;
      ctx.fill();

      // Cardinal labels
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "rgba(0, 180, 255, 0.25)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("N", cx, cy - maxR - 8);
      ctx.fillText("S", cx, cy + maxR + 8);
      ctx.fillText("E", cx + maxR + 8, cy);
      ctx.fillText("W", cx - maxR - 8, cy);

      angleRef.current += 0.018;
      if (angleRef.current > Math.PI * 2) angleRef.current -= Math.PI * 2;
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-xl" />;
}

/* ─── HeroConverter Component ─── */
/* ─── Searchable system picker (curated list + full EPSG registry) ─── */
const RESULT_LIMIT = 50;

type PickerItem = { key: string; code: number; name: string; flag: string; pick: () => CoordSystem };

function SystemPicker({ value, onChange }: { value: CoordSystem; onChange: (sys: CoordSystem) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<EpsgRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch the full EPSG list (~160 KB gzipped) only once the picker is first opened
  useEffect(() => {
    if (!open || rows || loadError) return;
    let cancelled = false;
    fetch("/data/epsg-projected.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: EpsgRow[]) => !cancelled && setRows(data))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [open, rows, loadError]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const { groups, items, total } = useMemo(() => {
    const curatedItem = (sys: CoordSystem): PickerItem => ({
      key: sys.id, code: sys.code, name: sys.name, flag: sys.flag, pick: () => sys,
    });
    const q = query.trim().toLowerCase().replace(/^epsg:?\s*/, "");
    if (!q) {
      const g = CURATED_GROUPS.map((grp) => ({ label: grp.label, items: grp.systems.map(curatedItem) }));
      return { groups: g, items: g.flatMap((x) => x.items), total: CURATED.length };
    }
    const tokens = q.split(/\s+/);
    const matches = (text: string) => {
      const t = text.toLowerCase();
      return tokens.every((tok) => t.includes(tok));
    };
    // Curated presets match on their own label or on their official EPSG name
    const officialName = new Map((rows ?? []).map((r) => [r[0], r[1]]));
    const curatedHits = CURATED.filter((sys) =>
      matches(`${sys.code} ${sys.name} ${sys.datum} ${officialName.get(sys.code) ?? ""}`)
    );
    const curatedCodes = new Set(CURATED.map((sys) => sys.code));
    const registryHits = (rows ?? []).filter((row) => !curatedCodes.has(row[0]) && matches(`${row[0]} ${row[1]}`));

    // Rank: exact code, then curated, then modern global datums, then registry order
    const rank = (code: number, name: string, curated: boolean) =>
      (String(code) === q ? 0 : 4) + (curated ? 0 : 2) + (/^(WGS 84|ETRS89|NAD83|GDA2020|SIRGAS 2000)\b/.test(name) ? 0 : 1);
    const ranked = [
      ...curatedHits.map((sys) => ({ r: rank(sys.code, officialName.get(sys.code) ?? "WGS 84", true), item: curatedItem(sys) })),
      ...registryHits.map((row) => ({
        r: rank(row[0], row[1], false),
        item: { key: `epsg-${row[0]}`, code: row[0], name: row[1], flag: "🌐", pick: () => systemFromRow(row) },
      })),
    ].sort((a, b) => a.r - b.r);
    const found = ranked.slice(0, RESULT_LIMIT).map((x) => x.item);
    return { groups: [{ label: "", items: found }], items: found, total: ranked.length };
  }, [query, rows]);

  const choose = (item: PickerItem) => {
    onChange(item.pick());
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.max(0, Math.min(items.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let index = -1;
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="hc-system"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setActive(0);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-base sm:text-[13px] font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
        style={{ background: "rgba(0, 180, 255, 0.05)", border: "1px solid rgba(0, 180, 255, 0.15)", color: "#e0f2fe" }}
      >
        <span className="shrink-0">{value.flag}</span>
        <span className="flex-1 min-w-0 truncate">{value.name}</span>
        <span className="shrink-0 font-mono text-[11px] text-cyan-400/70">{value.grid}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-cyan-400/80 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-lg overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{ background: "#041528", border: "1px solid rgba(0, 180, 255, 0.2)" }}
        >
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.12)" }}>
            <Search className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded
              aria-controls="hc-system-list"
              aria-activedescendant={items[active] ? `hc-opt-${items[active].key}` : undefined}
              aria-label="Search coordinate systems"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search country, zone or EPSG code…"
              className="flex-1 min-w-0 bg-transparent text-base sm:text-[13px] text-cyan-50 placeholder:text-cyan-400/40 focus:outline-none"
            />
          </div>

          <ul ref={listRef} id="hc-system-list" role="listbox" aria-label="Coordinate systems" className="max-h-56 overflow-y-auto py-1">
            {groups.map((grp) => (
              <React.Fragment key={grp.label || "results"}>
                {grp.label && (
                  <li role="presentation" className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400/80">
                    {grp.label}
                  </li>
                )}
                {grp.items.map((item) => {
                  index++;
                  const i = index;
                  const isActive = i === active;
                  const isSelected = item.code === value.code && item.name === value.name;
                  return (
                    <li
                      key={item.key}
                      id={`hc-opt-${item.key}`}
                      role="option"
                      aria-selected={isSelected}
                      data-index={i}
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(item)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-[12.5px] cursor-pointer ${isActive ? "bg-cyan-400/10" : ""}`}
                    >
                      <span className="shrink-0">{item.flag}</span>
                      <span className={`flex-1 min-w-0 truncate ${isSelected ? "text-cyan-300 font-semibold" : "text-cyan-50"}`}>
                        {item.name}
                      </span>
                      <span className="shrink-0 font-mono text-[10.5px] text-cyan-400/80">EPSG:{item.code}</span>
                    </li>
                  );
                })}
              </React.Fragment>
            ))}
            {items.length === 0 && (
              <li className="px-3 py-4 text-center text-[12px] text-cyan-400/80">
                {rows || loadError ? `No systems match “${query}”` : "Loading EPSG registry…"}
              </li>
            )}
          </ul>

          <div
            className="px-3 py-1.5 text-[10.5px] text-cyan-400/80 flex justify-between gap-2"
            style={{ borderTop: "1px solid rgba(0, 180, 255, 0.12)" }}
          >
            <span>
              {loadError
                ? "Couldn't load the full registry — showing curated systems"
                : query.trim()
                  ? total > items.length
                    ? `Showing ${items.length} of ${total.toLocaleString()} — refine your search`
                    : `${total.toLocaleString()} match${total === 1 ? "" : "es"}`
                  : `${CURATED.length} curated · type to search ${rows ? rows.length.toLocaleString() : "5,800+"} EPSG systems`}
            </span>
            <span className="hidden sm:inline">↑↓ Enter</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Batch mode: paste many rows, download one KML ─── */
function BatchPanel({ sys }: { sys: CoordSystem }) {
  const [text, setText] = useState("");
  const [order, setOrder] = useState<ColumnOrder>("ENZ");
  const [downloaded, setDownloaded] = useState(false);

  const { points, issues, truncated } = useMemo(() => {
    const parsed = parseSurveyRows(text, order);
    const converted: ConvertedPoint[] = [];
    const problems = [...parsed.issues];
    for (const row of parsed.rows) {
      const ll = gridToWgs84(sys, row.easting, row.northing);
      if (ll) converted.push({ ...row, ...ll });
      else problems.push({ line: row.line, message: `outside ${sys.grid}'s range` });
    }
    problems.sort((a, b) => a.line - b.line);
    return { points: converted, issues: problems, truncated: parsed.truncated };
  }, [text, order, sys]);

  // A few rows around this system's sample point, so the example always lands in range
  const loadExample = () => {
    const offsets = [[0, 0, 0], [125.4, 48.2, 1.2], [210.8, -96.5, 2.9], [64.1, -181.7, 0.6], [-58.3, -92.4, -0.4]];
    const lines = offsets.map(([de, dn, dz], i) =>
      [`BM-${String(i + 1).padStart(2, "0")}`, (sys.defaultE + de).toFixed(3), (sys.defaultN + dn).toFixed(3), (sys.defaultZ + dz).toFixed(2)].join("\t")
    );
    setOrder("ENZ");
    setText(["Point\tEasting\tNorthing\tElevation", ...lines].join("\n"));
  };

  const download = () => {
    const kml = buildKml(points, { title: `${sys.name} — ${points.length} survey points`, gridLabel: `${sys.name} (${sys.grid})`, unit: sys.unit });
    const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey_points_${sys.grid.replace(":", "_")}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2200);
  };

  const fieldStyle: React.CSSProperties = {
    background: "rgba(0, 180, 255, 0.04)",
    border: "1px solid rgba(0, 180, 255, 0.12)",
    color: "#e0f2fe",
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="hc-batch" className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/70">
          Paste rows from Excel or CSV
        </label>
        <button
          type="button"
          onClick={loadExample}
          className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 underline underline-offset-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 rounded"
        >
          Load example
        </button>
      </div>
      <textarea
        id="hc-batch"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        spellCheck={false}
        aria-describedby="hc-batch-help"
        placeholder={`Point  Easting  Northing  Elevation\nBM-01  ${sys.defaultE}  ${sys.defaultN}  ${sys.defaultZ}\n…`}
        className="w-full px-3 py-2.5 rounded-lg text-base sm:text-[12px] leading-relaxed font-mono resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40 placeholder:text-cyan-400/30"
        style={fieldStyle}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="hc-batch-help" className="text-[10.5px] text-cyan-400/80">
          ID, easting, northing, elevation · tabs, commas or spaces · up to {MAX_ROWS.toLocaleString()} rows
        </p>
        <label className="flex items-center gap-1.5 text-[10.5px] text-cyan-400/70">
          Column order
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as ColumnOrder)}
            className="rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer"
            style={fieldStyle}
          >
            <option value="ENZ" style={{ background: "#030e1e" }}>E, N</option>
            <option value="NEZ" style={{ background: "#030e1e" }}>N, E</option>
          </select>
        </label>
      </div>

      {/* Result summary */}
      <div
        className="rounded-lg p-3 space-y-2"
        style={{ background: "rgba(0, 255, 180, 0.04)", border: "1px solid rgba(0, 255, 180, 0.1)" }}
        aria-live="polite"
      >
        {text.trim() === "" ? (
          <p className="text-[12px] text-cyan-400/80">
            Paste your points above — each row converts to WGS84 in your browser, nothing is uploaded.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {points.length.toLocaleString()} point{points.length === 1 ? "" : "s"} converted
              </span>
              {issues.length > 0 && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {issues.length} skipped
                </span>
              )}
              {truncated && <span className="text-amber-300">first {MAX_ROWS.toLocaleString()} rows only</span>}
            </div>
            {issues.length > 0 && (
              <ul className="text-[11px] text-amber-200/80 space-y-0.5">
                {issues.slice(0, 1).map((iss) => (
                  <li key={iss.line}>
                    Line {iss.line}: {iss.message}
                  </li>
                ))}
                {issues.length > 1 && <li>…and {issues.length - 1} more</li>}
              </ul>
            )}
            {points.length > 0 && (
              <ul className="text-[11.5px] font-mono text-cyan-100/90 space-y-0.5">
                {points.slice(0, 2).map((pt) => (
                  <li key={pt.line} className="flex justify-between gap-3">
                    <span className="truncate text-cyan-300">{pt.id}</span>
                    <span className="shrink-0">
                      {Math.abs(pt.lat).toFixed(6)}° {pt.lat >= 0 ? "N" : "S"}, {Math.abs(pt.lon).toFixed(6)}° {pt.lon >= 0 ? "E" : "W"}
                    </span>
                  </li>
                ))}
                {points.length > 2 && <li className="text-cyan-400/80">+ {points.length - 2} more</li>}
              </ul>
            )}
          </>
        )}
        <button
          type="button"
          onClick={download}
          disabled={points.length === 0}
          className="w-full mt-1 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          style={{
            background: downloaded ? "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))" : "linear-gradient(135deg, #0071e3, #0284c7)",
            color: "#fff",
            border: "1px solid rgba(56, 189, 248, 0.4)",
          }}
        >
          {downloaded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          <span>{downloaded ? "Downloaded" : `Download KML${points.length ? ` (${points.length.toLocaleString()} points)` : ""}`}</span>
        </button>
      </div>
    </div>
  );
}

/** Start on a curated system (initialSystemId) or any EPSG system (initialRow),
    as the grid landing pages do; otherwise on the first popular system. */
export default function HeroConverter({ initialSystemId, initialRow }: { initialSystemId?: string; initialRow?: EpsgRow } = {}) {
  const [current, setCurrent] = useState<CoordSystem>(
    () =>
      (initialRow ? systemFromRow(initialRow) : undefined) ??
      CURATED.find((s) => s.id === initialSystemId) ??
      POPULAR_SYSTEMS[0]
  );
  const [mode, setMode] = useState<"single" | "batch">("single");

  const [easting, setEasting] = useState<number>(current.defaultE);
  const [northing, setNorthing] = useState<number>(current.defaultN);
  const [elevation, setElevation] = useState<number>(current.defaultZ);

  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // When changing system from dropdown, update coordinates to defaults
  const handleSystemChange = (sys: CoordSystem) => {
    setCurrent(sys);
    setEasting(sys.defaultE);
    setNorthing(sys.defaultN);
    setElevation(sys.defaultZ);
  };

  // Real-time grid → WGS84 conversion with proj4 (includes the datum shift)
  const result = useMemo(() => gridToWgs84(current, easting, northing), [easting, northing, current]);
  const valid = result !== null;
  const computed = result ?? { lat: 0, lon: 0 };

  const computedLat = computed.lat.toFixed(6);
  const computedLon = computed.lon.toFixed(6);

  // Normalized blip position
  const dE = (easting || 0) - current.defaultE;
  const dN = (northing || 0) - current.defaultN;
  const blipX = Math.max(-0.95, Math.min(0.95, dE / 5000));
  const blipY = Math.max(-0.95, Math.min(0.95, dN / 5000));

  const copyCoords = useCallback(() => {
    navigator.clipboard.writeText(`${computedLat}, ${computedLon}`).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [computedLat, computedLon]);

  const downloadKml = useCallback(() => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${current.station} - Survey Benchmark</name>
    <description><![CDATA[Converted via Excel to KML Pro
Grid: ${current.name} (${current.grid})
Easting: ${easting} m
Northing: ${northing} m
Elevation: ${elevation} m
Datum: ${current.datum}]]></description>
    <Style id="surveyStyle">
      <IconStyle>
        <color>ff00e6ff</color>
        <scale>1.25</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0.9</scale>
      </LabelStyle>
    </Style>
    <Placemark>
      <name>${current.station}</name>
      <description><![CDATA[
        <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.5; color: #1e293b;">
          <h3 style="margin: 0 0 6px 0; color: #0071e3; font-size: 15px;">${current.station}</h3>
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 11px;">Grid: <b>${current.name}</b> (${current.grid})</p>
          <table style="border-collapse: collapse; width: 100%; font-size: 12px;">
            <tr style="background: #f1f5f9;"><td style="padding: 4px 8px; font-weight: 600;">Easting (m)</td><td style="padding: 4px 8px; font-family: monospace;">${easting}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: 600;">Northing (m)</td><td style="padding: 4px 8px; font-family: monospace;">${northing}</td></tr>
            <tr style="background: #f1f5f9;"><td style="padding: 4px 8px; font-weight: 600;">Elevation (m)</td><td style="padding: 4px 8px; font-family: monospace;">${elevation}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: 600;">WGS84 Latitude</td><td style="padding: 4px 8px; font-family: monospace;">${computedLat}° ${parseFloat(computedLat) >= 0 ? "N" : "S"}</td></tr>
            <tr style="background: #f1f5f9;"><td style="padding: 4px 8px; font-weight: 600;">WGS84 Longitude</td><td style="padding: 4px 8px; font-family: monospace;">${computedLon}° ${parseFloat(computedLon) >= 0 ? "E" : "W"}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: 600;">Accuracy</td><td style="padding: 4px 8px; color: #059669; font-weight: bold;">${current.accuracy}</td></tr>
          </table>
        </div>
      ]]></description>
      <styleUrl>#surveyStyle</styleUrl>
      <Point>
        <extrude>1</extrude>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${computedLon},${computedLat},${elevation}</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current.station}_${current.grid.replace(":", "_")}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2200);
  }, [current, easting, northing, elevation, computedLat, computedLon]);

  const inputStyle: React.CSSProperties = {
    background: "rgba(0, 180, 255, 0.04)",
    border: "1px solid rgba(0, 180, 255, 0.12)",
    color: "#e0f2fe",
  };

  return (
    <div className="w-full min-w-0 max-w-[640px] mx-auto lg:mx-0">
      <div
        className="rounded-2xl"
        style={{
          background: "rgba(3, 14, 30, 0.95)",
          border: "1px solid rgba(0, 180, 255, 0.12)",
          boxShadow: "0 8px 40px rgba(0, 0, 0, 0.25), 0 0 60px rgba(0, 100, 200, 0.06)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.08)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(0,180,255,0.25), rgba(0,255,180,0.15))",
                border: "1px solid rgba(0,180,255,0.2)",
              }}
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[13px] font-bold text-cyan-50 leading-tight truncate">
                <span className="sm:hidden">Quick Converter</span>
                <span className="hidden sm:inline">Quick Coordinate Converter</span>
              </h2>
              <p className="hidden sm:block text-[11px] font-medium truncate" style={{ color: "rgba(0,180,255,0.85)" }}>
                Grid (E, N) → GPS (Lat, Lon) • 5,800+ EPSG systems
              </p>
            </div>
          </div>
          {/* Single point / many points */}
          <div
            role="tablist"
            aria-label="Conversion mode"
            className="shrink-0 flex p-0.5 rounded-lg"
            style={{ background: "rgba(0, 180, 255, 0.05)", border: "1px solid rgba(0, 180, 255, 0.12)" }}
          >
            {([
              ["single", "Single", RefreshCw],
              ["batch", "Many rows", ClipboardPaste],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                  mode === id ? "bg-cyan-400/15 text-cyan-100" : "text-cyan-400/80 hover:text-cyan-200"
                }`}
              >
                <Icon className="w-3 h-3" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-0">
          {/* ── Left: Inputs ── */}
          <div className="sm:col-span-7 px-4 py-4 space-y-3" style={{ borderRight: "1px solid rgba(0,180,255,0.06)" }}>

            {/* Simple, Clean Dropdown for ALL World Systems */}
            <div>
              <label htmlFor="hc-system" className="block mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400/70">
                Coordinate system / zone
              </label>

              <SystemPicker value={current} onChange={handleSystemChange} />
            </div>

            {mode === "batch" ? (
              <BatchPanel sys={current} />
            ) : (
            <>
            {/* Easting & Northing Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="hc-easting" className="block text-[10px] font-semibold uppercase tracking-wider mb-1 text-cyan-400/70">
                  Easting ({current.unit})
                </label>
                <input
                  id="hc-easting"
                  inputMode="decimal"
                  type="number"
                  step="0.001"
                  value={easting}
                  onChange={(e) => setEasting(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-lg text-base sm:text-[13px] font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-all"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="hc-northing" className="block text-[10px] font-semibold uppercase tracking-wider mb-1 text-cyan-400/70">
                  Northing ({current.unit})
                </label>
                <input
                  id="hc-northing"
                  inputMode="decimal"
                  type="number"
                  step="0.001"
                  value={northing}
                  onChange={(e) => setNorthing(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-lg text-base sm:text-[13px] font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-all"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Elevation Input */}
            <div>
              <label htmlFor="hc-elevation" className="block text-[10px] font-semibold uppercase tracking-wider mb-1 text-cyan-400/70">
                Elevation (m)
              </label>
              <input
                id="hc-elevation"
                inputMode="decimal"
                type="number"
                step="0.01"
                value={elevation}
                onChange={(e) => setElevation(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-lg text-base sm:text-[13px] font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400/40 transition-all"
                style={inputStyle}
              />
            </div>

            {/* Computed GPS Output */}
            <div
              className="rounded-lg p-3 space-y-2"
              style={{ background: "rgba(0, 255, 180, 0.04)", border: "1px solid rgba(0, 255, 180, 0.1)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${valid ? "text-emerald-400" : "text-amber-300"}`}>
                    {valid ? "WGS84 result" : "Outside this system's range"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyCoords}
                  disabled={!valid}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors hover:bg-cyan-500/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                  style={{ color: "rgba(0,180,255,0.95)", background: "rgba(0,180,255,0.06)" }}
                  title="Copy Latitude, Longitude"
                >
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy GPS"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-medium">Latitude</div>
                  <div className="text-[13px] font-mono font-bold text-cyan-50">
                    {valid ? `${Math.abs(computed.lat).toFixed(6)}° ${computed.lat >= 0 ? "N" : "S"}` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-medium">Longitude</div>
                  <div className="text-[13px] font-mono font-bold text-cyan-50">
                    {valid ? `${Math.abs(computed.lon).toFixed(6)}° ${computed.lon >= 0 ? "E" : "W"}` : "—"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-500/10">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-medium">Elevation</div>
                  <div className="text-[13px] font-mono font-bold text-cyan-300">{elevation >= 0 ? "+" : ""}{elevation} m</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-medium">Accuracy</div>
                  <div className="text-[13px] font-mono font-bold text-emerald-400">{current.accuracy}</div>
                </div>
              </div>

              {/* Download KML Button */}
              <button
                type="button"
                onClick={downloadKml}
                disabled={!valid}
                className="w-full mt-1 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                style={{
                  background: downloaded
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))"
                    : "linear-gradient(135deg, #0071e3, #0284c7)",
                  color: "#ffffff",
                  border: downloaded
                    ? "1px solid rgba(52, 211, 153, 0.5)"
                    : "1px solid rgba(56, 189, 248, 0.4)",
                  boxShadow: downloaded
                    ? "0 0 16px rgba(16, 185, 129, 0.45)"
                    : "0 2px 14px rgba(0, 113, 227, 0.35)",
                }}
              >
                {downloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Downloaded {current.station}.kml</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Download KML</span>
                  </>
                )}
              </button>
            </div>
            </>
            )}
          </div>

          {/* ── Right: Radar Display ── */}
          <div className="hidden sm:flex sm:col-span-5 p-3 flex-col gap-2" aria-hidden>
            <div
              className="relative w-full aspect-square rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(0,180,255,0.08)" }}
            >
              <RadarCanvas blipX={blipX} blipY={blipY} />

              {/* Scan-line overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,180,255,0.01) 2px, rgba(0,180,255,0.01) 4px)",
                }}
              />

              {/* HUD labels */}
              <div
                className="absolute top-2 left-2 text-[9px] font-mono pointer-events-none"
                style={{ color: "rgba(0,180,255,0.8)" }}
              >
                GRID: <span className="text-cyan-300 font-bold">{current.grid}</span>
              </div>
              <div
                className="absolute top-2 right-2 text-[9px] font-mono pointer-events-none"
                style={{ color: "rgba(0,180,255,0.8)" }}
              >
                {centralMeridian(current.def) !== null && <>CM {Number(centralMeridian(current.def)!.toFixed(4))}°</>}
              </div>
              <div
                className="absolute bottom-2 left-2 text-[9px] font-mono pointer-events-none text-emerald-400 font-semibold"
              >
                ● GPS SYNC
              </div>
              <div
                className="absolute bottom-2 right-2 text-[9px] font-mono pointer-events-none"
                style={{ color: "rgba(0,180,255,0.8)" }}
              >
                {current.accuracy}
              </div>

              {/* Corner accents */}
              <div className="absolute top-1 left-1 w-3 h-3 pointer-events-none border-l-[1.5px] border-t-[1.5px] border-cyan-400/20" />
              <div className="absolute top-1 right-1 w-3 h-3 pointer-events-none border-r-[1.5px] border-t-[1.5px] border-cyan-400/20" />
              <div className="absolute bottom-1 left-1 w-3 h-3 pointer-events-none border-l-[1.5px] border-b-[1.5px] border-cyan-400/20" />
              <div className="absolute bottom-1 right-1 w-3 h-3 pointer-events-none border-r-[1.5px] border-b-[1.5px] border-cyan-400/20" />
            </div>

            {/* Station and Datum Info */}
            <div
              className="rounded-lg px-3 py-2 flex items-center justify-between"
              style={{ background: "rgba(0,180,255,0.04)", border: "1px solid rgba(0,180,255,0.08)" }}
            >
              <div>
                <div className="text-[9px] uppercase tracking-wider text-cyan-400/80">Station ID</div>
                <div className="text-[11px] font-mono font-bold text-cyan-200">{current.station}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider text-cyan-400/80">Datum</div>
                <div className="text-[10px] font-mono font-bold text-cyan-100 truncate max-w-[100px]">
                  {current.datum.split(" ")[0]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(0, 180, 255, 0.06)" }}
        >
          <span className="text-[11px] font-medium flex items-center gap-1.5 text-cyan-400/70">
            <Globe className="w-3 h-3 text-cyan-400/80" />
            Exports standard KML 2.2 for Google Earth
          </span>
          <span className="text-[11px] font-mono text-cyan-400/80">
            {current.grid}
          </span>
        </div>
      </div>
    </div>
  );
}
