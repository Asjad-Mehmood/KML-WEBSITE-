// The traverse tool's state and how it is worked out: the same rules as Traverse adjust in the
// Excel to KML app (control points, traverses that chain on each other, level runs), on the
// arithmetic in lib/surveyEngine.js.
import { SURV, type LevelResult, type TraverseResult } from "./surveyEngine.js";

export type Level = "primary" | "secondary" | "tertiary";
export type TravType = "loop" | "link" | "open";
export type Method = "bowditch" | "transit" | "lsq";
export type AngleFmt = "dms" | "deg" | "gon";

export interface CtrlRow { name: string; E: string; N: string; H: string }
export interface ObsRow { name: string; angle: string; dist: string; dh: string }
export interface LevRow { pt: string; bs: string; is: string; fs: string; dh: string; dist: string }

export interface Trav {
  id: string;
  name: string;
  level: Level;
  type: TravType;
  method: Method;
  angleDir: "cw" | "ccw";
  scale: string;
  start: string;
  startMode: "point" | "bearing" | "firstleg";
  bsPt: string;
  bsBrg: string;
  end: string;
  endMode: "point" | "bearing" | "none";
  fsPt: string;
  fsBrg: string;
  tol: { angK: number | string; ratio: number | string; hC: number | string };
  sigma: { ang: number | string; dA: number | string; dB: number | string };
  useH: boolean;
  rows: ObsRow[];
}

export interface LevRun {
  id: string;
  name: string;
  mode: "staff" | "dh";
  /** a control point's name, or "#" for a typed level */
  start: string;
  startRL: string;
  /** "=" back on the start, a control point's name, "#" typed, "" none */
  close: string;
  closeRL: string;
  C: number | string;
  spread: "dist" | "setups";
  rows: LevRow[];
}

export interface TvState { v: 1; fmt: AngleFmt; control: CtrlRow[]; travs: Trav[]; cur: number; levs: LevRun[]; lcur: number }

export const LEVEL: Record<Level, string> = { primary: "Primary", secondary: "Secondary", tertiary: "Tertiary" };
export const DEF_TOL: Record<Level, { angK: number; ratio: number; hC: number }> = {
  primary: { angK: 5, ratio: 20000, hC: 8 },
  secondary: { angK: 10, ratio: 10000, hC: 12 },
  tertiary: { angK: 20, ratio: 5000, hC: 24 },
};
export const TYPE: Record<TravType, string> = { loop: "Closed loop", link: "Closed link", open: "Open" };
export const METHOD: Record<Method, string> = { bowditch: "Bowditch", transit: "Transit", lsq: "Least squares" };

const uid = () => Math.random().toString(36).slice(2, 9);
export const blankRow = (): ObsRow => ({ name: "", angle: "", dist: "", dh: "" });
export const blankLRow = (): LevRow => ({ pt: "", bs: "", is: "", fs: "", dh: "", dist: "" });
export const blankCtrl = (): CtrlRow => ({ name: "", E: "", N: "", H: "" });

export function newTrav(level: Level, idx: number): Trav {
  return {
    id: uid(), name: `T${idx + 1} ${LEVEL[level]}`, level, type: level === "primary" ? "loop" : "link",
    method: "bowditch", angleDir: "cw", scale: "1.00000000",
    start: "", startMode: "point", bsPt: "", bsBrg: "", end: "", endMode: "point", fsPt: "", fsBrg: "",
    tol: { ...DEF_TOL[level] }, sigma: { ang: 3, dA: 2, dB: 2 }, useH: false,
    rows: [blankRow(), blankRow(), blankRow(), blankRow()],
  };
}
export function newLev(idx: number): LevRun {
  return { id: uid(), name: `L${idx + 1} Level run`, mode: "staff", start: "", startRL: "", close: "=", closeRL: "", C: 12, spread: "dist", rows: [blankLRow(), blankLRow(), blankLRow(), blankLRow()] };
}
export function blankState(): TvState {
  return { v: 1, fmt: "dms", control: [blankCtrl(), blankCtrl()], travs: [newTrav("primary", 0)], cur: 0, levs: [newLev(0)], lcur: 0 };
}

