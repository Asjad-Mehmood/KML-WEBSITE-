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
  TableProperties
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

interface ShowcaseProps {
  versionTag: string;
  onToast: (msg: string) => void;
}

export default function Showcase({ versionTag, onToast }: ShowcaseProps) {
  const { requireAuth, trackDownload } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [selectedDatasetKey, setSelectedDatasetKey] = useState<string>("dubai");
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
              TAB 3: SITE CALIBRATION (HELMERT)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "calibration" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Local Site Calibration (Helmert 2D Transformation)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aligns local total station project coordinates to official national map grids without GPS scale distortion.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    Average Residual: 0.4 mm
                  </span>
                </div>
              </div>

              {/* Visual Transformation Overview Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Visual Alignment Diagram */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-1 relative z-10">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      Geometric Alignment
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">
                      Local Grid ➔ National EPSG
                    </h4>
                  </div>

                  {/* Visual Coordinate Axes */}
                  <div className="my-6 relative h-28 flex items-center justify-center">
                    {/* National Grid (Orthogonal) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 border border-dashed border-slate-600 rounded-lg flex items-center justify-center">
                        <span className="text-[9px] font-mono text-slate-400 absolute top-1 right-2">EPSG Grid</span>
                      </div>
                    </div>
                    {/* Local Site Grid (Rotated & Scaled) */}
                    <div className="w-20 h-20 border-2 border-cyan-400/80 bg-cyan-500/10 rounded-lg transform rotate-6 flex items-center justify-center relative shadow-lg shadow-cyan-500/20">
                      <span className="text-[9px] font-mono font-bold text-cyan-300">Local Site</span>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 relative z-10 pt-2 border-t border-slate-800">
                    <span>Rotation: +0° 00&apos; 14&quot;</span>
                    <span className="text-emerald-400">Scale: 0.999984</span>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Ground Scale Factor
                      </div>
                      <div className="text-xl font-mono font-bold text-slate-900">
                        0.999984
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Converts ground distance to grid
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/70 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>&plusmn;0.000001 precision</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Grid Rotation Angle
                      </div>
                      <div className="text-xl font-mono font-bold text-slate-900">
                        +0° 00&apos; 14.2&quot;
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Aligns baseline with True North
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/70 text-[10px] text-blue-700 font-semibold flex items-center gap-1">
                      <RotateCw className="w-3 h-3 text-blue-600" />
                      <span>Convergence corrected</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Origin Shift (dX, dY)
                      </div>
                      <div className="text-lg font-mono font-bold text-[#0071e3]">
                        +513,556m, +2,787,467m
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Offset to national grid origin
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/70 text-[10px] text-slate-600 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>Fixed to datum</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benchmark Residuals Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-800 flex justify-between items-center">
                  <span>Control Benchmark Residuals</span>
                  <span className="text-slate-500 font-mono text-[11px]">Coordinate difference after least-squares fit</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs font-mono">
                  {[
                    { id: "BM-01", name: "Master Benchmark Datum", diff: "0.4 mm", east: "513,556.612", north: "2,787,467.856" },
                    { id: "CP-02", name: "Boundary Corner Peg", diff: "0.5 mm", east: "513,720.400", north: "2,787,590.200" },
                    { id: "CR-03", name: "Ridge Elevation Point", diff: "0.2 mm", east: "513,850.150", north: "2,787,480.900" },
                    { id: "BS-04", name: "Traverse Tie Station", diff: "0.5 mm", east: "513,690.800", north: "2,787,350.100" },
                  ].map((row) => (
                    <div key={row.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-[#0071e3]">{row.id}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-800 font-sans font-medium">{row.name}</span>
                      </div>

                      <div className="flex items-center gap-4 text-slate-500">
                        <span className="hidden sm:inline">E: {row.east} · N: {row.north}</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          Residual: {row.diff}
                        </span>
                        <span className="text-xs text-emerald-600 font-sans font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Calibrated
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footnote */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Calculates 100% locally on your machine · No cloud upload required
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Supports 6,864 national EPSG datums
                </span>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
