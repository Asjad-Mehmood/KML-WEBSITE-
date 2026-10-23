// The field book (angles and distances) worked out by the Excel to KML engine, checked against
// exact traverses, against the coordinate traverse, and on the Qatar National Grid against a
// reference built with PROJ (tests/qng-reference.json, from Traverse Pro).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeFieldBook, computeAny, blankFieldBook } from '../src/fieldbook.js';
import { computeTraverse, bearing } from '../src/core.js';
import { QNG } from '../src/qng.js';
import { SURV } from '../../lib/surveyEngine.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b}`);
const ref = JSON.parse(readFileSync(new URL('./qng-reference.json', import.meta.url)));
const n360 = a => ((a % 360) + 360) % 360;
const deg = a => String(a);                       // decimal degrees, typed as such
const local = { sys: 'local', sf: 'typed', scale: '1' };

/** a field book job from true coordinates: angles turned clockwise from the backsight */
function fromTruth(stations, bs, { closing = null, distErr = [], fmt = 'deg' } = {}) {
  const az = (a, b) => bearing({ E: a[0], N: a[1] }, { E: b[0], N: b[1] });
  const pts = stations.slice(1), last = closing ? stations.length - 1 : stations.length;
  const rows = [], legsTo = closing ? pts.slice(0, -1) : pts;
  legsTo.forEach((p, i) => {
    const at = stations[i], back = i === 0 ? bs : stations[i - 1];
    rows.push({ side: 'point', name: 'P' + (i + 1), angle: deg(n360(az(at, p) - az(at, back))), dist: String(Math.hypot(p[0] - at[0], p[1] - at[1]) + (distErr[i] || 0)), dh: '', remark: '' });
  });
  const job = { type: closing ? 'closed' : 'open', method: 'bowditch', precision: '10000', input: 'fieldbook', grid: local,
    station: { name: 'S', E: stations[0][0], N: stations[0][1] }, backsight: { name: 'BS', E: bs[0], N: bs[1] },
    fb: { ...blankFieldBook(), fmt, rows } };
  if (closing) {
    const i = last - 1, at = stations[i], back = i === 0 ? bs : stations[i - 1], p = stations[last];
    job.closing = { name: closing.name, E: p[0], N: p[1] };
    job.fb.close = { angle: deg(n360(az(at, p) - az(at, back))), dist: String(Math.hypot(p[0] - at[0], p[1] - at[1]) + (distErr[i] || 0)), dh: '' };
    if (closing.ref) { job.fb.ref = { name: 'R', E: closing.ref[0], N: closing.ref[1] }; job.fb.closeAngle = deg(n360(az(p, closing.ref) - az(p, at))); }
    if (closing.loop) job.fb.closeAngle = deg(n360(az(p, bs) - az(p, at)));
  }
  return job;
}
const LINK = [[1000, 1000], [1180, 1060], [1350, 1010], [1530, 1100], [1700, 1080]];
const LOOP = [[1000, 1000], [1200, 1050], [1250, 1250], [1050, 1300], [950, 1150], [1000, 1000]];

test('an exact link closes on itself, by every method', () => {
  for (const method of ['bowditch', 'transit', 'equal', 'lsq']) {
    const job = { ...fromTruth(LINK, [900, 1200], { closing: { name: 'E', ref: [1800, 1300] } }), method };
    const r = computeFieldBook(job);
    assert.ok(r.ok, JSON.stringify(r.errors));
    near(r.linear, 0, 1e-8, method); near(r.fb.angMis, 0, 1e-6, method);
    r.points.forEach((p, i) => { near(p.E, LINK[i][0], 1e-7, method); near(p.N, LINK[i][1], 1e-7, method); });
    assert.equal(r.pass, true, method + ': ' + r.why.join('; '));
  }
});

test('an exact loop closes back on its start, with the closing angle onto the backsight', () => {
  const r = computeFieldBook(fromTruth(LOOP, [1000, 1500], { closing: { name: 'S', loop: true } }));
  assert.ok(r.ok, JSON.stringify(r.errors)); assert.equal(r.fb.isLoop, true); assert.equal(r.fb.hasCloseAngle, true);
  near(r.fb.angMis, 0, 1e-6); near(r.linear, 0, 1e-8);
  const last = r.points[r.points.length - 1]; near(last.E, 1000, 1e-9); near(last.N, 1000, 1e-9);
});

