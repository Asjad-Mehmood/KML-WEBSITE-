// SurveyX Lite — calculation engine (no UI). All lengths in metres.
// Traverse: coordinate traverse from site-measured Easting/Northing, closed or open.
// Levelling: level book reduction (Rise & Fall / Height of Instrument), closed or open.

/** Parse a number typed or pasted by the user. Returns NaN for anything that is not a plain number. */
export function num(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (v == null) return NaN;
  let s = String(v).trim().replace(/\s+/g, '');
  if (s === '') return NaN;
  // allow thousands separators like 228,450.312 (only when grouped in threes before a decimal point)
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return parseFloat(s);
}
export const isBlank = v => v == null || String(v).trim() === '';

/** Whole circle bearing in degrees (0..360) from point a to point b. */
export function bearing(a, b) {
  const t = Math.atan2(b.E - a.E, b.N - a.N) * 180 / Math.PI;
  return (t + 360) % 360;
}
/** 123.456789 → 123°27'24" (rounded to whole seconds by default, carrying correctly). */
export function dms(deg, secDp = 0) {
  if (!Number.isFinite(deg)) return '';
  const f = Math.pow(10, secDp);
  let total = Math.round(Math.abs(deg) * 3600 * f);        // in units of (1/f) seconds
  const full = 360 * 3600 * f;
  if (total >= full) total -= full;
  const d = Math.floor(total / (3600 * f)); total -= d * 3600 * f;
  const m = Math.floor(total / (60 * f)); total -= m * 60 * f;
  const s = total / f;
  const ss = secDp ? s.toFixed(secDp).padStart(3 + secDp, '0') : String(s).padStart(2, '0');
  return `${String(d).padStart(3, '0')}°${String(m).padStart(2, '0')}'${ss}"`;
}

export const METHODS = {
  bowditch: 'Bowditch (Compass rule)',
  transit: 'Transit rule',
  equal: 'Equal distribution',
};

/**
 * Coordinate traverse.
 * input = {
 *   type: 'closed' | 'open',
 *   method: 'bowditch' | 'transit' | 'equal',
 *   precision: 10000,                       // required 1 : N (closed only)
 *   station:   { name, E, N },              // known (where the instrument starts)
 *   backsight: { name, E, N },              // known (reference / RO)
 *   points:    [ { name, E, N, remark } ],  // as measured on site, in order
 *   closing:   { name, E, N, measE, measN } // known coords + coords measured on site
 *   useClosing: true                        // open traverse only: also close it on a known point
 * }
 * A closed traverse always ends on its known closing point. An open traverse does not, unless
 * useClosing is set: then it is checked and adjusted on that point exactly like a closed one.
 * Returns { ok, errors[], warnings[], ... } — never throws on bad input.
 */