/** The app's example: two pillars, a primary loop, a secondary link hung off it, and the loop levelled */
export function exampleState(): TvState {
  const t1 = newTrav("primary", 0), t2 = newTrav("secondary", 1), l1 = newLev(0);
  Object.assign(t1, { name: "T1 Primary loop", method: "lsq", start: "CP-01", bsPt: "CP-02", fsPt: "CP-02", useH: true, sigma: { ang: 2, dA: 1, dB: 1.5 } });
  t1.rows = [["", "81.3127", "316.630", "0.646"], ["TS-01", "124.3129", "308.240", "0.584"], ["TS-02", "125.5354", "308.364", "0.566"],
    ["TS-03", "104.5917", "293.903", "-0.802"], ["TS-04", "129.2554", "294.528", "-0.478"], ["TS-05", "130.2740", "288.697", "-0.523"],
    ["", "23.1021", "", ""]].map(([name, angle, dist, dh]) => ({ name, angle, dist, dh }));
  Object.assign(t2, { name: "T2 Secondary link", start: "TS-02", bsPt: "TS-01", end: "TS-03", fsPt: "TS-04", useH: true });
  t2.rows = [["", "162.5350", "141.088", "0.463"], ["ST-01", "166.3652", "131.143", "0.426"], ["ST-02", "108.5225", "90.961", "-0.073"],
    ["ST-03", "148.5015", "71.767", "-0.243"], ["", "183.3946", "", ""]].map(([name, angle, dist, dh]) => ({ name, angle, dist, dh }));
  Object.assign(l1, { name: "L1 Level loop", start: "CP-01", close: "=", C: 8 });
  l1.rows = [["CP-01", "1.425", "", "0"], ["TS-01", "1.612", "0.779", "316.630"], ["TS-02", "1.508", "1.028", "308.240"],
    ["TS-03", "0.987", "0.942", "308.364"], ["TS-04", "1.233", "1.789", "293.903"], ["TS-05", "1.104", "1.711", "294.528"],
    ["CP-01", "", "1.627", "288.697"]].map(([pt, bs, fs, dist]) => ({ pt, bs, is: "", fs, dh: "", dist }));
  return {
    v: 1, fmt: "dms",
    control: [{ name: "CP-01", E: "228450.312", N: "441203.845", H: "4.215" }, { name: "CP-02", E: "228912.640", N: "441655.118", H: "5.032" }],
    travs: [t1, t2], cur: 0, levs: [l1], lcur: 0,
  };
}

/** A typed number: null when empty, NaN when it isn't one */
export function tn(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[,\s]/g, "");
  if (s === "") return null;
  return /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s) ? Number(s) : NaN;
}
export const okNum = (v: number | null | undefined): v is number => v !== null && v !== undefined && !Number.isNaN(v);

export interface Known { name: string; E: number; N: number; H: number | null; src: string }
type Res = TraverseResult;
type LevRes = LevelResult;
export type TravCalc = { ok: true; res: Res; input: ReturnType<typeof resolve> } | { ok: false; error: string };
export type LevCalc = { ok: true; res: LevRes; input: ReturnType<typeof levInput> } | { ok: false; error: string };

export function ctrlKnown(T: TvState): Record<string, Known> {
  const k: Record<string, Known> = {};
  T.control.forEach((c) => {
    const nm = String(c.name || "").trim(), E = tn(c.E), N = tn(c.N), H = tn(c.H);
    if (nm && okNum(E) && okNum(N) && !k[nm]) k[nm] = { name: nm, E, N, H: okNum(H) ? H : null, src: "Control" };
  });
  return k;
}

/** control, then every traverse worked out before this one: a secondary hangs off a primary */
export function knownFor(T: TvState, CT: TravCalc[], k: number): Record<string, Known> {
  const kn = ctrlKnown(T);
  for (let j = 0; j < k; j++) {
    const c = CT[j];
    if (!c || !c.ok) continue;
    c.res.stations.forEach((s) => {
      if (!kn[s.name]) kn[s.name] = { name: s.name, E: s.E, N: s.N, H: s.H, src: T.travs[j].name };
    });
  }
  return kn;
}