test('with exact angles, the field book and the coordinate traverse give the same Bowditch answer', () => {
  const err = [0.012, -0.008, 0.015, 0.006];
  const fbJob = fromTruth(LINK, [900, 1200], { closing: { name: 'E' }, distErr: err });
  const fbr = computeFieldBook(fbJob);
  assert.ok(fbr.ok, JSON.stringify(fbr.errors));
  // the same observations, worked into coordinates as measured on site
  const co = computeTraverse({ type: 'closed', method: 'bowditch', precision: '10000', station: fbJob.station, backsight: fbJob.backsight,
    points: fbr.points.slice(1, -1).map(p => ({ name: p.name, E: p.measE, N: p.measN, remark: '' })),
    closing: { name: 'E', E: LINK[4][0], N: LINK[4][1], measE: fbr.points[4].measE, measN: fbr.points[4].measN } });
  assert.ok(co.ok, JSON.stringify(co.errors));
  near(fbr.misE, co.misE, 1e-9); near(fbr.misN, co.misN, 1e-9);
  fbr.points.forEach((p, i) => { near(p.E, co.points[i].E, 1e-9, 'E' + i); near(p.N, co.points[i].N, 1e-9, 'N' + i); });
});

test('Excel to KML sample loop: same answer as the engine itself', () => {
  const rows = [['TS-01', '81.3127', '316.630'], ['TS-02', '124.3129', '308.240'], ['TS-03', '125.5354', '308.364'], ['TS-04', '104.5917', '293.903'], ['TS-05', '129.2554', '294.528']];
  const job = { type: 'closed', method: 'bowditch', precision: '20000', input: 'fieldbook', grid: local,
    station: { name: 'CP-01', E: '228450.312', N: '441203.845' }, backsight: { name: 'CP-02', E: '228912.640', N: '441655.118' },
    closing: { name: 'CP-01', E: '228450.312', N: '441203.845' },
    fb: { ...blankFieldBook(), angK: '5', closeAngle: '23.1021', close: { angle: '130.2740', dist: '288.697', dh: '' },
      rows: rows.map(([name, angle, dist]) => ({ side: 'point', name, angle, dist, dh: '', remark: '' })) } };
  const r = computeFieldBook(job);
  assert.ok(r.ok, JSON.stringify(r.errors));
  near(r.fb.angMis, 2.0, 0.05, 'angular misclosure"'); assert.equal(Math.floor(r.ratio), 125383); assert.equal(r.pass, true);
  near(r.points[1].E, 228702.457, 0.0006); near(r.points[1].N, 441012.336, 0.0006);   // Traverse Pro / Excel to KML, Compass
});

test('bearings in the field book give the same traverse as the angles', () => {
  const ang = fromTruth(LINK, [900, 1200], { closing: { name: 'E' }, distErr: [0.01, 0, -0.01, 0.004] });
  const brg = JSON.parse(JSON.stringify(ang));
  brg.fb.angleMode = 'bearing';
  const legsAz = []; for (let i = 0; i < LINK.length - 1; i++) legsAz.push(bearing({ E: LINK[i][0], N: LINK[i][1] }, { E: LINK[i + 1][0], N: LINK[i + 1][1] }));
  brg.fb.rows.forEach((r, i) => (r.angle = String(legsAz[i])));
  brg.fb.close.angle = String(legsAz[legsAz.length - 1]);
  const a = computeFieldBook(ang), b = computeFieldBook(brg);
  assert.ok(a.ok && b.ok, JSON.stringify([a.errors, b.errors]));
  a.points.forEach((p, i) => { near(p.E, b.points[i].E, 1e-8); near(p.N, b.points[i].N, 1e-8); });
});

test('anticlockwise angles and DDD.MMSS read correctly', () => {
  const cw = fromTruth(LINK, [900, 1200], { closing: { name: 'E' } });
  const ccw = JSON.parse(JSON.stringify(cw)); ccw.fb.dir = 'ccw';
  const flip = a => String(n360(360 - Number(a)));
  ccw.fb.rows.forEach(r => (r.angle = flip(r.angle))); ccw.fb.close.angle = flip(ccw.fb.close.angle);
  const dms = JSON.parse(JSON.stringify(cw)); dms.fb.fmt = 'dms';
  const toDms = a => { const t = Math.round(Number(a) * 360000); const d = Math.floor(t / 360000), m = Math.floor((t % 360000) / 6000), s = (t % 6000) / 100; return `${d}°${m}'${s}"`; };
  dms.fb.rows.forEach(r => (r.angle = toDms(r.angle))); dms.fb.close.angle = toDms(dms.fb.close.angle);
  for (const j of [ccw, dms]) { const r = computeFieldBook(j); assert.ok(r.ok, JSON.stringify(r.errors)); r.points.forEach((p, i) => { near(p.E, LINK[i][0], 2e-4); near(p.N, LINK[i][1], 2e-4); }); }
});

