"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "../context/AuthContext";
import {
  Download,
  Globe,
  FileSpreadsheet,
  Compass,
  CheckCircle2,
  Search,
  ShieldCheck,
  RotateCw,
} from "lucide-react";

// Dynamically import the Live Satellite Map
const RealSatelliteMap = dynamic(() => import("./RealSatelliteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center gap-2 text-cyan-300 font-mono text-xs">
      <Globe className="w-6 h-6 animate-spin text-cyan-500" aria-hidden />
      <span>Loading Interactive Satellite View...</span>
    </div>
  ),
});

type TabId = "map" | "table" | "calibration";

interface SurveyRow {
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

const DATASETS: Record<string, DatasetPreset> = {
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

const CALIBRATION_PRESETS: Record<string, CalibrationPreset> = {
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
const PLOT_SCALE = 200;
const TOLERANCE_MM = 5;
const PLOT_RINGS = [
  { mm: 0.5, stroke: "rgba(96,165,250,0.45)", fill: "rgba(59,130,246,0.05)", label: "rgba(147,197,253,0.7)", dashed: true },
  { mm: 0.25, stroke: "rgba(52,211,153,0.5)", fill: "rgba(16,185,129,0.08)", label: "rgba(110,231,183,0.7)", dashed: false },
];
const POINT_HEX: Record<CalibrationPoint["color"], string> = {
  blue: "#60a5fa",
  indigo: "#818cf8",
  emerald: "#34d399",
  amber: "#fbbf24",
};

interface ShowcaseProps {
  versionTag: string;
  onToast: (msg: string) => void;
}

export default function Showcase({ versionTag, onToast }: ShowcaseProps) {
  const { requireAuth, trackDownload } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [selectedDatasetKey, setSelectedDatasetKey] = useState<string>("dubai");
  const [selectedCalibrationKey, setSelectedCalibrationKey] = useState<string>("dubai");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const currentDataset = DATASETS[selectedDatasetKey] || DATASETS.dubai;

  const filteredPoints = currentDataset.points.filter((pt) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      pt.id.toLowerCase().includes(q) ||
      pt.name.toLowerCase().includes(q) ||
      pt.code.toLowerCase().includes(q)
    );
  });

  const handleDownloadDatasetKml = (datasetName: string, points: SurveyRow[]) => {
    requireAuth(() => {
      const placemarks = points
        .map(
          (p) => `    <Placemark>
      <name>${p.id} - ${p.name}</name>
      <description><![CDATA[
        <div style="font-family: sans-serif; font-size: 13px;">
          <h3 style="color: #0071e3; margin: 0 0 6px;">${p.id} (${p.code})</h3>
          <p style="margin: 0 0 6px; color: #64748b;">${p.name}</p>
          <table style="border-collapse: collapse; width: 100%; font-size: 12px;">
            <tr><td style="padding: 3px 6px; font-weight: bold;">Easting:</td><td>${p.easting.toFixed(3)} m</td></tr>
            <tr><td style="padding: 3px 6px; font-weight: bold;">Northing:</td><td>${p.northing.toFixed(3)} m</td></tr>
            <tr><td style="padding: 3px 6px; font-weight: bold;">Elevation:</td><td>${p.elev.toFixed(2)} m</td></tr>
            <tr><td style="padding: 3px 6px; font-weight: bold;">Grid:</td><td>${currentDataset.grid}</td></tr>
            <tr><td style="padding: 3px 6px; font-weight: bold;">WGS84 Lat:</td><td>${p.lat.toFixed(6)}°</td></tr>
            <tr><td style="padding: 3px 6px; font-weight: bold;">WGS84 Lon:</td><td>${p.lon.toFixed(6)}°</td></tr>
          </table>
        </div>
      ]]></description>
      <Point>
        <extrude>1</extrude>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${p.lon},${p.lat},${p.elev}</coordinates>
      </Point>
    </Placemark>`
        )
        .join("\n");

      const coordStr = points.map((p) => `${p.lon},${p.lat},${p.elev}`).join(" ");
      const polygonXml =
        points.length >= 3
          ? `    <Placemark>
      <name>${datasetName} - Site Boundary</name>
      <Style>
        <LineStyle><color>ff00aaff</color><width>2.5</width></LineStyle>
        <PolyStyle><color>3300aaff</color></PolyStyle>
      </Style>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordStr} ${points[0].lon},${points[0].lat},${points[0].elev}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`
          : "";

      const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${datasetName} - Survey Export</name>
    <description>Generated by Excel to KML Pro | Datum: ${currentDataset.datum} (${currentDataset.grid})</description>
${polygonXml}
${placemarks}
  </Document>
</kml>`;

      const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `${datasetName.toLowerCase().replace(/\s+/g, "_")}_survey.kml`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackDownload("sample_kml", filename, versionTag);
      onToast(`✅ Downloaded ${filename}`);
    }, "Sign in to export survey .KML files.");
  };

  return (
    <section id="showcase" className="relative py-20 lg:py-24 bg-white border-b border-slate-100 overflow-hidden">
      {/* Subtle modern ambient background gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-50/40 via-cyan-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">

        {/* ── Section Header ── */}
        <div className="text-center max-w-[640px] mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-2xs mb-3.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071e3]" />
            </span>
            <span>Live Feature Preview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-slate-900 mb-3">
            Preview Survey Conversion &amp; Mapping
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Inspect satellite mapping, review spreadsheet point conversion, and check site calibration accuracy before exporting to KML.
          </p>
        </div>

        {/* ── Segmented Control Tab Switcher ── */}
        <div className="flex justify-center mb-8">
          <div role="tablist" aria-label="Preview mode" className="inline-flex p-1 bg-slate-100/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs">
            {[
              { id: "map", label: "Satellite Map & Points", short: "Map", icon: Globe },
              { id: "table", label: "Survey Table & KML Output", short: "Table", icon: FileSpreadsheet },
              { id: "calibration", label: "Site Calibration (Helmert)", short: "Calibration", icon: Compass },
            ].map(({ id, label, short, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(id as TabId)}
                  className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#0071e3]" : "text-slate-400"}`} />
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Showcase Stage Card ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden p-5 sm:p-7">

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: SATELLITE MAP & POINTS
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "map" && (
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-slate-900">
                    4 control benchmarks &amp; boundary
                  </span>
                  <span className="text-slate-300 hidden sm:inline">·</span>
                  <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                    EPSG:3997 (Dubai DLTM)
                  </span>
                </div>

                <button
                  onClick={() => handleDownloadDatasetKml("Dubai_Site", DATASETS.dubai.points.slice(0, 4))}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-[0_2px_10px_rgba(0,113,227,0.25)] hover:shadow-[0_4px_14px_rgba(0,113,227,0.35)] transition-all active:translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download site KML (4 points + boundary)</span>
                </button>
              </div>

              {/* Embedded Satellite Map */}
              <div className="w-full">
                <RealSatelliteMap />
              </div>

              {/* Satellite Footer Note */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 sm:gap-3 text-xs text-slate-500 pt-1">
                <p className="flex items-start sm:items-center gap-1.5 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-px sm:mt-0" />
                  <span>
                    Placemarks carry real heights (<code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">relativeToGround</code>) for 3D extrusion in Google Earth.
                  </span>
                </p>
                <span className="text-slate-500 font-mono text-[11px]">
                  ESRI World Imagery + OpenStreetMap
                </span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: SURVEY TABLE & KML OUTPUT
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "table" && (
            <div className="space-y-4">
              {/* Controls Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span id="region-label" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Region:</span>
                  <div role="group" aria-labelledby="region-label" className="flex flex-wrap gap-1.5">
                    {Object.entries(DATASETS).map(([key, data]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedDatasetKey(key);
                          setSearchFilter("");
                        }}
                        aria-pressed={selectedDatasetKey === key}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          selectedDatasetKey === key
                            ? "bg-[#0071e3] text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <span>{data.flag} {data.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
                    <input
                      type="search"
                      aria-label="Filter survey points by ID, name or code"
                      placeholder="Filter points or code..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-8 pr-3 py-2 sm:py-1.5 text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono w-full sm:w-[220px]"
                    />
                  </div>

                  {/* Download KML button */}
                  <button
                    onClick={() => handleDownloadDatasetKml(currentDataset.name, currentDataset.points)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-[0_2px_10px_rgba(0,113,227,0.25)] hover:shadow-[0_4px_14px_rgba(0,113,227,0.35)] transition-all active:translate-y-0.5 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export {currentDataset.points.length} Points to KML</span>
                  </button>
                </div>
              </div>

              {/* Dataset Info Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-bold text-slate-900 whitespace-nowrap">{currentDataset.flag} {currentDataset.country}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600 font-mono whitespace-nowrap">Grid: <b className="text-slate-900">{currentDataset.grid}</b></span>
                  <span className="text-slate-300 hidden sm:inline">·</span>
                  <span className="text-slate-500 font-sans w-full sm:w-auto">{currentDataset.datum}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500" aria-live="polite">
                  {filteredPoints.length} of {currentDataset.points.length} survey rows
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <caption className="sr-only">
                    {currentDataset.name} survey points with grid and WGS84 coordinates
                  </caption>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">
                      <th className="px-4 py-3">Point ID</th>
                      <th className="px-4 py-3 font-sans">Feature Name</th>
                      <th className="px-4 py-3 font-mono">Easting (m)</th>
                      <th className="px-4 py-3 font-mono">Northing (m)</th>
                      <th className="px-4 py-3 font-mono">Elevation (m)</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3 font-mono text-blue-700">WGS84 Latitude</th>
                      <th className="px-4 py-3 font-mono text-blue-700">WGS84 Longitude</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredPoints.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50/30 transition-colors [&>td]:whitespace-nowrap [&>td:nth-child(2)]:whitespace-normal">
                        <th scope="row" className="px-4 py-3 font-bold text-slate-900 text-left whitespace-nowrap">{row.id}</th>
                        <td className="px-4 py-3 font-sans font-medium text-slate-700 min-w-[170px]">{row.name}</td>
                        <td className="px-4 py-3 text-slate-800">{row.easting.toFixed(3)}</td>
                        <td className="px-4 py-3 text-slate-800">{row.northing.toFixed(3)}</td>
                        <td className="px-4 py-3 text-slate-700">+{row.elev.toFixed(2)}</td>
                        <td className="px-4 py-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {row.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-blue-700 font-semibold">{Math.abs(row.lat).toFixed(6)}° {row.lat >= 0 ? "N" : "S"}</td>
                        <td className="px-4 py-3 text-blue-700 font-semibold">{Math.abs(row.lon).toFixed(6)}° {row.lon >= 0 ? "E" : "W"}</td>
                        <td className="px-4 py-3 text-right font-sans">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            KML Ready
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredPoints.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-sans text-xs">
                          No survey points matching &quot;{searchFilter}&quot;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer info */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Exports directly to Google Earth (.KML / .KMZ) with 3D elevations and feature labels.
                </span>
                <span className="font-mono text-slate-500">
                  Total points in dataset: {currentDataset.points.length}
                </span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: SITE CALIBRATION (HELMERT)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "calibration" && (() => {
            const cal = CALIBRATION_PRESETS[selectedCalibrationKey] || CALIBRATION_PRESETS.dubai;
            const maxErrorMm = parseFloat(cal.maxError);
            const tolerancePct = Math.min(100, (maxErrorMm / TOLERANCE_MM) * 100);

            return (
              <div className="space-y-5">
                {/* ── Header & Preset Switcher ── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0071e3] flex items-center justify-center shrink-0">
                      <Compass className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                          Helmert 2D Site Calibration
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sub-mm fit
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                        Least-squares fit that aligns local total station coordinates to a national EPSG datum.
                      </p>
                    </div>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Calibration preset"
                    className="flex gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0"
                  >
                    {Object.entries(CALIBRATION_PRESETS).map(([key, preset]) => {
                      const isSelected = selectedCalibrationKey === key;
                      return (
                        <button
                          key={key}
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedCalibrationKey(key)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            isSelected
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {preset.flag} {preset.country === "United Kingdom" ? "UK" : preset.country}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

                  {/* ── Left: Residual plot (dark) ── */}
                  <div className="lg:col-span-7 relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#0a1638] via-[#0d2254] to-[#071128] text-white p-4 sm:p-6 flex flex-col">
                    <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 truncate">
                          Residual plot · {cal.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] font-mono font-semibold text-cyan-200 bg-cyan-950/70 border border-cyan-700/50 px-2 py-0.5 rounded-full">
                        {cal.grid}
                      </span>
                    </div>

                    {/* Plot: rings in mm, each benchmark placed at its (dx, dy) */}
                    <div className="relative flex-1 flex items-center justify-center py-4">
                      <svg
                        viewBox="-130 -130 260 260"
                        className="w-full max-w-[340px] h-auto"
                        role="img"
                        aria-label={`Residuals for ${cal.points.length} control benchmarks, all within ${cal.maxError}`}
                      >
                        <defs>
                          {/* Fades from the trailing edge (left) to the bright leading edge (right) */}
                          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity="0" />
                            <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0.32" />
                          </linearGradient>
                        </defs>

                        {/* Axes */}
                        <line x1="-120" y1="0" x2="120" y2="0" stroke="rgba(34,211,238,0.2)" />
                        <line x1="0" y1="-120" x2="0" y2="120" stroke="rgba(34,211,238,0.2)" />
                        <text x="118" y="-4" textAnchor="end" className="fill-cyan-300/50 font-mono" fontSize="8">+dx</text>
                        <text x="4" y="-112" className="fill-cyan-300/50 font-mono" fontSize="8">+dy</text>

                        {/* Rings */}
                        {PLOT_RINGS.map((r) => (
                          <g key={r.mm}>
                            <circle
                              r={r.mm * PLOT_SCALE}
                              fill={r.fill}
                              stroke={r.stroke}
                              strokeDasharray={r.dashed ? "3 3" : undefined}
                            />
                            <text
                              x={-r.mm * PLOT_SCALE * 0.707 - 3}
                              y={r.mm * PLOT_SCALE * 0.707 + 9}
                              textAnchor="end"
                              className="font-mono"
                              fill={r.label}
                              fontSize="8"
                            >
                              {r.mm} mm
                            </text>
                          </g>
                        ))}

                        {/* Radar sweep */}
                        {/* Rotates about the plot centre (0, 0) in SVG user space. A CSS transform-origin
                            of "center" resolves against the viewBox's top-left, not its middle. */}
                        <g>
                          <path d="M0 0 L-84.85 -84.85 A120 120 0 0 1 0 -120 Z" fill="url(#sweep)" />
                          <line x1="0" y1="0" x2="0" y2="-120" stroke="rgba(34,211,238,0.55)" strokeWidth="1" />
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 0 0"
                            to="360 0 0"
                            dur="4s"
                            repeatCount="indefinite"
                          />
                        </g>

                        {/* Site baseline vector, rotated by the fitted angle */}
                        <g
                          style={{ transform: `rotate(${cal.rotationDeg}deg)`, transition: "transform 700ms ease-out" }}
                        >
                          <line x1="-118" y1="0" x2="118" y2="0" stroke="rgba(110,231,183,0.5)" strokeWidth="1.5" />
                          <circle cx="118" cy="0" r="3.5" fill="#34d399" />
                        </g>

                        {/* Benchmarks */}
                        {cal.points.map((pt) => {
                          const cx = parseFloat(pt.dx) * PLOT_SCALE;
                          const cy = -parseFloat(pt.dy) * PLOT_SCALE;
                          const color = POINT_HEX[pt.color];
                          const labelLeft = cx < 0;
                          return (
                            <g key={pt.id} style={{ transition: "transform 500ms ease-out" }}>
                              <circle cx={cx} cy={cy} r="9" fill={color} opacity="0.18" />
                              <circle cx={cx} cy={cy} r="4" fill={color} stroke="#0a1638" strokeWidth="1.5" />
                              <text
                                x={cx + (labelLeft ? -9 : 9)}
                                y={cy + 3}
                                textAnchor={labelLeft ? "end" : "start"}
                                className="font-mono font-bold"
                                fill={color}
                                fontSize="9"
                              >
                                {pt.id}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="relative flex flex-wrap items-center justify-center gap-2 mb-4 text-[11px] font-mono">
                      <span className="inline-flex items-center gap-1.5 text-cyan-200 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                        <RotateCw className="w-3 h-3 text-cyan-400" />
                        Rotation {cal.rotation}
                      </span>
                      <span className="text-emerald-300 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        RMS ±{cal.rmsResidual}
                      </span>
                      <span className="text-slate-300 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-white/10">
                        Tolerance {TOLERANCE_MM.toFixed(1)} mm
                      </span>
                    </div>

                    {/* Transformation parameters */}
                    <dl className="relative grid grid-cols-1 sm:grid-cols-3 rounded-xl bg-white/[0.06] border border-white/10 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                      {[
                        { k: "Scale factor", v: cal.scaleFactor, sub: cal.scalePpm, tone: "text-emerald-300" },
                        { k: "Rotation", v: cal.rotation, sub: "True north corrected", tone: "text-cyan-300" },
                        { k: "Origin shift (dX, dY)", v: cal.originShiftShort, sub: cal.originShiftFull, tone: "text-blue-300" },
                      ].map((p) => (
                        <div key={p.k} className="px-4 py-3 flex sm:block items-baseline justify-between gap-3 sm:text-center min-w-0">
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{p.k}</dt>
                          <dd className="min-w-0 text-right sm:text-center">
                            <div className={`text-sm font-mono font-bold ${p.tone} sm:mt-1 sm:truncate`}>{p.v}</div>
                            <div className="text-[10px] font-mono text-slate-400 sm:truncate" title={p.sub}>{p.sub}</div>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* ── Right: Fit quality + benchmarks ── */}
                  <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 flex flex-col">
                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { k: "Confidence", v: cal.confidence },
                        { k: "RMS", v: cal.rmsResidual },
                        { k: "Max error", v: cal.maxError },
                      ].map((m) => (
                        <div key={m.k} className="rounded-xl bg-slate-50 border border-slate-200/70 px-2.5 py-2.5 text-center">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{m.k}</div>
                          <div className="text-[15px] sm:text-base font-bold font-mono tracking-tight text-slate-900 mt-0.5">{m.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Tolerance usage */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600 font-medium">Error budget used</span>
                        <span className="font-mono font-semibold text-emerald-700">
                          {cal.maxError} / {TOLERANCE_MM.toFixed(1)} mm
                        </span>
                      </div>
                      <div className="relative w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                          style={{ width: `${tolerancePct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                        <span>0</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          {Math.round(100 - tolerancePct)}% headroom
                        </span>
                        <span>{TOLERANCE_MM.toFixed(1)} mm</span>
                      </div>
                    </div>

                    {/* Benchmarks */}
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      <span>Control benchmarks</span>
                      <span className="font-normal normal-case tracking-normal text-slate-500">Residual</span>
                    </div>
                    <ul className="space-y-1.5 mb-5">
                      {cal.points.map((pt) => {
                        const residualMm = parseFloat(pt.residual);
                        return (
                          <li
                            key={pt.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 hover:border-blue-200 transition-colors"
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: POINT_HEX[pt.color] }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs leading-snug">
                                <span className="font-mono font-bold text-slate-900 mr-1.5">{pt.id}</span>
                                <span className="font-medium text-slate-700">{pt.name}</span>
                              </div>
                              <div className="text-[10.5px] font-mono text-slate-500 mt-0.5">
                                <span className="hidden sm:inline">{pt.role} · </span>dx {pt.dx} · dy {pt.dy}
                              </div>
                            </div>
                            <div className="shrink-0 w-16 text-right">
                              <div className="text-[11px] font-mono font-bold text-emerald-700">±{pt.residual}</div>
                              <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-400"
                                  style={{ width: `${Math.min(100, (residualMm / 0.5) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    <button
                      onClick={() =>
                        handleDownloadDatasetKml(cal.name, (DATASETS[cal.kmlDatasetKey] || DATASETS.dubai).points)
                      }
                      className="mt-auto w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.28)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.38)] active:translate-y-0.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download calibrated site KML</span>
                    </button>
                  </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1">
                  <span className="flex items-start sm:items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    Calculated locally · Helmert 4-parameter (dX, dY, scale, rotation) &amp; Bursa-Wolf compliant.
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] pl-[22px] sm:pl-0">
                    5,800+ EPSG systems · ISO 19111
                  </span>
                </div>
              </div>
            );
          })()}

        </div>

      </div>
    </section>
  );
}
