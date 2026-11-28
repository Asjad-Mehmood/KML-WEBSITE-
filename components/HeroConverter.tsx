"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, Copy, CheckCircle2, Download, Globe, ClipboardPaste } from "lucide-react";
import { CURATED, POPULAR_SYSTEMS, centralMeridian, gridToWgs84, systemFromRow, type CoordSystem, type EpsgRow } from "@/lib/geo/heroSystems";
import { RadarCanvas } from "@/components/hero/RadarCanvas";
import { SystemPicker } from "@/components/hero/SystemPicker";
import { BatchPanel } from "@/components/hero/BatchPanel";
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
  const pathname = usePathname();

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
    <description><![CDATA[Converted via Excel to KML
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
          {/* On other pages, link to this grid's own page (parameters, area of use, tips) */}
          {pathname?.startsWith("/convert") ? (
            <span className="text-[11px] font-mono text-cyan-400/80">{current.grid}</span>
          ) : (
            <Link
              href={`/convert/epsg/${current.code}`}
              className="text-[11px] font-mono text-cyan-300 hover:text-white underline-offset-2 hover:underline"
              title={`${current.grid} details and converter page`}
            >
              {current.grid} details →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