export function resolve(T: TvState, t: Trav, kn: Record<string, Known>) {
  if (!t.start) throw new Error("Choose the start station: a point with known coordinates.");
  const startPt = kn[t.start];
  if (!startPt) throw new Error(`The start station ${t.start} has no known coordinates.`);
  const startOri: { mode: string; az?: number } = { mode: t.startMode };
  let bsC: Known | null = null;
  if (t.startMode === "point") {
    const b = kn[t.bsPt];
    if (!b) throw new Error("Choose the backsight point.");
    if (b.name === startPt.name) throw new Error("The backsight must be a different point from the start station.");
    startOri.az = SURV.azimuth(startPt.E, startPt.N, b.E, b.N);
    bsC = b;
  } else {
    const a = SURV.parseAngle(t.bsBrg, T.fmt);
    if (a === null || Number.isNaN(a)) throw new Error(t.startMode === "bearing" ? "Type the backsight bearing." : "Type the bearing of the first leg.");
    startOri.az = SURV.n360(a);
  }
  let endPt: Known | null = null, fsC: Known | null = null;
  let endOri: { mode: string; az?: number } = { mode: "none" };
  if (t.type === "link") {
    if (!t.end) throw new Error("Choose the closing station.");
    endPt = kn[t.end];
    if (!endPt) throw new Error(`The closing station ${t.end} has no known coordinates.`);
  }
  if (t.type !== "open") {
    const at = t.type === "loop" ? startPt : (endPt as Known);
    if (t.type === "loop" && t.startMode === "firstleg") endOri = { mode: "firstleg", az: startOri.az };
    else if (t.endMode === "point") {
      const fp = kn[t.fsPt];
      if (!fp) throw new Error("Choose the closing foresight point, or set the closing orientation to None.");
      if (fp.name === at.name) throw new Error("The closing foresight must be a different point from the closing station.");
      endOri = { mode: "point", az: SURV.azimuth(at.E, at.N, fp.E, fp.N) };
      fsC = fp;
    } else if (t.endMode === "bearing") {
      const a = SURV.parseAngle(t.fsBrg, T.fmt);
      if (a === null || Number.isNaN(a)) throw new Error("Type the closing foresight bearing.");
      endOri = { mode: "bearing", az: SURV.n360(a) };
    }
  }
  const n = t.rows.length;
  const rows = t.rows.map((r, i) => {
    let name = String(r.name || "").trim();
    if (i === 0) name = t.start;
    else if (i === n - 1 && t.type === "loop") name = t.start;
    else if (i === n - 1 && t.type === "link") name = t.end;
    return { name, angle: SURV.parseAngle(r.angle, T.fmt), dist: tn(r.dist), dh: tn(r.dh) };
  });
  return {
    type: t.type, method: t.method, angleDir: t.angleDir, scale: tn(t.scale),
    tol: { angK: +t.tol.angK || 0, ratio: +t.tol.ratio || 0, hC: +t.tol.hC || 0 },
    sigma: { ang: +t.sigma.ang || 1, dA: +t.sigma.dA || 1, dB: +t.sigma.dB || 0 }, useH: !!t.useH,
    startPt, endPt, startOri, endOri, rows, bsC, fsC,
  };
}

export function levKnown(T: TvState, CT: TravCalc[]): Record<string, Known> {
  const kn = ctrlKnown(T);
  CT.forEach((c, j) => {
    if (c && c.ok) c.res.stations.forEach((s) => {
      if (!kn[s.name] && okNum(s.H)) kn[s.name] = { name: s.name, E: s.E, N: s.N, H: s.H, src: T.travs[j].name };
    });
  });
  return kn;
}

