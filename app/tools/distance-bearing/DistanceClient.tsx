"use client";

import React, { useState } from "react";
import { Card, Field, ResultRow, Tabs } from "@/components/tools/ui";
import { ShareButton, useShared } from "@/components/tools/share";
import {
  compassPoint, direct, fmt, formatBearing, formatDms, gridInverse, inverse, parseDms, parseNumber, validLat, validLon,
} from "@/lib/toolMath";

type Mode = "geo" | "grid" | "direct";

export default function DistanceClient() {
  const get = useShared();
  const [mode, setMode] = useState<Mode>(() => {
    const m = get("m", "geo");
    return m === "grid" || m === "direct" ? m : "geo";
  });
  return (
    <div className="space-y-5">
      <Tabs
        label="Measure"
        value={mode}
        onChange={setMode}
        options={[
          { value: "geo", label: "Latitude / longitude" },
          { value: "grid", label: "Grid (easting / northing)" },
          { value: "direct", label: "Point from bearing and distance" },
        ]}
      />
      {mode === "geo" ? <Geo /> : mode === "grid" ? <Grid /> : <Direct />}
    </div>
  );
}

const latErr = (t: string, v: number | null) => (t.trim() && !validLat(v) ? "Not a latitude (-90 to 90)" : null);
const lonErr = (t: string, v: number | null) => (t.trim() && !validLon(v) ? "Not a longitude (-180 to 180)" : null);

function Distances({ m }: { m: number }) {
  return (
    <>
      <ResultRow label="Distance" value={m >= 10000 ? `${fmt(m / 1000, 4)} km` : `${fmt(m, 3)} m`} big />
      <ResultRow label="In metres" value={m.toFixed(3)} />
      <ResultRow label="Miles / nautical miles" value={`${fmt(m / 1609.344, 4)} mi · ${fmt(m / 1852, 4)} nmi`} copy={false} />
      <ResultRow label="Feet" value={fmt(m / 0.3048, 2)} />
    </>
  );
}

function Geo() {
  const get = useShared();
  const here = { key: "m", value: "geo", isDefault: true };
  const [a1, setA1] = useState(() => get("a1", "25.285028", here));
  const [o1, setO1] = useState(() => get("o1", "51.499862", here));
  const [a2, setA2] = useState(() => get("a2", "25.683900", here));
  const [o2, setO2] = useState(() => get("o2", "51.505800", here));
  const la1 = parseDms(a1), lo1 = parseDms(o1), la2 = parseDms(a2), lo2 = parseDms(o2);
  const ok = validLat(la1) && validLon(lo1) && validLat(la2) && validLon(lo2);
  const r = ok ? inverse(la1, lo1, la2, lo2) : null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Two points (WGS 84)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="From: latitude" value={a1} onChange={setA1} inputMode="text" error={latErr(a1, la1)} />
          <Field label="From: longitude" value={o1} onChange={setO1} inputMode="text" error={lonErr(o1, lo1)} />
          <Field label="To: latitude" value={a2} onChange={setA2} inputMode="text" error={latErr(a2, la2)} />
          <Field label="To: longitude" value={o2} onChange={setO2} inputMode="text" error={lonErr(o2, lo2)} />
        </div>
        <p className="mt-3 text-[12.5px] text-slate-500">Decimal degrees or DMS, e.g. 25°11&apos;49.9&quot;N.</p>
      </Card>
      <Card title="Between them">
        {r ? (
          <div>
            <Distances m={r.distance} />
            <ResultRow label="Bearing, setting off" value={`${formatBearing(r.initialBearing)} (${r.initialBearing.toFixed(4)}°) ${compassPoint(r.initialBearing)}`} />
            <ResultRow label="Bearing, arriving" value={`${formatBearing(r.finalBearing)} (${r.finalBearing.toFixed(4)}°)`} />
            <ResultRow label="Back bearing" value={formatBearing(r.finalBearing + 180)} />
            <div className="mt-4">
              <ShareButton title="Distance and bearing" params={{ m: "geo", a1: a1.trim(), o1: o1.trim(), a2: a2.trim(), o2: o2.trim() }} />
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-slate-500">Type both points.</p>
        )}
      </Card>
    </div>
  );
}

