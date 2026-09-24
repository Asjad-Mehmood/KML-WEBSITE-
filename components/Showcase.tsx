"use client";

import React, { useState, useId } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "../context/AuthContext";
import { 
  Download, 
  MapPin, 
  Globe, 
  Cpu, 
  RefreshCw,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

// Dynamically import the Live Satellite Map
const RealSatelliteMap = dynamic(() => import("./RealSatelliteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] rounded-2xl bg-slate-100/80 border border-slate-200 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-xs">
      <Globe className="w-6 h-6 animate-spin text-slate-300" />
      <span>Loading Live Satellite Map...</span>
    </div>
  ),
});

interface PresetData {
  name: string;
  flag: string;
  station: string;
  easting: number;
  northing: number;
  elev: number;
  code: string;
  lat: number;
  lon: number;
  grid: string;
  accuracy: string;
}

const PRESETS: Record<string, PresetData> = {
  dubai: {
    name: "Dubai DLTM",
    flag: "🇦🇪",
    station: "BM-DUB-01",
    easting: 513556.612,
    northing: 2787467.856,
    elev: 14.85,
    code: "BENCHMARK",
    lat: 25.193248,
    lon: 55.467835,
    grid: "EPSG:3997 (Dubai DLTM)",
    accuracy: "Under 1 mm",
  },
  qatar: {
    name: "Qatar QNG 1995",
    flag: "🇶🇦",
    station: "QNG-DOH-12",
    easting: 231540.25,
    northing: 392410.8,
    elev: 11.2,
    code: "BENCHMARK",
    lat: 25.2867,
    lon: 51.5332,
    grid: "EPSG:2932 (Qatar National Grid)",
    accuracy: "Under 1 mm",
  },
  pakistan: {
    name: "Pakistan Survey (UTM 42N)",
    flag: "🇵🇰",
    station: "PAK-ISB-07",
    easting: 336520.4,
    northing: 3728140.6,
    elev: 540.5,
    code: "PRIMARY_TRIG",
    lat: 33.68442,
    lon: 73.04788,
    grid: "EPSG:32642 (Pakistan UTM 42N)",
    accuracy: "Under 1 mm",
  },
  saudi: {
    name: "Saudi Arabia (UTM 38N)",
    flag: "🇸🇦",
    station: "KSA-RUH-03",
    easting: 671230.15,
    northing: 2731520.85,
    elev: 612.0,
    code: "CADASTRE",
    lat: 24.68773,
    lon: 46.68631,
    grid: "EPSG:32638 (Ain el Abd / UTM 38N)",
    accuracy: "Under 1 mm",
  },
  london: {
    name: "London OSGB36",
    flag: "🇬🇧",
    station: "TBM-LON-04",
    easting: 538120.0,
    northing: 184510.0,
    elev: 12.3,
    code: "CORNER-PEG",
    lat: 51.54321,
    lon: -0.01254,
    grid: "EPSG:27700 (British National Grid)",
    accuracy: "1–2 mm",
  },
  nyc: {
    name: "New York NAD83",
    flag: "🇺🇸",
    station: "NYC-CTRL-22",
    easting: 298450.0,
    northing: 68420.0,
    elev: 34.2,
    code: "MONUMENT",
    lat: 40.782865,
    lon: -73.965355,
    grid: "EPSG:32118 (SPCS NY)",
    accuracy: "Under 1 mm",
  },
  utm40: {
    name: "UTM Zone 40N (Global)",
    flag: "🌐",
    station: "UTM-PT-88",
    easting: 350000.0,
    northing: 2790000.0,
    elev: 28.5,
    code: "BOUNDARY",
    lat: 25.21542,
    lon: 53.51205,
    grid: "EPSG:32640 (UTM 40N)",
    accuracy: "Under 1 mm",
  },
};

type TabId = "earth" | "telemetry" | "converter";

