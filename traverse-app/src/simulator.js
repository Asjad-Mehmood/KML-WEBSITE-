// Traverse simulator — animated total-station traverse with realistic random errors.
import { simulate } from './simcore.js';
import { dms, fmt, ratioText } from './core.js';
import { $, esc, toast } from './util.js';

let sim = null, step = 0, phase = 0, t0 = 0, playing = false, raf = 0, speed = 1, onSend = null;
const PH = [700, 650, 800, 350];   // move, backsight, foresight, record (ms)
const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function params() {
  const [mm, ppm] = $('#sim-dist').value.split(',').map(Number);
  return { shape: $('#sim-shape').value, stations: +$('#sim-n').value, leg: Math.max(30, Math.min(1000, +$('#sim-leg').value || 200)), angleSec: +$('#sim-ang').value, distMm: mm, distPpm: ppm, seed: Math.max(1, Math.floor(+$('#sim-seed').value || 1)) };
}

let view = null;
function frame(s) {
  const pts = [s.B, ...s.chain, ...s.meas];
  const minE = Math.min(...pts.map(p => p.E)), maxE = Math.max(...pts.map(p => p.E)), minN = Math.min(...pts.map(p => p.N)), maxN = Math.max(...pts.map(p => p.N));
  const W = 900, H = 560, pad = 70, sc = Math.min((W - 2 * pad) / (maxE - minE || 1), (H - 2 * pad) / (maxN - minN || 1));
  const ox = (W - (maxE - minE) * sc) / 2, oy = (H + (maxN - minN) * sc) / 2;
  view = { W, H, X: e => ox + (e - minE) * sc, Y: n => oy - (n - minN) * sc, sc };
}
function contours(seed, W, H) {
  // soft terrain lines for atmosphere (decorative)
  let d = '';
  for (let k = 0; k < 9; k++) {
    const cy = H * (0.1 + k * 0.11), amp = 18 + ((seed * (k + 3)) % 23), ph = (seed % 97) / 10 + k;
    d += `M -20 ${cy.toFixed(1)} `;
    for (let x = 0; x <= W + 40; x += 40) d += `Q ${x + 20} ${(cy + amp * Math.sin(x / 140 + ph)).toFixed(1)} ${x + 40} ${(cy + amp * 0.6 * Math.sin((x + 40) / 120 + ph)).toFixed(1)} `;
  }
  return `<path class="contour" d="${d}"/>`;
}
const instrument = `<g class="ts" aria-hidden="true"><path class="ts-leg" d="M0 4 L-14 34 M0 4 L14 34 M0 4 L0 36"/><rect class="ts-body" x="-9" y="-16" width="18" height="18" rx="3"/><rect class="ts-scope" x="-3" y="-25" width="6" height="12" rx="2"/><circle class="ts-eye" cx="0" cy="-7" r="3"/></g>`;

