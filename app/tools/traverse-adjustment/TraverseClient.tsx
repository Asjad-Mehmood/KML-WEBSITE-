"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Download, Plus, Printer, RotateCcw, Sparkles, X } from "lucide-react";
import { Card, CopyButton, Tabs } from "@/components/tools/ui";
import {
  DEF_TOL, LEVEL, METHOD, STATUS_TEXT, SURV, TYPE, blankCtrl, blankLRow, blankRow, blankState, computeAll, exampleState,
  knownFor, levKnown, levStatus, newLev, newTrav, okNum, register, resolve, tn, travStatus,
  type Known, type LevCalc, type LevRun, type Status, type Trav, type TravCalc, type TvState,
} from "@/lib/traverseModel";
import type { LevelResult, TraverseResult } from "@/lib/surveyEngine.js";

const KEY = "tools.traverse.v1";
type Section = "ctl" | "trav" | "lev";

/* ---------- formatting ---------- */
const f = (v: number | null | undefined, dp: number) => (okNum(v) ? v.toFixed(dp) : "");
const fc = (v: number | null | undefined, dp: number) => {
  if (!okNum(v)) return "";
  const [a, b] = v.toFixed(dp).split(".");
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b ? "." + b : "");
};
const brg = (v: number | null | undefined) => (okNum(v) ? SURV.fmtDMS(v, 1) : "");
const ratioTx = (r: number | null) => (r === null ? "—" : r === Infinity ? "exact" : "1 : " + fc(Math.floor(r), 0));
const sgn = (v: number | null | undefined, dp: number) => (okNum(v) ? (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(dp) : "");
const mm = (v: number | null | undefined) => (okNum(v) ? (v * 1000).toFixed(1) + " mm" : "");

const cellCls =
  "w-full min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-mono text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
const nameCls = cellCls.replace("text-right", "text-left").replace("font-mono", "font-mono");
const selCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500";
const smallBtn =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-200 hover:text-[#0071e3] text-[13px] font-semibold text-slate-700 cursor-pointer";
const priBtn =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

function load(fresh: boolean): TvState {
  if (fresh) return exampleState();
  try {
    const t = JSON.parse(localStorage.getItem(KEY) || "null");
    if (t && t.travs && t.levs && t.control) return t;
  } catch {
    // nothing kept, or blocked: start blank
  }
  return blankState();
}

function badNum(v: string) { const x = tn(v); return x !== null && Number.isNaN(x); }
function badAngle(v: string, fmt: string) { const a = SURV.parseAngle(v, fmt); return v.trim() !== "" && a !== null && Number.isNaN(a); }

function download(name: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function csvOf(head: string[], rows: (string | number | null | undefined)[][]) {
  const q = (v: unknown) => { const s = v === null || v === undefined ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return "﻿" + [head, ...rows].map((r) => r.map(q).join(",")).join("\r\n") + "\r\n";
}
const fileSafe = (s: string) => (s.replace(/[\\/:*?"<>|]/g, "-").trim() || "traverse");

/* ---------- the tool ---------- */
export default function TraverseClient() {
  const sp = useSearchParams();
  const [T, setT] = useState<TvState>(() => load(sp.get("example") === "1"));
  const [sec, setSec] = useState<Section>(() => (sp.get("s") === "lev" ? "lev" : sp.get("s") === "ctl" ? "ctl" : sp.get("example") === "1" ? "trav" : "ctl"));

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(T)); } catch { /* storage off: still works, just not kept */ }
  }, [T]);

  const { CT, CL } = useMemo(() => computeAll(T), [T]);
  const up = (fn: (d: TvState) => void) => setT((t) => { const d: TvState = JSON.parse(JSON.stringify(t)); fn(d); return d; });

  const nCtl = Object.keys(knownFor(T, [], 0)).length;
  const tvPass = CT.filter((c) => travStatus(c) === "pass").length, tvFail = CT.filter((c) => travStatus(c) === "fail").length;
  const ls = levStatus(CL[T.lcur]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          label="Part of the tool"
          value={sec}
          onChange={setSec}
          options={[
            { value: "ctl", label: `Control points${nCtl ? ` · ${nCtl}` : ""}` },
            { value: "trav", label: `Traverse${tvFail ? ` · ${tvFail} fail` : tvPass ? ` · ${tvPass} pass` : ""}` },
            { value: "lev", label: `Level run${ls === "pass" || ls === "fail" ? " · " + (ls === "pass" ? "pass" : "fail") : ""}` },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={smallBtn} onClick={() => { if (isBlank(T) || confirm("Replace what is here with the example?")) { setT(exampleState()); setSec("trav"); } }}>
            <Sparkles className="w-4 h-4" aria-hidden /> Try the example
          </button>
          <button type="button" className={smallBtn} onClick={() => { if (confirm("Clear the control points, traverses and level runs?")) { setT(blankState()); setSec("ctl"); } }}>
            <RotateCcw className="w-4 h-4" aria-hidden /> Start again
          </button>
        </div>
      </div>

      {sec === "ctl" && <ControlPart T={T} up={up} CT={CT} CL={CL} />}
      {sec === "trav" && <TraversePart T={T} up={up} CT={CT} goCtl={() => setSec("ctl")} />}
      {sec === "lev" && <LevelPart T={T} up={up} CT={CT} CL={CL} goCtl={() => setSec("ctl")} />}
    </div>
  );
}

function isBlank(T: TvState) {
  return !(
    T.control.some((c) => c.name || c.E || c.N) ||
    T.travs.some((t) => t.start || t.rows.some((r) => r.angle || r.dist || r.name)) ||
    T.levs.some((L) => L.rows.some((r) => r.bs || r.fs || r.dh || r.pt))
  );
}

type Up = (fn: (d: TvState) => void) => void;

/* Enter moves to the next box in the table; on the last box it adds a row */
function onGridKey(e: React.KeyboardEvent<HTMLTableSectionElement>, addRow: () => void) {
  const el = e.target as HTMLElement;
  if (e.key !== "Enter" || el.tagName !== "INPUT") return;
  e.preventDefault();
  const all = Array.from(e.currentTarget.querySelectorAll("input"));
  const i = all.indexOf(el as HTMLInputElement);
  if (all[i + 1]) { all[i + 1].focus(); all[i + 1].select(); return; }
  addRow();
  const body = e.currentTarget;
  setTimeout(() => { const ins = body.querySelectorAll("input"); const last = ins[ins.length - 1]; if (last) last.focus(); }, 0);
}

/* Several cells pasted from Excel fill the boxes from the one pasted into, adding rows */
function gridPaste<R>(e: React.ClipboardEvent, rows: R[], r0: number, cols: (keyof R)[], c0: number, blank: () => R, keepTail: number): R[] | null {
  const txt = e.clipboardData.getData("text");
  if (!/[\t\n]/.test(txt.replace(/\s+$/, ""))) return null;
  e.preventDefault();
  const out = rows.slice();
  const lines = txt.replace(/\r/g, "").replace(/\n+$/, "").split("\n");
  lines.forEach((ln, j) => {
    const ri = r0 + j;
    if (ri >= out.length - keepTail) out.splice(ri, 0, blank());
    const row = { ...out[ri] };
    ln.split("\t").forEach((cv, ci) => { const k = cols[c0 + ci]; if (k) (row as Record<string, string>)[k as string] = cv.trim(); });
    out[ri] = row;
  });
  return out;
}

/* ---------- control points ---------- */
function ControlPart({ T, up, CT, CL }: { T: TvState; up: Up; CT: TravCalc[]; CL: LevCalc[] }) {
  const reg = register(T, CT, CL);
  const sets = CT.map((c, j) => (c && c.ok ? { res: c.res, col: COLS[j % COLS.length] } : null)).filter(Boolean) as { res: TraverseResult; col: string }[];
  const cols = ["name", "E", "N", "H"] as const;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 items-start">
      <Card title="Control points">
        <p className="text-[13px] text-slate-600 -mt-2 mb-3">
          The points you already know. Traverses start and close on them; level runs on their levels. Eastings and northings on your grid; the level is optional.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[440px] text-[12px] table-fixed">
            <thead className="bg-slate-50 text-slate-500">
              <tr><th className="text-left font-semibold px-2 py-2">Name</th><th className="font-semibold px-2 w-[28%]">Easting</th><th className="font-semibold px-2 w-[28%]">Northing</th><th className="font-semibold px-2 w-[18%]">Level</th><th className="w-8" /></tr>
            </thead>
            <tbody onKeyDown={(e) => onGridKey(e, () => up((d) => { d.control.push(blankCtrl()); }))}>
              {T.control.map((c, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {cols.map((k, ci) => (
                    <td key={k} className="px-1 py-1">
                      <input
                        aria-label={`${k === "name" ? "Name" : k === "E" ? "Easting" : k === "N" ? "Northing" : "Level"}, row ${i + 1}`}
                        className={`${k === "name" ? nameCls : cellCls} ${k !== "name" && badNum(c[k]) ? "border-red-300 bg-red-50" : ""}`}
                        value={c[k]}
                        placeholder={k === "name" ? "CP-01" : ""}
                        onChange={(e) => up((d) => { d.control[i][k] = e.target.value; })}
                        onPaste={(e) => { const nx = gridPaste(e, T.control, i, [...cols], ci, blankCtrl, 0); if (nx) up((d) => { d.control = nx; }); }}
                      />
                    </td>
                  ))}
                  <td className="text-center"><RowX label={`Remove row ${i + 1}`} onClick={() => up((d) => { d.control.splice(i, 1); if (!d.control.length) d.control.push(blankCtrl()); })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className={smallBtn} onClick={() => up((d) => { d.control.push(blankCtrl()); })}><Plus className="w-4 h-4" aria-hidden /> Add a point</button>
          <PasteRows cols={["name", "easting", "northing", "level"]} onRows={(rows) => up((d) => { d.control = rows.map((r) => ({ name: r[0] || "", E: r[1] || "", N: r[2] || "", H: r[3] || "" })); })} />
          <span className="text-[12px] text-slate-500">Enter moves on; paste from Excel into any box.</span>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Coordinate register</h2>
            <p className="text-[12px] text-slate-500">{Object.keys(knownFor(T, [], 0)).length} control · {reg.filter((p) => !p.fixed).length} from traverses</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className={smallBtn} disabled={!reg.length} onClick={() => download("control register.csv", csvOf(["STATION", "EASTING", "NORTHING", "ELEVATION", "SOURCE"], reg.map((p) => [p.name, f(p.E, 4), f(p.N, 4), f(p.H, 4), p.src]))) }>
              <Download className="w-4 h-4" aria-hidden /> CSV
            </button>
          </div>
        </div>
        {!reg.length ? (
          <Empty title="No points yet." text="Type the control points on the left, paste them, or try the example." />
        ) : (
          <>
            <Plan sets={sets} ctrl={reg.filter((p) => p.fixed)} />
            <ResTable
              head={["Point", "Easting", "Northing", "Level", "From"]}
              right={[0, 1, 1, 1, 0]}
              rows={reg.map((p) => ({ fx: p.fixed, c: [p.name, fc(p.E, 3), fc(p.N, 3), f(p.H, 3), p.src + (p.hsrc ? " · level from " + p.hsrc : "")] }))}
            />
          </>
        )}
      </Card>
    </div>
  );
}

/* ---------- traverse ---------- */
function TraversePart({ T, up, CT, goCtl }: { T: TvState; up: Up; CT: TravCalc[]; goCtl: () => void }) {
  const k = Math.min(T.cur, T.travs.length - 1), t = T.travs[k], c = CT[k];
  const kn = knownFor(T, CT, k);
  const closed = t.type !== "open", n = t.rows.length, useH = t.useH;
  const set = (fn: (x: Trav) => void) => up((d) => { fn(d.travs[k]); });
  const knownOpts = Object.keys(kn).map((nm) => ({ value: nm, label: nm + (kn[nm].src !== "Control" ? `  (${kn[nm].src})` : "") }));
  const needAng = (i: number) => (i === 0 ? t.startMode !== "firstleg" : i === n - 1 ? closed && ((t.type === "loop" && t.startMode === "firstleg") || t.endMode !== "none") : true);
  const addRow = () => set((x) => { x.rows.splice(x.type === "open" ? x.rows.length : x.rows.length - 1, 0, blankRow()); });
  const cols = ["name", "angle", "dist", "dh"] as const;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 items-start">
      <Card>
        <Picker
          items={T.travs.map((x, i) => ({ name: x.name, st: travStatus(CT[i]) }))}
          cur={k}
          onPick={(i) => up((d) => { d.cur = i; })}
          onNew={() => up((d) => { d.travs.push(newTrav(d.travs.length ? "secondary" : "primary", d.travs.length)); d.cur = d.travs.length - 1; })}
        />
        <div className="flex gap-2 items-center mb-4">
          <input aria-label="Traverse name" className={`${selCls} font-semibold`} value={t.name} onChange={(e) => set((x) => { x.name = e.target.value; })} />
          <select aria-label="Order" className={`${selCls} w-auto`} value={t.level} onChange={(e) => set((x) => { x.level = e.target.value as Trav["level"]; x.tol = { ...DEF_TOL[x.level] }; })}>
            <option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option>
          </select>
          <RowX big label="Delete this traverse" onClick={() => { if (confirm(`Delete ${t.name || "this traverse"}?`)) up((d) => { d.travs.splice(k, 1); if (!d.travs.length) d.travs.push(newTrav("primary", 0)); d.cur = Math.max(0, k - 1); }); }} />
        </div>
        {!knownOpts.length && (
          <Warn>No control points yet. Add the points you start and close on under <button type="button" className="font-semibold underline" onClick={goCtl}>Control points</button>.</Warn>
        )}
        <div className="space-y-3">
          <Seg label="Kind of traverse" value={t.type} onChange={(v) => set((x) => { if (v === "open" && x.type === "link" && !x.rows[x.rows.length - 1].name.trim()) x.rows[x.rows.length - 1].name = x.end; x.type = v; })}
            options={[["loop", "Closed loop"], ["link", "Closed link"], ["open", "Open"]]} />
          <Seg label="Adjustment" value={t.method} onChange={(v) => set((x) => { x.method = v; })} options={[["bowditch", "Bowditch"], ["transit", "Transit"], ["lsq", "Least squares"]]} />
        </div>
        <Sub>Start</Sub>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Sel label="Start station" value={t.start} onChange={(v) => set((x) => { x.start = v; })} options={knownOpts} first="Choose…" />
          <Sel label="Opening orientation" value={t.startMode} onChange={(v) => set((x) => { x.startMode = v as Trav["startMode"]; })} options={[{ value: "point", label: "Backsight point" }, { value: "bearing", label: "Backsight bearing" }, { value: "firstleg", label: "Bearing of the first leg" }]} />
          {t.startMode === "point" ? (
            <Sel label="Backsight point" value={t.bsPt} onChange={(v) => set((x) => { x.bsPt = v; })} options={knownOpts} first="Choose…" />
          ) : (
            <Txt label={t.startMode === "bearing" ? "Backsight bearing" : "First leg bearing"} value={t.bsBrg} bad={badAngle(t.bsBrg, T.fmt)} onChange={(v) => set((x) => { x.bsBrg = v; })} placeholder="045.3015" />
          )}
        </div>
        {closed && (
          <>
            <Sub>Close</Sub>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {t.type === "link" && <Sel label="Closing station" value={t.end} onChange={(v) => set((x) => { x.end = v; })} options={knownOpts} first="Choose…" />}
              {t.type === "loop" && t.startMode === "firstleg" ? (
                <p className="text-[12.5px] text-slate-500 sm:col-span-2">Closes on the first leg: the last angle, at {t.start || "the start"}, is read to the second station.</p>
              ) : (
                <>
                  <Sel label="Closing orientation" value={t.endMode} onChange={(v) => set((x) => { x.endMode = v as Trav["endMode"]; })} options={[{ value: "point", label: "Foresight point" }, { value: "bearing", label: "Foresight bearing" }, { value: "none", label: "None (no angle check)" }]} />
                  {t.endMode === "point" && <Sel label="Foresight point" value={t.fsPt} onChange={(v) => set((x) => { x.fsPt = v; })} options={knownOpts} first="Choose…" />}
                  {t.endMode === "bearing" && <Txt label="Foresight bearing" value={t.fsBrg} bad={badAngle(t.fsBrg, T.fmt)} onChange={(v) => set((x) => { x.fsBrg = v; })} />}
                </>
              )}
            </div>
          </>
        )}
        <Sub note={`angle at each station, backsight to foresight; distance to the next station${useH ? "; height difference to the next" : ""}`}>Observations</Sub>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[440px] text-[12px] table-fixed">
            <thead className="bg-slate-50 text-slate-500">
              <tr><th className="w-7" /><th className="text-left font-semibold px-1 py-2">Station</th><th className="font-semibold px-1 w-[27%]">Angle</th><th className="font-semibold px-1 w-[23%]">Distance</th>{useH && <th className="font-semibold px-1 w-[17%]">ΔH</th>}<th className="w-8" /></tr>
            </thead>
            <tbody onKeyDown={(e) => onGridKey(e, addRow)}>
              {t.rows.map((r, i) => {
                const fixedName = i === 0 ? t.start : i === n - 1 && closed ? (t.type === "loop" ? t.start : t.end) : null;
                const last = i === n - 1;
                const paste = (e: React.ClipboardEvent, ci: number) => { const nx = gridPaste(e, t.rows, i, [...cols], ci, blankRow, closed ? 1 : 0); if (nx) set((x) => { x.rows = nx; }); };
                return (
                  <tr key={i} className={`border-t border-slate-100 ${fixedName !== null ? "bg-slate-50/70" : ""}`}>
                    <td className="text-center text-[11px] font-mono text-slate-400">{i + 1}</td>
                    <td className="px-1 py-1">
                      {fixedName !== null ? (
                        <span className="block px-1 font-mono font-semibold text-slate-900 truncate">{fixedName || "—"}<span className="block text-[10px] font-sans text-amber-700">{i === 0 ? "Start" : "Close"}</span></span>
                      ) : (
                        <input aria-label={`Station, row ${i + 1}`} className={nameCls} value={r.name} placeholder={`TS-${String(i).padStart(2, "0")}`} onChange={(e) => set((x) => { x.rows[i].name = e.target.value; })} onPaste={(e) => paste(e, 0)} />
                      )}
                    </td>
                    <td className="px-1 py-1">{needAng(i) ? <input aria-label={`Angle, row ${i + 1}`} className={`${cellCls} ${badAngle(r.angle, T.fmt) ? "border-red-300 bg-red-50" : ""}`} value={r.angle} onChange={(e) => set((x) => { x.rows[i].angle = e.target.value; })} onPaste={(e) => paste(e, 1)} /> : <Na />}</td>
                    <td className="px-1 py-1">{!last ? <input aria-label={`Distance, row ${i + 1}`} className={`${cellCls} ${r.dist !== "" && !((tn(r.dist) ?? 0) > 0) ? "border-red-300 bg-red-50" : ""}`} value={r.dist} onChange={(e) => set((x) => { x.rows[i].dist = e.target.value; })} onPaste={(e) => paste(e, 2)} /> : <Na />}</td>
                    {useH && <td className="px-1 py-1">{!last ? <input aria-label={`Height difference, row ${i + 1}`} className={`${cellCls} ${badNum(r.dh) ? "border-red-300 bg-red-50" : ""}`} value={r.dh} onChange={(e) => set((x) => { x.rows[i].dh = e.target.value; })} onPaste={(e) => paste(e, 3)} /> : <Na />}</td>}
                    <td className="text-center">{i > 0 && !(closed && last) && n > 2 && <RowX label={`Remove row ${i + 1}`} onClick={() => set((x) => { x.rows.splice(i, 1); })} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className={smallBtn} onClick={addRow}><Plus className="w-4 h-4" aria-hidden /> Add a station</button>
          <span className="text-[12px] text-slate-500">Enter moves on; paste from Excel into any box.</span>
        </div>
        <details className="mt-5 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer text-[14px] font-semibold text-slate-800">
            Angles, heights and tolerances <span className="font-mono font-normal text-[12px] text-slate-500 ml-1">{t.tol.angK}″√N · 1:{fc(+t.tol.ratio || 0, 0)}{useH ? ` · ${t.tol.hC}√K mm` : ""}</span>
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Sel label="Angles typed as" value={T.fmt} onChange={(v) => up((d) => { d.fmt = v as TvState["fmt"]; })} options={[{ value: "dms", label: "123.4530 (DDD.MMSS)" }, { value: "deg", label: "Decimal degrees" }, { value: "gon", label: "Gons (grads)" }]} />
            <Sel label="Angles turned" value={t.angleDir} onChange={(v) => set((x) => { x.angleDir = v as Trav["angleDir"]; })} options={[{ value: "cw", label: "Clockwise" }, { value: "ccw", label: "Anticlockwise" }]} />
            <Txt label="Combined scale factor" value={t.scale} bad={badNum(t.scale)} onChange={(v) => set((x) => { x.scale = v; })} />
            <label className="flex items-center gap-2 self-end pb-2 text-[13px] text-slate-800 cursor-pointer">
              <input type="checkbox" checked={useH} onChange={(e) => set((x) => { x.useH = e.target.checked; })} className="w-4 h-4 accent-[#0071e3]" /> Carry heights (ΔH per leg)
            </label>
            <Txt label={'Angular limit, K″ × √N'} value={String(t.tol.angK)} onChange={(v) => set((x) => { x.tol.angK = v; })} />
            <Txt label="Precision, 1 in" value={String(t.tol.ratio)} onChange={(v) => set((x) => { x.tol.ratio = v; })} />
            {useH && <Txt label="Height limit, C mm × √K" value={String(t.tol.hC)} onChange={(v) => set((x) => { x.tol.hC = v; })} />}
            {t.method === "lsq" && (
              <>
                <Txt label={'Angle std dev, ″'} value={String(t.sigma.ang)} onChange={(v) => set((x) => { x.sigma.ang = v; })} />
                <div className="grid grid-cols-2 gap-2">
                  <Txt label="Distance, mm" value={String(t.sigma.dA)} onChange={(v) => set((x) => { x.sigma.dA = v; })} />
                  <Txt label="+ ppm" value={String(t.sigma.dB)} onChange={(v) => set((x) => { x.sigma.dB = v; })} />
                </div>
              </>
            )}
          </div>
          <p className="mt-2 text-[12px] text-slate-500">Changing the order (Primary, Secondary, Tertiary) loads its usual limits. Set them to your specification.</p>
        </details>
      </Card>
      <TravResults t={t} c={c} T={T} />
    </div>
  );
}

function TravResults({ t, c, T }: { t: Trav; c: TravCalc | undefined; T: TvState }) {
  const [tab, setTab] = useState<"coords" | "angles" | "legs" | "resid">("coords");
  const st = travStatus(c);
  const head = (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">{t.name || "Traverse"}</h2>
        <p className="text-[12px] text-slate-500">{LEVEL[t.level]} · {TYPE[t.type]} · {METHOD[t.method]}</p>
      </div>
      <Pill st={st} />
    </div>
  );
  if (!c || !c.ok) return <Card>{head}<Empty title="Not worked out yet." error={c && !c.ok ? c.error : ""} text="The results appear here as soon as the start, the orientation and the observations are in." /></Card>;
  const r = c.res, cl = r.closure, ip = c.input;
  const tb = tab === "resid" && !r.lsq ? "coords" : tab;
  const coordRows = uniqStations(r).map((s) => ({ fx: s.fixed, c: [s.name, fc(s.E, 3), fc(s.N, 3), ...(r.H ? [f(s.H, 3)] : []), ...(r.lsq ? [s.fixed ? "—" : `${f((s.sE ?? 0) * 1000, 1)} / ${f((s.sN ?? 0) * 1000, 1)}`] : []), s.fixed ? "Fixed" : r.closed ? "Adjusted" : "Not checked"] }));
  const coordHead = ["Station", "Easting", "Northing", ...(r.H ? ["Level"] : []), ...(r.lsq ? ["σE / σN mm"] : []), ""];
  return (
    <Card>
      {head}
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" className={smallBtn} onClick={() => download(fileSafe(t.name) + ".csv", csvOf(["STATION", "EASTING", "NORTHING", "ELEVATION", "STATUS", "SD_E_MM", "SD_N_MM"], uniqStations(r).map((s) => [s.name, f(s.E, 4), f(s.N, 4), f(s.H, 4), s.fixed ? "Fixed" : r.closed ? "Adjusted" : "Not checked", s.sE ? f(s.sE * 1000, 1) : "", s.sN ? f(s.sN * 1000, 1) : ""])))}>
          <Download className="w-4 h-4" aria-hidden /> CSV
        </button>
        <button type="button" className={smallBtn} onClick={() => printTraverse(T, t, r, ip)}><Printer className="w-4 h-4" aria-hidden /> Print or save as PDF</button>
        <CopyButton label="Copy coordinates" text={[coordHead.slice(0, -1).join("\t"), ...coordRows.map((x) => x.c.slice(0, -1).join("\t"))].join("\n")} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {cl.hasClose ? <Gauge label="Angular misclosure" value={SURV.fmtSec(cl.angMis ?? 0)} sub={`limit ±${f(cl.angAllow, 1)}″ (${t.tol.angK}″√${cl.nAng})`} frac={Math.abs(cl.angMis ?? 0) / (cl.angAllow || 1)} pass={cl.angPass} />
          : <Gauge label="Angular misclosure" value="not checked" sub={r.closed ? "no closing orientation" : "open traverse"} />}
        {r.closed ? (
          <>
            <Gauge label="Linear misclosure" value={mm(cl.fL)} sub={`E ${sgn((cl.fE ?? 0) * 1000, 1)}  N ${sgn((cl.fN ?? 0) * 1000, 1)} mm over ${fc(cl.sumD, 1)} m`} />
            <Gauge label="Relative precision" value={ratioTx(cl.precision)} sub={`need 1 : ${fc(cl.ratioReq, 0)}`} frac={cl.precision === Infinity || !cl.precision ? 0 : cl.ratioReq / cl.precision} pass={cl.precPass} />
          </>
        ) : <Gauge label="Length" value={`${fc(cl.sumD, 3)} m`} sub={`${r.names.length - 1} legs, no closure`} />}
        {cl.fH !== null && <Gauge label="Height misclosure" value={`${sgn(cl.fH * 1000, 1)} mm`} sub={`limit ±${f((cl.hAllow ?? 0) * 1000, 1)} mm`} frac={Math.abs(cl.fH) / (cl.hAllow || 1)} pass={cl.hPass} />}
        {r.lsq && r.lsq.chi && <Gauge label="Chi-square, 95%" value={f(r.lsq.chi.value, 2)} sub={`${f(r.lsq.chi.lo, 2)} to ${f(r.lsq.chi.hi, 2)} · σ₀ ${f(r.lsq.s0, 2)}`} pass={r.lsq.chi.pass} />}
      </div>
      {r.warnings.map((w) => <Warn key={w}>{w}</Warn>)}
      <Plan sets={[{ res: r, col: COLS[0] }]} bs={ip.bsC} fs={ip.fsC} />
      <div className="mt-4">
        <Tabs label="Results" value={tb} onChange={setTab} options={[{ value: "coords", label: "Coordinates" }, { value: "angles", label: "Angles" }, { value: "legs", label: "Bearings and distances" }, ...(r.lsq ? [{ value: "resid" as const, label: "Residuals" }] : [])]} />
      </div>
      <div className="mt-3">
        {tb === "coords" && <ResTable head={coordHead} right={coordHead.map((_, i) => (i > 0 && i < coordHead.length - 1 ? 1 : 0))} rows={coordRows} />}
        {tb === "angles" && (
          <ResTable head={["Station", "Backsight", "Foresight", "Observed", "Correction", "Adjusted"]} right={[0, 0, 0, 1, 1, 1]} rows={r.names.map((nm, j) => {
            const o = r.rows[j].obs, a = r.adjAng[j], corr = o !== null && a !== null ? SURV.n180(a - o) * 3600 : null;
            const bs = j === 0 ? (ip.startOri.mode === "point" ? t.bsPt : ip.startOri.mode === "bearing" ? "bearing" : "—") : r.names[j - 1];
            const fs = j === r.names.length - 1 ? (r.closed ? (ip.endOri.mode === "point" ? t.fsPt : ip.endOri.mode === "bearing" ? "bearing" : ip.endOri.mode === "firstleg" ? r.names[1] : "—") : "—") : r.names[j + 1];
            return { c: [nm, bs, fs, o !== null ? brg(o) : "—", corr !== null ? SURV.fmtSec(corr, 2) : "—", a !== null ? brg(a) : "—"] };
          })} />
        )}
        {tb === "legs" && <ResTable head={["From", "To", "Grid bearing", "Distance (m)", ...(r.H ? ["ΔH (m)"] : [])]} right={[0, 0, 1, 1, 1]} rows={r.adjLegs.map((l) => ({ c: [l.from, l.to, brg(l.az), f(l.d, 3), ...(r.H ? [sgn(l.dh, 3)] : [])] }))} />}
        {tb === "resid" && r.lsq && (
          <>
            <ResTable head={["Observation", "At", "To", "Observed", "Residual", "Std. resid.", ""]} right={[0, 0, 0, 1, 1, 1, 0]} rows={r.lsq.obs.map((o) => ({ flag: o.flag, c: [o.label, o.at, o.to, o.unit === "m" ? f(o.obs, 4) : brg(o.obs), o.unit === "m" ? `${sgn(o.v * 1000, 1)} mm` : SURV.fmtSec(o.v, 2), o.std === null ? "—" : f(o.std, 2), o.flag ? "check" : ""] }))} />
            <p className="mt-2 text-[12px] text-slate-500">σ₀ = {f(r.lsq.s0, 3)} from {r.lsq.m} observations, {r.lsq.u} unknowns, {r.lsq.r} degrees of freedom. Standardized residuals over 3 are marked to check.</p>
          </>
        )}
      </div>
    </Card>
  );
}

function uniqStations(r: TraverseResult) {
  const seen: Record<string, 1> = {};
  return r.stations.filter((s) => (seen[s.name] ? false : (seen[s.name] = 1)));
}

/* ---------- level run ---------- */
function LevelPart({ T, up, CT, CL, goCtl }: { T: TvState; up: Up; CT: TravCalc[]; CL: LevCalc[]; goCtl: () => void }) {
  const k = Math.min(T.lcur, T.levs.length - 1), L = T.levs[k], c = CL[k];
  const kn = levKnown(T, CT);
  const set = (fn: (x: LevRun) => void) => up((d) => { fn(d.levs[k]); });
  const bm = Object.keys(kn).filter((nm) => okNum(kn[nm].H)).map((nm) => ({ value: nm, label: nm + (kn[nm].src !== "Control" ? `  (${kn[nm].src})` : "") }));
  const n = L.rows.length, staff = L.mode === "staff";
  const sName = L.start && L.start !== "#" ? L.start : null;
  const cName = L.close === "=" ? (L.start === "#" ? null : L.start) : L.close && L.close !== "#" ? L.close : null;
  const addRow = () => set((x) => { x.rows.splice(x.close ? x.rows.length - 1 : x.rows.length, 0, blankLRow()); });
  const cols = (staff ? ["pt", "bs", "is", "fs", "dist"] : ["pt", "dh", "dist"]) as (keyof LevRun["rows"][number])[];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 items-start">
      <Card>
        <Picker items={T.levs.map((x, i) => ({ name: x.name, st: levStatus(CL[i]) }))} cur={k} onPick={(i) => up((d) => { d.lcur = i; })} onNew={() => up((d) => { d.levs.push(newLev(d.levs.length)); d.lcur = d.levs.length - 1; })} />
        <div className="flex gap-2 items-center mb-4">
          <input aria-label="Level run name" className={`${selCls} font-semibold`} value={L.name} onChange={(e) => set((x) => { x.name = e.target.value; })} />
          <RowX big label="Delete this level run" onClick={() => { if (confirm(`Delete ${L.name || "this level run"}?`)) up((d) => { d.levs.splice(k, 1); if (!d.levs.length) d.levs.push(newLev(0)); d.lcur = Math.max(0, k - 1); }); }} />
        </div>
        <Seg label="Readings" value={L.mode} onChange={(v) => set((x) => { x.mode = v; })} options={[["staff", "Staff readings"], ["dh", "Height differences"]]} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Sel label="Starts on benchmark" value={L.start} onChange={(v) => set((x) => { x.start = v; })} options={[...bm, { value: "#", label: "Type its level…" }]} first="Choose…" />
          {L.start === "#" ? <Txt label="Its level" value={L.startRL} bad={badNum(L.startRL)} onChange={(v) => set((x) => { x.startRL = v; })} /> : <span className="hidden sm:block" />}
          <Sel label="Closes on" value={L.close} onChange={(v) => set((x) => { x.close = v; })} options={[{ value: "=", label: "Back on the start (a loop)" }, ...bm, { value: "#", label: "Type its level…" }, { value: "", label: "None: no check" }]} />
          {L.close === "#" ? <Txt label="Its level" value={L.closeRL} bad={badNum(L.closeRL)} onChange={(v) => set((x) => { x.closeRL = v; })} /> : <span className="hidden sm:block" />}
        </div>
        {!bm.length && <Warn>No benchmark with a level yet: give a control point its level under <button type="button" className="font-semibold underline" onClick={goCtl}>Control points</button>, or type the level here.</Warn>}
        <Sub note={`${staff ? "one row per staff position; a change point has a foresight and a backsight" : "rise (+) or fall (−) from the row above"}; distance from the row above`}>{staff ? "Level book" : "Height differences"}</Sub>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[480px] text-[12px] table-fixed">
            <thead className="bg-slate-50 text-slate-500">
              <tr><th className="w-7" /><th className="text-left font-semibold px-1 py-2">Point</th>{staff ? <><th className="font-semibold px-1 w-[15%]">BS</th><th className="font-semibold px-1 w-[15%]">IS</th><th className="font-semibold px-1 w-[15%]">FS</th></> : <th className="font-semibold px-1 w-[24%]">ΔH</th>}<th className="font-semibold px-1 w-[20%]">Dist</th><th className="w-8" /></tr>
            </thead>
            <tbody onKeyDown={(e) => onGridKey(e, addRow)}>
              {L.rows.map((r, i) => {
                const nm = i === 0 ? sName : i === n - 1 ? (L.close === "=" ? (L.start === "#" ? L.rows[0].pt || null : sName) : cName) : null;
                const paste = (e: React.ClipboardEvent, ci: number) => { const nx = gridPaste(e, L.rows, i, cols, ci, blankLRow, L.close ? 1 : 0); if (nx) set((x) => { x.rows = nx; }); };
                const box = (key: "bs" | "is" | "fs" | "dh" | "dist", show: boolean, label: string) => (
                  <td className="px-1 py-1">{show ? <input aria-label={`${label}, row ${i + 1}`} className={`${cellCls} ${badNum(r[key]) ? "border-red-300 bg-red-50" : ""}`} value={r[key]} onChange={(e) => set((x) => { x.rows[i][key] = e.target.value; })} onPaste={(e) => paste(e, cols.indexOf(key))} /> : <Na />}</td>
                );
                return (
                  <tr key={i} className={`border-t border-slate-100 ${nm !== null ? "bg-slate-50/70" : ""}`}>
                    <td className="text-center text-[11px] font-mono text-slate-400">{i + 1}</td>
                    <td className="px-1 py-1">
                      {nm !== null ? <span className="block px-1 font-mono font-semibold text-slate-900 truncate">{nm || "—"}<span className="block text-[10px] font-sans text-amber-700">{i === 0 ? "Start" : "Close"}</span></span>
                        : <input aria-label={`Point, row ${i + 1}`} className={nameCls} value={r.pt} onChange={(e) => set((x) => { x.rows[i].pt = e.target.value; })} onPaste={(e) => paste(e, 0)} />}
                    </td>
                    {staff ? <>{box("bs", i < n - 1, "Backsight")}{box("is", i > 0 && i < n - 1, "Intermediate sight")}{box("fs", i > 0, "Foresight")}</> : box("dh", i > 0, "Height difference")}
                    {box("dist", i > 0, "Distance")}
                    <td className="text-center">{i > 0 && i < n - 1 && n > 2 && <RowX label={`Remove row ${i + 1}`} onClick={() => set((x) => { x.rows.splice(i, 1); })} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className={smallBtn} onClick={addRow}><Plus className="w-4 h-4" aria-hidden /> Add a row</button>
          <span className="text-[12px] text-slate-500">Enter moves on; paste from Excel into any box.</span>
        </div>
        <details className="mt-5 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer text-[14px] font-semibold text-slate-800">Tolerance and spreading <span className="font-mono font-normal text-[12px] text-slate-500 ml-1">{L.C} mm √K</span></summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Txt label="Allowed, C mm × √K" value={String(L.C)} onChange={(v) => set((x) => { x.C = v; })} />
            <Sel label="Spread the misclosure" value={L.spread} onChange={(v) => set((x) => { x.spread = v as LevRun["spread"]; })} options={[{ value: "dist", label: "By distance" }, { value: "setups", label: "By set-ups" }]} />
          </div>
          <p className="mt-2 text-[12px] text-slate-500">K is the length of the run in kilometres. Without distances, the misclosure is spread by set-ups and the limit is C × √n.</p>
        </details>
      </Card>
      <LevResults L={L} c={c} />
    </div>
  );
}

function LevResults({ L, c }: { L: LevRun; c: LevCalc | undefined }) {
  const st = levStatus(c);
  const head = (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900">{L.name || "Level run"}</h2>
        <p className="text-[12px] text-slate-500">{L.mode === "staff" ? "Rise and fall" : "Height differences"} · C = {L.C} mm√K</p>
      </div>
      <Pill st={st} />
    </div>
  );
  if (!c || !c.ok) return <Card>{head}<Empty title="Not worked out yet." error={c && !c.ok ? c.error : ""} text="The reduced levels appear here as soon as the benchmark and the readings are in." /></Card>;
  const r = c.res, inR = c.input.rows, staff = r.mode === "staff";
  const hd = [...(staff ? ["Point", "BS", "IS", "FS"] : ["Point", "ΔH"]), "Rise", "Fall", "Reduced", "Corr. mm", "Adjusted"];
  const rows = r.rows.map((o, i) => ({
    fx: i === 0 || (i === r.rows.length - 1 && r.closed),
    c: [o.pt, ...(staff ? [f(inR[i].bs, 3), f(inR[i].is, 3), f(inR[i].fs, 3)] : [i ? sgn(inR[i].dh, 3) : ""]), o.rise !== null ? f(o.rise, 3) : "", o.fall !== null ? f(o.fall, 3) : "", f(o.raw, 3), i ? sgn(o.corr * 1000, 1) : "", f(o.rl, 3)],
  }));
  return (
    <Card>
      {head}
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" className={smallBtn} onClick={() => download(fileSafe(L.name) + ".csv", csvOf(["POINT", "BS", "IS", "FS", "DH", "DIST", "RISE", "FALL", "REDUCED", "CORR_MM", "ADJUSTED"], r.rows.map((o, i) => [o.pt, f(inR[i].bs, 3), f(inR[i].is, 3), f(inR[i].fs, 3), f(inR[i].dh, 3), f(inR[i].dist, 3), f(o.rise, 3), f(o.fall, 3), f(o.raw, 4), f(o.corr * 1000, 1), f(o.rl, 4)])))}>
          <Download className="w-4 h-4" aria-hidden /> CSV
        </button>
        <button type="button" className={smallBtn} onClick={() => printLevel(L, r, hd, rows)}><Printer className="w-4 h-4" aria-hidden /> Print or save as PDF</button>
        <CopyButton label="Copy levels" text={["Point\tAdjusted level", ...r.rows.map((o) => `${o.pt}\t${f(o.rl, 3)}`)].join("\n")} />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
        {r.closed ? <Gauge label="Misclosure" value={`${sgn((r.mis ?? 0) * 1000, 1)} mm`} sub={`limit ±${f((r.allow ?? 0) * 1000, 1)} mm (${r.C}${r.km !== null ? "√" + f(r.km, 3) + " km" : "√" + r.setups + " set-ups"})`} frac={Math.abs(r.mis ?? 0) / (r.allow || 1)} pass={r.pass} />
          : <Gauge label="Misclosure" value="not checked" sub="no closing benchmark" />}
        <Gauge label="Length" value={r.dist !== null ? `${fc(r.dist, 1)} m` : "—"} sub={`${r.setups} set-up${r.setups === 1 ? "" : "s"} · spread by ${r.spread === "dist" ? "distance" : "set-ups"}`} />
        {staff && <Gauge label="Arithmetic check" value={r.arith ? "agrees" : "does not agree"} sub={`ΣBS − ΣFS = ${sgn(r.sBS - r.sFS, 3)} = Σrise − Σfall`} pass={r.arith} />}
      </div>
      {r.warnings.map((w) => <Warn key={w}>{w}</Warn>)}
      <Profile r={r} />
      <div className="mt-3"><ResTable head={hd} right={hd.map((_, i) => (i > 0 ? 1 : 0))} rows={rows} /></div>
      {staff && <p className="mt-2 text-[12px] text-slate-500">ΣBS {f(r.sBS, 3)} − ΣFS {f(r.sFS, 3)} = {sgn(r.sBS - r.sFS, 3)}; Σrise {f(r.sRise, 3)} − Σfall {f(r.sFall, 3)} = {sgn(r.sRise - r.sFall, 3)}.</p>}
    </Card>
  );
}

/* ---------- small parts ---------- */
const COLS = ["#1F6F8B", "#B4531B", "#1F9D5B", "#7A4FB0", "#B7791F"];

function Picker({ items, cur, onPick, onNew }: { items: { name: string; st: Status }[]; cur: number; onPick: (i: number) => void; onNew: () => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {items.map((x, i) => (
        <button key={i} type="button" onClick={() => onPick(i)} aria-pressed={i === cur}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold border cursor-pointer ${i === cur ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"}`}>
          <span className={`w-2 h-2 rounded-full ${x.st === "pass" ? "bg-emerald-500" : x.st === "fail" ? "bg-red-500" : "bg-slate-300"}`} aria-hidden />
          {x.name || "Untitled"}
        </button>
      ))}
      <button type="button" onClick={onNew} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12.5px] font-semibold border border-dashed border-slate-300 text-[#0071e3] cursor-pointer"><Plus className="w-3.5 h-3.5" aria-hidden /> New</button>
    </div>
  );
}

function Seg<V extends string>({ label, value, onChange, options }: { label: string; value: V; onChange: (v: V) => void; options: [V, string][] }) {
  return (
    <div>
      <div className="text-[12px] font-bold text-slate-600 mb-1.5">{label}</div>
      <div role="group" aria-label={label} className="grid rounded-xl border border-slate-200 overflow-hidden" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
        {options.map(([v, l], i) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
            className={`px-2 py-2 text-[13px] cursor-pointer ${i ? "border-l border-slate-200" : ""} ${value === v ? "bg-slate-900 text-white font-semibold" : "bg-white text-slate-700 hover:bg-slate-50"}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function Sel({ label, value, onChange, options, first }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; first?: string }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-slate-600 mb-1.5">{label}</span>
      <select className={selCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {first !== undefined && <option value="">{first}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Txt({ label, value, onChange, bad, placeholder }: { label: string; value: string; onChange: (v: string) => void; bad?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-slate-600 mb-1.5">{label}</span>
      <input inputMode="decimal" autoComplete="off" spellCheck={false} placeholder={placeholder} className={`${selCls} font-mono ${bad ? "border-red-300 bg-red-50" : ""}`} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const Sub = ({ children, note }: { children: React.ReactNode; note?: string }) => (
  <div className="mt-5 mb-2">
    <h3 className="text-[14px] font-bold text-slate-900">{children}</h3>
    {note && <p className="text-[11.5px] text-slate-500">{note}</p>}
  </div>
);
const Na = () => <span className="block text-center text-slate-300">—</span>;
const RowX = ({ label, onClick, big }: { label: string; onClick: () => void; big?: boolean }) => (
  <button type="button" aria-label={label} title={label} onClick={onClick} className={`inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer ${big ? "w-9 h-9 shrink-0" : "w-7 h-7"}`}>
    <X className={big ? "w-5 h-5" : "w-4 h-4"} aria-hidden />
  </button>
);
const Warn = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 border border-amber-200/70 px-3 py-2 text-[12.5px] text-amber-900">
    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /><span>{children}</span>
  </p>
);
const Empty = ({ title, text, error }: { title: string; text: string; error?: string }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-[13.5px]">
    <p className="font-semibold text-slate-900">{title}</p>
    {error && <p className="mt-1 text-red-700">{error}</p>}
    <p className="mt-1 text-slate-500 text-[12.5px]">{text}</p>
  </div>
);
const Pill = ({ st }: { st: Status }) =>
  STATUS_TEXT[st] ? (
    <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${st === "pass" ? "bg-emerald-50 text-emerald-700" : st === "fail" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{STATUS_TEXT[st]}</span>
  ) : null;

function Gauge({ label, value, sub, frac, pass }: { label: string; value: string; sub: string; frac?: number; pass?: boolean | null }) {
  const has = pass !== null && pass !== undefined;
  const bar = !has ? "bg-slate-400" : !pass ? "bg-red-500" : (frac ?? 0) > 0.8 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className={`rounded-xl border px-3 py-2.5 min-w-0 ${has && !pass ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-1 text-[11.5px] leading-tight text-slate-500">
        <span className="min-w-0">{label}</span>
        {has && <b className={`shrink-0 px-1.5 rounded text-[10.5px] ${pass ? "bg-emerald-50 text-emerald-700" : "bg-red-600 text-white"}`}>{pass ? "Pass" : "Fail"}</b>}
      </div>
      <div className={`mt-0.5 font-mono text-[17px] font-semibold truncate ${has && !pass ? "text-red-700" : "text-slate-900"}`}>{value}</div>
      {frac !== undefined && <div className="h-1.5 rounded bg-slate-100 my-1"><div className={`h-1.5 rounded ${bar}`} style={{ width: `${Math.max(2, Math.min(100, frac * 100)).toFixed(0)}%` }} /></div>}
      <div className="text-[11px] leading-snug text-slate-500 break-words" title={sub}>{sub}</div>
    </div>
  );
}

function ResTable({ head, rows, right }: { head: string[]; rows: { c: string[]; fx?: boolean; flag?: boolean }[]; right: number[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-[12.5px]">
        <thead className="bg-slate-50 text-slate-500">
          <tr>{head.map((h, i) => <th key={i} className={`px-3 py-2 font-semibold whitespace-nowrap ${right[i] ? "text-right" : "text-left"}`}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, j) => (
            <tr key={j} className={`border-t border-slate-100 ${r.fx ? "bg-slate-50/70 font-semibold" : ""} ${r.flag ? "text-red-700 font-semibold" : ""}`}>
              {r.c.map((v, i) => <td key={i} className={`px-3 py-1.5 whitespace-nowrap ${right[i] ? "text-right font-mono" : ""}`}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PasteRows({ cols, onRows }: { cols: string[]; onRows: (rows: string[][]) => void }) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  if (!open) return <button type="button" className={smallBtn} onClick={() => setOpen(true)}>Paste rows</button>;
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[12px] text-slate-600 mb-2">One row per line, columns in this order: <b>{cols.join(", ")}</b>. Tabs (from Excel), commas or spaces between them. The rows replace the ones above.</p>
      <textarea aria-label="Rows to paste" className="w-full h-32 rounded-lg border border-slate-200 bg-white p-2 font-mono text-[12px]" value={txt} onChange={(e) => setTxt(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button type="button" className={priBtn} onClick={() => {
          const rows = txt.replace(/\r/g, "").split("\n").filter((l) => l.trim()).map((l) => (/\t/.test(l) ? l.split("\t") : /[,;]/.test(l) ? l.split(/[,;]/) : l.trim().split(/\s+/)).map((x) => x.trim()));
          if (rows.length && rows[0][1] !== undefined && /^[A-Za-z ]+$/.test(rows[0][1]) && Number.isNaN(Number(rows[0][1]))) rows.shift();
          if (rows.length) onRows(rows);
          setOpen(false); setTxt("");
        }}>Use these rows</button>
        <button type="button" className={smallBtn} onClick={() => { setOpen(false); setTxt(""); }}>Cancel</button>
      </div>
    </div>
  );
}

/* ---------- drawings ---------- */
function niceStep(raw: number) { const p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }

function Plan({ sets, ctrl, bs, fs }: { sets: { res: TraverseResult; col: string }[]; ctrl?: { name: string; E: number; N: number }[]; bs?: Known | null; fs?: Known | null }) {
  const W = 760, H = 360;
  const pts: [number, number][] = [];
  sets.forEach((s) => s.res.stations.forEach((q) => pts.push([q.E, q.N])));
  (ctrl || []).forEach((q) => pts.push([q.E, q.N]));
  if (bs) pts.push([bs.E, bs.N]);
  if (fs) pts.push([fs.E, fs.N]);
  if (!pts.length) return null;
  const mnE = Math.min(...pts.map((p) => p[0])), mxE = Math.max(...pts.map((p) => p[0])), mnN = Math.min(...pts.map((p) => p[1])), mxN = Math.max(...pts.map((p) => p[1]));
  const spE = Math.max(mxE - mnE, 1), spN = Math.max(mxN - mnN, 1), pad = 46;
  const sc = Math.min((W - 2 * pad) / spE, (H - 2 * pad) / spN), cE = (mnE + mxE) / 2, cN = (mnN + mxN) / 2;
  const X = (e: number) => W / 2 + (e - cE) * sc, Y = (n: number) => H / 2 - (n - cN) * sc;
  const step = niceStep(Math.max(spE, spN) / 6);
  const gx: number[] = [], gy: number[] = [];
  for (let e = Math.ceil((cE - W / 2 / sc) / step) * step; X(e) < W; e += step) gx.push(X(e));
  for (let n = Math.ceil((cN - H / 2 / sc) / step) * step; Y(n) > 0; n += step) gy.push(Y(n));
  let mxA = 0;
  sets.forEach((s) => s.res.stations.forEach((q) => { if (q.ellA) mxA = Math.max(mxA, q.ellA); }));
  const ex = mxA > 0 ? niceStep((Math.max(spE, spN) * 0.035) / mxA) : 0;
  const labelled = new Set<string>();
  const label = (nm: string, x: number, y: number) => {
    if (labelled.has(nm)) return null;
    labelled.add(nm);
    return <text key={"l" + nm} x={x + 8} y={y - 7} fontSize="12" fontFamily="ui-monospace, monospace" fontWeight="600" fill="#0B2A35" stroke="#fff" strokeWidth="4" paintOrder="stroke">{nm}</text>;
  };
  const tri = (x: number, y: number, key: string) => <path key={key} d={`M${x} ${y - 7}l6.5 11h-13z`} fill="#0B2A35" />;
  const sb = niceStep((W * 0.18) / sc);
  const s0 = sets[0]?.res.stations;
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img" aria-label="Plan of the traverse">
        <g stroke="#EEF2F4">{gx.map((x, i) => <line key={"x" + i} x1={x} y1={0} x2={x} y2={H} />)}{gy.map((y, i) => <line key={"y" + i} x1={0} y1={y} x2={W} y2={y} />)}</g>
        {bs && s0 && <line x1={X(s0[0].E)} y1={Y(s0[0].N)} x2={X(bs.E)} y2={Y(bs.N)} stroke="#8A9BA3" strokeDasharray="3 4" />}
        {fs && s0 && <line x1={X(s0[s0.length - 1].E)} y1={Y(s0[s0.length - 1].N)} x2={X(fs.E)} y2={Y(fs.N)} stroke="#8A9BA3" strokeDasharray="3 4" />}
        {sets.map((s, si) => (
          <g key={"s" + si}>
            <polyline points={s.res.stations.map((q) => `${X(q.E)},${Y(q.N)}`).join(" ")} fill="none" stroke={s.col} strokeWidth="2.4" strokeLinejoin="round" strokeDasharray={s.res.closed ? undefined : "7 5"} />
            {ex > 0 && s.res.stations.map((q, qi) => (q.ellA ? <ellipse key={"e" + qi} cx={X(q.E)} cy={Y(q.N)} rx={(q.ellB ?? 0) * ex * sc} ry={q.ellA * ex * sc} transform={`rotate(${q.ellAz ?? 0} ${X(q.E)} ${Y(q.N)})`} fill="rgba(214,69,69,.1)" stroke="#D64545" strokeWidth="1.2" /> : null))}
          </g>
        ))}
        {sets.map((s, si) => s.res.stations.map((q, qi) => (
          <g key={`p${si}-${qi}`}>
            {q.fixed ? tri(X(q.E), Y(q.N), "t") : <circle cx={X(q.E)} cy={Y(q.N)} r="5" fill={s.col} stroke="#fff" strokeWidth="2"><title>{`${q.name}  E ${f(q.E, 3)}  N ${f(q.N, 3)}`}</title></circle>}
            {label(q.name, X(q.E), Y(q.N))}
          </g>
        )))}
        {[bs, fs, ...(ctrl || [])].map((q, i) => (q ? <g key={"c" + i}>{tri(X(q.E), Y(q.N), "c")}{label(q.name, X(q.E), Y(q.N))}</g> : null))}
        <g transform={`translate(${W - 30},34)`}><path d="M0 -18 L-7 4 L0 0 L7 4Z" fill="#0B2A35" /><text x="0" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0B2A35">N</text></g>
        <path d={`M18 ${H - 20}h${sb * sc}`} stroke="#0B2A35" strokeWidth="2" />
        <text x="18" y={H - 27} fontSize="11" fontFamily="ui-monospace, monospace" fill="#0B2A35">{sb >= 1000 ? sb / 1000 + " km" : sb + " m"}</text>
        {ex > 0 && <text x={W - 14} y={H - 14} textAnchor="end" fontSize="11" fontFamily="ui-monospace, monospace" fill="#0B2A35">error ellipses ×{fc(ex, 0)}</text>}
      </svg>
    </div>
  );
}

function Profile({ r }: { r: LevelResult }) {
  const W = 760, H = 230, rows = r.rows, n = rows.length;
  const xs = rows.map((o, i) => (r.dist !== null ? (o.cum ?? 0) : i)), x1 = xs[n - 1] || 1;
  let lo = Math.min(...rows.map((o) => o.rl)), hi = Math.max(...rows.map((o) => o.rl));
  const sp = Math.max(hi - lo, 0.2); lo -= sp * 0.25; hi += sp * 0.25;
  const Lm = 56, R = 20, Tp = 26, B = 34;
  const X = (v: number) => Lm + (v / x1) * (W - Lm - R), Y = (v: number) => Tp + ((hi - v) / (hi - lo)) * (H - Tp - B);
  const st = niceStep((hi - lo) / 4);
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) ticks.push(v);
  const path = rows.map((q, i) => `${X(xs[i])},${Y(q.rl)}`).join(" ");
  const every = Math.max(1, Math.ceil(n / 14));
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img" aria-label="Profile of the level run">
        {ticks.map((v, i) => <g key={i}><line x1={Lm} y1={Y(v)} x2={W - R} y2={Y(v)} stroke="#EEF2F4" /><text x={Lm - 6} y={Y(v) + 4} textAnchor="end" fontSize="10.5" fontFamily="ui-monospace, monospace" fill="#7A8D96">{f(v, st < 0.1 ? 2 : st < 1 ? 1 : 0)}</text></g>)}
        <polygon points={`${X(0)},${H - B} ${path} ${X(x1)},${H - B}`} fill="rgba(31,111,139,.08)" />
        <polyline points={path} fill="none" stroke={COLS[0]} strokeWidth="2.4" strokeLinejoin="round" />
        {rows.map((q, i) => {
          const x = X(xs[i]), y = Y(q.rl), end = i === 0 || i === n - 1;
          return (
            <g key={i}>
              {end ? <path d={`M${x} ${y - 7}l6.5 11h-13z`} fill="#0B2A35" /> : <circle cx={x} cy={y} r="4" fill={COLS[0]} stroke="#fff" strokeWidth="2"><title>{`${q.pt}  ${f(q.rl, 3)}`}</title></circle>}
              {(end || i % every === 0) && <text x={x} y={y - 10} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="12" fontFamily="ui-monospace, monospace" fontWeight="600" fill="#0B2A35" stroke="#fff" strokeWidth="4" paintOrder="stroke">{q.pt}</text>}
            </g>
          );
        })}
        <text x={Lm} y={H - 12} fontSize="10.5" fontFamily="ui-monospace, monospace" fill="#7A8D96">0</text>
        <text x={W - R} y={H - 12} textAnchor="end" fontSize="10.5" fontFamily="ui-monospace, monospace" fill="#7A8D96">{r.dist !== null ? fc(x1, 0) + " m" : `${n - 1} staff positions`}</text>
      </svg>
    </div>
  );
}

/* ---------- printable reports (the browser's Print saves them as PDF) ---------- */
function openReport(title: string, body: string) {
  const w = window.open("", "_blank");
  if (!w) { alert("Your browser blocked the report window. Allow pop-ups for this site and try again."); return; }
  const esc = (s: string) => s.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch] as string);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    body{font:12px/1.45 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0F2A33;margin:28px}
    h1{font-size:22px;margin:0 0 2px} h2{font-size:14px;margin:22px 0 8px;border-bottom:2px solid #FFD100;display:inline-block}
    .sub{color:#5A6E77;margin:0 0 14px} table{border-collapse:collapse;width:100%;margin:4px 0 8px} th{background:#F1F5F7;color:#5A6E77;font-size:11px;text-align:left}
    th,td{padding:4px 7px;border-bottom:1px solid #E2E8F0} td.r,th.r{text-align:right;font-family:ui-monospace,Consolas,monospace}
    .pass{color:#157A45;font-weight:700} .fail{color:#B5302F;font-weight:700} .note{color:#5A6E77;font-size:11px}
    .sign{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px} .sign div{border:1px solid #E2E8F0;padding:8px 10px;height:64px}
    @media print{body{margin:12mm} button{display:none}}
  </style></head><body>${body}<p class="note">Worked out at exceltokml.com/tools/traverse-adjustment.</p>
  <h2>Sign-off</h2><div class="sign"><div><b>Computed by</b></div><div><b>Checked by</b></div><div><b>Approved by</b></div></div>
  <script>setTimeout(function(){window.print()},300)<\/script></body></html>`);
  w.document.close();
}
const tbl = (head: string[], rows: string[][], right: number[]) =>
  `<table><tr>${head.map((h, i) => `<th class="${right[i] ? "r" : ""}">${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((v, i) => `<td class="${right[i] ? "r" : ""}${v === "PASS" ? " pass" : v === "FAIL" ? " fail" : ""}">${v}</td>`).join("")}</tr>`).join("")}</table>`;

function printTraverse(T: TvState, t: Trav, r: TraverseResult, ip: ReturnType<typeof resolve>) {
  const cl = r.closure, pf = (b: boolean | null) => (b === null ? "" : b ? "PASS" : "FAIL");
  const checks: string[][] = [];
  checks.push(cl.hasClose ? ["Angular misclosure", SURV.fmtSec(cl.angMis ?? 0), `±${f(cl.angAllow, 1)}″ (${t.tol.angK}″√${cl.nAng})`, pf(cl.angPass)] : ["Angular misclosure", "not checked", "", ""]);
  if (r.closed) {
    checks.push(["Linear misclosure", `${mm(cl.fL)} over ${fc(cl.sumD, 3)} m`, "", ""]);
    checks.push(["Relative precision", ratioTx(cl.precision), `1 : ${fc(cl.ratioReq, 0)} or better`, pf(cl.precPass)]);
  }
  if (cl.fH !== null) checks.push(["Height misclosure", `${sgn(cl.fH * 1000, 1)} mm`, `±${f((cl.hAllow ?? 0) * 1000, 1)} mm`, pf(cl.hPass)]);
  if (r.lsq && r.lsq.chi) checks.push(["Chi-square, 95%", f(r.lsq.chi.value, 3), `${f(r.lsq.chi.lo, 3)} to ${f(r.lsq.chi.hi, 3)}`, pf(r.lsq.chi.pass)]);
  const coords = uniqStations(r).map((s) => [s.name, fc(s.E, 3), fc(s.N, 3), ...(r.H ? [f(s.H, 3)] : []), s.fixed ? "Fixed" : r.closed ? "Adjusted" : "Not checked"]);
  const body = `<h1>Traverse adjustment</h1><p class="sub">${t.name} · ${LEVEL[t.level]} · ${TYPE[t.type]} · ${METHOD[t.method]} · ${new Date().toLocaleDateString()}</p>
    <p>Start ${ip.startPt.name}${t.type === "link" && ip.endPt ? ", close " + ip.endPt.name : ""}; ${r.names.length} stations, ${fc(cl.sumD, 3)} m; angles ${T.fmt === "dms" ? "DDD.MMSS" : T.fmt}, ${t.angleDir === "ccw" ? "anticlockwise" : "clockwise"}; scale factor ${f(ip.scale, 8)}.</p>
    <h2>Closure</h2>${tbl(["Check", "Result", "Allowed", "Status"], checks, [0, 0, 0, 0])}
    ${r.warnings.map((w) => `<p class="note">Note: ${w}</p>`).join("")}
    <h2>Adjusted coordinates</h2>${tbl(["Station", "Easting (m)", "Northing (m)", ...(r.H ? ["Level (m)"] : []), "Status"], coords, [0, 1, 1, 1, 0])}
    <h2>Bearings and distances</h2>${tbl(["From", "To", "Grid bearing", "Distance (m)", ...(r.H ? ["ΔH (m)"] : [])], r.adjLegs.map((l) => [l.from, l.to, brg(l.az), f(l.d, 3), ...(r.H ? [sgn(l.dh, 3)] : [])]), [0, 0, 1, 1, 1])}
    <h2>Angles</h2>${tbl(["Station", "Observed", "Correction", "Adjusted"], r.names.map((nm, j) => { const o = r.rows[j].obs, a = r.adjAng[j]; return [nm, o !== null ? brg(o) : "—", o !== null && a !== null ? SURV.fmtSec(SURV.n180(a - o) * 3600, 2) : "—", a !== null ? brg(a) : "—"]; }), [0, 1, 1, 1])}`;
  openReport(`${t.name} - traverse`, body);
}

function printLevel(L: LevRun, r: LevelResult, hd: string[], rows: { c: string[] }[]) {
  const body = `<h1>Level run</h1><p class="sub">${L.name} · ${r.mode === "staff" ? "Rise and fall" : "Height differences"} · ${new Date().toLocaleDateString()}</p>
    <h2>Closure</h2>${tbl(["Check", "Result", "Allowed", "Status"], [
      r.closed ? ["Misclosure", `${sgn((r.mis ?? 0) * 1000, 1)} mm`, `±${f((r.allow ?? 0) * 1000, 1)} mm`, r.pass ? "PASS" : "FAIL"] : ["Misclosure", "not checked", "no closing benchmark", ""],
      ...(r.mode === "staff" ? [["Arithmetic check", `ΣBS − ΣFS ${sgn(r.sBS - r.sFS, 3)} = Σrise − Σfall ${sgn(r.sRise - r.sFall, 3)}`, "", r.arith ? "PASS" : "FAIL"]] : []),
    ], [0, 0, 0, 0])}
    <h2>Reduced levels</h2>${tbl(hd, rows.map((x) => x.c), hd.map((_, i) => (i > 0 ? 1 : 0)))}`;
  openReport(`${L.name} - level run`, body);
}
