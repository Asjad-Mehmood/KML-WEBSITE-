"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Choice, CopyButton, Field, ResultRow, Tabs, inputCls } from "@/components/tools/ui";
import { ShareButton, useShared } from "@/components/tools/share";
import { formatDms, fromUtm, parseDms, parseNumber, parsePair, toUtm, utmZone, validLat, validLon } from "@/lib/toolMath";

type Mode = "toUtm" | "fromUtm" | "list";

export default function UtmClient() {
  const get = useShared();
  const [mode, setMode] = useState<Mode>(() => {
    const m = get("m", "toUtm");
    return m === "fromUtm" || m === "list" ? m : "toUtm";
  });
  return (
    <div className="space-y-5">
      <Tabs
        label="Direction"
        value={mode}
        onChange={setMode}
        options={[
          { value: "toUtm", label: "Lat/long → UTM" },
          { value: "fromUtm", label: "UTM → lat/long" },
          { value: "list", label: "A list → UTM" },
        ]}
      />
      {mode === "toUtm" ? <ToUtm /> : mode === "fromUtm" ? <FromUtm /> : <ListToUtm />}
    </div>
  );
}

const m3 = (v: number) => v.toFixed(3);

function ToUtm() {
  const get = useShared();
  const here = { key: "m", value: "toUtm", isDefault: true };
  const [latT, setLatT] = useState(() => get("lat", "25.285028", here));
  const [lonT, setLonT] = useState(() => get("lon", "51.499862", here));
  const [zoneT, setZoneT] = useState(() => get("z", "auto", here));
  const lat = parseDms(latT), lon = parseDms(lonT);
  const ok = validLat(lat) && validLon(lon) && Math.abs(lat) <= 84;
  const natural = ok ? utmZone(lat, lon) : 0;
  const zone = zoneT === "auto" ? undefined : Number(zoneT);
  const u = ok ? toUtm(lat, lon, zone) : null;
  const zones = natural ? [natural - 1, natural, natural + 1].map((z) => ((z + 59) % 60) + 1) : [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Latitude and longitude (WGS 84)">
        <div className="space-y-4">
          <Field label="Latitude" value={latT} onChange={setLatT} inputMode="text"
            error={latT.trim() && !validLat(lat) ? "Not a latitude (-90 to 90)" : validLat(lat) && Math.abs(lat) > 84 ? "UTM covers 80°S to 84°N; polar areas use UPS" : null}
            hint={`Decimal or DMS, e.g. 25°17'06.1"N`} />
          <Field label="Longitude" value={lonT} onChange={setLonT} inputMode="text" error={lonT.trim() && !validLon(lon) ? "Not a longitude (-180 to 180)" : null} />
          {ok && (
            <Choice
              label="Zone"
              value={zoneT}
              onChange={setZoneT}
              options={[{ value: "auto", label: `The point's own zone (${natural})` }, ...zones.filter((z) => z !== natural).map((z) => ({ value: String(z), label: `Force zone ${z}` }))]}
            />
          )}
        </div>
      </Card>
      <Card title="UTM">
        {u ? (
          <div>
            <ResultRow label="Zone" value={`${u.zone}${u.band} (${u.hemisphere === "N" ? "north" : "south"})`} />
            <ResultRow label="Easting (m)" value={m3(u.easting)} big />
            <ResultRow label="Northing (m)" value={m3(u.northing)} big />
            <ResultRow label="EPSG code" value={`EPSG:${u.epsg}`} />
            <ResultRow label="All in one line" value={`${u.zone}${u.band} ${m3(u.easting)} E ${m3(u.northing)} N`} />
            <div className="mt-4">
              <ShareButton title="Lat/long to UTM" params={{ m: "toUtm", lat: latT.trim(), lon: lonT.trim(), z: zoneT === "auto" ? "" : zoneT }} />
            </div>
            <p className="mt-3 text-[13px] text-slate-500">
              Grid details for this zone:{" "}
              <Link href={`/convert/epsg/${u.epsg}`} className="font-semibold text-[#0071e3] hover:underline">EPSG:{u.epsg}</Link>
              {zone && zone !== natural ? " · converted into a neighbouring zone on purpose; distortion grows away from its centre." : ""}
            </p>
          </div>
        ) : (
          <p className="text-[14px] text-slate-500">Type a latitude and longitude to see the UTM coordinates.</p>
        )}
      </Card>
    </div>
  );
}

