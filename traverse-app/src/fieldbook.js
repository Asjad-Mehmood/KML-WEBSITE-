// Field book traverse: horizontal angles (or bearings) and distances, as the instrument records
// them, worked out by the Excel to KML traverse engine (lib/surveyEngine.js, SURV): angular
// misclosure, Bowditch, Transit, Equal or least squares, side shots, levels, and the scale
// factor of the Qatar National Grid. The answer has the same shape as computeTraverse, so the
// Traverse screen, the PDF, the CSV and the dashboard read it the same way.
import { SURV } from '../../lib/surveyEngine.js';
import { QNG } from './qng.js';
import { computeTraverse, num, isBlank, bearing, METHODS } from './core.js';

export const FB_METHODS = { ...METHODS, lsq: 'Least squares' };
export const ANGLE_FMT = { dms: 'DDD.MMSS', deg: 'decimal degrees', gon: 'gons' };

export const blankFieldBook = () => ({
  angleMode: 'angle',            // 'angle': turned at the station from the backsight · 'bearing': whole circle bearing
  fmt: 'dms', dir: 'cw',
  rows: Array.from({ length: 4 }, () => ({ side: 'point', angle: '', dist: '', dh: '', name: '', remark: '' })),
  close: { angle: '', dist: '', dh: '' },     // the closing leg: from the last point to the closing point
  closeAngle: '',                             // optional: at the closing point, onto the closing reference
  ref: { name: '', E: '', N: '' },            // closing reference of a link (a second known point)
  angK: '10', sigma: { ang: '3', dA: '2', dB: '2' },
  useH: false, startH: '', closeH: '', hC: '12',
});
export const blankGrid = () => ({ sys: 'qng', sf: 'auto', scale: '1', meanH: '' });

const n360 = SURV.n360;
const D2R = Math.PI / 180;

/** Coordinates or field book, then the grid's latitude and longitude. */
export function computeAny(t) {
  const r = t.input === 'fieldbook' ? computeFieldBook(t) : computeTraverse(t);
  r.input = t.input === 'fieldbook' ? 'fieldbook' : 'coords';
  return withGrid(r, t.grid);
}

/** WGS84 latitude and longitude of every point on the Qatar National Grid, and a check that it is in Qatar. */
export function withGrid(r, grid) {
  const g = { ...blankGrid(), ...(grid || {}) };
  r.grid = { sys: g.sys === 'local' ? 'local' : 'qng' };
  if (!r.ok || r.grid.sys !== 'qng') return r;
  const ll = p => { const w = QNG.toWGS84(p.E, p.N, Number.isFinite(p.H) ? p.H : 0); p.lat = w[0]; p.lon = w[1]; };
  r.points.forEach(ll);
  (r.sides || []).forEach(p => { if (Number.isFinite(p.E)) ll(p); });
  if (!QNG.inQatar(r.station.E, r.station.N))
    r.gridWarn = `The station (E ${r.station.E.toFixed(3)}, N ${r.station.N.toFixed(3)}) is not in Qatar on the Qatar National Grid. Check that Easting and Northing are not swapped, or set the coordinate system to Local.`;
  return r;
}

/** The grid scale factor where the traverse is, or the one typed. pts: provisional positions (scale 1). */
export function gridScale(grid, pts, heights) {
  const g = { ...blankGrid(), ...(grid || {}) };
  if (g.sys === 'qng' && g.sf === 'auto') {
    if (!pts.length) return { scale: 1, auto: true, none: true };
    const E = pts.reduce((a, p) => a + p.E, 0) / pts.length, N = pts.reduce((a, p) => a + p.N, 0) / pts.length;
    if (!QNG.inQatar(E, N)) return { scale: 1, auto: true, outside: true, E, N };
    const typedH = num(g.meanH), hs = heights.filter(Number.isFinite);
    const h = Number.isFinite(typedH) ? typedH : hs.length ? hs.reduce((a, b) => a + b, 0) / hs.length : 0;
    const k = QNG.pointScale(E, N), ef = QNG.heightFactor(N, h);
    return { scale: k * ef, auto: true, k, ef, h, hFrom: Number.isFinite(typedH) ? 'typed' : hs.length ? 'levels' : 'none', E, N };
  }
  const s = num(g.scale);
  return { scale: s, auto: false, bad: !(s > 0) };
}

