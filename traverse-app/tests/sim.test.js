import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../src/simcore.js';
import { computeTraverse } from '../src/core.js';

test('perfect instrument closes exactly (link and loop)', () => {
  for (const shape of ['link', 'loop']) {
    const s = simulate({ shape, stations: 7, angleSec: 0, distMm: 0, distPpm: 0, seed: 42 });
    assert.ok(s.linear < 1e-6, shape + ' ' + s.linear);
    s.chain.forEach((p, i) => assert.ok(Math.hypot(p.E - s.meas[i].E, p.N - s.meas[i].N) < 1e-6));
  }
});
test('same scenario number gives the same traverse; errors grow with worse instruments', () => {
  const a = simulate({ seed: 7 }), b = simulate({ seed: 7 });
  assert.deepEqual(a.travInput, b.travInput);
  let good = 0, bad = 0;
  for (let k = 1; k <= 40; k++) { good += simulate({ seed: k, angleSec: 1, distMm: 1, distPpm: 1 }).linear; bad += simulate({ seed: k, angleSec: 30, distMm: 10, distPpm: 5 }).linear; }
  assert.ok(bad > good * 3, `${bad} vs ${good}`);
});
test('simulator output adjusts in the Traverse tool with the same misclosure', () => {
  for (const shape of ['link', 'loop']) {
    const s = simulate({ shape, seed: 123, stations: 6 });
    const r = computeTraverse(s.travInput);
    assert.ok(r.ok, JSON.stringify(r.errors));
    assert.ok(Math.abs(r.misE - s.misE) < 0.0006 && Math.abs(r.misN - s.misN) < 0.0006, shape);
    assert.equal(r.points.length, s.chain.length);
  }
});