test('Equal: every point gets the same share; least squares reports its statistics', () => {
  const job = { ...fromTruth(LOOP, [1000, 1500], { closing: { name: 'S', loop: true }, distErr: [0.02, -0.01, 0.015, 0.01, -0.005] }), method: 'equal' };
  const r = computeFieldBook(job); assert.ok(r.ok);
  const k = r.points.length - 1;
  r.points.slice(0, -1).forEach((p, i) => { near(p.cE, -r.misE * i / k, 1e-12, 'equal E' + i); near(p.cN, -r.misN * i / k, 1e-12); });
  const l = computeFieldBook({ ...job, method: 'lsq' }); assert.ok(l.ok);
  assert.ok(l.fb.lsq && l.fb.lsq.r > 0 && l.fb.lsq.obs.length > 0); assert.ok(typeof l.fb.chiPass === 'boolean');
});

test('side shots hang off the set-up of the row above them, from the adjusted stations', () => {
  const job = fromTruth(LINK, [900, 1200], { closing: { name: 'E' } });
  // after row 1 (S to P1): from the same set-up, the instrument on S with BS behind it; 90° right, 25 m
  job.fb.rows.splice(1, 0, { side: 'side', name: 'MH-1', angle: '90', dist: '25', dh: '', remark: 'Manhole' });
  // after row 3 (P1 to P2): on P1, looking back at S
  job.fb.rows.splice(3, 0, { side: 'side', name: 'MH-2', angle: '45', dist: '10', dh: '', remark: '' });
  const r = computeFieldBook(job); assert.ok(r.ok, JSON.stringify(r.errors));
  assert.equal(r.sides.length, 2); assert.equal(r.sides[0].from, 'S'); assert.equal(r.sides[1].from, 'P1');
  const at = (p, back, ang, d) => { const az = n360(bearing({ E: p[0], N: p[1] }, { E: back[0], N: back[1] }) + ang); return [p[0] + d * Math.sin(az * Math.PI / 180), p[1] + d * Math.cos(az * Math.PI / 180)]; };
  const a = at(LINK[0], [900, 1200], 90, 25), b = at(LINK[1], LINK[0], 45, 10);
  near(r.sides[0].E, a[0], 1e-7); near(r.sides[0].N, a[1], 1e-7); near(r.sides[1].E, b[0], 1e-7); near(r.sides[1].N, b[1], 1e-7);
  assert.equal(r.points.length, LINK.length);                  // a side shot is not a traverse station
});

test('an open traverse with a closing point is checked like a link; without one it is not', () => {
  const link = fromTruth(LINK, [900, 1200], { closing: { name: 'E' }, distErr: [0.01, 0, 0.01, 0] });
  const open = { ...link, type: 'open', useClosing: true };
  const a = computeFieldBook(link), b = computeFieldBook(open);
  assert.ok(b.ok && b.checked); near(a.linear, b.linear, 0);
  const plain = computeFieldBook({ ...link, type: 'open', useClosing: false, fb: { ...link.fb } });
  assert.ok(plain.ok, JSON.stringify(plain.errors)); assert.equal(plain.checked, false); assert.equal(plain.pass, null);
});

test('the field book says what is wrong, row by row', () => {
  const job = fromTruth(LINK, [900, 1200], { closing: { name: 'E' } });
  job.fb.rows[0].angle = '12x'; job.fb.rows[1].dist = ''; job.fb.rows[2].name = 'P1';
  const r = computeFieldBook(job); assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => e.row === 0 && e.col === 'angle'), 'unreadable angle');
  assert.ok(r.errors.some(e => e.row === 1 && e.col === 'dist'), 'missing distance');
  assert.ok(r.errors.some(e => e.row === 2 && e.col === 'name'), 'name used twice');
  const noClose = fromTruth(LINK, [900, 1200], { closing: { name: 'E' } }); noClose.fb.close = { angle: '', dist: '', dh: '' };
  const c = computeFieldBook(noClose); assert.equal(c.ok, false);
  assert.ok(c.errors.some(e => e.row === 'C' && e.col === 'angle') && c.errors.some(e => e.row === 'C' && e.col === 'dist'), 'closing leg');
});

