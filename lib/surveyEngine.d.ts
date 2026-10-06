// Types for lib/surveyEngine.js (the app's traverse and level arithmetic, kept as plain JavaScript).

export interface Station {
  name: string;
  E: number;
  N: number;
  H: number | null;
  fixed: boolean;
  sE?: number;
  sN?: number;
  ellA?: number;
  ellB?: number;
  ellAz?: number;
}

export interface Closure {
  hasClose: boolean;
  nAng: number;
  angMis: number | null;
  angAllow: number;
  angPass: boolean | null;
  angCorr: number | null;
  fE: number | null;
  fN: number | null;
  fL: number | null;
  sumD: number;
  precision: number | null;
  ratioReq: number;
  precPass: boolean | null;
  fH: number | null;
  hAllow: number | null;
  hPass: boolean | null;
}

export interface LsqObs {
  type: "dist" | "ang" | "az";
  label: string;
  at: string;
  to: string;
  obs: number;
  adj: number;
  v: number;
  std: number | null;
  sigma: number;
  unit: "m" | "sec";
  flag: boolean;
}

export interface Lsq {
  E: number[];
  N: number[];
  iter: number;
  m: number;
  u: number;
  r: number;
  vtpv: number;
  s02: number;
  s0: number;
  chi: { value: number; lo: number; hi: number; pass: boolean } | null;
  obs: LsqObs[];
  k95: number;
}

export interface TraverseResult {
  type: "loop" | "link" | "open";
  method: "bowditch" | "transit" | "lsq";
  closed: boolean;
  names: string[];
  warnings: string[];
  closure: Closure;
  rows: { name: string; obs: number | null }[];
  balAng: (number | null)[];
  balAz: number[];
  sd: number[];
  d: number[];
  dE: number[];
  dN: number[];
  cE: number[];
  cN: number[];
  H: number[] | null;
  lsq: Lsq | null;
  finalE: number[];
  finalN: number[];
  adjLegs: { from: string; to: string; az: number; d: number; dh: number | null }[];
  adjAng: (number | null)[];
  stations: Station[];
}

export interface LevelRow {
  pt: string;
  rise: number | null;
  fall: number | null;
  raw: number;
  corr: number;
  rl: number;
  cum: number | null;
}

export interface LevelResult {
  rows: LevelRow[];
  mode: "staff" | "dh";
  closed: boolean;
  mis: number | null;
  allow: number | null;
  pass: boolean | null;
  dist: number | null;
  km: number | null;
  setups: number;
  spread: "dist" | "setups";
  C: number;
  sBS: number;
  sFS: number;
  sRise: number;
  sFall: number;
  arith: boolean | null;
  warnings: string[];
}

export interface Pt { name: string; E: number; N: number; H: number | null }

export declare const SURV: {
  parseAngle(raw: unknown, fmt?: string): number | null;
  fmtDMS(deg: number | null | undefined, dp?: number, padDeg?: boolean): string;
  fmtSec(sec: number, dp?: number): string;
  azimuth(E1: number, N1: number, E2: number, N2: number): number;
  dist2D(E1: number, N1: number, E2: number, N2: number): number;
  n360(a: number): number;
  n180(a: number): number;
  compute(t: {
    type: string;
    method: string;
    angleDir: string;
    scale: number | null;
    startPt: Pt;
    endPt: Pt | null;
    startOri: { mode: string; az?: number };
    endOri: { mode: string; az?: number };
    rows: { name: string; angle: number | null; dist: number | null; dh: number | null }[];
    tol: { angK: number; ratio: number; hC: number };
    sigma: { ang: number; dA: number; dB: number };
    useH: boolean;
  }): TraverseResult;
  levels(L: {
    mode: string;
    startRL: number | null;
    closeRL: number | null;
    C: number;
    spread: string;
    rows: { pt: string; bs: number | null; is: number | null; fs: number | null; dh: number | null; dist: number | null }[];
  }): LevelResult;
  chi2inv(p: number, dof: number): number;
};
