"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Layers, MapPin, CheckCircle2, Globe, Sparkles } from "lucide-react";

interface SurveyMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  easting: string;
  northing: string;
  elev: string;
  code: string;
}

const SURVEY_STATIONS: SurveyMarker[] = [
  {
    id: "BM-01",
    name: "Control Datum BM-01",
    lat: 25.1972,
    lng: 55.2744,
    easting: "513,556.61",
    northing: "2,787,467.85",
    elev: "+14.85m",
    code: "PRIMARY_BENCHMARK",
  },
  {
    id: "CP-02",
    name: "Corner Monument CP-02",
    lat: 25.1995,
    lng: 55.2785,
    easting: "513,720.40",
    northing: "2,787,590.20",
    elev: "+26.50m",
    code: "BOUNDARY_CORNER",
  },
  {
    id: "CR-03",
    name: "Survey Station CR-03",
    lat: 25.1962,
    lng: 55.2810,
    easting: "513,850.15",
    northing: "2,787,480.90",
    elev: "+38.20m",
    code: "HIGH_CREST",
  },
  {
    id: "BS-04",
    name: "Traverse Peg BS-04",
    lat: 25.1942,
    lng: 55.2762,
    easting: "513,690.80",
    northing: "2,787,350.10",
    elev: "+19.00m",
    code: "TRAVERSE_PEG",
  },
];

export default function RealSatelliteMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polygonRef = useRef<any>(null);

  const [activeStationId, setActiveStationId] = useState<string>("BM-01");
  const [mapType, setMapType] = useState<"satellite" | "street">("satellite");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentTileLayerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      // Dynamic import leaflet to prevent any SSR window undefined errors
      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Initialize map centered on the survey site
      const map = L.map(mapContainerRef.current, {
        center: [25.1968, 55.2775],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Add Zoom control at top-right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Tile URLs
      const satelliteUrl =
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      const streetUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(mapType === "satellite" ? satelliteUrl : streetUrl, {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      currentTileLayerRef.current = tileLayer;

      // Create survey polygon connecting all 4 stations
      const polygonCoords = SURVEY_STATIONS.map((s) => [s.lat, s.lng] as [number, number]);
      const polygon = L.polygon(polygonCoords, {
        color: "#2563eb",
        weight: 2.5,
        fillColor: "#38bdf8",
        fillOpacity: 0.18,
        dashArray: "6, 4",
      }).addTo(map);

      polygonRef.current = polygon;

      // Create Custom Google Earth Style Pins
      const markers: any[] = [];
      SURVEY_STATIONS.forEach((station) => {
        const pinHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35)); user-select: none;">
            <div style="display: inline-flex; align-items: center; gap: 4px; background: #0f172a; color: #ffffff; padding: 2.5px 7px; border-radius: 6px; font-size: 11px; font-family: monospace; font-weight: 700; white-space: nowrap; border: 1px solid rgba(255, 255, 255, 0.25); box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
              <span style="width: 5px; height: 5px; border-radius: 50%; background: #38bdf8; display: inline-block;"></span>
              <span>${station.id}</span>
            </div>
            <div style="width: 2px; height: 6px; background: #2563eb;"></div>
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb; border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(37, 99, 235, 0.8);"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: pinHtml,
          className: "!bg-transparent !border-0",
          iconSize: [60, 36],
          iconAnchor: [30, 36],
        });

        const marker = L.marker([station.lat, station.lng], { icon: customIcon }).addTo(map);

        // Popup balloon
        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1e293b; min-width: 170px;">
            <div style="font-weight: bold; color: #0071e3; margin-bottom: 4px; font-size: 13px;">📍 ${station.id} · ${station.name}</div>
            <div style="font-family: monospace; font-size: 11px; color: #475569;">
              <div><strong>EAST:</strong> ${station.easting}</div>
              <div><strong>NORTH:</strong> ${station.northing}</div>
              <div style="color: #059669; font-weight: bold;"><strong>ELEV:</strong> ${station.elev}</div>
              <div style="margin-top: 4px; font-size: 10px; color: #64748b;">DATUM: EPSG:3997 DLTM</div>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);

        marker.on("click", () => {
          setActiveStationId(station.id);
        });

        markers.push({ id: station.id, marker });
      });

      markersRef.current = markers;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Layer Toggle (Satellite ⇄ Street)
  const handleToggleLayer = async (type: "satellite" | "street") => {
    if (!mapInstanceRef.current || !currentTileLayerRef.current) return;
    const L = (await import("leaflet")).default;
    setMapType(type);

    mapInstanceRef.current.removeLayer(currentTileLayerRef.current);

    const newUrl =
      type === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    }).addTo(mapInstanceRef.current);

    currentTileLayerRef.current = newLayer;

    // Bring polygon and markers to front
    if (polygonRef.current) polygonRef.current.bringToFront();
  };

  // Fly to selected station
  const handleSelectStation = (id: string) => {
    setActiveStationId(id);
    const target = SURVEY_STATIONS.find((s) => s.id === id);
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], 16, { duration: 1.2 });
      const found = markersRef.current.find((m) => m.id === id);
      if (found && found.marker) {
        found.marker.openPopup();
      }
    }
  };

  const activeStation = SURVEY_STATIONS.find((s) => s.id === activeStationId) || SURVEY_STATIONS[0];

  return (
    <div className="relative w-full rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Viewport Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-800">Satellite Inspection &amp; Boundary Map</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">EPSG:3997 (Dubai DLTM)</span>
        </div>

        {/* Map Layer Switcher: Satellite / Street */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => handleToggleLayer("satellite")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              mapType === "satellite"
                ? "bg-[#0071e3] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => handleToggleLayer("street")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              mapType === "street"
                ? "bg-[#0071e3] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Street</span>
          </button>
        </div>
      </div>

      {/* Real Interactive Leaflet Map Container */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Station Selector Pills */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
          {SURVEY_STATIONS.map((station) => (
            <button
              key={station.id}
              onClick={() => handleSelectStation(station.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeStationId === station.id
                  ? "bg-[#0071e3] text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {station.id}
            </button>
          ))}
        </div>

        {/* Polygon Area Callout Pill */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/90 shadow-md flex items-center gap-2 text-xs font-semibold text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>Surveyed Parcel: 4 Benchmarks Plotted</span>
        </div>

        {/* Live Datum Tag */}
        <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-200/80 shadow-xs font-mono text-[11px] text-slate-600 hidden sm:block">
          EPSG:3997 DLTM ➔ WGS84
        </div>
      </div>

      {/* Active Station Telemetry Footer */}
      <div className="px-4 py-2.5 bg-slate-50/95 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 sm:gap-4 text-slate-600">
          <span>
            <strong className="text-slate-800">STATION:</strong> {activeStation.id}
          </span>
          <span>
            <strong className="text-slate-800">EAST:</strong> {activeStation.easting}
          </span>
          <span>
            <strong className="text-slate-800">NORTH:</strong> {activeStation.northing}
          </span>
          <span className="text-blue-600 font-bold">
            ELEV: {activeStation.elev}
          </span>
        </div>
        <div className="text-emerald-700 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Google Earth KML Ready</span>
        </div>
      </div>
    </div>
  );
}