test('Qatar National Grid: the scale factor matches PROJ and the WGS84 position matches Excel to KML', () => {
  for (const [name, p] of Object.entries(ref.points)) {
    near(QNG.pointScale(p.E, p.N), p.k_pyproj, 2e-9, 'k ' + name);
    const w = QNG.toWGS84(p.E, p.N, 0);
    near(w[0], p.lat_kml, 1e-8, 'lat ' + name); near(w[1], p.lon_kml, 1e-8, 'lon ' + name);
  }
});

test('Qatar National Grid: ground distances times the worked-out scale factor land on the truth', () => {
  for (const [kind, T] of [['loop', ref.loop], ['link', ref.link]]) {
    const st = T.stations, isLoop = kind === 'loop', n = st.length;
    const job = { type: 'closed', method: 'bowditch', precision: '20000', input: 'fieldbook', grid: { sys: 'qng', sf: 'auto', meanH: String(T.h) },
      station: { name: isLoop ? 'L0' : 'K0', E: st[0][0], N: st[0][1] }, backsight: { name: 'BS', E: T.bs[0], N: T.bs[1] },
      closing: isLoop ? { name: 'L0', E: st[0][0], N: st[0][1] } : { name: 'K5', E: st[n - 1][0], N: st[n - 1][1] },
      fb: { ...blankFieldBook(), fmt: 'deg', angK: '5', closeAngle: T.closeAngle,
        rows: T.rows.slice(0, -1).map(r => ({ side: 'point', name: r.name, angle: r.angle, dist: r.distance, dh: '', remark: '' })),
        close: { angle: T.rows[T.rows.length - 1].angle, dist: T.rows[T.rows.length - 1].distance, dh: '' },
        ref: isLoop ? { name: '', E: '', N: '' } : { name: 'FS', E: T.fs[0], N: T.fs[1] } } };
    const r = computeAny(job);
    assert.ok(r.ok, JSON.stringify(r.errors));
    assert.ok(r.fb.scale.auto && Math.abs(r.fb.scale.scale - 1) > 1e-6, 'a real scale factor');
    const truth = isLoop ? st.concat([st[0]]) : st;
    const worst = Math.max(...r.points.map((p, i) => Math.hypot(p.E - truth[i][0], p.N - truth[i][1])));
    assert.ok(worst < 0.003, `${kind}: worst station ${(worst * 1000).toFixed(2)} mm from the truth`);
    // without the grid's scale factor it is visibly off
    const plain = computeAny({ ...job, grid: local });
    const off = Math.max(...plain.points.map((p, i) => Math.hypot(p.E - truth[i][0], p.N - truth[i][1])));
    assert.ok(off > 0.01 || plain.linear > 0.01, `${kind}: scale 1 should be off`);
    assert.ok(Number.isFinite(r.points[1].lat) && r.points[1].lat > 24 && r.points[1].lat < 27);
  }
});

test('coordinates mode is untouched, and gets latitude and longitude on the Qatar grid', () => {
  const X = { type: 'closed', method: 'bowditch', precision: '10000', input: 'coords', grid: { sys: 'qng' },
    station: { name: 'CP-01', E: '228450.312', N: '441203.845' }, backsight: { name: 'CP-02', E: '228912.640', N: '441655.118' },
    points: [{ name: 'TP-01', E: '228610.458', N: '441118.300', remark: '' }], closing: { name: 'CP-03', E: '229265.871', N: '441392.006', measE: '229265.883', measN: '441391.997' } };
  const a = computeAny(X), b = computeTraverse(X);
  a.points.forEach((p, i) => { assert.equal(p.E, b.points[i].E); assert.equal(p.N, b.points[i].N); });
  assert.ok(a.points.every(p => p.lat > 25 && p.lon > 51));
  assert.equal(computeAny({ ...X, grid: { sys: 'local' } }).points[0].lat, undefined);
  void SURV;
});
