// Traverse simulator — pure calculation, no UI.
// Builds a true traverse, "observes" it with a total station that has realistic random errors,
// and carries the orientation forward by backsighting each previous station, exactly as on site.

export function rng(seed) {            // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = r => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
const rad = d => d * Math.PI / 180;
const brg = (a, b) => (Math.atan2(b.E - a.E, b.N - a.N) * 180 / Math.PI + 360) % 360;
const norm360 = d => ((d % 360) + 360) % 360;
const r3 = v => Math.round(v * 1000) / 1000;

/**
 * params = { stations: 3..12 (new points), leg: metres, angleSec: σ″, distMm: σ mm, distPpm, shape: 'link'|'loop', seed }
 */
export function simulate(params) {
  const p = { stations: 5, leg: 200, angleSec: 2, distMm: 1, distPpm: 1.5, shape: 'link', seed: 1, ...params };
  const n = Math.max(2, Math.min(12, Math.round(p.stations)));
  const R = rng(p.seed);
  const A = { name: 'CP-01', E: r3(228400 + R() * 400), N: r3(441100 + R() * 400) };
  const startBrg = R() * 360;
  const B = { name: 'CP-02', E: r3(A.E + 380 * Math.sin(rad(startBrg + 140))), N: r3(A.N + 380 * Math.cos(rad(startBrg + 140))) };

  // true traverse points (names TP-01..), then closing point
  const truth = [];
  if (p.shape === 'loop') {
    // points around a loose ring that comes back to A
    const radius = p.leg * (n + 1) / (2 * Math.PI);
    const cE = A.E + radius * Math.sin(rad(startBrg)), cN = A.N + radius * Math.cos(rad(startBrg));
    const a0 = brg({ E: cE, N: cN }, A);
    for (let i = 1; i <= n; i++) {
      const a = a0 + (360 * i) / (n + 1) + (R() - 0.5) * (200 / (n + 1));
      const rr = radius * (0.85 + R() * 0.3);
      truth.push({ name: `TP-${String(i).padStart(2, '0')}`, E: r3(cE + rr * Math.sin(rad(a))), N: r3(cN + rr * Math.cos(rad(a))) });
    }
  } else {
    let b = startBrg, cur = A;
    for (let i = 1; i <= n + 1; i++) {
      b = norm360(b + (R() - 0.5) * 70);
      const L = p.leg * (0.8 + R() * 0.4);
      const q = { name: i <= n ? `TP-${String(i).padStart(2, '0')}` : 'CP-03', E: r3(cur.E + L * Math.sin(rad(b))), N: r3(cur.N + L * Math.cos(rad(b))) };
      truth.push(q); cur = q;
    }
  }
  const C = p.shape === 'loop' ? { ...A } : truth.pop();          // closing point (known)
  const chain = [A, ...truth, C];                                 // true positions, station → … → closing

  // observations at every station: clockwise angle back → fore, and horizontal distance to fore
  const obs = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const back = i === 0 ? B : chain[i - 1], st = chain[i], fore = chain[i + 1];
    const trueAng = norm360(brg(st, fore) - brg(st, back));
    const trueD = Math.hypot(fore.E - st.E, fore.N - st.N);
    const angErr = gauss(R) * p.angleSec;                         // seconds
    const dErr = gauss(R) * (p.distMm + p.distPpm * trueD / 1000) / 1000;   // metres
    obs.push({ at: st.name, back: back.name, fore: fore.name, trueAng, angle: norm360(trueAng + angErr / 3600), angErr, trueD, dist: trueD + dErr, dErr });
  }

  // measured coordinates: orientation from the known backsight, then carried forward
  const meas = [{ ...A }];
  let backBrg = brg(A, B);
  for (let i = 0; i < obs.length; i++) {
    const st = meas[i], o = obs[i];
    const fwd = norm360(backBrg + o.angle);
    const q = { name: chain[i + 1].name, E: st.E + o.dist * Math.sin(rad(fwd)), N: st.N + o.dist * Math.cos(rad(fwd)) };
    o.bearing = fwd; meas.push(q);
    backBrg = norm360(fwd + 180);
  }
  const mc = meas[meas.length - 1];
  const misE = mc.E - C.E, misN = mc.N - C.N, linear = Math.hypot(misE, misN);
  const length = obs.reduce((s, o) => s + o.dist, 0);

  // the same data as the Traverse tool takes it (rounded to the millimetre, as a total station records)
  const travInput = {
    type: 'closed', method: 'bowditch', precision: '10000',
    station: { name: A.name, E: A.E.toFixed(3), N: A.N.toFixed(3) },
    backsight: { name: B.name, E: B.E.toFixed(3), N: B.N.toFixed(3) },
    points: meas.slice(1, -1).map(q => ({ name: q.name, E: q.E.toFixed(3), N: q.N.toFixed(3), remark: 'Simulated' })),
    closing: { name: C.name, E: C.E.toFixed(3), N: C.N.toFixed(3), measE: mc.E.toFixed(3), measN: mc.N.toFixed(3) },
  };
  return { params: { ...p, stations: n }, A, B, C, chain, meas, obs, misE, misN, linear, length, ratio: linear > 0 ? length / linear : Infinity, travInput };
}