interface ShowcaseProps {
  versionTag: string;
  onToast: (msg: string) => void;
}

export default function Showcase({ versionTag, onToast }: ShowcaseProps) {
  const { requireAuth, trackDownload } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("earth");

  // Tab 3 State (Single Point Converter)
  const [selectedPreset, setSelectedPreset] = useState("dubai");
  const [stationId, setStationId] = useState(PRESETS.dubai.station);
  const [easting, setEasting] = useState<number>(PRESETS.dubai.easting);
  const [northing, setNorthing] = useState<number>(PRESETS.dubai.northing);
  const [elevation, setElevation] = useState<number>(PRESETS.dubai.elev);
  const [coordSystem, setCoordSystem] = useState("dubai");

  const stationId_ = useId();
  const eastId_ = useId();
  const northId_ = useId();
  const elevId_ = useId();
  const sysId_ = useId();

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setSelectedPreset(key);
    setCoordSystem(key);
    setStationId(p.station);
    setEasting(p.easting);
    setNorthing(p.northing);
    setElevation(p.elev);
  };

  const currentPreset = PRESETS[selectedPreset] || PRESETS.dubai;
  const dE = (easting || 0) - currentPreset.easting;
  const dN = (northing || 0) - currentPreset.northing;
  const computedLat = (currentPreset.lat + dN / 111320).toFixed(6);
  const computedLon = (
    currentPreset.lon + dE / (111320 * Math.cos((currentPreset.lat * Math.PI) / 180))
  ).toFixed(6);

  const handleDownloadKml = () => {
    requireAuth(() => {
      const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Survey Benchmark — ${stationId}</name>
    <Placemark>
      <name>${stationId}</name>
      <description>Easting: ${easting} m | Northing: ${northing} m | Elev: ${elevation} m | Grid: ${currentPreset.grid}</description>
      <Point>
        <extrude>1</extrude>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${computedLon},${computedLat},${elevation}</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;
      const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${stationId || "Benchmark"}_export.kml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackDownload("test_kml", `${stationId}_export.kml`, versionTag);
      onToast(`✅ Downloaded ${stationId}_export.kml`);
    }, "Sign in or register to export survey .KML files.");
  };

  // Eye-conforming input styling: gentle white background, soft borders, comfortable font, relaxed focus ring
  const inputCls =
    "w-full px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono shadow-xs";

  return (
    <section id="showcase" className="py-16 sm:py-20 bg-[#fafbfc] border-b border-slate-100">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section Header (Clear, Meaningful & Practical) ── */}
        <div className="text-center max-w-[660px] mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Live Feature Preview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 mb-2.5">
            See How Your Survey Points Convert
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Check how points plot on satellite maps, see site calibration in action, or test single coordinate conversions before saving your KML file.
          </p>
        </div>

        {/* ── Practical & Modern Segmented Control Tab Bar ── */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 shadow-xs">
            {[
              { id: "earth", label: "3D Satellite View", icon: Globe },
              { id: "telemetry", label: "Site Calibration (Helmert)", icon: Cpu },
              { id: "converter", label: "Coordinate Converter", icon: RefreshCw },
            ].map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabId)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Stage Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden p-5 sm:p-7">

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: 3D SATELLITE VIEW
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "earth" && (
            <div className="flex flex-col gap-4">
              {/* Minimal Top Action Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    Live 3D Map View
                  </span>
                  <span className="text-slate-300 hidden sm:inline">·</span>
                  <span className="text-xs text-slate-500 font-mono hidden sm:inline">4 Survey Points Plotted</span>
                </div>

                <button
                  onClick={handleDownloadKml}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-xs transition-all active:translate-y-0.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample .KML</span>
                </button>
              </div>

              {/* The Live Interactive Satellite Map */}
              <div className="w-full">
                <RealSatelliteMap />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: SITE CALIBRATION (HELMERT)
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "telemetry" && (
            <div className="flex flex-col gap-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Local Site Calibration Check
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Shows how your local site coordinates adjust for scale, angle rotation, and position shift to match official map grids.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/70">
                  Average Accuracy: Under 1 mm
                </span>
              </div>

              {/* 3 Practical Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Ground Scale Factor
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-900">
                    0.999984 <span className="text-xs text-slate-400 font-normal">(&plusmn;0.000001)</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Near 1:1 ground-to-grid match</div>
                </div>

                <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Grid Rotation Angle
                  </div>
                  <div className="text-lg font-mono font-bold text-slate-900">
                    +0° 00&apos; 14.2&quot;
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Aligns survey grid with True North</div>
                </div>

                <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Position Shift (X, Y)
                  </div>
                  <div className="text-lg font-mono font-bold text-blue-600">
                    +513,556m, +2,787,467m
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Offset from official grid origin</div>
                </div>
              </div>

              {/* Clean 4-Point Tie Residuals List */}
              <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200/70 text-xs font-semibold text-slate-700 flex justify-between items-center">
                  <span>Benchmark Accuracy Check</span>
                  <span className="text-slate-400 font-mono text-[11px]">Position differences after calibration</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs font-mono">
                  {[
                    { id: "BM-01", name: "Master Benchmark Datum", diff: "0.4 mm", east: "513,556.612", north: "2,787,467.856" },
                    { id: "CP-02", name: "Boundary Corner Peg", diff: "0.5 mm", east: "513,720.400", north: "2,787,590.200" },
                    { id: "CR-03", name: "Ridge Elevation Point", diff: "0.2 mm", east: "513,850.150", north: "2,787,480.900" },
                    { id: "BS-04", name: "Traverse Tie Station", diff: "0.5 mm", east: "513,690.800", north: "2,787,350.100" },
                  ].map((row) => (
                    <div key={row.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-blue-600">{row.id}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-700 font-sans font-medium">{row.name}</span>
                      </div>

                      <div className="flex items-center gap-4 text-slate-500">
                        <span className="hidden sm:inline">E: {row.east} · N: {row.north}</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          Difference: {row.diff}
                        </span>
                        <span className="text-xs text-emerald-600 font-sans font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Matched
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minimalist Footnote */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Runs 100% on your computer · No data leaves your machine
                </span>
                <span className="text-slate-400 font-mono">Supports 6,800+ national map datums</span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: COORDINATE CONVERTER
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "converter" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Form Inputs (7 cols) */}
              <div className="lg:col-span-7 bg-slate-50/70 p-5 rounded-xl border border-slate-200/70 space-y-4">
                
                {/* Coordinate System Selector with Qatar, Dubai, Pakistan, and others */}
                <div>
                  <label htmlFor={sysId_} className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Select Map Grid / Region</span>
                    <span className="text-[11px] text-slate-400 font-normal">Fills in a sample benchmark</span>
                  </label>
                  <select
                    id={sysId_}
                    value={coordSystem}
                    onChange={(e) => applyPreset(e.target.value)}
                    className={inputCls + " cursor-pointer bg-white"}
                  >
                    <option value="dubai">🇦🇪 Dubai DLTM (EPSG:3997)</option>
                    <option value="qatar">🇶🇦 Qatar National Grid (EPSG:2932)</option>
                    <option value="pakistan">🇵🇰 Pakistan Survey / UTM 42N (EPSG:32642)</option>
                    <option value="saudi">🇸🇦 Saudi Arabia / UTM 38N (EPSG:32638)</option>
                    <option value="london">🇬🇧 British National Grid (EPSG:27700)</option>
                    <option value="nyc">🇺🇸 New York NAD83 (EPSG:32118)</option>
                    <option value="utm40">🌐 Global UTM Zone 40N (EPSG:32640)</option>
                  </select>
                </div>

                {/* Point ID */}
                <div>
                  <label htmlFor={stationId_} className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Point Name / ID
                  </label>
                  <input
                    id={stationId_}
                    type="text"
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Easting, Northing & Elevation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label htmlFor={eastId_} className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Easting / X (m)
                    </label>
                    <input
                      id={eastId_}
                      type="number"
                      step="0.001"
                      value={easting}
                      onChange={(e) => setEasting(parseFloat(e.target.value) || 0)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor={northId_} className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Northing / Y (m)
                    </label>
                    <input
                      id={northId_}
                      type="number"
                      step="0.001"
                      value={northing}
                      onChange={(e) => setNorthing(parseFloat(e.target.value) || 0)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor={elevId_} className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Elevation / Z (m)
                    </label>
                    <input
                      id={elevId_}
                      type="number"
                      step="0.01"
                      value={elevation}
                      onChange={(e) => setElevation(parseFloat(e.target.value) || 0)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Practical Tip */}
                <div className="bg-white/80 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-slate-600 leading-relaxed">
                  💡 <strong>Instant Conversion:</strong> Type any coordinates above. Latitude and Longitude calculate automatically, and you can test the KML download immediately.
                </div>
              </div>

              {/* Right Column: Radar Simulation + Outputs + Download Button (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-3.5">
                
                {/* Calculation Header & Radar Display */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3.5">
                  
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Converted GPS Coordinates
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70">
                      WGS84 GPS
                    </span>
                  </div>

                  {/* Interactive Geodetic Radar Screen */}
                  <div className="relative w-full h-36 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {/* Concentric Range Rings */}
                    <div className="absolute w-28 h-28 rounded-full border border-sky-500/20" />
                    <div className="absolute w-20 h-20 rounded-full border border-sky-500/30" />
                    <div className="absolute w-10 h-10 rounded-full border border-sky-500/40" />

                    {/* Axis Crosshairs */}
                    <div className="absolute inset-x-0 h-px bg-sky-500/25 top-1/2" />
                    <div className="absolute inset-y-0 w-px bg-sky-500/25 left-1/2" />

                    {/* Sweeping Radar Beam */}
                    <div className="absolute inset-0 animate-radar-sweep pointer-events-none">
                      <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/35 via-transparent to-transparent origin-bottom-right" />
                    </div>

                    {/* Dynamic Station Target Blip */}
                    <div
                      className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-lg shadow-emerald-500/60 transition-all duration-300"
                      style={{
                        transform: `translate(${Math.max(-46, Math.min(46, dE / 22))}px, ${Math.max(-46, Math.min(46, -dN / 22))}px)`,
                      }}
                    />

                    {/* Radar Status Tags */}
                    <div className="absolute top-2 left-2.5 text-[10px] font-mono text-slate-400">
                      GRID: <span className="text-white font-bold">{currentPreset.name.split(" ")[0]}</span>
                    </div>
                    <div className="absolute bottom-2 right-2.5 text-[10px] font-mono text-emerald-400 font-bold tracking-wider">
                      POINT LOCATED
                    </div>
                  </div>

                  {/* Coordinate Outputs Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
                    <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-sans">Latitude (GPS)</div>
                      <div className="font-semibold text-slate-900 mt-0.5">{computedLat}° N</div>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-sans">Longitude (GPS)</div>
                      <div className="font-semibold text-slate-900 mt-0.5">{computedLon}° {parseFloat(computedLon) >= 0 ? "E" : "W"}</div>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-sans">Elevation (3D)</div>
                      <div className="font-semibold text-blue-600 mt-0.5">+{elevation} m</div>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/70">
                      <div className="text-[10px] text-slate-400 font-sans">Accuracy</div>
                      <div className="font-semibold text-emerald-600 mt-0.5 truncate">{currentPreset.accuracy}</div>
                    </div>
                  </div>
                </div>

                {/* Eye-conforming Download button */}
                <button
                  onClick={handleDownloadKml}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.28)] active:translate-y-0.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sample .KML</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}