export function levInput(T: TvState, CT: TravCalc[], L: LevRun) {
  const kn = levKnown(T, CT);
  let startRL: number | null, closeRL: number | null = null, startName: string, closeName = "";
  if (L.start === "#") { startRL = tn(L.startRL); startName = String(L.rows[0]?.pt || "").trim(); }
  else {
    if (!L.start) throw new Error("Choose the benchmark the run starts on, or type its level.");
    if (!kn[L.start] || !okNum(kn[L.start].H)) throw new Error(`The benchmark ${L.start} has no known level.`);
    startRL = kn[L.start].H; startName = L.start;
  }
  if (!okNum(startRL)) throw new Error("Type the level of the starting benchmark.");
  if (L.close === "=") { closeRL = startRL; closeName = startName; }
  else if (L.close === "#") { closeRL = tn(L.closeRL); if (!okNum(closeRL)) throw new Error("Type the level of the closing benchmark."); }
  else if (L.close) {
    if (!kn[L.close] || !okNum(kn[L.close].H)) throw new Error(`The benchmark ${L.close} has no known level.`);
    closeRL = kn[L.close].H; closeName = L.close;
  }
  const n = L.rows.length;
  const names: Record<string, string> = { bs: "backsight", is: "intermediate sight", fs: "foresight", dh: "height difference", dist: "distance" };
  const rows = L.rows.map((r, i) => {
    let pt = String(r.pt || "").trim();
    if (i === 0 && L.start !== "#") pt = startName;
    if (i === n - 1 && closeName && L.close !== "#") pt = closeName;
    const o = { pt, bs: tn(r.bs), is: tn(r.is), fs: tn(r.fs), dh: tn(r.dh), dist: tn(r.dist) };
    (["bs", "is", "fs", "dh", "dist"] as const).forEach((k) => {
      const v = o[k];
      if (v !== null && Number.isNaN(v)) throw new Error(`Row ${i + 1}: the ${names[k]} is not a number.`);
    });
    return o;
  });
  return { mode: L.mode, startRL, closeRL, C: +L.C || 0, spread: L.spread, rows };
}

export function computeAll(T: TvState): { CT: TravCalc[]; CL: LevCalc[] } {
  const CT: TravCalc[] = [];
  T.travs.forEach((t, k) => {
    const kn = knownFor(T, CT, k);
    try {
      const input = resolve(T, t, kn);
      CT[k] = { ok: true, res: SURV.compute(input), input };
    } catch (e) {
      CT[k] = { ok: false, error: (e as Error).message };
    }
  });
  const CL: LevCalc[] = T.levs.map((L) => {
    try {
      const input = levInput(T, CT, L);
      return { ok: true, res: SURV.levels(input), input };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });
  return { CT, CL };
}

export type Status = "pass" | "fail" | "err" | "open" | "idle";
export function travStatus(c: TravCalc | undefined): Status {
  if (!c) return "idle";
  if (!c.ok) return "err";
  if (!c.res.closed) return "open";
  const cl = c.res.closure;
  const checks = [cl.angPass, cl.precPass, cl.hPass, c.res.lsq && c.res.lsq.chi ? c.res.lsq.chi.pass : null].filter((v) => v !== null);
  return checks.every(Boolean) ? "pass" : "fail";
}
export function levStatus(c: LevCalc | undefined): Status {
  if (!c) return "idle";
  if (!c.ok) return "err";
  if (!c.res.closed) return "open";
  return c.res.pass ? "pass" : "fail";
}
export const STATUS_TEXT: Record<Status, string> = { pass: "Within tolerance", fail: "Outside tolerance", err: "Not complete", open: "No check", idle: "" };

export interface RegPoint { name: string; E: number; N: number; H: number | null; src: string; fixed: boolean; hsrc?: string }
/** every control point and adjusted station, with levels from the level runs where they had none */
export function register(T: TvState, CT: TravCalc[], CL: LevCalc[]): RegPoint[] {
  const reg: RegPoint[] = [], seen: Record<string, 1> = {};
  const kn = ctrlKnown(T);
  Object.keys(kn).forEach((nm) => { seen[nm] = 1; reg.push({ name: nm, E: kn[nm].E, N: kn[nm].N, H: kn[nm].H, src: "Control", fixed: true }); });
  CT.forEach((c, j) => {
    if (!c || !c.ok) return;
    c.res.stations.forEach((s) => {
      if (seen[s.name]) return;
      seen[s.name] = 1;
      reg.push({ name: s.name, E: s.E, N: s.N, H: s.H, src: T.travs[j].name, fixed: false });
    });
  });
  CL.forEach((c, j) => {
    if (!c || !c.ok) return;
    c.res.rows.forEach((o) => {
      reg.forEach((p) => { if (p.name === o.pt && !okNum(p.H)) { p.H = o.rl; p.hsrc = T.levs[j].name; } });
    });
  });
  return reg;
}

export { SURV };