export function computeFieldBook(t) {
  const fb = { ...blankFieldBook(), ...(t.fb || {}) };
  fb.sigma = { ...blankFieldBook().sigma, ...(fb.sigma || {}) };
  fb.close = { ...blankFieldBook().close, ...(fb.close || {}) };
  fb.ref = { ...blankFieldBook().ref, ...(fb.ref || {}) };
  const errors = [], warnings = [];
  const type = t.type === 'open' ? 'open' : 'closed';
  const checked = type === 'closed' || t.useClosing === true;
  const method = FB_METHODS[t.method] ? t.method : 'bowditch';
  const bearings = fb.angleMode === 'bearing';
  const fmt = ANGLE_FMT[fb.fmt] ? fb.fmt : 'dms';
  const known = (p, label) => {
    const o = { name: String(p?.name ?? '').trim() || label, E: num(p?.E), N: num(p?.N) };
    if (!Number.isFinite(o.E) || !Number.isFinite(o.N)) errors.push({ where: label, msg: `${label}: enter the known Easting and Northing.` });
    return o;
  };
  const station = known(t.station, 'Station point');
  const backsight = known(t.backsight, 'Backsight point');
  if (Number.isFinite(station.E) && Number.isFinite(backsight.E) && station.E === backsight.E && station.N === backsight.N)
    errors.push({ where: 'Backsight point', msg: 'Backsight point has the same coordinates as the station point.' });
  let closing = null;
  if (checked) closing = known(t.closing, 'Closing point');
  const precision = num(t.precision);
  if (checked && !(precision > 0)) errors.push({ where: 'Precision', msg: 'Required precision must be a positive number (for example 10000 for 1:10,000).' });

  // the rows as typed: traverse points, and side shots taken from the set-up of the row above
  const readAngle = (raw, where, row, col) => {
    if (isBlank(raw)) { errors.push({ where, row, col, msg: `${where}: the ${bearings ? 'bearing' : 'angle'} is missing.` }); return NaN; }
    const a = SURV.parseAngle(raw, fmt);
    if (a === null || Number.isNaN(a)) errors.push({ where, row, col, msg: `${where}: the ${bearings ? 'bearing' : 'angle'} "${String(raw).trim()}" cannot be read as ${ANGLE_FMT[fmt]}.` });
    return a;
  };
  const readDist = (raw, where, row, col) => {
    const d = num(raw);
    if (!(d > 0)) errors.push({ where, row, col, msg: `${where}: the distance is ${isBlank(raw) ? 'missing' : 'not a number above 0'}.` });
    return d;
  };
  const rows = [];
  (fb.rows || []).forEach((p, i) => {
    if (isBlank(p.name) && isBlank(p.angle) && isBlank(p.dist) && isBlank(p.dh) && isBlank(p.remark)) return;
    const side = p.side === 'side';
    const name = String(p.name ?? '').trim() || (side ? `SS${i + 1}` : `P${i + 1}`);
    const where = `Row ${i + 1} (${name})`;
    const o = { row: i, side, name, remark: String(p.remark ?? '').trim(), raw: { angle: String(p.angle ?? '').trim(), dist: String(p.dist ?? '').trim(), dh: String(p.dh ?? '').trim() } };
    o.angle = readAngle(p.angle, where, i, 'angle');
    o.dist = readDist(p.dist, where, i, 'dist');
    o.dh = fb.useH && !isBlank(p.dh) ? num(p.dh) : null;
    if (fb.useH && !isBlank(p.dh) && !Number.isFinite(o.dh)) errors.push({ where, row: i, col: 'dh', msg: `${where}: the height difference is not a number.` });
    rows.push(o);
  });
  const trav = rows.filter(o => !o.side);
  if (!checked && trav.length === 0) errors.push({ where: 'Points', msg: 'Add at least one traverse point.' });
  let closeLeg = null;
  if (checked) {
    const where = `Closing leg (to ${closing.name})`;
    closeLeg = { name: closing.name, angle: readAngle(fb.close.angle, where, 'C', 'angle'), dist: readDist(fb.close.dist, where, 'C', 'dist'), raw: { angle: String(fb.close.angle ?? '').trim(), dist: String(fb.close.dist ?? '').trim(), dh: String(fb.close.dh ?? '').trim() } };
    closeLeg.dh = fb.useH && !isBlank(fb.close.dh) ? num(fb.close.dh) : null;
  }
  // names: each point once; the closing point of a loop is the station again
  const seen = new Map([[station.name, 'the station']]);
  trav.forEach(o => {
    if (seen.has(o.name)) errors.push({ where: `Row ${o.row + 1}`, row: o.row, col: 'name', msg: `Row ${o.row + 1}: the name ${o.name} is already used by ${seen.get(o.name)}. Each point needs its own name.` });
    else seen.set(o.name, `row ${o.row + 1}`);
  });
  const isLoop = checked && Number.isFinite(closing.E) && Math.abs(closing.E - station.E) < 0.0005 && Math.abs(closing.N - station.N) < 0.0005;
  if (checked && !isLoop && trav.some(o => o.name === closing.name)) errors.push({ where: 'Closing point', msg: `The closing point ${closing.name} is also the name of a point along the traverse. Rename one of them.` });
  // the closing angle checks the angles; on a link it needs a second known point to look at
  const hasCloseAngle = checked && !bearings && !isBlank(fb.closeAngle);
  let closeAng = null, ref = null;
  if (hasCloseAngle) {
    closeAng = readAngle(fb.closeAngle, 'Closing angle', 'C', 'closeAngle');
    if (!isLoop) {
      ref = known(fb.ref, 'Closing reference');
      if (Number.isFinite(ref.E) && Number.isFinite(closing.E) && ref.E === closing.E && ref.N === closing.N) errors.push({ where: 'Closing reference', msg: 'The closing reference must be a different point from the closing point.' });
    }
  }
  const startH = num(fb.startH), closeH = num(fb.closeH);
  if (fb.useH && !Number.isFinite(startH)) errors.push({ where: 'Levels', msg: 'Levels: enter the level of the station point, or turn levels off.' });

  const base = { type, checked, method, station, backsight, closing, precision, errors, warnings, ok: false, input: 'fieldbook' };
  if (errors.length) return base;

  // angles as the engine wants them: clockwise from the backsight
  const startAz = bearing(station, backsight);
  const legs = trav.map(o => ({ name: o.name, angle: o.angle, dist: o.dist, dh: o.dh, remark: o.remark, row: o.row }));
  if (closeLeg) legs.push({ name: closeLeg.name, angle: closeLeg.angle, dist: closeLeg.dist, dh: closeLeg.dh, remark: '', row: 'C' });
  const toCw = a => (fb.dir === 'ccw' ? n360(360 - a) : n360(a));
  let backAz = startAz;
  const angles = legs.map(l => {
    if (!bearings) return l.angle;                              // the engine turns anticlockwise ones itself
    const a = n360(l.angle - backAz); backAz = n360(l.angle + 180); return a;   // bearings have no direction of turning
  });

  // where the traverse is, before any scale or adjustment, for the grid's scale factor
  const prov = [{ E: station.E, N: station.N }];
  let az = startAz, hh = fb.useH ? [startH] : [];
  legs.forEach((l, i) => {
    const t1 = n360(az + (bearings ? angles[i] : toCw(angles[i])));
    const p = prov[prov.length - 1];
    prov.push({ E: p.E + l.dist * Math.sin(t1 * D2R), N: p.N + l.dist * Math.cos(t1 * D2R) });
    if (fb.useH && Number.isFinite(l.dh) && Number.isFinite(hh[hh.length - 1])) hh.push(hh[hh.length - 1] + l.dh);
    az = n360(t1 + 180);
  });
  const sc = gridScale(t.grid, prov, hh);
  if (!(sc.scale > 0)) { errors.push({ where: 'Scale factor', msg: 'The scale factor must be a number above 0.' }); return base; }
  if (sc.outside) warnings.push('The traverse is not in Qatar on the Qatar National Grid, so no grid scale factor is applied (1 is used).');

  const names = [station.name].concat(legs.map(l => l.name));
  const n = names.length;
  const rowsIn = names.map((nm, i) => i < n - 1
    ? { name: nm, angle: angles[i], dist: legs[i].dist, dh: legs[i].dh }
    : { name: nm, angle: hasCloseAngle ? closeAng : null, dist: null, dh: null });
  const endOri = !hasCloseAngle ? { mode: 'none' } : { mode: 'point', az: isLoop ? startAz : bearing(closing, ref) };
  const inp = {
    type: !checked ? 'open' : isLoop ? 'loop' : 'link', method: method === 'equal' ? 'bowditch' : method,
    angleDir: bearings ? 'cw' : fb.dir, scale: sc.scale,
    tol: { angK: num(fb.angK) || 0, ratio: checked ? precision : 0, hC: num(fb.hC) || 0 },
    sigma: { ang: num(fb.sigma.ang) || 1, dA: num(fb.sigma.dA) || 1, dB: num(fb.sigma.dB) || 0 }, useH: !!fb.useH,
    startPt: { name: station.name, E: station.E, N: station.N, H: fb.useH ? startH : null },
    endPt: checked && !isLoop ? { name: closing.name, E: closing.E, N: closing.N, H: fb.useH && Number.isFinite(closeH) ? closeH : null } : null,
    startOri: { mode: 'point', az: startAz }, endOri, rows: rowsIn,
  };
  if (fb.useH && checked && isLoop) inp.startPt.H = startH;
  let res;
  try { res = SURV.compute(inp); } catch (e) { errors.push({ where: 'Field book', msg: e.message }); return base; }
  res.warnings.forEach(w => { if (!/open traverse has no closure/.test(w)) warnings.push(w); });

  // as observed (angles balanced, distances on the grid), then adjusted
  const c = res.closure, legsN = n - 1;
  const meas = [{ E: station.E, N: station.N }];
  for (let i = 0; i < legsN; i++) meas.push({ E: meas[i].E + res.dE[i], N: meas[i].N + res.dN[i] });
  let fE = res.finalE.slice(), fN = res.finalN.slice();
  if (checked && method === 'equal') {
    fE = meas.map((p, i) => (i === n - 1 ? (isLoop ? station.E : closing.E) : p.E - c.fE * i / legsN));
    fN = meas.map((p, i) => (i === n - 1 ? (isLoop ? station.N : closing.N) : p.N - c.fN * i / legsN));
  }
  const H = res.H;
  const points = names.map((nm, i) => {
    const kind = i === 0 ? 'station' : checked && i === n - 1 ? 'closing' : 'point';
    const leg = legs[i - 1];
    return {
      name: nm, kind, remark: (leg && leg.remark) || (kind === 'station' ? 'Station (known)' : kind === 'closing' ? 'Closing point (known)' : ''),
      measE: meas[i].E, measN: meas[i].N, cE: fE[i] - meas[i].E, cN: fN[i] - meas[i].N, E: fE[i], N: fN[i], H: H ? H[i] : null,
    };
  });
  const legRows = [];
  for (let i = 1; i < n; i++) {
    const a = points[i - 1], b = points[i];
    legRows.push({ from: a.name, to: b.name, bearing: bearing(a, b), dist: Math.hypot(b.E - a.E, b.N - a.N), rawDist: res.d[i - 1], obsDist: res.sd[i - 1] });
  }

  // side shots, from the adjusted stations: a side shot is taken from the same set-up as the
  // traverse row above it (instrument on that row's station, same backsight)
  const bsAzAt = k => (k === 0 ? startAz : bearing(points[k], points[k - 1]));
  let k = 0;
  const sides = [];
  rows.forEach(o => {
    if (!o.side) { k++; return; }
    const at = Math.max(k - 1, 0), from = points[at];
    const azS = bearings ? n360(o.angle) : n360(bsAzAt(at) + toCw(o.angle));
    const d = o.dist * sc.scale;
    sides.push({ name: o.name, from: from.name, remark: o.remark, bearing: azS, dist: d, obsDist: o.dist, E: from.E + d * Math.sin(azS * D2R), N: from.N + d * Math.cos(azS * D2R),
      H: Number.isFinite(from.H) && Number.isFinite(o.dh) ? from.H + o.dh : null });
  });

  // the angles, as observed and as adjusted
  const angleRows = res.rows.map((x, i) => (x.obs === null ? null : {
    at: x.name, bs: i === 0 ? backsight.name : names[i - 1],
    fs: i < n - 1 ? names[i + 1] : isLoop ? backsight.name : (ref ? ref.name : ''),
    obs: x.obs, adj: res.adjAng[i], corr: SURV.n180(res.adjAng[i] - x.obs) * 3600,
  })).filter(Boolean);

  const lsq = res.lsq && method === 'lsq' ? res.lsq : null;
  // the chi-square test fails a traverse only on the high side (observations worse than their
  // standard errors allow: a blunder). On the low side the standard errors are just pessimistic.
  const chiPass = lsq && lsq.chi ? lsq.chi.value <= lsq.chi.hi : null;
  if (lsq && lsq.chi && lsq.chi.value < lsq.chi.lo)
    warnings.push(`Least squares: the observations agree better than their standard errors expect (chi-square ${lsq.chi.value.toFixed(2)} under ${lsq.chi.lo.toFixed(2)}). The σ for angles and distances may be set too large.`);
  const why = [];
  if (checked) {
    if (c.precPass === false) why.push(`precision ${Math.round(c.precision).toLocaleString('en-US')} is worse than 1 : ${Math.round(precision).toLocaleString('en-US')}`);
    if (c.angPass === false) why.push(`angular misclosure ${SURV.fmtSec(c.angMis, 1)} is more than the allowed ±${c.angAllow.toFixed(1)}"`);
    if (c.hPass === false) why.push(`level misclosure ${(c.fH * 1000).toFixed(1)} mm is more than the allowed ±${(c.hAllow * 1000).toFixed(1)} mm`);
    if (chiPass === false) why.push('the least squares test fails: the observations disagree more than their standard errors allow');
  }
  const pass = checked ? why.length === 0 : null;
  if (method === 'lsq' && !checked) warnings.push('Least squares needs a closing point, so this open traverse is worked out as observed.');
  if (bearings && checked) warnings.push('The field book holds bearings, so there is no angular check: only the linear misclosure is tested.');

  return {
    ...base, ok: true, points, legs: legRows, sides,
    totalL: c.sumD, misE: checked ? c.fE : 0, misN: checked ? c.fN : 0, linear: checked ? c.fL : 0, ratio: checked ? c.precision : Infinity, pass, why,
    refBearing: startAz, refDist: Math.hypot(backsight.E - station.E, backsight.N - station.N), nLegs: legsN,
    fb: {
      bearings, fmt, dir: fb.dir, isLoop, hasCloseAngle, closeAngleRaw: String(fb.closeAngle ?? '').trim(), ref,
      nAng: c.nAng, angMis: c.angMis, angAllow: c.angAllow, angPass: c.angPass, angCorr: c.angCorr, angK: num(fb.angK) || 0,
      useH: !!fb.useH, fH: c.fH, hAllow: c.hAllow, hPass: c.hPass,
      scale: sc, lsq, chiPass, angles: angleRows, sigma: inp.sigma,
      obs: rows.map(o => ({ side: o.side, name: o.name, raw: o.raw, remark: o.remark })).concat(closeLeg ? [{ side: false, name: closeLeg.name, raw: closeLeg.raw, remark: 'Closing leg', closing: true }] : []),
    },
  };
}