export function computeTraverse(input) {
  const errors = [], warnings = [];
  const type = input.type === 'open' ? 'open' : 'closed';
  const method = METHODS[input.method] ? input.method : 'bowditch';
  const known = (p, label) => {
    const o = { name: String(p?.name ?? '').trim() || label, E: num(p?.E), N: num(p?.N) };
    if (!Number.isFinite(o.E) || !Number.isFinite(o.N)) errors.push({ where: label, msg: `${label}: enter the known Easting and Northing.` });
    return o;
  };
  const station = known(input.station, 'Station point');
  const backsight = known(input.backsight, 'Backsight point');
  if (Number.isFinite(station.E) && Number.isFinite(backsight.E) && station.E === backsight.E && station.N === backsight.N)
    errors.push({ where: 'Backsight point', msg: 'Backsight point has the same coordinates as the station point.' });

  const pts = [];
  (input.points || []).forEach((p, i) => {
    const blankRow = isBlank(p.name) && isBlank(p.E) && isBlank(p.N) && isBlank(p.remark);
    if (blankRow) return;
    const o = { row: i, name: String(p.name ?? '').trim() || `P${i + 1}`, E: num(p.E), N: num(p.N), remark: String(p.remark ?? '').trim() };
    if (!Number.isFinite(o.E)) errors.push({ where: `row ${i + 1}`, row: i, col: 'E', msg: `Row ${i + 1} (${o.name}): Easting is missing or not a number.` });
    if (!Number.isFinite(o.N)) errors.push({ where: `row ${i + 1}`, row: i, col: 'N', msg: `Row ${i + 1} (${o.name}): Northing is missing or not a number.` });
    pts.push(o);
  });

  let closing = null;
  if (type === 'closed' || (type === 'open' && input.useClosing === true)) {
    const c = input.closing || {};
    closing = { name: String(c.name ?? '').trim() || 'Closing point', E: num(c.E), N: num(c.N), measE: num(c.measE), measN: num(c.measN) };
    if (!Number.isFinite(closing.E) || !Number.isFinite(closing.N)) errors.push({ where: 'Closing point', msg: 'Closing point: enter its known Easting and Northing.' });
    if (!Number.isFinite(closing.measE) || !Number.isFinite(closing.measN)) errors.push({ where: 'Closing point', msg: 'Closing point: enter the Easting and Northing measured on site.' });
  }
  const precision = num(input.precision);
  if (closing !== null && !(precision > 0)) errors.push({ where: 'Precision', msg: 'Required precision must be a positive number (for example 10000 for 1:10,000).' });
  if (type === 'open' && pts.length === 0) errors.push({ where: 'Points', msg: 'Add at least one traverse point.' });

  const base = { type, checked: closing !== null, method, station, backsight, closing, precision, errors, warnings, ok: false };
  if (errors.length) return base;

  // chain of measured positions: station (known) → points (measured) → closing (measured)
  const chain = [{ name: station.name, E: station.E, N: station.N, kind: 'station' }]
    .concat(pts.map(p => ({ ...p, kind: 'point' })));
  if (closing) chain.push({ name: closing.name, E: closing.measE, N: closing.measN, kind: 'closing' });

  // leg lengths and cumulative sums from the measured coordinates
  const n = chain.length;
  const cumL = [0], cumAE = [0], cumAN = [0];
  for (let i = 1; i < n; i++) {
    const dE = chain[i].E - chain[i - 1].E, dN = chain[i].N - chain[i - 1].N;
    const L = Math.hypot(dE, dN);
    if (L < 0.0005) warnings.push(`${chain[i - 1].name} → ${chain[i].name}: the two points are less than 0.5 mm apart.`);
    cumL.push(cumL[i - 1] + L); cumAE.push(cumAE[i - 1] + Math.abs(dE)); cumAN.push(cumAN[i - 1] + Math.abs(dN));
  }
  const totalL = cumL[n - 1];

  let misE = 0, misN = 0, linear = 0, ratio = Infinity, pass = null;
  if (closing) {
    misE = closing.measE - closing.E;
    misN = closing.measN - closing.N;
    linear = Math.hypot(misE, misN);
    ratio = linear > 0 ? totalL / linear : Infinity;
    pass = linear === 0 || ratio >= precision;
    if (totalL === 0) { errors.push({ where: 'Points', msg: 'The traverse has no length: all points have the same coordinates.' }); return base; }
    if (method === 'transit') {
      if (cumAE[n - 1] === 0 && misE !== 0) { errors.push({ where: 'Method', msg: 'Transit rule cannot spread an Easting error on a traverse with no Easting change. Choose Bowditch.' }); return base; }
      if (cumAN[n - 1] === 0 && misN !== 0) { errors.push({ where: 'Method', msg: 'Transit rule cannot spread a Northing error on a traverse with no Northing change. Choose Bowditch.' }); return base; }
    }
  }

  // corrections (metres) — closing point ends exactly on its known coordinates
  const legs = n - 1;
  const out = chain.map((p, i) => {
    let kE = 0, kN = 0;
    if (closing && i > 0) {
      if (method === 'bowditch') { kE = kN = cumL[i] / totalL; }
      else if (method === 'transit') { kE = cumAE[n - 1] ? cumAE[i] / cumAE[n - 1] : 0; kN = cumAN[n - 1] ? cumAN[i] / cumAN[n - 1] : 0; }
      else { kE = kN = i / legs; }
    }
    const cE = 0 - misE * kE, cN = 0 - misN * kN;
    const adjE = p.kind === 'closing' ? closing.E : p.E + cE;
    const adjN = p.kind === 'closing' ? closing.N : p.N + cN;
    return { name: p.name, kind: p.kind, remark: p.remark || (p.kind === 'station' ? 'Station (known)' : p.kind === 'closing' ? 'Closing point (known)' : ''), measE: p.E, measN: p.N, cE, cN, E: adjE, N: adjN };
  });

  const legRows = [];
  for (let i = 1; i < n; i++) {
    const a = out[i - 1], b = out[i];
    legRows.push({ from: a.name, to: b.name, bearing: bearing(a, b), dist: Math.hypot(b.E - a.E, b.N - a.N), rawDist: cumL[i] - cumL[i - 1] });
  }
  const refBearing = bearing(station, backsight);
  const refDist = Math.hypot(backsight.E - station.E, backsight.N - station.N);
  return { ...base, ok: true, points: out, legs: legRows, totalL, misE, misN, linear, ratio, pass, refBearing, refDist, nLegs: legs };
}

