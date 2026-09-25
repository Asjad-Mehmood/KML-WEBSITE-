"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "../context/AuthContext";
import {
  Download,
  MapPin,
  Globe,
  FileSpreadsheet,
  Compass,
  CheckCircle2,
  Search,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Maximize2,
  TableProperties,
  Sparkles,
  Activity,
  Crosshair
} from "lucide-react";

// Dynamically import the Live Satellite Map
const RealSatelliteMap = dynamic(() => import("./RealSatelliteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-2xl bg-slate-900 border border-slate-800 animate-pulse flex flex-col items-center justify-center gap-2 text-cyan-400 font-mono text-xs">
      <Globe className="w-6 h-6 animate-spin text-cyan-500" />
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
      { id: "BM-01", name: "Master Control Datum", easting: 513556.612, northing: 2787467.856, elev: 14.85, code: "CONTROL", lat: 25.1972, lon: 55.2744 },
      { id: "CP-02", name: "Boundary Corner Peg", easting: 513720.400, northing: 2787590.200, elev: 26.50, code: "BOUNDARY", lat: 25.1995, lon: 55.2785 },
      { id: "CR-03", name: "Ridge Elevation Point", easting: 513850.150, northing: 2787480.900, elev: 38.20, code: "CREST", lat: 25.1962, lon: 55.2810 },
      { id: "BS-04", name: "Traverse Tie Station", easting: 513690.800, northing: 2787350.100, elev: 19.00, code: "TRAVERSE", lat: 25.1942, lon: 55.2762 },
      { id: "CL-05", name: "Road Centerline Stn 0+120", easting: 513610.250, northing: 2787410.500, elev: 16.30, code: "ROAD", lat: 25.1955, lon: 55.2755 },
      { id: "MH-06", name: "Storm Drainage Manhole", easting: 513780.900, northing: 2787520.100, elev: 21.15, code: "UTILITY", lat: 25.1978, lon: 55.2798 },
    ],
  },
  qatar: {
    name: "Qatar National Grid",
    country: "Qatar",
    flag: "🇶🇦",
    grid: "EPSG:2932",
    datum: "Qatar 1995 / QNG",
    points: [
      { id: "QNG-01", name: "Doha Primary Trig", easting: 231540.250, northing: 392410.800, elev: 11.20, code: "CONTROL", lat: 25.2867, lon: 51.5332 },
      { id: "QNG-02", name: "Harbor Boundary West", easting: 231710.600, northing: 392550.400, elev: 8.50, code: "BOUNDARY", lat: 25.2880, lon: 51.5348 },
      { id: "QNG-03", name: "Infrastructure Hub Stn", easting: 231850.100, northing: 392390.200, elev: 14.70, code: "FACILITY", lat: 25.2865, lon: 51.5362 },
      { id: "QNG-04", name: "Pavement Edge Level", easting: 231620.400, northing: 392280.900, elev: 9.90, code: "TOPO", lat: 25.2855, lon: 51.5340 },
    ],
  },
  pakistan: {
    name: "Pakistan UTM 42N",
    country: "Pakistan",
    flag: "🇵🇰",
    grid: "EPSG:32642",
    datum: "WGS 84 / UTM zone 42N",
    points: [
      { id: "PAK-01", name: "Islamabad Survey Datum", easting: 336520.400, northing: 3728140.600, elev: 540.50, code: "CONTROL", lat: 33.6844, lon: 73.0478 },
      { id: "PAK-02", name: "Sector Boundary Peg 1", easting: 336710.800, northing: 3728320.100, elev: 548.20, code: "BOUNDARY", lat: 33.6860, lon: 73.0498 },
      { id: "PAK-03", name: "Culvert Flowline Invert", easting: 336850.000, northing: 3728190.500, elev: 535.10, code: "DRAINAGE", lat: 33.6849, lon: 73.0513 },
      { id: "PAK-04", name: "Highway Cross Section", easting: 336630.200, northing: 3728020.300, elev: 538.70, code: "ROAD", lat: 33.6833, lon: 73.0489 },
    ],
  },
  london: {
    name: "British National Grid",
    country: "United Kingdom",
    flag: "🇬🇧",
    grid: "EPSG:27700",
    datum: "OSGB36 / British National Grid",
    points: [
      { id: "OSGB-01", name: "Ordnance Survey Trig", easting: 538120.000, northing: 184510.000, elev: 12.30, code: "CONTROL", lat: 51.5432, lon: -0.0125 },
      { id: "OSGB-02", name: "Property Boundary Wall", easting: 538280.500, northing: 184640.200, elev: 15.60, code: "BOUNDARY", lat: 51.5444, lon: -0.0102 },
      { id: "OSGB-03", name: "Railway Track Baseline", easting: 538410.200, northing: 184490.800, elev: 11.80, code: "RAIL", lat: 51.5430, lon: -0.0083 },
      { id: "OSGB-04", name: "Site Entrance Level", easting: 538190.400, northing: 184380.000, elev: 10.90, code: "ACCESS", lat: 51.5420, lon: -0.0115 },
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
    originShiftShort: "+513.5k, +2,787.4k",
    originShiftFull: "+513,556.61m, +2,787,467.86m",
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
    originShiftShort: "+538.1k, +184.5k",
    originShiftFull: "+538,120.00m, +184,510.00m",
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
    originShiftShort: "+231.5k, +392.4k",
    originShiftFull: "+231,540.25m, +392,410.80m",
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
    grid: "EPSG:32642",
    datum: "WGS 84 / UTM zone 42N",
    scaleFactor: "0.999600",
    scalePpm: "-40.0 ppm",
    rotation: "+0° 01' 32.1\"",
    rotationDeg: 14.5,
    originShiftShort: "+336.5k, +3,728.1k",
    originShiftFull: "+336,520.40m, +3,728,140.60m",
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
          <div className="inline-flex p-1 bg-slate-100/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs">
            {[
              { id: "map", label: "Satellite Map & Points", icon: Globe },
              { id: "table", label: "Survey Table & KML Output", icon: FileSpreadsheet },
              { id: "calibration", label: "Site Calibration (Helmert)", icon: Compass },
            ].map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabId)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#0071e3]" : "text-slate-400"}`} />
                  <span>{label}</span>
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
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-bold text-slate-900">
                    4 Control Benchmarks &amp; Boundary Polygon
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500 font-mono">
                    EPSG:3997 (Dubai DLTM)
                  </span>
                </div>

                <button
                  onClick={() => handleDownloadDatasetKml("Dubai_Site", DATASETS.dubai.points.slice(0, 4))}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-[0_2px_10px_rgba(0,113,227,0.25)] hover:shadow-[0_4px_14px_rgba(0,113,227,0.35)] transition-all active:translate-y-0.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Site KML (4 Points + Boundary)</span>
                </button>
              </div>

              {/* Embedded Satellite Map */}
              <div className="w-full">
                <RealSatelliteMap />
              </div>

              {/* Satellite Footer Note */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Placemarks include real ellipsoidal heights (<code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">relativeToGround</code>) for 3D extrusion in Google Earth.
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
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
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Region:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(DATASETS).map(([key, data]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedDatasetKey(key);
                          setSearchFilter("");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

                <div className="flex items-center gap-2.5">
                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter points or code..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono w-[180px] sm:w-[220px]"
                    />
                  </div>

                  {/* Download KML button */}
                  <button
                    onClick={() => handleDownloadDatasetKml(currentDataset.name, currentDataset.points)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-[0_2px_10px_rgba(0,113,227,0.25)] hover:shadow-[0_4px_14px_rgba(0,113,227,0.35)] transition-all active:translate-y-0.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export {currentDataset.points.length} Points to KML</span>
                  </button>
                </div>
              </div>

              {/* Dataset Info Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{currentDataset.flag} {currentDataset.country}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600 font-mono">Grid: <b className="text-slate-900">{currentDataset.grid}</b></span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 font-sans">{currentDataset.datum}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {filteredPoints.length} of {currentDataset.points.length} survey rows
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-3">Point ID</th>
                      <th className="px-4 py-3 font-sans">Feature Name</th>
                      <th className="px-4 py-3 font-mono">Easting (m)</th>
                      <th className="px-4 py-3 font-mono">Northing (m)</th>
                      <th className="px-4 py-3 font-mono">Elevation (m)</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3 font-mono text-[#0071e3]">WGS84 Latitude</th>
                      <th className="px-4 py-3 font-mono text-[#0071e3]">WGS84 Longitude</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredPoints.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">{row.id}</td>
                        <td className="px-4 py-3 font-sans font-medium text-slate-700">{row.name}</td>
                        <td className="px-4 py-3 text-slate-800">{row.easting.toFixed(3)}</td>
                        <td className="px-4 py-3 text-slate-800">{row.northing.toFixed(3)}</td>
                        <td className="px-4 py-3 text-slate-700">+{row.elev.toFixed(2)}</td>
                        <td className="px-4 py-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {row.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-blue-700 font-semibold">{row.lat.toFixed(6)}° N</td>
                        <td className="px-4 py-3 text-blue-700 font-semibold">{row.lon.toFixed(6)}° {row.lon >= 0 ? "E" : "W"}</td>
                        <td className="px-4 py-3 text-right font-sans">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            KML Ready
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredPoints.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-sans text-xs">
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
                <span className="font-mono text-slate-400">
                  Total points in dataset: {currentDataset.points.length}
                </span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: SITE CALIBRATION (HELMERT) - REDESIGNED
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "calibration" && (() => {
            const currentCalibration = CALIBRATION_PRESETS[selectedCalibrationKey] || CALIBRATION_PRESETS.dubai;

            return (
              <div className="space-y-6">
                {/* ── Top Header & Interactive Preset Switcher ── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20 shrink-0">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          Helmert 2D Site Calibration &amp; Geodetic Engine
                        </h3>
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sub-Millimeter Fit
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dual-grid least-squares transformation aligns local total station project coordinates to national EPSG datums.
                      </p>
                    </div>
                  </div>

                  {/* Interactive Calibration Preset Switcher */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Preset:</span>
                    {Object.entries(CALIBRATION_PRESETS).map(([key, preset]) => {
                      const isSelected = selectedCalibrationKey === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedCalibrationKey(key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                          }`}
                        >
                          <span>{preset.flag} {preset.name.split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Main Unified Cockpit (No 4-grid fragmentation) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                  {/* Left Column: Geodetic Alignment Studio (7 Cols) */}
                  <div className="lg:col-span-7 bg-gradient-to-br from-[#0a1638] via-[#0d2254] to-[#071128] border border-blue-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-blue-950/20 relative overflow-hidden flex flex-col justify-between">
                    {/* Ambient Glows */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

                    <div>
                      {/* Studio Header Strip */}
                      <div className="flex items-center justify-between relative z-10 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                          </span>
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                            Geodetic Alignment Reticle
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-cyan-200 bg-cyan-950/70 border border-cyan-700/50 px-2.5 py-0.5 rounded-full">
                          {currentCalibration.grid}
                        </span>
                      </div>

                      {/* Interactive Visual Alignment Reticle */}
                      <div className="relative w-full h-60 my-4 flex items-center justify-center">
                        {/* 5mm Tolerance Ring */}
                        <div className="absolute w-52 h-52 rounded-full border border-dashed border-cyan-400/25 flex items-center justify-center">
                          <span className="text-[8px] font-mono text-cyan-400/50 absolute top-1">5.0 mm Tolerance Limit</span>
                        </div>

                        {/* 2mm Tolerance Ring */}
                        <div className="absolute w-36 h-36 rounded-full border border-blue-400/35 flex items-center justify-center">
                          <span className="text-[8px] font-mono text-blue-300/50 absolute top-1">2.0 mm Engineering Zone</span>
                        </div>

                        {/* Sub-Millimeter Core Zone */}
                        <div className="absolute w-20 h-20 rounded-full border-2 border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-emerald-300">&lt;0.5 mm</span>
                        </div>

                        {/* Crosshairs */}
                        <div className="absolute inset-x-0 h-px bg-cyan-400/25 top-1/2" />
                        <div className="absolute inset-y-0 w-px bg-cyan-400/25 left-1/2" />

                        {/* Animated Radar Sweep */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-radar-sweep">
                          <div className="w-24 h-24 bg-gradient-to-br from-cyan-400/30 via-emerald-400/15 to-transparent origin-bottom-right rounded-tl-full" />
                        </div>

                        {/* Dynamic Rotated Site Baseline Vector */}
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-700 ease-out"
                          style={{ transform: `rotate(${currentCalibration.rotationDeg}deg)` }}
                        >
                          <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-emerald-300 shadow-[0_0_10px_rgba(6,182,212,0.8)] relative">
                            <div className="absolute -top-1.5 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-md shadow-emerald-400/60" />
                            <div className="absolute -bottom-5 right-2 text-[9px] font-mono font-bold text-emerald-300 tracking-wider">
                              Site Vector
                            </div>
                          </div>
                        </div>

                        {/* Station Blips plotted in reticle */}
                        <div className="absolute top-10 right-14 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                          <span className="text-[9px] font-mono font-bold text-blue-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-blue-500/30">
                            BM-01 (0.2mm)
                          </span>
                        </div>

                        <div className="absolute bottom-10 left-12 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[9px] font-mono font-bold text-emerald-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            BS-04 (0.4mm)
                          </span>
                        </div>

                        <div className="absolute top-12 left-16 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          <span className="text-[9px] font-mono font-bold text-indigo-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-indigo-500/30">
                            CP-02 (0.3mm)
                          </span>
                        </div>

                        {/* Status overlays in reticle */}
                        <div className="absolute bottom-2 left-3 text-[11px] font-mono text-cyan-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
                          <RotateCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
                          <span>Rotation: {currentCalibration.rotation}</span>
                        </div>
                        <div className="absolute bottom-2 right-3 text-[11px] font-mono text-emerald-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          RMS Residual: ±{currentCalibration.rmsResidual}
                        </div>
                      </div>
                    </div>

                    {/* Integrated Translucent Parameter Strip (Replaces separate clunky grids) */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/10 grid grid-cols-3 gap-2 text-center relative z-10">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                          Scale Factor
                        </div>
                        <div className="text-sm sm:text-base font-mono font-bold text-emerald-400 mt-0.5">
                          {currentCalibration.scaleFactor}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-300/80">
                          {currentCalibration.scalePpm}
                        </div>
                      </div>
                      <div className="border-x border-white/10 px-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                          Convergence Angle
                        </div>
                        <div className="text-sm sm:text-base font-mono font-bold text-cyan-300 mt-0.5">
                          {currentCalibration.rotation}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-200/80">
                          True North Corrected
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                          Origin Shift (dX, dY)
                        </div>
                        <div className="text-xs sm:text-sm font-mono font-bold text-blue-300 mt-0.5 truncate" title={currentCalibration.originShiftFull}>
                          {currentCalibration.originShiftShort}
                        </div>
                        <div className="text-[10px] font-mono text-blue-200/80">
                          Fixed to Datum
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Least-Squares Quality & Benchmark Network (5 Cols) */}
                  <div className="lg:col-span-5 bg-gradient-to-b from-slate-50/80 via-white to-blue-50/20 rounded-3xl border border-slate-200/90 p-5 sm:p-6 flex flex-col justify-between shadow-sm">
                    <div>
                      {/* Quality Scorecard */}
                      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/70">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Fit Quality Confidence
                          </div>
                          <div className="text-2xl font-black font-mono tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent mt-0.5">
                            {currentCalibration.confidence} Confidence
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Sub-mm Pass
                        </span>
                      </div>

                      {/* Error Tolerance Bar */}
                      <div className="py-3.5 border-b border-slate-200/60 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">RMS Residual Error</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {currentCalibration.maxError} max (Limit: 5.0 mm)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
                            style={{ width: "99.8%" }}
                          />
                        </div>
                      </div>

                      {/* Control Benchmark Stations List */}
                      <div className="pt-3 pb-2 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <span>Control Benchmarks</span>
                          <span className="font-mono text-[10px] text-slate-400">Least-Squares Deltas</span>
                        </div>

                        {currentCalibration.points.map((pt) => {
                          const badgeClasses = {
                            blue: "bg-blue-100 text-blue-800 border-blue-200",
                            indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
                            emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
                            amber: "bg-amber-100 text-amber-800 border-amber-200",
                          }[pt.color];

                          return (
                            <div
                              key={pt.id}
                              className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-colors flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${badgeClasses}`}>
                                  {pt.id}
                                </span>
                                <div>
                                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                                    {pt.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    dx: {pt.dx} · dy: {pt.dy}
                                  </div>
                                </div>
                              </div>

                              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md whitespace-nowrap">
                                ±{pt.residual}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Export Button */}
                    <div className="pt-3">
                      <button
                        onClick={() =>
                          handleDownloadDatasetKml(
                            currentCalibration.name,
                            (DATASETS[currentCalibration.kmlDatasetKey] || DATASETS.dubai).points
                          )
                        }
                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-[#0071e3] to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Calibrated Site KML ({currentCalibration.points.length} Points)</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* ── Geodetic Standards Quality Footer ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Calculates 100% locally on your machine · Helmert 4-Parameter (dX, dY, Scale, Rotation) &amp; Bursa-Wolf compliant.
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Supports 6,864 EPSG Datums · ISO 19111 Validated
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