function FromUtm() {
  const get = useShared();
  const here = { key: "m", value: "fromUtm" };
  const [zoneT, setZoneT] = useState(() => get("z", "39", here));
  const [hemi, setHemi] = useState<"N" | "S">(() => (get("h", "N", here) === "S" ? "S" : "N"));
  const [eT, setET] = useState(() => get("e", "550324.350", here));
  const [nT, setNT] = useState(() => get("n", "2796602.862", here));
  const zone = parseNumber(zoneT), e = parseNumber(eT), n = parseNumber(nT);
  const zoneOk = zone !== null && Number.isInteger(zone) && zone >= 1 && zone <= 60;
  const eOk = e !== null && e > 100000 && e < 900000;
  const nOk = n !== null && n >= 0 && n <= 10000000;
  const ll = zoneOk && eOk && nOk ? fromUtm(e, n, zone, hemi) : null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="UTM (WGS 84)">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Zone number" value={zoneT} onChange={setZoneT} inputMode="numeric" error={zoneT.trim() && !zoneOk ? "1 to 60" : null} />
            <Choice label="Hemisphere" value={hemi} onChange={setHemi} options={[{ value: "N", label: "North" }, { value: "S", label: "South" }]} />
          </div>
          <Field label="Easting (m)" value={eT} onChange={setET} error={eT.trim() && !eOk ? "UTM eastings are between about 160,000 and 840,000 m" : null} />
          <Field label="Northing (m)" value={nT} onChange={setNT} error={nT.trim() && !nOk ? "0 to 10,000,000 m" : null} />
        </div>
      </Card>
      <Card title="Latitude and longitude (WGS 84)">
        {ll ? (
          <div>
            <ResultRow label="Decimal degrees" value={`${ll.lat.toFixed(7)}, ${ll.lon.toFixed(7)}`} big />
            <ResultRow label="Latitude, DMS" value={formatDms(ll.lat, "lat")} />
            <ResultRow label="Longitude, DMS" value={formatDms(ll.lon, "lon")} />
            <p className="mt-4 flex flex-wrap items-center gap-3">
              <ShareButton title="UTM to lat/long" params={{ m: "fromUtm", z: zoneT.trim(), h: hemi, e: eT.trim(), n: nT.trim() }} />
              <a href={`https://www.google.com/maps?q=${ll.lat.toFixed(7)},${ll.lon.toFixed(7)}`} target="_blank" rel="noopener noreferrer"
                className="text-[14px] font-semibold text-[#0071e3] hover:underline">Open in Google Maps ↗</a>
            </p>
          </div>
        ) : (
          <p className="text-[14px] text-slate-500">Type the zone, hemisphere, easting and northing.</p>
        )}
      </Card>
    </div>
  );
}

function ListToUtm() {
  const get = useShared();
  const [text, setText] = useState(() => get("pts", "25.285028\t51.499862\n25.683900, 51.505800\n31.520400 74.358700", { key: "m", value: "list" }));
  const rows = useMemo(
    () => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 5000).map((line) => {
      const p = parsePair(line);
      return { line, u: p && Math.abs(p.lat) <= 84 ? toUtm(p.lat, p.lon) : null };
    }),
    [text]
  );
  const good = rows.filter((r) => r.u);
  const zonesUsed = [...new Set(good.map((r) => `${r.u!.zone}${r.u!.hemisphere}`))];
  const csv = "ZONE,HEMISPHERE,EASTING,NORTHING\n" + good.map((r) => `${r.u!.zone},${r.u!.hemisphere},${m3(r.u!.easting)},${m3(r.u!.northing)}`).join("\n");
  return (
    <div className="space-y-5">
      <Card title="Paste latitude and longitude, one point per line">
        <label htmlFor="utm-list" className="sr-only">Points, one per line</label>
        <textarea id="utm-list" value={text} onChange={(e) => setText(e.target.value)} rows={6} spellCheck={false} className={`${inputCls} text-[13.5px] leading-relaxed`} />
        <p className="mt-2 text-[12.5px] text-slate-500">
          {good.length} of {rows.length} read
          {zonesUsed.length > 1 ? ` · they fall in ${zonesUsed.length} different zones (${zonesUsed.join(", ")}): each point is in its own zone` : ""}
        </p>
      </Card>
      {rows.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-[15px] font-bold text-slate-900">UTM</h2>
            <span className="flex flex-wrap items-center gap-1">
              <ShareButton title="Lat/long to UTM" params={{ m: "list", pts: text.trim() }} />
              <CopyButton text={csv} label="Copy as CSV" />
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] font-mono">
              <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 font-sans">
                <tr><th className="py-2 pr-4">Zone</th><th className="py-2 pr-4 text-right">Easting</th><th className="py-2 text-right">Northing</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 500).map((r, i) =>
                  r.u ? (
                    <tr key={i}>
                      <td className="py-1.5 pr-4">{r.u.zone}{r.u.band}</td>
                      <td className="py-1.5 pr-4 text-right">{m3(r.u.easting)}</td>
                      <td className="py-1.5 text-right">{m3(r.u.northing)}</td>
                    </tr>
                  ) : (
                    <tr key={i} className="bg-red-50/60">
                      <td colSpan={3} className="py-1.5 px-2 text-red-700 font-sans">Not understood: <span className="font-mono">{r.line.slice(0, 80)}</span></td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
