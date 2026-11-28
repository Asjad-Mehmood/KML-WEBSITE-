// The sample survey data on the home page showcase (components/Showcase.tsx): the datasets for the
// map and table, and the calibration presets with their tolerance.

export interface SurveyRow {
  id: string;
  name: string;
  easting: number;
  northing: number;
  elev: number;
  code: string;
  lat: number;
  lon: number;
}

interface DatasetPreset {
  name: string;
  country: string;
  flag: string;
  grid: string;
  datum: string;
  points: SurveyRow[];
}

export const DATASETS: Record<string, DatasetPreset> = {
  qatar: {
    name: "Qatar National Grid",
    country: "Qatar",
    flag: "🇶🇦",
    grid: "EPSG:2932",
    datum: "Qatar 1995 / QNG",
    points: [
      { id: "QNG-01", name: "Doha Primary Trig", easting: 231956.844, northing: 392642.945, elev: 11.20, code: "CONTROL", lat: 25.2867, lon: 51.5332 },
      { id: "QNG-02", name: "Harbor Boundary West", easting: 232117.645, northing: 392787.335, elev: 8.50, code: "BOUNDARY", lat: 25.2880, lon: 51.5348 },
      { id: "QNG-03", name: "Infrastructure Hub Stn", easting: 232259.038, northing: 392621.505, elev: 14.70, code: "FACILITY", lat: 25.2865, lon: 51.5362 },
      { id: "QNG-04", name: "Pavement Edge Level", easting: 232037.728, northing: 392510.204, elev: 9.90, code: "TOPO", lat: 25.2855, lon: 51.5340 },
    ],
  },
  dubai: {
    name: "Dubai DLTM",
    country: "UAE",
    flag: "🇦🇪",
    grid: "EPSG:3997",
    datum: "WGS 84 / Dubai Local TM",
    points: [
      { id: "BM-01", name: "Master Control Datum", easting: 494060.205, northing: 2787900.173, elev: 14.85, code: "CONTROL", lat: 25.1972, lon: 55.2744 },
      { id: "CP-02", name: "Boundary Corner Peg", easting: 494473.541, northing: 2788154.783, elev: 26.50, code: "BOUNDARY", lat: 25.1995, lon: 55.2785 },
      { id: "CR-03", name: "Ridge Elevation Point", easting: 494725.365, northing: 2787789.122, elev: 38.20, code: "CREST", lat: 25.1962, lon: 55.2810 },
      { id: "BS-04", name: "Traverse Tie Station", easting: 494241.483, northing: 2787567.767, elev: 19.00, code: "TRAVERSE", lat: 25.1942, lon: 55.2762 },
      { id: "CL-05", name: "Road Centerline Stn 0+120", easting: 494170.991, northing: 2787711.806, elev: 16.30, code: "ROAD", lat: 25.1955, lon: 55.2755 },
      { id: "MH-06", name: "Storm Drainage Manhole", easting: 494604.489, northing: 2787966.411, elev: 21.15, code: "UTILITY", lat: 25.1978, lon: 55.2798 },
    ],
  },
  pakistan: {
    name: "Pakistan UTM 43N",
    country: "Pakistan",
    flag: "🇵🇰",
    grid: "EPSG:32643",
    datum: "WGS 84 / UTM zone 43N",
    points: [
      { id: "PAK-01", name: "Islamabad Survey Datum", easting: 319040.999, northing: 3728873.973, elev: 540.50, code: "CONTROL", lat: 33.6844, lon: 73.0478 },
      { id: "PAK-02", name: "Sector Boundary Peg 1", easting: 319229.767, northing: 3729047.905, elev: 548.20, code: "BOUNDARY", lat: 33.6860, lon: 73.0498 },
      { id: "PAK-03", name: "Culvert Flowline Invert", easting: 319366.526, northing: 3728923.293, elev: 535.10, code: "DRAINAGE", lat: 33.6849, lon: 73.0513 },
      { id: "PAK-04", name: "Highway Cross Section", easting: 319140.674, northing: 3728750.059, elev: 538.70, code: "ROAD", lat: 33.6833, lon: 73.0489 },
    ],
  },
  london: {
    name: "British National Grid",
    country: "United Kingdom",
    flag: "🇬🇧",
    grid: "EPSG:27700",
    datum: "OSGB36 / British National Grid",
    points: [
      { id: "OSGB-01", name: "Ordnance Survey Trig", easting: 537921.815, northing: 184572.109, elev: 12.30, code: "CONTROL", lat: 51.5432, lon: -0.0125 },
      { id: "OSGB-02", name: "Property Boundary Wall", easting: 538077.666, northing: 184709.888, elev: 15.60, code: "BOUNDARY", lat: 51.5444, lon: -0.0102 },
      { id: "OSGB-03", name: "Railway Track Baseline", easting: 538213.647, northing: 184557.790, elev: 11.80, code: "RAIL", lat: 51.5430, lon: -0.0083 },
      { id: "OSGB-04", name: "Site Entrance Level", easting: 537994.782, northing: 184440.551, elev: 10.90, code: "ACCESS", lat: 51.5420, lon: -0.0115 },
    ],
  },
};

