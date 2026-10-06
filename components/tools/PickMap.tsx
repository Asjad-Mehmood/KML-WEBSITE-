"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";

const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = {
  satellite: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
  street: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
};

export interface PickMapProps {
  point: { lat: number; lon: number } | null;
  /** the picked point's UTM zone, drawn as a light band */
  zone?: { west: number; east: number; south: number; north: number } | null;
  /** accuracy circle in metres, for a phone's location */
  accuracy?: number | null;
  /** fly to this view when it changes */
  view?: { lat: number; lon: number; zoom: number; key: number } | null;
  mapType: "satellite" | "street";
  onPick: (lat: number, lon: number) => void;
}

/** A Leaflet map to click on. Loaded in the browser only (Leaflet needs `window`). */
export default function PickMap({ point, zone, accuracy, view, mapType, onPick }: PickMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const tiles = useRef<Leaflet.TileLayer | null>(null);
  const marker = useRef<Leaflet.CircleMarker | null>(null);
  const band = useRef<Leaflet.Rectangle | null>(null);
  const acc = useRef<Leaflet.Circle | null>(null);
  // the map loads a moment after the page: points and views that arrive before are applied then
  const [ready, setReady] = useState(false);
  const pick = useRef(onPick);
  useEffect(() => {
    pick.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let dead = false;
    (async () => {
      const lib = await import("leaflet");
      if (dead || !box.current || map.current) return;
      L.current = lib;
      const m = lib.map(box.current, { center: [25.285028, 51.499862], zoom: 4, worldCopyJump: true });
      m.on("click", (e: Leaflet.LeafletMouseEvent) => pick.current(e.latlng.lat, lib.Util.wrapNum(e.latlng.lng, [-180, 180], true)));
      map.current = m;
      tiles.current = lib.tileLayer(mapType === "satellite" ? SATELLITE_URL : STREET_URL, { maxZoom: 19, subdomains: ["a", "b", "c"], attribution: ATTRIBUTION[mapType] }).addTo(m);
      setReady(true);
    })();
    return () => {
      dead = true;
      map.current?.remove();
      map.current = null;
    };
    // the map is made once; later changes go through the effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lib = L.current, m = map.current;
    if (!lib || !m) return;
    tiles.current?.remove();
    tiles.current = lib.tileLayer(mapType === "satellite" ? SATELLITE_URL : STREET_URL, { maxZoom: 19, subdomains: ["a", "b", "c"], attribution: ATTRIBUTION[mapType] }).addTo(m);
  }, [mapType]);

  useEffect(() => {
    const lib = L.current, m = map.current;
    if (!lib || !m) return;
    marker.current?.remove();
    band.current?.remove();
    acc.current?.remove();
    marker.current = band.current = acc.current = null;
    if (zone) band.current = lib.rectangle([[zone.south, zone.west], [zone.north, zone.east]], { color: "#0071e3", weight: 1, fillOpacity: 0.06, interactive: false }).addTo(m);
    if (point && accuracy) acc.current = lib.circle([point.lat, point.lon], { radius: accuracy, color: "#0071e3", weight: 1, fillOpacity: 0.12, interactive: false }).addTo(m);
    if (point) marker.current = lib.circleMarker([point.lat, point.lon], { radius: 8, color: "#fff", weight: 3, fillColor: "#e11d48", fillOpacity: 1 }).addTo(m);
  }, [point, zone, accuracy, ready]);

  useEffect(() => {
    if (view && map.current) map.current.flyTo([view.lat, view.lon], view.zoom, { duration: 0.8 });
  }, [view, ready]);

  return <div ref={box} className="h-[380px] sm:h-[460px] w-full rounded-2xl overflow-hidden border border-slate-200 z-0" role="application" aria-label="Map: click to pick a point" />;
}
