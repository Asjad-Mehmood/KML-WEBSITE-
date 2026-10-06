"use client";

import React, { useMemo, useState } from "react";
import { Card, CopyButton, Field, ResultRow, Tabs, inputCls } from "@/components/tools/ui";
import { ShareButton, useShared } from "@/components/tools/share";
import { formatDdm, formatDms, parseDms, parsePair, validLat, validLon } from "@/lib/toolMath";

type Mode = "one" | "list";

export default function DmsClient() {
  const get = useShared();
  const [mode, setMode] = useState<Mode>(() => (get("m", "one") === "list" ? "list" : "one"));
  return (
    <div className="space-y-5">
      <Tabs label="Convert" value={mode} onChange={setMode} options={[{ value: "one", label: "One point" }, { value: "list", label: "A list" }]} />
      {mode === "one" ? <One /> : <List />}
    </div>
  );
}

function One() {
  const get = useShared();
  const here = { key: "m", value: "one", isDefault: true };
  const [latT, setLatT] = useState(() => get("lat", `25°17'06.1"N`, here));
  const [lonT, setLonT] = useState(() => get("lon", `51°29'59.5"E`, here));
  const lat = latT.trim() ? parseDms(latT) : null;
  const lon = lonT.trim() ? parseDms(lonT) : null;
  const latErr = latT.trim() && !validLat(lat) ? "Not a latitude: use -90 to 90, e.g. 25.285028 or 25°17'06.1\"N" : null;
  const lonErr = lonT.trim() && !validLon(lon) ? "Not a longitude: use -180 to 180, e.g. 51.499862 or 51°29'59.5\"E" : null;
  const ok = validLat(lat) && validLon(lon);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Type the point">
        <div className="space-y-4">
          <Field label="Latitude" value={latT} onChange={setLatT} error={latErr} inputMode="text" placeholder={`25.285028 or 25°17'06.1"N`} />
          <Field label="Longitude" value={lonT} onChange={setLonT} error={lonErr} inputMode="text" placeholder={`51.499862 or 51°29'59.5"E`} />
        </div>
      </Card>
      <Card title="The same point">
        {ok ? (
          <div>
            <ResultRow label="Decimal degrees" value={`${lat.toFixed(6)}, ${lon.toFixed(6)}`} big />
            <ResultRow label="Latitude, decimal" value={lat.toFixed(8)} />
            <ResultRow label="Longitude, decimal" value={lon.toFixed(8)} />
            <ResultRow label="Latitude, DMS" value={formatDms(lat, "lat")} />
            <ResultRow label="Longitude, DMS" value={formatDms(lon, "lon")} />
            <ResultRow label="Degrees and decimal minutes" value={`${formatDdm(lat, "lat")}  ${formatDdm(lon, "lon")}`} />
            <p className="mt-4 flex flex-wrap items-center gap-3">
              <ShareButton title="DMS ↔ decimal degrees" params={{ m: "one", lat: latT.trim(), lon: lonT.trim() }} />
              <a
                href={`https://www.google.com/maps?q=${lat.toFixed(7)},${lon.toFixed(7)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-semibold text-[#0071e3] hover:underline"
              >
                Open in Google Maps ↗
              </a>
            </p>
          </div>
        ) : (
          <p className="text-[14px] text-slate-500">Type a latitude and a longitude to see them converted.</p>
        )}
      </Card>
    </div>
  );
}

function List() {
  const get = useShared();
  const [text, setText] = useState(() => get("pts", `25°17'06.1"N\t51°29'59.5"E\n25.683900, 51.505800\n33°52'10"S 151°12'30"E`, { key: "m", value: "list" }));
  const rows = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 5000)
        .map((line) => ({ line, p: parsePair(line) })),
    [text]
  );
  const good = rows.filter((r) => r.p);
  const csv = (kind: "dec" | "dms") =>
    good
      .map((r) =>
        kind === "dec"
          ? `${r.p!.lat.toFixed(8)},${r.p!.lon.toFixed(8)}`
          : `"${formatDms(r.p!.lat, "lat").replace(/"/g, '""')}","${formatDms(r.p!.lon, "lon").replace(/"/g, '""')}"`
      )
      .join("\n");
  return (
    <div className="space-y-5">
      <Card title="Paste your points, one per line">
        <label htmlFor="dms-list" className="sr-only">Points, one per line</label>
        <textarea
          id="dms-list"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          spellCheck={false}
          className={`${inputCls} text-[13.5px] leading-relaxed`}
          placeholder={"25.285028\t51.499862\n25°17'06.1\"N 51°29'59.5\"E"}
        />
        <p className="mt-2 text-[12.5px] text-slate-500">
          {rows.length} line{rows.length === 1 ? "" : "s"} · {good.length} read
          {rows.length - good.length ? ` · ${rows.length - good.length} not understood (marked below)` : ""}
        </p>
      </Card>
      {rows.length > 0 && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-[15px] font-bold text-slate-900">Converted</h2>
            <div className="flex flex-wrap items-center gap-1">
              <ShareButton title="DMS ↔ decimal degrees" params={{ m: "list", pts: text.trim() }} />
              <CopyButton text={csv("dec")} label="Copy decimal" />
              <CopyButton text={csv("dms")} label="Copy DMS" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] font-mono">
              <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 font-sans">
                <tr>
                  <th className="py-2 pr-4">Latitude</th>
                  <th className="py-2 pr-4">Longitude</th>
                  <th className="py-2 pr-4">Latitude DMS</th>
                  <th className="py-2">Longitude DMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 500).map((r, i) =>
                  r.p ? (
                    <tr key={i}>
                      <td className="py-1.5 pr-4 whitespace-nowrap">{r.p.lat.toFixed(8)}</td>
                      <td className="py-1.5 pr-4 whitespace-nowrap">{r.p.lon.toFixed(8)}</td>
                      <td className="py-1.5 pr-4 whitespace-nowrap">{formatDms(r.p.lat, "lat")}</td>
                      <td className="py-1.5 whitespace-nowrap">{formatDms(r.p.lon, "lon")}</td>
                    </tr>
                  ) : (
                    <tr key={i} className="bg-red-50/60">
                      <td colSpan={4} className="py-1.5 px-2 text-red-700 font-sans">
                        Not understood: <span className="font-mono">{r.line.slice(0, 80)}</span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            {rows.length > 500 && (
              <p className="mt-2 text-[12px] text-slate-500 font-sans">Showing the first 500; the copy buttons include all {good.length}.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
