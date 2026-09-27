"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, Choice, ResultRow, Tabs, inputCls } from "@/components/tools/ui";
import { AREA_UNITS, convertUnit, fmt, geoArea, parseCorner, parsePair, planarArea, selfIntersects, toUtm } from "@/lib/toolMath";

type Kind = "grid" | "geo";

const GRID_SAMPLE = "P1 1000.000 1000.000\nP2 1045.250 1002.100\nP3 1047.800 1030.600\nP4 1001.500 1028.900";
const GEO_SAMPLE = "25.193080, 55.468990\n25.193080, 55.469490\n25.193530, 55.469490\n25.193530, 55.468990";

const SHOW = ["m2", "ha", "acre", "ft2", "kanal", "marla", "yd2", "feddan", "dunam"];

export default function PlotClient() {
  const [kind, setKind] = useState<Kind>("grid");
  const [order, setOrder] = useState<"EN" | "NE">("EN");
  const [text, setText] = useState(GRID_SAMPLE);

  const switchKind = (k: Kind) => {
    setKind(k);
    if (text === GRID_SAMPLE || text === GEO_SAMPLE || !text.trim()) setText(k === "grid" ? GRID_SAMPLE : GEO_SAMPLE);
  };

  const r = useMemo(() => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 2000);
    const bad: string[] = [];
    let names: string[] = [];
    let xy: [number, number][] = [];
    let geo: { lat: number; lon: number }[] = [];
    if (kind === "grid") {
      for (const l of lines) {
        const c = parseCorner(l, order);
        if (c) { xy.push(c.xy); names.push(c.name); } else bad.push(l);
      }
    } else {
      for (const l of lines) {
        const p = parsePair(l);
        if (p) geo.push(p); else bad.push(l);
      }
    }
    // a repeated first corner at the end closes the shape; it isn't a corner of its own
    const same = (a: number[], b: number[]) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
    if (kind === "grid" && xy.length > 3 && same(xy[0], xy[xy.length - 1])) { xy = xy.slice(0, -1); names = names.slice(0, -1); }
    if (kind === "geo" && geo.length > 3 && same([geo[0].lat, geo[0].lon], [geo[geo.length - 1].lat, geo[geo.length - 1].lon])) geo = geo.slice(0, -1);
    const n = kind === "grid" ? xy.length : geo.length;
    if (n < 3) return { n, bad, area: null as null | { area: number; perimeter: number; zone?: number }, sketch: [] as [number, number][], names, crossed: false };
    let area: { area: number; perimeter: number; zone?: number };
    let sketch: [number, number][];
    if (kind === "grid") {
      area = planarArea(xy);
      sketch = xy;
    } else {
      area = geoArea(geo);
      sketch = geo.map((p) => { const u = toUtm(p.lat, p.lon, area.zone); return [u.easting, u.northing] as [number, number]; });
    }
    return { n, bad, area, sketch, names, crossed: selfIntersects(sketch) };
  }, [text, kind, order]);

  return (
    <div className="space-y-5">
      <Tabs label="Corners are" value={kind} onChange={switchKind} options={[{ value: "grid", label: "Eastings / northings" }, { value: "geo", label: "Latitude / longitude" }]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Corners, in order round the plot">
          {kind === "grid" && (
            <div className="mb-3 max-w-xs">
              <Choice label="Columns" value={order} onChange={setOrder} options={[{ value: "EN", label: "Easting, then northing" }, { value: "NE", label: "Northing, then easting" }]} />
            </div>
          )}
          <label htmlFor="plot-corners" className="sr-only">Corners, one per line</label>
          <textarea id="plot-corners" value={text} onChange={(e) => setText(e.target.value)} rows={9} spellCheck={false} className={`${inputCls} text-[13.5px] leading-relaxed`} />
          <p className="mt-2 text-[12.5px] text-slate-500">
            {r.n} corner{r.n === 1 ? "" : "s"}
            {r.bad.length ? ` · ${r.bad.length} line${r.bad.length === 1 ? "" : "s"} not understood: ${r.bad.slice(0, 2).map((b) => `"${b.slice(0, 30)}"`).join(", ")}` : ""}
          </p>
        </Card>
        <Card title="Area">
          {r.area ? (
            <div>
              {r.crossed && (
                <p className="mb-3 flex gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[13px] text-amber-900">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                  Two sides cross, so the corners are out of order and this area is wrong. List them in order round the plot.
                </p>
              )}
              <ResultRow label="Square metres" value={`${fmt(r.area.area, 2)} m²`} big />
              {SHOW.filter((id) => id !== "m2").map((id) => {
                const u = AREA_UNITS.find((x) => x.id === id)!;
                return <ResultRow key={id} label={u.name} value={fmt(convertUnit(r.area!.area, AREA_UNITS[0], u), id === "ft2" || id === "yd2" ? 1 : 4)} />;
              })}
              <ResultRow label={kind === "grid" ? "Perimeter (grid units)" : "Perimeter (m)"} value={fmt(r.area.perimeter, 3)} />
              {kind === "geo" && r.area.zone && <ResultRow label="Measured on" value={`UTM zone ${r.area.zone}, scale removed`} copy={false} />}
            </div>
          ) : (
            <p className="text-[14px] text-slate-500">Type at least three corners.</p>
          )}
        </Card>
      </div>
      {r.sketch.length >= 3 && <Sketch pts={r.sketch} names={r.names} crossed={r.crossed} />}
    </div>
  );
}

/** A drawing of the plot, north up, to check the corners are in order. */
function Sketch({ pts, names, crossed }: { pts: [number, number][]; names: string[]; crossed: boolean }) {
  const W = 560, H = 300, pad = 28;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const s = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1));
  const ox = (W - (maxX - minX) * s) / 2, oy = (H - (maxY - minY) * s) / 2;
  const P = pts.map(([x, y]) => [ox + (x - minX) * s, H - (oy + (y - minY) * s)] as [number, number]);
  return (
    <Card title="Sketch (north up)">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[320px]" role="img" aria-label={`Sketch of a plot with ${pts.length} corners`}>
        <polygon points={P.map((p) => p.join(",")).join(" ")} fill={crossed ? "rgba(245,158,11,0.15)" : "rgba(0,113,227,0.10)"} stroke={crossed ? "#d97706" : "#0071e3"} strokeWidth={2} strokeLinejoin="round" />
        {P.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill="#fff" stroke="#0f172a" strokeWidth={1.5} />
            <text x={x + 7} y={y - 7} fontSize={12} fontFamily="ui-monospace, monospace" fill="#334155">{names[i] || i + 1}</text>
          </g>
        ))}
        <g transform={`translate(${W - 18},22)`}>
          <path d="M0 -12 L5 4 L0 0 L-5 4 Z" fill="#0f172a" />
          <text y={16} fontSize={11} textAnchor="middle" fill="#0f172a">N</text>
        </g>
      </svg>
    </Card>
  );
}
