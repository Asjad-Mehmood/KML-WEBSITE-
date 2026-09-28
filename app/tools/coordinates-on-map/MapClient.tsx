"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, Layers, Search } from "lucide-react";
import { Card, ResultRow } from "@/components/tools/ui";
import { ShareButton, useShared } from "@/components/tools/share";
import { formatDdm, formatDms, parseDms, parsePair, toUtm, validLat, validLon } from "@/lib/toolMath";
import { placeSearchAllowed, searchPlaces, type PlaceHit } from "@/lib/mapSearch";

const PickMap = dynamic(() => import("@/components/tools/PickMap"), {
  ssr: false,
  loading: () => <div className="h-[380px] sm:h-[460px] rounded-2xl bg-slate-100 border border-slate-200 animate-pulse" />,
});

type Pt = { lat: number; lon: number };

export default function MapClient() {
  const get = useShared();
  // a shared link opens on its point
  const [shared] = useState<Pt | null>(() => {
    const lat = parseDms(get("lat", "")), lon = parseDms(get("lon", ""));
    return validLat(lat) && validLon(lon) ? { lat, lon } : null;
  });
  const [pt, setPt] = useState<Pt | null>(shared);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [view, setView] = useState<{ lat: number; lon: number; zoom: number; key: number } | null>(
    shared ? { ...shared, zoom: Number(get("zoom", "17")) || 17, key: 1 } : null
  );
  const [mapType, setMapType] = useState<"satellite" | "street">("satellite");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = (lat: number, lon: number, zoom: number, acc: number | null = null) => {
    setPt({ lat, lon });
    setAccuracy(acc);
    setView({ lat, lon, zoom, key: Date.now() });
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setHits([]);
    setMsg(null);
    const pair = parsePair(q);
    if (pair) return go(pair.lat, pair.lon, 17);
    if (!q.trim()) return;
    if (!placeSearchAllowed()) return setMsg("One search a second, please.");
    setBusy(true);
    try {
      const r = await searchPlaces(q);
      if (!r.length) setMsg("No place found by that name. Try adding the city or country.");
      else if (r.length === 1) go(r[0].lat, r[0].lng, 15);
      else setHits(r);
    } catch {
      setMsg("The place search didn't answer. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const locate = () => {
    setMsg(null);
    if (!navigator.geolocation) return setMsg("This browser can't share its location.");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        go(p.coords.latitude, p.coords.longitude, 17, p.coords.accuracy);
      },
      (err) => {
        setBusy(false);
        setMsg(err.code === 1 ? "Location access was refused. Allow it for this site in your browser, or click the map instead." : "Your location couldn't be found. Try again outdoors, or click the map.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const u = pt && Math.abs(pt.lat) <= 84 ? toUtm(pt.lat, pt.lon) : null;
  const zone = u ? { west: u.zone * 6 - 186, east: u.zone * 6 - 180, south: u.hemisphere === "N" ? 0 : -80, north: u.hemisphere === "N" ? 84 : 0 } : null;
  const dec = pt ? `${pt.lat.toFixed(6)}, ${pt.lon.toFixed(6)}` : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <form onSubmit={search} className="flex-1 min-w-[220px] flex gap-2">
            <label htmlFor="map-q" className="sr-only">Search a place or type coordinates</label>
            <input
              id="map-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a place, or type 25.1930, 55.4690"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-semibold disabled:opacity-60 cursor-pointer">
              <Search className="w-4 h-4" aria-hidden /> Find
            </button>
          </form>
          <button type="button" onClick={locate} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[14px] font-semibold text-slate-800 disabled:opacity-60 cursor-pointer">
            <Crosshair className="w-4 h-4" aria-hidden /> My location
          </button>
          <button type="button" onClick={() => setMapType(mapType === "satellite" ? "street" : "satellite")} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[14px] font-semibold text-slate-800 cursor-pointer">
            <Layers className="w-4 h-4" aria-hidden /> {mapType === "satellite" ? "Street map" : "Satellite"}
          </button>
        </div>
        {msg && <p role="status" className="text-[13px] text-amber-700">{msg}</p>}
        {hits.length > 0 && (
          <ul className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {hits.map((h, i) => (
              <li key={i}>
                <button type="button" onClick={() => { setHits([]); go(h.lat, h.lng, 15); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer">
                  <span className="text-[14px] font-semibold text-slate-900">{h.label}</span>
                  {h.detail && <span className="text-[12.5px] text-slate-500"> · {h.detail}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <PickMap point={pt} zone={zone} accuracy={accuracy} view={view} mapType={mapType} onPick={(lat, lon) => { setPt({ lat, lon }); setAccuracy(null); }} />
      </div>

      <Card title={pt ? "This point" : "Pick a point"}>
        {pt ? (
          <div>
            <ResultRow label="Latitude, longitude" value={dec} big />
            <ResultRow label="Latitude, DMS" value={formatDms(pt.lat, "lat", 1)} />
            <ResultRow label="Longitude, DMS" value={formatDms(pt.lon, "lon", 1)} />
            <ResultRow label="GPS style" value={`${formatDdm(pt.lat, "lat", 3)} ${formatDdm(pt.lon, "lon", 3)}`} />
            {u ? (
              <>
                <ResultRow label="UTM zone" value={`${u.zone}${u.band} (EPSG:${u.epsg})`} />
                <ResultRow label="Easting, northing (m)" value={`${u.easting.toFixed(2)}, ${u.northing.toFixed(2)}`} />
              </>
            ) : (
              <ResultRow label="UTM" value="Not used this far north or south" copy={false} />
            )}
            {accuracy ? <ResultRow label="Location accuracy" value={`± ${Math.round(accuracy)} m`} copy={false} /> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[14px] font-semibold">
              <ShareButton title="A point on the map" params={{ lat: pt.lat.toFixed(7), lon: pt.lon.toFixed(7) }} />
              <a href={`https://www.google.com/maps?q=${pt.lat.toFixed(7)},${pt.lon.toFixed(7)}`} target="_blank" rel="noopener noreferrer" className="text-[#0071e3] hover:underline">
                Google Maps ↗
              </a>
              <a href={`https://earth.google.com/web/search/${pt.lat.toFixed(7)},${pt.lon.toFixed(7)}`} target="_blank" rel="noopener noreferrer" className="text-[#0071e3] hover:underline">
                Google Earth ↗
              </a>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-slate-500 leading-relaxed">
            Click the map, search a place, type coordinates, or press <strong>My location</strong>.
          </p>
        )}
      </Card>
    </div>
  );
}
