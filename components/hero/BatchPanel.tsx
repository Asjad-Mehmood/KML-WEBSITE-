"use client";

// Batch mode: paste many rows, download one KML.
import React, { useState, useMemo } from "react";
import { parseSurveyRows, buildKml, MAX_ROWS, type ColumnOrder, type ConvertedPoint } from "@/lib/geo/surveyRows";
import { CheckCircle2, Download, AlertTriangle } from "lucide-react";
import { gridToWgs84, type CoordSystem } from "@/lib/geo/heroSystems";

/* ─── Batch mode: paste many rows, download one KML ─── */
export function BatchPanel({ sys }: { sys: CoordSystem }) {
  const [text, setText] = useState("");
  const [order, setOrder] = useState<ColumnOrder>("ENZ");
  const [downloaded, setDownloaded] = useState(false);

  const { points, issues, truncated } = useMemo(() => {
    const parsed = parseSurveyRows(text, order);
    const converted: ConvertedPoint[] = [];
    const problems = [...parsed.issues];
    for (const row of parsed.rows) {
      const ll = gridToWgs84(sys, row.easting, row.northing);
      if (ll) converted.push({ ...row, ...ll });
      else problems.push({ line: row.line, message: `outside ${sys.grid}'s range` });
    }
    problems.sort((a, b) => a.line - b.line);
    return { points: converted, issues: problems, truncated: parsed.truncated };
  }, [text, order, sys]);

  // A few rows around this system's sample point, so the example always lands in range
  const loadExample = () => {
    const offsets = [[0, 0, 0], [125.4, 48.2, 1.2], [210.8, -96.5, 2.9], [64.1, -181.7, 0.6], [-58.3, -92.4, -0.4]];
    const lines = offsets.map(([de, dn, dz], i) =>
      [`BM-${String(i + 1).padStart(2, "0")}`, (sys.defaultE + de).toFixed(3), (sys.defaultN + dn).toFixed(3), (sys.defaultZ + dz).toFixed(2)].join("\t")
    );
    setOrder("ENZ");
    setText(["Point\tEasting\tNorthing\tElevation", ...lines].join("\n"));
  };

  const download = () => {
    const kml = buildKml(points, { title: `${sys.name} — ${points.length} survey points`, gridLabel: `${sys.name} (${sys.grid})`, unit: sys.unit });
    const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey_points_${sys.grid.replace(":", "_")}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2200);
  };

  const fieldStyle: React.CSSProperties = {
    background: "rgba(0, 180, 255, 0.04)",
    border: "1px solid rgba(0, 180, 255, 0.12)",
    color: "#e0f2fe",
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="hc-batch" className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/70">
          Paste rows from Excel or CSV
        </label>
        <button
          type="button"
          onClick={loadExample}
          className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 underline underline-offset-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 rounded"
        >
          Load example
        </button>
      </div>
      <textarea
        id="hc-batch"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        spellCheck={false}
        aria-describedby="hc-batch-help"
        placeholder={`Point  Easting  Northing  Elevation\nBM-01  ${sys.defaultE}  ${sys.defaultN}  ${sys.defaultZ}\n…`}
        className="w-full px-3 py-2.5 rounded-lg text-base sm:text-[12px] leading-relaxed font-mono resize-y focus:outline-none focus:ring-2 focus:ring-cyan-400/40 placeholder:text-cyan-400/30"
        style={fieldStyle}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id="hc-batch-help" className="text-[10.5px] text-cyan-400/80">
          ID, easting, northing, elevation · tabs, commas or spaces · up to {MAX_ROWS.toLocaleString()} rows
        </p>
        <label className="flex items-center gap-1.5 text-[10.5px] text-cyan-400/70">
          Column order
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as ColumnOrder)}
            className="rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/40 cursor-pointer"
            style={fieldStyle}
          >
            <option value="ENZ" style={{ background: "#030e1e" }}>E, N</option>
            <option value="NEZ" style={{ background: "#030e1e" }}>N, E</option>
          </select>
        </label>
      </div>

      {/* Result summary */}
      <div
        className="rounded-lg p-3 space-y-2"
        style={{ background: "rgba(0, 255, 180, 0.04)", border: "1px solid rgba(0, 255, 180, 0.1)" }}
        aria-live="polite"
      >
        {text.trim() === "" ? (
          <p className="text-[12px] text-cyan-400/80">
            Paste your points above — each row converts to WGS84 in your browser, nothing is uploaded.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {points.length.toLocaleString()} point{points.length === 1 ? "" : "s"} converted
              </span>
              {issues.length > 0 && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {issues.length} skipped
                </span>
              )}
              {truncated && <span className="text-amber-300">first {MAX_ROWS.toLocaleString()} rows only</span>}
            </div>
            {issues.length > 0 && (
              <ul className="text-[11px] text-amber-200/80 space-y-0.5">
                {issues.slice(0, 1).map((iss) => (
                  <li key={iss.line}>
                    Line {iss.line}: {iss.message}
                  </li>
                ))}
                {issues.length > 1 && <li>…and {issues.length - 1} more</li>}
              </ul>
            )}
            {points.length > 0 && (
              <ul className="text-[11.5px] font-mono text-cyan-100/90 space-y-0.5">
                {points.slice(0, 2).map((pt) => (
                  <li key={pt.line} className="flex justify-between gap-3">
                    <span className="truncate text-cyan-300">{pt.id}</span>
                    <span className="shrink-0">
                      {Math.abs(pt.lat).toFixed(6)}° {pt.lat >= 0 ? "N" : "S"}, {Math.abs(pt.lon).toFixed(6)}° {pt.lon >= 0 ? "E" : "W"}
                    </span>
                  </li>
                ))}
                {points.length > 2 && <li className="text-cyan-400/80">+ {points.length - 2} more</li>}
              </ul>
            )}
          </>
        )}
        <button
          type="button"
          onClick={download}
          disabled={points.length === 0}
          className="w-full mt-1 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          style={{
            background: downloaded ? "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))" : "linear-gradient(135deg, #0071e3, #0284c7)",
            color: "#fff",
            border: "1px solid rgba(56, 189, 248, 0.4)",
          }}
        >
          {downloaded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          <span>{downloaded ? "Downloaded" : `Download KML${points.length ? ` (${points.length.toLocaleString()} points)` : ""}`}</span>
        </button>
      </div>
    </div>
  );
}
