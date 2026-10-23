import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTraverse, computeLevel, dms, num, bearing } from '../src/core.js';
import { EXAMPLE_TRAVERSE, EXAMPLE_LEVEL } from '../src/example.js';

const near = (a, b, tol = 1e-9, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b}`);

test('number parsing is strict', () => {
  assert.equal(num('228,450.312'), 228450.312);
  assert.equal(num(' 441203.845 '), 441203.845);
  assert.ok(Number.isNaN(num('12a')));
  assert.ok(Number.isNaN(num('')));
  assert.ok(Number.isNaN(num('1.2.3')));
  assert.equal(num('-0.5'), -0.5);
});

test('DMS formatting carries seconds and minutes', () => {
  assert.equal(dms(0), '000°00\'00"');
  assert.equal(dms(359.99999), '000°00\'00"');
  assert.equal(dms(45.5), '045°30\'00"');
  assert.equal(dms(123.456789), '123°27\'24"');
  assert.equal(dms(29.999999), '030°00\'00"');
  assert.equal(bearing({ E: 0, N: 0 }, { E: -1, N: 0 }), 270);
});

test('closed traverse, Bowditch: hand-computed corrections', () => {
  // square-ish traverse 100 m legs, measured closing error +0.04 E / -0.03 N
  const r = computeTraverse({
    type: 'closed', method: 'bowditch', precision: 5000,
    station: { name: 'A', E: 1000, N: 1000 }, backsight: { name: 'R', E: 1000, N: 1100 },
    points: [{ name: 'B', E: 1100.01, N: 1000 }, { name: 'C', E: 1100.03, N: 1099.98 }],
    closing: { name: 'D', E: 1000, N: 1100, measE: 1000.04, measN: 1099.97 },
  });
  assert.ok(r.ok, JSON.stringify(r.errors));
  near(r.misE, 0.04, 1e-12); near(r.misN, -0.03, 1e-12); near(r.linear, 0.05, 1e-12);
  // cumulative lengths from measured coords
  const L1 = Math.hypot(100.01, 0), L2 = L1 + Math.hypot(0.02, 99.98), L3 = L2 + Math.hypot(100.03 - 0.04 + 0, 0.01);
  const Lt = r.totalL;
  near(Lt, L2 + Math.hypot(1000.04 - 1100.03, 1099.97 - 1099.98), 1e-9);
  near(r.points[1].cE, -0.04 * L1 / Lt, 1e-12, 'B dE');
  near(r.points[2].cN, 0.03 * L2 / Lt, 1e-12, 'C dN');
  near(r.points[3].E, 1000, 1e-12); near(r.points[3].N, 1100, 1e-12);
  assert.equal(r.pass, true);
  void L3;
});

test('transit and equal rules end on the known closing point', () => {
  for (const method of ['transit', 'equal', 'bowditch']) {
    const r = computeTraverse({ ...EXAMPLE_TRAVERSE, method });
    assert.ok(r.ok, method);
    const last = r.points[r.points.length - 1];
    near(last.E, num(EXAMPLE_TRAVERSE.closing.E), 1e-9, method); near(last.N, num(EXAMPLE_TRAVERSE.closing.N), 1e-9, method);
    near(r.points[0].cE, 0, 0); near(r.points[0].E, num(EXAMPLE_TRAVERSE.station.E), 0);
  }
  const e = computeTraverse({ ...EXAMPLE_TRAVERSE, method: 'equal' });
  const k = e.points.length - 1;
  e.points.forEach((p, i) => near(p.cE, -e.misE * i / k, 1e-12, 'equal ' + i));
});

test('example traverse: misclosure, precision and pass', () => {
  const r = computeTraverse(EXAMPLE_TRAVERSE);
  assert.ok(r.ok);
  near(r.misE, 0.012, 1e-9); near(r.misN, -0.009, 1e-9); near(r.linear, 0.015, 1e-9);
  assert.ok(r.ratio > 50000 && r.ratio < 70000, String(r.ratio));
  assert.equal(r.pass, true);
});

test('open traverse: no corrections, coordinates unchanged', () => {
  const r = computeTraverse({ ...EXAMPLE_TRAVERSE, type: 'open' });
  assert.ok(r.ok);
  assert.equal(r.pass, null);
  r.points.forEach(p => { assert.equal(p.cE, 0); assert.equal(p.E, p.measE); });
  assert.equal(r.points.length, EXAMPLE_TRAVERSE.points.length + 1);
});

test('traverse rejects when precision is worse than required', () => {
  const r = computeTraverse({ ...EXAMPLE_TRAVERSE, precision: 100000 });
  assert.equal(r.pass, false);
});

test('traverse input errors are reported, not thrown', () => {
  const r = computeTraverse({ type: 'closed', station: { E: 'x' }, points: [{ name: 'P', E: '1', N: '' }], closing: {} });
  assert.equal(r.ok, false);
  assert.ok(r.errors.length >= 4);
  assert.ok(r.errors.some(e => e.row === 0 && e.col === 'N'));
});

test('levelling example: reduction, checks, misclosure and adjustment', () => {
  const r = computeLevel(EXAMPLE_LEVEL);
  assert.ok(r.ok, JSON.stringify(r.errors));
  const rl = r.rows.map(x => +x.rl.toFixed(4));
  assert.deepEqual(rl, [4.215, 4.861, 4.215, 5.448, 4.213]);
  near(r.mis, -0.002, 1e-9);
  assert.equal(r.n, 3);
  near(r.allow, 10 * Math.sqrt(3), 1e-9);
  assert.equal(r.pass, true);
  assert.ok(r.checks.every(c => c.ok));
  // corrections: +2 mm × setup/3
  near(r.rows[1].corr, 0.002 / 3, 1e-12); near(r.rows[2].corr, 0.004 / 3, 1e-12); near(r.rows[3].corr, 0.004 / 3, 1e-12);
  near(r.rows[4].adjRL, 4.215, 1e-12);
});

test('levelling: Rise & Fall sums', () => {
  const r = computeLevel(EXAMPLE_LEVEL);
  near(r.sumRise - r.sumFall, r.lastRL - r.firstRL, 1e-9);
  near(r.sumBS - r.sumFS, -0.002, 1e-9);
});

test('levelling: open run has no adjustment; bad books are explained', () => {
  const o = computeLevel({ ...EXAMPLE_LEVEL, type: 'open' });
  assert.ok(o.ok); assert.equal(o.mis, null); o.rows.forEach(x => assert.equal(x.adjRL, x.rl));
  const bad = computeLevel({ ...EXAMPLE_LEVEL, rows: [{ station: 'A', bs: '1.2' }, { station: 'B', bs: '1.1' }, { station: 'C', is: '1', fs: '1' }] });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some(e => /change point/.test(e.msg)));
  assert.ok(bad.errors.some(e => /intermediate/.test(e.msg)));
  const bad2 = computeLevel({ ...EXAMPLE_LEVEL, rows: [{ station: 'A', bs: '1.2' }, { station: 'B', fs: '1.1', bs: '1.3' }] });
  assert.ok(bad2.errors.some(e => /last row/.test(e.msg)));
});

test('levelling: rejected when misclosure exceeds the allowable', () => {
  const r = computeLevel({ ...EXAMPLE_LEVEL, allow: '1.5' });
  assert.equal(r.pass, false);
});

test('open traverse with a closing point is checked and adjusted like a closed one', () => {
  for (const method of ['bowditch', 'transit', 'equal']) {
    const closed = computeTraverse({ ...EXAMPLE_TRAVERSE, method });
    const open = computeTraverse({ ...EXAMPLE_TRAVERSE, method, type: 'open', useClosing: true });
    assert.ok(open.ok, JSON.stringify(open.errors));
    assert.equal(open.type, 'open'); assert.equal(open.checked, true); assert.equal(closed.checked, true);
    near(open.misE, closed.misE, 0); near(open.misN, closed.misN, 0); near(open.ratio, closed.ratio, 0);
    assert.equal(open.pass, closed.pass);
    open.points.forEach((p, i) => { near(p.E, closed.points[i].E, 0, method); near(p.N, closed.points[i].N, 0, method); });
    const last = open.points[open.points.length - 1];
    near(last.E, num(EXAMPLE_TRAVERSE.closing.E), 1e-9); near(last.N, num(EXAMPLE_TRAVERSE.closing.N), 1e-9);
  }
});

test('open traverse: the closing point only counts when it is switched on', () => {
  const off = computeTraverse({ ...EXAMPLE_TRAVERSE, type: 'open', useClosing: false });
  assert.ok(off.ok); assert.equal(off.checked, false); assert.equal(off.pass, null); assert.equal(off.closing, null);
  assert.equal(off.points.length, EXAMPLE_TRAVERSE.points.length + 1);
  off.points.forEach(p => assert.equal(p.cE, 0));
  // switched on, both the known and the measured closing coordinates are needed
  const half = computeTraverse({ ...EXAMPLE_TRAVERSE, type: 'open', useClosing: true, closing: { name: 'CP-03', E: '229265.871', N: '441392.006', measE: '', measN: '' } });
  assert.equal(half.ok, false);
  assert.ok(half.errors.some(e => /measured on site/.test(e.msg)));
  // and a required precision
  const noPrec = computeTraverse({ ...EXAMPLE_TRAVERSE, type: 'open', useClosing: true, precision: '' });
  assert.equal(noPrec.ok, false);
  // a closed traverse ignores the switch
  assert.equal(computeTraverse({ ...EXAMPLE_TRAVERSE, useClosing: false }).checked, true);
});