interface CalibrationPoint {
  id: string;
  name: string;
  role: string;
  dx: string;
  dy: string;
  residual: string;
  color: "blue" | "indigo" | "emerald" | "amber";
}

interface CalibrationPreset {
  name: string;
  country: string;
  flag: string;
  grid: string;
  datum: string;
  scaleFactor: string;
  scalePpm: string;
  rotation: string;
  rotationDeg: number;
  originShiftShort: string;
  originShiftFull: string;
  confidence: string;
  rmsResidual: string;
  maxError: string;
  kmlDatasetKey: string;
  points: CalibrationPoint[];
}

export const CALIBRATION_PRESETS: Record<string, CalibrationPreset> = {
  qatar: {
    name: "Qatar National Network",
    country: "Qatar",
    flag: "🇶🇦",
    grid: "EPSG:2932",
    datum: "Qatar 1995 / QNG",
    scaleFactor: "0.999992",
    scalePpm: "-8.0 ppm",
    rotation: "+0° 00' 06.8\"",
    rotationDeg: 4.2,
    originShiftShort: "+232.0k, +392.6k",
    originShiftFull: "+231,956.84m, +392,642.95m",
    confidence: "99.99%",
    rmsResidual: "0.28 mm",
    maxError: "0.36 mm",
    kmlDatasetKey: "qatar",
    points: [
      { id: "QNG-01", name: "Doha Primary Trig", role: "Primary Trig", dx: "+0.1 mm", dy: "+0.1 mm", residual: "0.14 mm", color: "blue" },
      { id: "QNG-02", name: "Harbor Boundary West", role: "Site Perimeter", dx: "+0.2 mm", dy: "-0.2 mm", residual: "0.28 mm", color: "indigo" },
      { id: "QNG-03", name: "Infrastructure Hub Stn", role: "Master Station", dx: "-0.2 mm", dy: "+0.2 mm", residual: "0.28 mm", color: "emerald" },
      { id: "QNG-04", name: "Pavement Edge Level", role: "Aux Station", dx: "+0.2 mm", dy: "+0.3 mm", residual: "0.36 mm", color: "amber" },
    ],
  },
  dubai: {
    name: "Dubai DLTM Baseline",
    country: "UAE",
    flag: "🇦🇪",
    grid: "EPSG:3997",
    datum: "WGS 84 / Dubai Local TM",
    scaleFactor: "0.999984",
    scalePpm: "-16.0 ppm",
    rotation: "+0° 00' 14.2\"",
    rotationDeg: 8.5,
    originShiftShort: "+494.1k, +2,787.9k",
    originShiftFull: "+494,060.20m, +2,787,900.17m",
    confidence: "99.98%",
    rmsResidual: "0.38 mm",
    maxError: "0.45 mm",
    kmlDatasetKey: "dubai",
    points: [
      { id: "BM-01", name: "Master Control Datum", role: "Primary Trig", dx: "+0.1 mm", dy: "+0.2 mm", residual: "0.22 mm", color: "blue" },
      { id: "CP-02", name: "Boundary Corner Peg", role: "Site Perimeter", dx: "+0.3 mm", dy: "-0.2 mm", residual: "0.36 mm", color: "indigo" },
      { id: "CR-03", name: "Ridge Elevation Point", role: "Elevated Benchmark", dx: "-0.1 mm", dy: "+0.3 mm", residual: "0.31 mm", color: "emerald" },
      { id: "BS-04", name: "Traverse Tie Station", role: "Backsight Tie", dx: "+0.2 mm", dy: "+0.4 mm", residual: "0.45 mm", color: "amber" },
    ],
  },
  london: {
    name: "Crossrail London Grid",
    country: "United Kingdom",
    flag: "🇬🇧",
    grid: "EPSG:27700",
    datum: "OSGB36 / British National Grid",
    scaleFactor: "0.999601",
    scalePpm: "-39.9 ppm",
    rotation: "-0° 01' 08.4\"",
    rotationDeg: -12.0,
    originShiftShort: "+537.9k, +184.6k",
    originShiftFull: "+537,921.81m, +184,572.11m",
    confidence: "99.96%",
    rmsResidual: "0.42 mm",
    maxError: "0.44 mm",
    kmlDatasetKey: "london",
    points: [
      { id: "OSGB-01", name: "Ordnance Survey Trig", role: "Primary Trig", dx: "+0.2 mm", dy: "-0.3 mm", residual: "0.36 mm", color: "blue" },
      { id: "OSGB-02", name: "Property Boundary Wall", role: "Site Perimeter", dx: "+0.3 mm", dy: "+0.2 mm", residual: "0.36 mm", color: "indigo" },
      { id: "OSGB-03", name: "Railway Track Baseline", role: "Rail Control", dx: "-0.2 mm", dy: "+0.4 mm", residual: "0.44 mm", color: "emerald" },
      { id: "OSGB-04", name: "Site Entrance Level", role: "Tunnel Datum", dx: "+0.3 mm", dy: "+0.3 mm", residual: "0.42 mm", color: "amber" },
    ],
  },
  pakistan: {
    name: "Pakistan Survey Sector",
    country: "Pakistan",
    flag: "🇵🇰",
    grid: "EPSG:32643",
    datum: "WGS 84 / UTM zone 43N",
    scaleFactor: "0.999600",
    scalePpm: "-40.0 ppm",
    rotation: "+0° 01' 32.1\"",
    rotationDeg: 14.5,
    originShiftShort: "+319.0k, +3,728.9k",
    originShiftFull: "+319,041.00m, +3,728,873.97m",
    confidence: "99.95%",
    rmsResidual: "0.45 mm",
    maxError: "0.50 mm",
    kmlDatasetKey: "pakistan",
    points: [
      { id: "PAK-01", name: "Islamabad Survey Datum", role: "Primary Trig", dx: "+0.3 mm", dy: "+0.2 mm", residual: "0.36 mm", color: "blue" },
      { id: "PAK-02", name: "Sector Boundary Peg 1", role: "Site Perimeter", dx: "+0.4 mm", dy: "-0.3 mm", residual: "0.50 mm", color: "indigo" },
      { id: "PAK-03", name: "Culvert Flowline Invert", role: "Hydraulic Tie", dx: "-0.2 mm", dy: "+0.3 mm", residual: "0.36 mm", color: "emerald" },
      { id: "PAK-04", name: "Highway Cross Section", role: "Road Corridor", dx: "+0.3 mm", dy: "+0.4 mm", residual: "0.50 mm", color: "amber" },
    ],
  },
};

// Residual plot: 200 px per millimetre, rings at 0.25 / 0.5 mm
export const PLOT_SCALE = 200;
export const TOLERANCE_MM = 5;
export const PLOT_RINGS = [
  { mm: 0.5, stroke: "rgba(96,165,250,0.45)", fill: "rgba(59,130,246,0.05)", label: "rgba(147,197,253,0.7)", dashed: true },
  { mm: 0.25, stroke: "rgba(52,211,153,0.5)", fill: "rgba(16,185,129,0.08)", label: "rgba(110,231,183,0.7)", dashed: false },
];
export const POINT_HEX: Record<CalibrationPoint["color"], string> = {
  blue: "#60a5fa",
  indigo: "#818cf8",
  emerald: "#34d399",
  amber: "#fbbf24",
};