export const LEVEL_METHODS = { rise: 'Rise & Fall', hi: 'Height of Instrument' };

/**
 * Level book.
 * input = {
 *   type: 'closed' | 'open', method: 'rise' | 'hi',
 *   startName, startRL,                 // starting benchmark
 *   closeName, closeRL,                 // closing benchmark (closed only)
 *   allow: '' | number,                 // allowable misclosure in mm; blank = 10 mm × √(set-ups)
 *   rows: [ { station, bs, is, fs, remark } ]
 * }
 */
export function computeLevel(input) {
  const errors = [], warnings = [];
  const type = input.type === 'open' ? 'open' : 'closed';
  const method = LEVEL_METHODS[input.method] ? input.method : 'rise';
  const startRL = num(input.startRL);
  const startName = String(input.startName ?? '').trim() || 'BM';
  if (!Number.isFinite(startRL)) errors.push({ where: 'Start benchmark', msg: 'Start benchmark: enter its known RL.' });
  let closeRL = NaN, closeName = '';
  if (type === 'closed') {
    closeRL = num(input.closeRL); closeName = String(input.closeName ?? '').trim() || 'BM';
    if (!Number.isFinite(closeRL)) errors.push({ where: 'Closing benchmark', msg: 'Closing benchmark: enter its known RL.' });
  }
  const rows = [];
  (input.rows || []).forEach((r, i) => {
    if (isBlank(r.station) && isBlank(r.bs) && isBlank(r.is) && isBlank(r.fs) && isBlank(r.remark)) return;
    const o = { row: i, station: String(r.station ?? '').trim() || `Pt ${i + 1}`, remark: String(r.remark ?? '').trim() };
    for (const k of ['bs', 'is', 'fs']) {
      if (isBlank(r[k])) o[k] = null;
      else { o[k] = num(r[k]); if (!Number.isFinite(o[k])) errors.push({ row: i, col: k, msg: `Row ${i + 1} (${o.station}): ${k.toUpperCase()} is not a number.` }); }
    }
    rows.push(o);
  });
  if (rows.length < 2) errors.push({ where: 'Readings', msg: 'Enter at least two rows: the starting benchmark (BS) and a last point (FS).' });
  rows.forEach((o, k) => {
    const lab = `Row ${o.row + 1} (${o.station})`;
    const first = k === 0, last = k === rows.length - 1;
    if (first) {
      if (o.bs == null) errors.push({ row: o.row, col: 'bs', msg: `${lab}: the first row is the starting benchmark and needs a BS reading.` });
      if (o.is != null || o.fs != null) errors.push({ row: o.row, msg: `${lab}: the first row takes a BS reading only.` });
      return;
    }
    if (o.is != null && (o.bs != null || o.fs != null)) errors.push({ row: o.row, msg: `${lab}: an intermediate sight (IS) row cannot also have BS or FS.` });
    if (o.bs != null && o.fs == null) errors.push({ row: o.row, col: 'fs', msg: `${lab}: a change point needs both FS and BS on the same row.` });
    if (o.bs == null && o.is == null && o.fs == null) errors.push({ row: o.row, msg: `${lab}: enter an IS or FS reading.` });
    if (last && (o.fs == null || o.bs != null)) errors.push({ row: o.row, col: 'fs', msg: `${lab}: the last row is the closing point and takes an FS reading only.` });
  });
  for (const o of rows) for (const k of ['bs', 'is', 'fs']) if (o[k] != null && (o[k] < -0.5 || o[k] > 6)) warnings.push(`Row ${o.row + 1} (${o.station}): ${k.toUpperCase()} = ${o[k]} m looks unusual for a staff reading.`);

  const base = { type, method, startName, startRL, closeName, closeRL, errors, warnings, ok: false };
  if (errors.length) return base;

  // reduce — Height of Instrument for RLs, Rise & Fall computed independently as a check
  let hi = startRL + rows[0].bs, setup = 1, prevRead = rows[0].bs, rfRL = startRL;
  const out = [{ ...rows[0], setup: 0, hi, rl: startRL, rise: null, fall: null }];
  let sumRise = 0, sumFall = 0, maxDiff = 0;
  for (let k = 1; k < rows.length; k++) {
    const o = rows[k], read = o.is != null ? o.is : o.fs;
    const rl = hi - read;
    const d = prevRead - read;
    const rise = d > 0 ? d : null, fall = d < 0 ? -d : null;
    if (rise) sumRise += rise; if (fall) sumFall += fall;
    rfRL += d; maxDiff = Math.max(maxDiff, Math.abs(rfRL - rl));
    const row = { ...o, setup, hi, rl, rise, fall };
    out.push(row);
    if (o.bs != null) { hi = rl + o.bs; setup++; prevRead = o.bs; row.hiNext = hi; } else prevRead = read;
  }
  const n = setup;                                         // number of instrument set-ups
  const sumBS = rows.reduce((a, o) => a + (o.bs ?? 0), 0);
  const sumFS = rows.reduce((a, o) => a + (o.fs ?? 0), 0);
  const firstRL = startRL, lastRL = out[out.length - 1].rl;
  const checks = [
    { name: 'ΣBS − ΣFS = Last RL − First RL', left: sumBS - sumFS, right: lastRL - firstRL },
    { name: 'ΣRise − ΣFall = Last RL − First RL', left: sumRise - sumFall, right: lastRL - firstRL },
  ].map(c => ({ ...c, ok: Math.abs(c.left - c.right) < 5e-7 }));
  checks.push({ name: 'HI method and Rise & Fall method give the same RLs', left: maxDiff, right: 0, ok: maxDiff < 5e-7, isDiff: true });

  let mis = null, allow = null, allowRule = '', pass = null;
  if (type === 'closed') {
    mis = lastRL - closeRL;
    const a = num(input.allow);
    if (Number.isFinite(a) && a > 0) { allow = a; allowRule = `±${fmt(a, 1)} mm (entered)`; }
    else { allow = 10 * Math.sqrt(n); allowRule = `±10 mm × √${n} set-ups = ±${fmt(allow, 1)} mm`; }
    pass = Math.abs(mis * 1000) <= allow + 1e-9;
  }
  out.forEach(r => {
    r.corr = type === 'closed' && r.setup > 0 ? -mis * r.setup / n : 0;
    r.adjRL = r.rl + r.corr;
  });
  if (type === 'closed') out[out.length - 1].adjRL = closeRL;     // exact on the known benchmark
  return { ...base, ok: true, rows: out, n, sumBS, sumFS, sumRise, sumFall, firstRL, lastRL, checks, mis, allow, allowRule, pass };
}

export function fmt(v, dp = 3) {
  if (v == null || !Number.isFinite(v)) return '';
  const s = (Math.round(v * 10 ** dp) / 10 ** dp).toFixed(dp);
  return s === '-' + (0).toFixed(dp) ? (0).toFixed(dp) : s;
}
export function ratioText(r) {
  if (!Number.isFinite(r)) return '1 : ∞ (no misclosure)';
  return '1 : ' + Math.round(r).toLocaleString('en-US');
}
