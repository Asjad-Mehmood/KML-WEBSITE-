// The converter's coordinate systems: the curated list (with a real benchmark for each) and the
// helpers that turn any EPSG row into one, convert grid to WGS84 and read a central meridian.
// Used by components/HeroConverter.tsx and its parts in components/hero/.
import proj4 from "proj4";

/* ─── Coordinate System Definition ─── */
export interface CoordSystem {
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
export const POPULAR_SYSTEMS: CoordSystem[] = [
  // → 25.2846, 51.5291
  { id: "qatar-qng", code: 2932, grid: "EPSG:2932", name: "Qatar National Grid (QNG)", flag: "🇶🇦", station: "QNG-DOH-12", datum: "Qatar 1995", accuracy: "< 1 mm", def: "+proj=tmerc +lat_0=24.45 +lon_0=51.2166666666667 +k=0.99999 +x_0=200000 +y_0=300000 +ellps=intl +towgs84=-119.4248,-303.65872,-11.00061,1.164298,0.174458,1.096259,3.657065 +units=m", unit: "m", defaultE: 231540.25, defaultN: 392410.8, defaultZ: 11.2 },
  // → 25.1932, 55.4678
  { id: "dubai-dltm", code: 3997, grid: "EPSG:3997", name: "Dubai DLTM", flag: "🇦🇪", station: "BM-DUB-01", datum: "WGS-84 / DLTM", accuracy: "< 1 mm", def: "+proj=tmerc +lat_0=0 +lon_0=55.3333333333333 +k=1 +x_0=500000 +y_0=0 +datum=WGS84 +units=m", unit: "m", defaultE: 513556.612, defaultN: 2787467.856, defaultZ: 14.85 },
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

export const CURATED_GROUPS: { label: string; systems: CoordSystem[] }[] = [
  { label: "Popular", systems: POPULAR_SYSTEMS },
  { label: "Middle East & Gulf", systems: GULF_SYSTEMS },
  { label: "Asia & Subcontinent", systems: ASIA_SYSTEMS },
  { label: "Europe & UK", systems: EUROPE_SYSTEMS },
  { label: "North America", systems: AMERICAS_SYSTEMS },
  { label: "Oceania, Africa & S. America", systems: OCEANIA_AFRICA_SYSTEMS },
];
export const CURATED: CoordSystem[] = CURATED_GROUPS.flatMap((g) => g.systems);

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
export function systemFromRow([code, name, def, bbox, unit]: EpsgRow): CoordSystem {
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
export function gridToWgs84(sys: CoordSystem, easting: number, northing: number): { lat: number; lon: number } | null {
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

export function centralMeridian(def: string): number | null {
  const m = def.match(/\+lon_0=(-?[\d.]+)/) ?? def.match(/\+zone=(\d+)/);
  if (!m) return null;
  return def.includes("+zone=") && !def.includes("+lon_0=") ? Number(m[1]) * 6 - 183 : Number(m[1]);
}