function Grid() {
  const get = useShared();
  const here = { key: "m", value: "grid" };
  const [e1, setE1] = useState(() => get("e1", "228600.000", here));
  const [n1, setN1] = useState(() => get("n1", "392450.000", here));
  const [z1, setZ1] = useState(() => get("z1", "10.000", here));
  const [e2, setE2] = useState(() => get("e2", "228700.000", here));
  const [n2, setN2] = useState(() => get("n2", "392350.000", here));
  const [z2, setZ2] = useState(() => get("z2", "12.500", here));
  const E1 = parseNumber(e1), N1 = parseNumber(n1), E2 = parseNumber(e2), N2 = parseNumber(n2);
  const Z1 = z1.trim() ? parseNumber(z1) : null, Z2 = z2.trim() ? parseNumber(z2) : null;
  const num = (t: string, v: number | null) => (t.trim() && v === null ? "Not a number" : null);
  const ok = E1 !== null && N1 !== null && E2 !== null && N2 !== null;
  const r = ok ? gridInverse(E1, N1, E2, N2) : null;
  const dz = Z1 !== null && Z2 !== null ? Z2 - Z1 : null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Two points on a grid">
        <div className="grid grid-cols-3 gap-3">
          <Field label="From: easting" value={e1} onChange={setE1} error={num(e1, E1)} />
          <Field label="From: northing" value={n1} onChange={setN1} error={num(n1, N1)} />
          <Field label="Level (optional)" value={z1} onChange={setZ1} error={num(z1, Z1)} />
          <Field label="To: easting" value={e2} onChange={setE2} error={num(e2, E2)} />
          <Field label="To: northing" value={n2} onChange={setN2} error={num(n2, N2)} />
          <Field label="Level (optional)" value={z2} onChange={setZ2} error={num(z2, Z2)} />
        </div>
      </Card>
      <Card title="Between them">
        {r ? (
          <div>
            <ResultRow label="Grid distance (plan)" value={`${r.distance.toFixed(3)}`} big />
            <ResultRow label="Grid bearing" value={`${formatBearing(r.bearing)} (${r.bearing.toFixed(4)}°) ${compassPoint(r.bearing)}`} />
            <ResultRow label="Back bearing" value={formatBearing(r.bearing + 180)} />
            <ResultRow label="ΔE, ΔN" value={`${r.dE.toFixed(3)}, ${r.dN.toFixed(3)}`} />
            {dz !== null && (
              <>
                <ResultRow label="Level difference ΔZ" value={dz.toFixed(3)} />
                <ResultRow label="Slope distance" value={Math.hypot(r.distance, dz).toFixed(3)} />
                <ResultRow label="Gradient" value={r.distance ? `${((dz / r.distance) * 100).toFixed(3)} %` : "—"} />
              </>
            )}
            <p className="mt-3 text-[12.5px] text-slate-500">In the units of your coordinates (metres on metric grids).</p>
            <div className="mt-3">
              <ShareButton title="Grid distance and bearing" params={{ m: "grid", e1: e1.trim(), n1: n1.trim(), z1: z1.trim(), e2: e2.trim(), n2: n2.trim(), z2: z2.trim() }} />
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-slate-500">Type both points&apos; eastings and northings.</p>
        )}
      </Card>
    </div>
  );
}

function Direct() {
  const get = useShared();
  const here = { key: "m", value: "direct" };
  const [a, setA] = useState(() => get("a", "25.285028", here));
  const [o, setO] = useState(() => get("o", "51.499862", here));
  const [b, setB] = useState(() => get("b", "45", here));
  const [d, setD] = useState(() => get("d", "1000", here));
  const la = parseDms(a), lo = parseDms(o), br = parseDms(b), dist = parseNumber(d);
  const brOk = br !== null && br >= 0 && br <= 360;
  const dOk = dist !== null && dist >= 0 && dist <= 20000000;
  const ok = validLat(la) && validLon(lo) && brOk && dOk;
  const r = ok ? direct(la, lo, br, dist) : null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Start, bearing and distance">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start: latitude" value={a} onChange={setA} inputMode="text" error={latErr(a, la)} />
          <Field label="Start: longitude" value={o} onChange={setO} inputMode="text" error={lonErr(o, lo)} />
          <Field label="Bearing (from true north)" value={b} onChange={setB} inputMode="text" error={b.trim() && !brOk ? "0 to 360, e.g. 45 or 45 30 00" : null} />
          <Field label="Distance (m)" value={d} onChange={setD} error={d.trim() && !dOk ? "0 to 20,000 km, in metres" : null} />
        </div>
      </Card>
      <Card title="The point you reach">
        {r ? (
          <div>
            <ResultRow label="Latitude, longitude" value={`${r.lat.toFixed(7)}, ${r.lon.toFixed(7)}`} big />
            <ResultRow label="Latitude, DMS" value={formatDms(r.lat, "lat")} />
            <ResultRow label="Longitude, DMS" value={formatDms(r.lon, "lon")} />
            <ResultRow label="Bearing on arrival" value={formatBearing(r.finalBearing)} />
            <p className="mt-4 flex flex-wrap items-center gap-3">
              <ShareButton title="Point from bearing and distance" params={{ m: "direct", a: a.trim(), o: o.trim(), b: b.trim(), d: d.trim() }} />
              <a href={`https://www.google.com/maps?q=${r.lat.toFixed(7)},${r.lon.toFixed(7)}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-[#0071e3] hover:underline">
                Open in Google Maps ↗
              </a>
            </p>
          </div>
        ) : (
          <p className="text-[14px] text-slate-500">Type the start point, a bearing and a distance.</p>
        )}
      </Card>
    </div>
  );
}
