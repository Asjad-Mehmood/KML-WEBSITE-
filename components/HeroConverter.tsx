"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  RefreshCw,
  Copy,
  CheckCircle2,
  Download,
  ChevronDown,
  Globe,
} from "lucide-react";

/* ─── Preset Data ─── */
interface PresetData {
  name: string;
  flag: string;
  station: string;
  easting: number;
  northing: number;
  elev: number;
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
    lat: 25.193248,
    lon: 55.467835,
    grid: "EPSG:3997",
    accuracy: "< 1 mm",
  },
  qatar: {
    name: "Qatar QNG",
    flag: "🇶🇦",
    station: "QNG-DOH-12",
    easting: 231540.25,
    northing: 392410.8,
    elev: 11.2,
    lat: 25.2867,
    lon: 51.5332,
    grid: "EPSG:2932",
    accuracy: "< 1 mm",
  },
  pakistan: {
    name: "Pakistan UTM 42N",
    flag: "🇵🇰",
    station: "PAK-ISB-07",
    easting: 336520.4,
    northing: 3728140.6,
    elev: 540.5,
    lat: 33.68442,
    lon: 73.04788,
    grid: "EPSG:32642",
    accuracy: "< 1 mm",
  },
  saudi: {
    name: "Saudi UTM 38N",
    flag: "🇸🇦",
    station: "KSA-RUH-03",
    easting: 671230.15,
    northing: 2731520.85,
    elev: 612.0,
    lat: 24.68773,
    lon: 46.68631,
    grid: "EPSG:32638",
    accuracy: "< 1 mm",
  },
  london: {
    name: "London OSGB36",
    flag: "🇬🇧",
    station: "TBM-LON-04",
    easting: 538120.0,
    northing: 184510.0,
    elev: 12.3,
    lat: 51.54321,
    lon: -0.01254,
    grid: "EPSG:27700",
    accuracy: "1–2 mm",
  },
  nyc: {
    name: "NYC NAD83",
    flag: "🇺🇸",
    station: "NYC-CTRL-22",
    easting: 298450.0,
    northing: 68420.0,
    elev: 34.2,
    lat: 40.782865,
    lon: -73.965355,
    grid: "EPSG:32118",
    accuracy: "< 1 mm",
  },
};

/* ─── Radar Canvas Component ─── */
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

      // Background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.4);
      bgGrad.addColorStop(0, "rgba(3, 17, 35, 0.97)");
      bgGrad.addColorStop(1, "rgba(1, 5, 12, 1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(0, 180, 255, 0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath(); ctx.moveTo(0, (h / 8) * i); ctx.lineTo(w, (h / 8) * i); ctx.stroke();
        ctx.beginPath(); ctx.moveTo((w / 8) * i, 0); ctx.lineTo((w / 8) * i, h); ctx.stroke();
      }

      // Concentric rings
      for (const frac of [0.25, 0.5, 0.75, 1.0]) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 180, 255, ${frac === 1 ? 0.15 : 0.07})`;
        ctx.lineWidth = frac === 1 ? 1 : 0.6;
        ctx.stroke();
      }

      // Crosshairs
      ctx.strokeStyle = "rgba(0, 180, 255, 0.1)";
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();

      // Sweep beam
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

      // Leading edge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR);
      ctx.strokeStyle = "rgba(0, 220, 255, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Station blip
      const bx = cx + blipRef.current.x * maxR * 0.7;
      const by = cy - blipRef.current.y * maxR * 0.7;
      const blipAngle = Math.atan2(-(blipRef.current.y), blipRef.current.x);
      let angleDiff = ((sweep - blipAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      let alpha = angleDiff < Math.PI * 0.5 ? 1 - angleDiff / (Math.PI * 0.5) : 0;
      alpha = Math.max(alpha, 0.15 + 0.08 * Math.sin(Date.now() / 400));

      // Glow
      const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 12);
      glow.addColorStop(0, `rgba(0, 255, 180, ${alpha * 0.6})`);
      glow.addColorStop(1, "rgba(0, 255, 180, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(bx, by, 12, 0, Math.PI * 2); ctx.fill();

      // Core
      ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 180, ${alpha})`;
      ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 180, ${alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Center dot
      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 200, 255, 0.6)";
      ctx.fill();

      // Cardinal labels
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "rgba(0, 180, 255, 0.22)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("N", cx, cy - maxR - 8);
      ctx.fillText("S", cx, cy + maxR + 8);
      ctx.fillText("E", cx + maxR + 8, cy);
      ctx.fillText("W", cx - maxR - 8, cy);

      // Tick marks
      for (let i = 0; i < 36; i++) {
        const ta = (i * 10 * Math.PI) / 180;
        const inner = i % 3 === 0 ? maxR - 5 : maxR - 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ta) * inner, cy + Math.sin(ta) * inner);
        ctx.lineTo(cx + Math.cos(ta) * maxR, cy + Math.sin(ta) * maxR);
        ctx.strokeStyle = `rgba(0, 180, 255, ${i % 3 === 0 ? 0.18 : 0.06})`;
        ctx.lineWidth = i % 3 === 0 ? 0.8 : 0.4;
        ctx.stroke();
      }

      angleRef.current += 0.018;
      if (angleRef.current > Math.PI * 2) angleRef.current -= Math.PI * 2;
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-xl" />;
}