function drawStatic() {
  const s = sim, { W, H, X, Y } = view;
  const tri = (p, cls, label) => `<g class="${cls}"><path d="M${X(p.E)} ${Y(p.N) - 10} L${X(p.E) - 9} ${Y(p.N) + 7} L${X(p.E) + 9} ${Y(p.N) + 7} Z"/><text x="${X(p.E) + 13}" y="${Y(p.N) - 10}">${esc(label)}</text></g>`;
  const truePath = s.chain.map((p, i) => `${i ? 'L' : 'M'}${X(p.E).toFixed(1)} ${Y(p.N).toFixed(1)}`).join(' ');
  $('#sim-stage').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Traverse simulation">
    <defs><radialGradient id="glow"><stop offset="0" stop-color="var(--gold)" stop-opacity=".55"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/></radialGradient></defs>
    <g class="grid">${Array.from({ length: 19 }, (_, i) => `<path d="M${i * 50} 0 V${H}"/>`).join('')}${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 50} H${W}"/>`).join('')}</g>
    ${contours(s.params.seed, W, H)}
    <path class="true-path" d="${truePath}" ${$('#sim-true').checked ? '' : 'hidden'}/>
    <path class="bs-line" d="M${X(s.A.E)} ${Y(s.A.N)} L${X(s.B.E)} ${Y(s.B.N)}"/>
    <path id="sim-meas" class="meas-path" d=""/>
    <g id="sim-pts"></g>
    ${tri(s.B, 'known', s.B.name + ' (BS)')}${tri(s.A, 'known', s.A.name)}${s.params.shape === 'link' ? tri(s.C, 'known', s.C.name) : ''}
    <path id="sim-back" class="sight back" d=""/><path id="sim-beam" class="sight beam" d=""/>
    <circle id="sim-glow" r="26" fill="url(#glow)" cx="-99" cy="-99"/>
    <g id="sim-prism" class="prism" transform="translate(-99 -99)"><path d="M0 -9 L8 5 L-8 5 Z"/><path d="M0 5 V18"/></g>
    <g id="sim-ts" transform="translate(${X(s.A.E)} ${Y(s.A.N)})">${instrument}</g>
    <g class="north"><path d="M${W - 34} 58 V22 M${W - 34} 22 l-7 12 M${W - 34} 22 l7 12"/><text x="${W - 39}" y="76">N</text></g>
  </svg>`;
}
function setLog() {
  const rows = sim.obs.slice(0, step).map((o, i) => `<tr><td>${esc(o.at)}</td><td>${esc(o.back)}</td><td>${esc(o.fore)}</td><td>${dms(o.angle, 1)}</td><td class="${Math.abs(o.angErr) > 2 * sim.params.angleSec ? 'warn' : ''}">${fmt(o.angErr, 1)}</td><td>${fmt(o.dist)}</td><td>${fmt(o.dErr * 1000, 1)}</td><td>${fmt(sim.meas[i + 1].E)}</td><td>${fmt(sim.meas[i + 1].N)}</td></tr>`).join('');
  $('#sim-log tbody').innerHTML = rows || `<tr><td colspan="9" class="empty">Press <b>Run</b> to start observing.</td></tr>`;
}
function readout(o, i) {
  $('#sim-read').innerHTML = o ? `
    <div><span>Station</span><b>${esc(o.at)}</b></div><div><span>Backsight</span><b>${esc(o.back)}</b></div><div><span>Foresight</span><b>${esc(o.fore)}</b></div>
    <div><span>Horizontal angle</span><b>${dms(o.angle, 1)}</b></div><div><span>Horizontal distance</span><b>${fmt(o.dist)} m</b></div><div><span>Bearing carried</span><b>${dms(o.bearing)}</b></div>
    <div class="wide"><span>Measured ${esc(o.fore)}</span><b>E ${fmt(sim.meas[i + 1].E)} · N ${fmt(sim.meas[i + 1].N)}</b></div>`
    : `<div class="wide"><span>Ready</span><b>${sim.obs.length} set-ups · ${sim.params.shape === 'loop' ? 'loop back to ' + sim.A.name : 'link ' + sim.A.name + ' → ' + sim.C.name}</b></div>`;
  $('#sim-progress').style.width = `${(100 * Math.min(step, sim.obs.length)) / sim.obs.length}%`;
  $('#sim-step').textContent = `${Math.min(step, sim.obs.length)} / ${sim.obs.length}`;
}
function measuredUpTo(k) {
  const { X, Y } = view;
  $('#sim-meas').setAttribute('d', sim.meas.slice(0, k + 1).map((p, i) => `${i ? 'L' : 'M'}${X(p.E).toFixed(1)} ${Y(p.N).toFixed(1)}`).join(' '));
  const lastIdx = sim.meas.length - 1;
  $('#sim-pts').innerHTML = sim.meas.slice(1, k + 1).map((p, i) => `<g class="mp${i + 1 === k ? ' new' : ''}"><circle cx="${X(p.E).toFixed(1)}" cy="${Y(p.N).toFixed(1)}" r="6"/>${i + 1 === lastIdx ? '' : `<text x="${(X(p.E) + 11).toFixed(1)}" y="${(Y(p.N) + 18).toFixed(1)}">${esc(p.name)}</text>`}</g>`).join('');
}
function summary() {
  const s = sim, ok = s.ratio >= 10000;
  $('#sim-summary').innerHTML = `<div class="status ${ok ? 'pass' : 'fail'}"><div class="ic">${ok ? '✓' : '!'}</div><div><h3>${ok ? 'Closes within 1 : 10,000' : 'Outside 1 : 10,000'}</h3>
    <p>Misclosure E ${fmt(s.misE * 1000, 1)} mm · N ${fmt(s.misN * 1000, 1)} mm · linear ${fmt(s.linear * 1000, 1)} mm over ${fmt(s.length, 1)} m · precision ${esc(ratioText(s.ratio))}</p></div></div>
    <div class="sim-actions"><button class="btn big" id="sim-send">Adjust in Traverse tool</button><button class="btn ghost big" id="sim-again">Run a new traverse</button></div>`;
  $('#sim-summary').hidden = false;
}
function tick(now) {
  if (!playing) return;
  const s = sim, { X, Y } = view;
  if (step >= s.obs.length) { finish(); return; }
  const dur = PH[phase] / speed, k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const o = s.obs[step], st = s.meas[step], fore = s.meas[step + 1], back = step === 0 ? s.B : s.meas[step - 1];
  const ts = $('#sim-ts');
  if (phase === 0) {
    const from = step === 0 ? st : s.meas[step - 1] && step > 0 ? s.meas[step - 1] : st;
    const x = X(from.E) + (X(st.E) - X(from.E)) * e, y = Y(from.N) + (Y(st.N) - Y(from.N)) * e;
    ts.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    $('#sim-back').setAttribute('d', ''); $('#sim-beam').setAttribute('d', '');
    $('#sim-prism').setAttribute('transform', 'translate(-99 -99)');
    if (k === 1) readout(o, step);
  } else if (phase === 1) {
    $('#sim-back').setAttribute('d', `M${X(st.E)} ${Y(st.N)} L${(X(st.E) + (X(back.E) - X(st.E)) * e).toFixed(1)} ${(Y(st.N) + (Y(back.N) - Y(st.N)) * e).toFixed(1)}`);
  } else if (phase === 2) {
    $('#sim-prism').setAttribute('transform', `translate(${X(fore.E).toFixed(1)} ${Y(fore.N).toFixed(1)})`);
    $('#sim-beam').setAttribute('d', `M${X(st.E)} ${Y(st.N)} L${(X(st.E) + (X(fore.E) - X(st.E)) * e).toFixed(1)} ${(Y(st.N) + (Y(fore.N) - Y(st.N)) * e).toFixed(1)}`);
    $('#sim-glow').setAttribute('cx', X(st.E)); $('#sim-glow').setAttribute('cy', Y(st.N));
  } else if (phase === 3 && k === 1) {
    step++; measuredUpTo(step); setLog(); readout(o, step - 1);
    $('#sim-glow').setAttribute('cx', -99);
  }
  if (k === 1) { phase = (phase + 1) % 4; t0 = now; }
  raf = requestAnimationFrame(tick);
}
function finish() {
  playing = false; cancelAnimationFrame(raf);
  $('#sim-run').textContent = 'Run';
  $('#sim-back').setAttribute('d', ''); $('#sim-beam').setAttribute('d', ''); $('#sim-prism').setAttribute('transform', 'translate(-99 -99)');
  const last = sim.meas[sim.meas.length - 1]; $('#sim-ts').setAttribute('transform', `translate(${view.X(last.E)} ${view.Y(last.N)})`);
  measuredUpTo(sim.meas.length - 1); setLog(); readout(sim.obs[sim.obs.length - 1], sim.obs.length - 1); summary();
}
function reset() {
  playing = false; cancelAnimationFrame(raf); step = 0; phase = 0;
  sim = simulate(params()); frame(sim); drawStatic(); setLog(); readout(null);
  $('#sim-summary').hidden = true; $('#sim-run').textContent = 'Run';
}
function run() {
  if (playing) { playing = false; cancelAnimationFrame(raf); $('#sim-run').textContent = 'Resume'; return; }
  if (step >= sim.obs.length) reset();
  if (reduce()) { step = sim.obs.length; finish(); return; }
  playing = true; $('#sim-run').textContent = 'Pause'; t0 = performance.now(); raf = requestAnimationFrame(tick);
}
export function stopSim() { if (playing) { playing = false; cancelAnimationFrame(raf); $('#sim-run').textContent = 'Resume'; } }

let bound = false;
export function initSimulator(send) {
  onSend = send;
  if (!bound) {
    bound = true;
    ['#sim-shape', '#sim-n', '#sim-leg', '#sim-ang', '#sim-dist', '#sim-seed'].forEach(id => $(id).addEventListener('change', reset));
    $('#sim-n').addEventListener('input', () => { $('#sim-n-val').textContent = $('#sim-n').value; });
    $('#sim-true').addEventListener('change', () => { const p = $('#sim-stage .true-path'); if (p) p.hidden = !$('#sim-true').checked; });
    $('#sim-speed').addEventListener('change', e => { speed = +e.target.value; });
    $('#sim-dice').addEventListener('click', () => { $('#sim-seed').value = 1 + Math.floor(Math.random() * 99999); reset(); });
    $('#sim-run').addEventListener('click', run);
    $('#sim-reset').addEventListener('click', reset);
    document.addEventListener('click', e => {
      if (e.target.id === 'sim-send') { onSend && onSend(sim.travInput, `Simulated traverse #${sim.params.seed}`); }
      if (e.target.id === 'sim-again') { $('#sim-seed').value = 1 + Math.floor(Math.random() * 99999); reset(); run(); }
    });
    $('#sim-n-val').textContent = $('#sim-n').value;
    reset();
  }
}
export const _test = { get sim() { return sim; } };
void toast;
