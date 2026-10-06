"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X, MapPin, Crosshair, Globe2, Loader2 } from "lucide-react";
import { formatLatLng, parseCoordinates, placeSearchAllowed, searchPlaces, type PlaceHit } from "@/lib/mapSearch";

export interface MapTarget {
  lat: number;
  lng: number;
  label: string;
  detail?: string;
  /** [south, north, west, east] */
  bounds?: [number, number, number, number];
}

interface StationOption {
  id: string;
  name: string;
  code: string;
}

interface Props {
  stations: StationOption[];
  onStation: (id: string) => void;
  onTarget: (t: MapTarget) => void;
  onClear: () => void;
}

type Option =
  | { key: string; type: "coord"; target: MapTarget; title: string; sub: string }
  | { key: string; type: "station"; station: StationOption }
  | { key: string; type: "place"; place: PlaceHit }
  | { key: string; type: "search"; query: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export default function MapSearchBar({ stations, onStation, onTarget, onClear }: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [places, setPlaces] = useState<{ query: string; hits: PlaceHit[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const options = useMemo<Option[]>(() => {
    const q = query.trim();
    if (!q) return [];
    const out: Option[] = [];

    const coord = parseCoordinates(q);
    if (coord) {
      const pos = formatLatLng(coord.lat, coord.lng);
      out.push(
        coord.kind === "qng"
          ? {
              key: "coord",
              type: "coord",
              title: `QNG E ${coord.easting.toFixed(2)}, N ${coord.northing.toFixed(2)}`,
              sub: pos,
              // The map popup adds the lat/long and QNG lines itself
              target: { lat: coord.lat, lng: coord.lng, label: "Qatar National Grid point" },
            }
          : {
              key: "coord",
              type: "coord",
              title: "Go to latitude, longitude",
              sub: pos,
              target: { lat: coord.lat, lng: coord.lng, label: "Searched coordinate" },
            }
      );
    }

    const nq = norm(q);
    stations
      .filter((s) => nq && (norm(s.id).includes(nq) || norm(s.name).includes(nq) || norm(s.code).includes(nq)))
      .slice(0, 4)
      .forEach((s) => out.push({ key: `st-${s.id}`, type: "station", station: s }));

    if (!coord) {
      if (places && places.query === q) {
        places.hits.forEach((p, i) => out.push({ key: `pl-${i}`, type: "place", place: p }));
      } else if (q.length >= 2) {
        out.push({ key: "search", type: "search", query: q });
      }
    }
    return out;
  }, [query, stations, places]);

  const runPlaceSearch = async (q: string) => {
    // Nominatim allows one request a second; ignore rapid repeats
    if (!placeSearchAllowed()) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setMessage(null);
    try {
      const hits = await searchPlaces(q, ctrl.signal);
      setPlaces({ query: q, hits });
      setMessage(hits.length ? null : `No places found for “${q}”.`);
      setOpen(true);
      setActive(-1);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setMessage("Place search is unavailable right now. Try coordinates or a station ID.");
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  };

  const choose = (opt: Option) => {
    if (opt.type === "search") {
      void runPlaceSearch(opt.query);
      return;
    }
    if (opt.type === "station") {
      onStation(opt.station.id);
      setQuery(opt.station.id);
    } else if (opt.type === "coord") {
      onTarget(opt.target);
    } else {
      onTarget({ lat: opt.place.lat, lng: opt.place.lng, label: opt.place.label, detail: opt.place.detail, bounds: opt.place.bounds });
      setQuery(opt.place.label);
    }
    setOpen(false);
    setActive(-1);
    setMessage(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!options.length) return;
    choose(options[active >= 0 ? active : 0]);
  };

  const clear = () => {
    setQuery("");
    setPlaces(null);
    setMessage(null);
    setOpen(false);
    setActive(-1);
    onClear();
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      if (open) setOpen(false);
      else if (query) clear();
    }
  };

  const showList = open && (options.length > 0 || Boolean(message));
  const hasPlaces = options.some((o) => o.type === "place");
  const activeId = active >= 0 && options[active] ? `${listId}-${options[active].key}` : undefined;

  return (
    <form role="search" onSubmit={submit} className="relative z-[1100] px-3 sm:px-4 py-2 bg-white border-b border-slate-100">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Search the map: place, station, latitude and longitude, or QNG easting and northing"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            autoComplete="off"
            spellCheck={false}
            value={query}
            placeholder="Search a place, station, lat, long or QNG E, N…"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(-1);
              setMessage(null);
            }}
            onFocus={() => query && setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-slate-200 bg-slate-50 text-base sm:text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="shrink-0 h-9 px-3 sm:px-4 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Search className="w-3.5 h-3.5" aria-hidden />}
          <span className="hidden sm:inline">Search</span>
          <span className="sr-only sm:hidden">Search</span>
        </button>
      </div>

      {showList && (
        <div className="absolute left-3 right-3 sm:left-4 sm:right-4 top-full mt-1 rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_-12px_rgba(15,23,42,0.35)] overflow-hidden">
          <ul id={listId} role="listbox" aria-label="Search results" className="max-h-[260px] overflow-y-auto py-1">
            {options.map((opt, i) => {
              const isActive = i === active;
              const base = `flex items-start gap-2.5 px-3 py-2 cursor-pointer text-[12.5px] ${isActive ? "bg-blue-50" : "hover:bg-slate-50"}`;
              const props = {
                id: `${listId}-${opt.key}`,
                role: "option" as const,
                "aria-selected": isActive,
                // Keep focus in the input so onBlur doesn't close the list first
                onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
                onClick: () => choose(opt),
                onMouseEnter: () => setActive(i),
                className: base,
              };
              if (opt.type === "coord")
                return (
                  <li key={opt.key} {...props}>
                    <Crosshair className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900">{opt.title}</span>
                      <span className="block font-mono text-[11px] text-slate-500">{opt.sub}</span>
                    </span>
                  </li>
                );
              if (opt.type === "station")
                return (
                  <li key={opt.key} {...props}>
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900">
                        <span className="font-mono">{opt.station.id}</span> · {opt.station.name}
                      </span>
                      <span className="block font-mono text-[11px] text-slate-500">Survey station · {opt.station.code}</span>
                    </span>
                  </li>
                );
              if (opt.type === "place")
                return (
                  <li key={opt.key} {...props}>
                    <Globe2 className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" aria-hidden />
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900 truncate">{opt.place.label}</span>
                      <span className="block text-[11px] text-slate-500 truncate">{opt.place.detail}</span>
                    </span>
                  </li>
                );
              return (
                <li key={opt.key} {...props}>
                  <Search className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" aria-hidden />
                  <span className="min-w-0 text-slate-700">
                    Search places for <span className="font-semibold text-slate-900">“{opt.query}”</span>
                    <span className="block text-[11px] text-slate-500">Press Enter</span>
                  </span>
                </li>
              );
            })}
          </ul>
          {message && (
            <p role="status" className="px-3 py-2 text-[12px] text-slate-600 border-t border-slate-100">
              {message}
            </p>
          )}
          {hasPlaces && (
            <p className="px-3 py-1.5 text-[10.5px] text-slate-500 border-t border-slate-100 bg-slate-50">
              Place search ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                onMouseDown={(e) => e.preventDefault()}
                className="underline hover:text-slate-700"
              >
                OpenStreetMap contributors
              </a>
            </p>
          )}
        </div>
      )}
    </form>
  );
}