/* ─── Main Component ─── */
export default function HeroConverter() {
  const [selectedPreset, setSelectedPreset] = useState("dubai");
  const [easting, setEasting] = useState(PRESETS.dubai.easting);
  const [northing, setNorthing] = useState(PRESETS.dubai.northing);
  const [elevation, setElevation] = useState(PRESETS.dubai.elev);
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const current = PRESETS[selectedPreset] || PRESETS.dubai;

  const dE = (easting || 0) - current.easting;
  const dN = (northing || 0) - current.northing;
  const computedLat = (current.lat + dN / 111320).toFixed(6);
  const computedLon = (current.lon + dE / (111320 * Math.cos((current.lat * Math.PI) / 180))).toFixed(6);

  // Blip position normalized to -1..1
  const blipX = Math.max(-1, Math.min(1, dE / 5000));
  const blipY = Math.max(-1, Math.min(1, dN / 5000));

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setSelectedPreset(key);
    setEasting(p.easting);
    setNorthing(p.northing);
    setElevation(p.elev);
    setShowDropdown(false);
  };

  const copyCoords = useCallback(() => {
    navigator.clipboard.writeText(`${computedLat}, ${computedLon}`).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [computedLat, computedLon]);

  const [downloaded, setDownloaded] = useState(false);

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
Datum: WGS-84]]></description>
    <Style id="surveyStyle">
      <IconStyle>
        <color>ff00e6ff</color>
        <scale>1.2</scale>
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
            <tr><td style="padding: 4px 8px; font-weight: 600;">WGS84 Latitude</td><td style="padding: 4px 8px; font-family: monospace;">${computedLat}° N</td></tr>
            <tr style="background: #f1f5f9;"><td style="padding: 4px 8px; font-weight: 600;">WGS84 Longitude</td><td style="padding: 4px 8px; font-family: monospace;">${computedLon}° ${parseFloat(computedLon) >= 0 ? "E" : "W"}</td></tr>
            <tr><td style="padding: 4px 8px; font-weight: 600;">Datum</td><td style="padding: 4px 8px;">WGS-84 (Ellipsoidal)</td></tr>
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
    a.download = `${current.station}_converted.kml`;
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
    <div className="w-full max-w-[540px] mx-auto lg:mx-0">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(3, 14, 30, 0.95)",
          border: "1px solid rgba(0, 180, 255, 0.12)",
          boxShadow: "0 8px 40px rgba(0, 0, 0, 0.25), 0 0 60px rgba(0, 100, 200, 0.06)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.08)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(0,180,255,0.25), rgba(0,255,180,0.15))",
                border: "1px solid rgba(0,180,255,0.2)",
              }}
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-cyan-100 leading-tight">Quick Coordinate Converter</h3>
              <p className="text-[10px] font-medium" style={{ color: "rgba(0,180,255,0.5)" }}>
                Grid (E, N) → GPS (Lat, Lon)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold text-emerald-400">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-0">
          {/* ── Left: Inputs ── */}
          <div className="sm:col-span-7 px-4 py-3 space-y-2.5" style={{ borderRight: "1px solid rgba(0,180,255,0.06)" }}>
            {/* Grid Selector */}
            <div className="relative">
              <label className="block text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(0,180,255,0.45)" }}>
                Coordinate System
              </label>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors"
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                }}
              >
                <span>{current.flag} {current.name} ({current.grid})</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? "rotate-180" : ""}`} style={{ color: "rgba(0,180,255,0.4)" }} />
              </button>
              {showDropdown && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-30"
                  style={{
                    background: "rgba(3, 14, 30, 0.97)",
                    border: "1px solid rgba(0, 180, 255, 0.15)",
                    backdropFilter: "blur(12px)",
                    maxHeight: "180px",
                    overflowY: "auto",
                  }}
                >
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className="w-full text-left px-3 py-2 text-[10px] transition-colors hover:bg-cyan-500/10"
                      style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.06)", color: "#bae6fd" }}
                    >
                      <span className="font-bold">{p.flag} {p.name}</span>
                      <span className="ml-2 font-mono" style={{ color: "rgba(0,180,255,0.35)" }}>{p.grid}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Easting & Northing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(0,180,255,0.45)" }}>Easting (m)</label>
                <input
                  type="number"
                  step="0.001"
                  value={easting}
                  onChange={(e) => setEasting(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 rounded-lg text-[11px] font-mono font-semibold focus:outline-none transition-all"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(0,180,255,0.45)" }}>Northing (m)</label>
                <input
                  type="number"
                  step="0.001"
                  value={northing}
                  onChange={(e) => setNorthing(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-2 rounded-lg text-[11px] font-mono font-semibold focus:outline-none transition-all"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Elevation */}
            <div>
              <label className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(0,180,255,0.45)" }}>Elevation (m)</label>
              <input
                type="number"
                step="0.01"
                value={elevation}
                onChange={(e) => setElevation(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-2 rounded-lg text-[11px] font-mono font-semibold focus:outline-none transition-all"
                style={inputStyle}
              />
            </div>

            {/* Computed GPS Output */}
            <div
              className="rounded-lg p-2.5 space-y-1.5"
              style={{ background: "rgba(0, 255, 180, 0.04)", border: "1px solid rgba(0, 255, 180, 0.1)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Converted Coordinates (WGS84)</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={copyCoords}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-colors hover:bg-cyan-500/10 cursor-pointer"
                    style={{ color: "rgba(0,180,255,0.7)", background: "rgba(0,180,255,0.06)" }}
                    title="Copy Latitude, Longitude"
                  >
                    {copied ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(0,180,255,0.35)" }}>Latitude</div>
                  <div className="text-[11px] font-mono font-bold text-cyan-100">{computedLat}° N</div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(0,180,255,0.35)" }}>Longitude</div>
                  <div className="text-[11px] font-mono font-bold text-cyan-100">{computedLon}° {parseFloat(computedLon) >= 0 ? "E" : "W"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(0,180,255,0.35)" }}>Elevation</div>
                  <div className="text-[11px] font-mono font-bold" style={{ color: "#7dd3fc" }}>+{elevation} m</div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(0,180,255,0.35)" }}>Accuracy</div>
                  <div className="text-[11px] font-mono font-bold text-emerald-400">{current.accuracy}</div>
                </div>
              </div>

              {/* Download KML Button */}
              <button
                type="button"
                onClick={downloadKml}
                className="w-full mt-2 py-2 px-3 rounded-lg text-[10px] font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
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
                    <span>Downloaded KML</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Download KML</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Right: Radar Display ── */}
          <div className="sm:col-span-5 p-3 flex flex-col gap-2">
            {/* Radar */}
            <div className="relative w-full aspect-square rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,180,255,0.08)" }}>
              <RadarCanvas blipX={blipX} blipY={blipY} />

              {/* Scan-line overlay */}
              <div
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{
                  background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,180,255,0.01) 2px, rgba(0,180,255,0.01) 4px)",
                }}
              />

              {/* HUD labels */}
              <div className="absolute top-2 left-2 text-[7px] font-mono pointer-events-none" style={{ color: "rgba(0,180,255,0.4)" }}>
                GRID: <span className="text-cyan-300/80">{current.name.split(" ")[0]}</span>
              </div>
              <div className="absolute top-2 right-2 text-[7px] font-mono pointer-events-none" style={{ color: "rgba(0,180,255,0.4)" }}>
                {current.grid}
              </div>
              {/* <div className="absolute bottom-2 left-2 text-[7px] font-mono pointer-events-none text-cyan-300/60 font-semibold">
                RADAR VIEW
              </div> */}
              <div className="absolute bottom-2 right-2 text-[7px] font-mono pointer-events-none" style={{ color: "rgba(0,180,255,0.4)" }}>
                {current.accuracy}
              </div>

              {/* Corner accents */}
              <div className="absolute top-1 left-1 w-3 h-3 pointer-events-none" style={{ borderLeft: "1.5px solid rgba(0,180,255,0.2)", borderTop: "1.5px solid rgba(0,180,255,0.2)" }} />
              <div className="absolute top-1 right-1 w-3 h-3 pointer-events-none" style={{ borderRight: "1.5px solid rgba(0,180,255,0.2)", borderTop: "1.5px solid rgba(0,180,255,0.2)" }} />
              <div className="absolute bottom-1 left-1 w-3 h-3 pointer-events-none" style={{ borderLeft: "1.5px solid rgba(0,180,255,0.2)", borderBottom: "1.5px solid rgba(0,180,255,0.2)" }} />
              <div className="absolute bottom-1 right-1 w-3 h-3 pointer-events-none" style={{ borderRight: "1.5px solid rgba(0,180,255,0.2)", borderBottom: "1.5px solid rgba(0,180,255,0.2)" }} />
            </div>

            {/* Station Info */}
            <div
              className="rounded-lg px-3 py-2 flex items-center justify-between"
              style={{ background: "rgba(0,180,255,0.04)", border: "1px solid rgba(0,180,255,0.08)" }}
            >
              <div>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(0,180,255,0.35)" }}>Station ID</div>
                <div className="text-[11px] font-mono font-bold text-cyan-200">{current.station}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] uppercase tracking-wider" style={{ color: "rgba(0,180,255,0.35)" }}>Datum</div>
                <div className="text-[11px] font-mono font-bold" style={{ color: "#7dd3fc" }}>WGS-84</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(0, 180, 255, 0.06)" }}
        >
          <span className="text-[9px] font-medium flex items-center gap-1.5" style={{ color: "rgba(0, 180, 255, 0.45)" }}>
            <Globe className="w-3 h-3 text-cyan-400/60" />
            Exports standard KML 2.2 for Google Earth
          </span>
          <span className="text-[9px] font-mono" style={{ color: "rgba(0, 180, 255, 0.35)" }}>
            WGS84 Coordinates
          </span>
        </div>
      </div>
    </div>
  );
}
