"use client";

import React, { useState, useId } from "react";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { Download, ExternalLink } from "lucide-react";

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
    accuracy: "< 1 m (Direct WGS84)",
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
    accuracy: "1–2 m (OSTN15 Shift)",
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
    accuracy: "< 1 m (NAD83 aligned)",
  },
  utm40: {
    name: "UTM Zone 40N",
    flag: "🌐",
    station: "UTM-PT-88",
    easting: 350000.0,
    northing: 2790000.0,
    elev: 28.5,
    code: "BOUNDARY",
    lat: 25.21542,
    lon: 53.51205,
    grid: "EPSG:32640 (UTM 40N)",
    accuracy: "< 1 m (WGS84 Ellipsoid)",
  },
};

type TabId = "earth" | "telemetry" | "converter";

interface ShowcaseProps {
  versionTag: string;
  onToast: (msg: string) => void;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "earth",
    label: "Google Earth Preview",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: "telemetry",
    label: "GIS & Elevation",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    id: "converter",
    label: "Live Playground",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
];

export default function Showcase({ versionTag, onToast }: ShowcaseProps) {
  const { requireAuth, trackDownload } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("earth");
  const [selectedPreset, setSelectedPreset] = useState("dubai");
  const [stationId, setStationId] = useState(PRESETS.dubai.station);
  const [featureCode, setFeatureCode] = useState(PRESETS.dubai.code);
  const [easting, setEasting] = useState<number>(PRESETS.dubai.easting);
  const [northing, setNorthing] = useState<number>(PRESETS.dubai.northing);
  const [elevation, setElevation] = useState<number>(PRESETS.dubai.elev);
  const [coordSystem, setCoordSystem] = useState("dubai");

  const stationId_ = useId();
  const codeId_ = useId();
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
    setFeatureCode(p.code);
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
      const dateStr = new Date().toISOString().split("T")[0];
      const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Survey Benchmark — ${stationId}</name>
    <Placemark>
      <name>${stationId}</name>
      <description>Code: ${featureCode} | Elevation: ${elevation}m</description>
      <Point>
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

  const inputCls =
    "w-full px-4 py-2.5 text-[14px] text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] transition-all font-mono placeholder:text-[#aeaeb2]";

  return (
    <section id="showcase" className="py-20 bg-[#f5f5f7]">
      <div className="max-w-[980px] mx-auto px-5 sm:px-8">

        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-[13px] font-semibold text-[#0071e3] uppercase tracking-widest mb-3">Interactive Demo</p>
          <h2 className="text-[36px] sm:text-[44px] font-bold tracking-tight text-[#1d1d1f]">
            See It In Action.
          </h2>
          <p className="text-[16px] text-[#6e6e73] mt-3">
            Try the live coordinate converter or view real Google Earth outputs.
          </p>
        </div>

        {/* App window card */}
        <div className="bg-white rounded-[20px] border border-[#d2d2d7] shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden">

          {/* ── Window chrome bar ── */}
          <div className="flex items-center gap-0 border-b border-[#e8e8ed] bg-[#f5f5f7]/80 px-5">
            {/* Traffic lights */}
            <div className="flex items-center gap-1.5 pr-5 py-4 border-r border-[#e8e8ed]">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>

            {/* Tabs */}
            <div className="flex items-stretch gap-0 overflow-x-auto flex-1">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-5 py-4 text-[13px] font-medium whitespace-nowrap border-r border-[#e8e8ed] transition-colors duration-150 ${
                      active
                        ? "text-[#0071e3] bg-white"
                        : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/60"
                    }`}
                  >
                    <span className={active ? "text-[#0071e3]" : "text-[#aeaeb2]"}>{tab.icon}</span>
                    {tab.label}
                    {/* Active indicator — bottom line */}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0071e3]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Status dot */}
            <div className="flex items-center gap-1.5 pl-5 py-4 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse-soft" />
              <span className="text-[11px] text-[#aeaeb2] font-medium hidden sm:inline">Live</span>
            </div>
          </div>

          {/* ── Tab Content ── */}

          {/* Tab 1 — Google Earth Preview */}
          {activeTab === "earth" && (
            <div className="p-5">
              <div className="relative rounded-[14px] overflow-hidden border border-[#e8e8ed]">
                <Image
                  src="/assets/google_earth_preview.jpg"
                  alt="Google Earth 3D Survey Placemarks"
                  width={1400}
                  height={800}
                  className="w-full h-auto object-cover max-h-[480px]"
                  priority
                />
                {/* Caption overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-white bg-[#0071e3] px-2 py-0.5 rounded-md">KML 2.2</span>
                        <span className="text-[11px] text-white/70">3D Elevation Pins · Geotagged Photos</span>
                      </div>
                      <p className="text-[14px] font-semibold text-white">
                        Apex Tech Park Benchmark Project
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-[#febc2e] shrink-0">
                      Accuracy: &lt; 0.05 m
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[13px] text-[#6e6e73] text-center">
                Actual output opened in Google Earth Pro — Survey traverses, 3D elevation pins &amp; embedded site photos.
              </p>
            </div>
          )}

          {/* Tab 2 — GIS & Elevation */}
          {activeTab === "telemetry" && (
            <div className="p-5">
              <div className="relative rounded-[14px] overflow-hidden border border-[#e8e8ed]">
                <Image
                  src="/assets/hero_geospatial.jpg"
                  alt="Digital Elevation Model and Geospatial Data"
                  width={1400}
                  height={800}
                  className="w-full h-auto object-cover max-h-[480px]"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-black bg-[#febc2e] px-2 py-0.5 rounded-md">EPSG:3997 DLTM</span>
                        <span className="text-[11px] text-white/70">Helmert 2D Site Fit · 6,864 Grids</span>
                      </div>
                      <p className="text-[14px] font-semibold text-white">
                        Cascade North Elevation Analysis
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-[#6ee7b7] shrink-0">
                      Helmert Calibration Active
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[13px] text-[#6e6e73] text-center">
                Digital elevation models with national grid overlays — 12 satellites synced, PDOP 1.1.
              </p>
            </div>
          )}

          {/* Tab 3 — Live Playground */}
          {activeTab === "converter" && (
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* ── Left: Inputs ── */}
                <div className="lg:col-span-3 space-y-5">
                  {/* Preset pills */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73] mb-3">
                      Quick-Load Preset
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(PRESETS).map(([key, p]) => (
                        <button
                          key={key}
                          onClick={() => applyPreset(key)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-full border transition-all duration-150 ${
                            selectedPreset === key
                              ? "bg-[#0071e3] text-white border-[#0071e3] shadow-sm"
                              : "bg-white text-[#1d1d1f] border-[#d2d2d7] hover:border-[#aeaeb2]"
                          }`}
                        >
                          <span>{p.flag}</span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Station + Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={stationId_} className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
                        Station / Point ID
                      </label>
                      <input
                        id={stationId_}
                        type="text"
                        value={stationId}
                        onChange={(e) => setStationId(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor={codeId_} className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
                        Feature Code
                      </label>
                      <input
                        id={codeId_}
                        type="text"
                        value={featureCode}
                        onChange={(e) => setFeatureCode(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Easting + Northing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={eastId_} className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
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
                      <label htmlFor={northId_} className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
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
                  </div>

                  {/* Elevation + Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={elevId_} className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
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
                    <div>
                      <label htmlFor={sysId_} className="block text-[12px] font-semibold text-[#1d1d1f] mb-1.5">
                        Coordinate System
                      </label>
                      <select
                        id={sysId_}
                        value={coordSystem}
                        onChange={(e) => applyPreset(e.target.value)}
                        className={inputCls + " cursor-pointer"}
                      >
                        <option value="dubai">Dubai DLTM (EPSG:3997)</option>
                        <option value="london">British National Grid (EPSG:27700)</option>
                        <option value="nyc">SPCS NY Long Island (EPSG:32118)</option>
                        <option value="utm40">UTM Zone 40 North (EPSG:32640)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-[#f5f5f7] border border-[#e8e8ed] rounded-[12px] px-4 py-3 text-[13px] text-[#6e6e73] leading-relaxed">
                    💡 Edit any coordinate above — Lat/Lon updates live. Download a real Google Earth <strong className="text-[#1d1d1f]">.KML file</strong> instantly.
                  </div>
                </div>

                {/* ── Right: Results ── */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1d1d1f]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse-soft" />
                      Live WGS84 Output
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md border border-[#0071e3]/15">
                      ELLIPSOID: WGS84
                    </span>
                  </div>

                  {/* Radar */}
                  <div className="relative w-full h-36 rounded-[14px] bg-[#1d1d1f] overflow-hidden flex items-center justify-center shrink-0">
                    <div className="absolute w-28 h-28 rounded-full border border-white/10" />
                    <div className="absolute w-20 h-20 rounded-full border border-white/15" />
                    <div className="absolute w-10 h-10 rounded-full border border-white/20" />
                    <div className="absolute inset-x-0 h-px bg-white/10 top-1/2" />
                    <div className="absolute inset-y-0 w-px bg-white/10 left-1/2" />
                    <div className="absolute inset-0 animate-radar-sweep pointer-events-none">
                      <div className="w-1/2 h-1/2 bg-gradient-to-br from-[#34c759]/40 via-transparent to-transparent origin-bottom-right" />
                    </div>
                    <div
                      className="absolute w-3 h-3 rounded-full bg-[#34c759] shadow-[0_0_10px_rgba(52,199,89,0.8)] transition-all duration-300"
                      style={{ transform: `translate(${Math.max(-44, Math.min(44, dE / 22))}px, ${Math.max(-44, Math.min(44, -dN / 22))}px)` }}
                    />
                    <p className="absolute bottom-2 right-2.5 text-[9px] font-mono font-bold text-[#34c759] tracking-widest">TARGET LOCKED</p>
                  </div>

                  {/* Coordinate outputs */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: "Latitude", value: `${computedLat}° N`, color: "text-[#1d1d1f]" },
                      { label: "Longitude", value: `${computedLon}° ${parseFloat(computedLon) >= 0 ? "E" : "W"}`, color: "text-[#1d1d1f]" },
                      { label: "Grid", value: currentPreset.grid, color: "text-[#1d1d1f]" },
                      { label: "Accuracy", value: currentPreset.accuracy, color: "text-[#34c759]" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-[#f5f5f7] border border-[#e8e8ed] rounded-[12px] p-3">
                        <div className="text-[10px] uppercase font-semibold text-[#aeaeb2] tracking-wide mb-1">{label}</div>
                        <div className={`text-[12px] font-mono font-semibold ${color} truncate`} title={value}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={handleDownloadKml}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] rounded-[12px] transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Test .KML
                    </button>
                    <a
                      href="/app"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-[#0071e3] bg-[#0071e3]/[0.07] hover:bg-[#0071e3]/[0.12] rounded-[12px] transition-colors border border-[#0071e3]/15"
                    >
                      Open Full Tool
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
