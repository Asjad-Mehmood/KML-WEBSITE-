// Traverse and Levelling tools (same calculations and options as SurveyX Traverse & Level),
// now with named jobs that save to the user's dashboard.
import { computeTraverse, computeLevel, fmt, ratioText, dms, num, isBlank, METHODS, LEVEL_METHODS } from './core.js';
import { traverseReport, levelReport } from './report.js';
import { EXAMPLE_TRAVERSE, EXAMPLE_LEVEL } from './example.js';
import { storage } from './backend.js';
import { $, $$, esc, clone, today, slug, toast, saveFile, pickFile, splitTable, tableToRows, toCSV, relTime } from './util.js';

export const blankTrav = () => ({ type: 'closed', method: 'bowditch', precision: '10000', example: false, jobId: null, jobName: '',
  station: { name: '', E: '', N: '' }, backsight: { name: '', E: '', N: '' }, closing: { name: '', E: '', N: '', measE: '', measN: '' },
  points: Array.from({ length: 4 }, () => ({ name: '', E: '', N: '', remark: '' })) });
export const blankLevel = () => ({ type: 'closed', method: 'rise', allow: '', example: false, jobId: null, jobName: '', startName: '', startRL: '', closeName: '', closeRL: '',
  rows: Array.from({ length: 5 }, () => ({ station: '', bs: '', is: '', fs: '', remark: '' })) });
const blankInfo = () => ({ project: '', location: '', surveyor: '', checker: '', instrument: '', date: today() });

let S = null, ctx = null, workKey = '';
const T_COLS = ['name', 'E', 'N', 'remark'], L_COLS = ['station', 'bs', 'is', 'fs', 'remark'];
let lastT = null, lastL = null, saveTimer = 0;
function persist() { clearTimeout(saveTimer); saveTimer = setTimeout(() => storage.set(workKey, S), 250); }
function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] ??= {}), o); t[last] = v; }

// ---------- summaries for the dashboard ----------
export function summarize(kind, data) {
  if (kind === 'traverse') {
    const r = computeTraverse(data.trav);
    if (!r.ok) return { status: 'incomplete', points: (data.trav.points || []).length, project: data.info?.project || '' };
    return { status: r.type === 'open' ? 'open' : r.pass ? 'accepted' : 'rejected', ratio: Number.isFinite(r.ratio) ? Math.round(r.ratio) : null, linear: r.type === 'closed' ? +(r.linear * 1000).toFixed(1) : null, points: r.points.length, length: +r.totalL.toFixed(2), method: r.type === 'closed' ? r.method : null, project: data.info?.project || '' };
  }
  const r = computeLevel(data.level);
  if (!r.ok) return { status: 'incomplete', rows: (data.level.rows || []).length, project: data.info?.project || '' };
  return { status: r.type === 'open' ? 'open' : r.pass ? 'accepted' : 'rejected', mis: r.mis == null ? null : +(r.mis * 1000).toFixed(1), allow: r.allow == null ? null : +r.allow.toFixed(1), setups: r.n, rows: r.rows.length, project: data.info?.project || '' };
}

// ---------- shared rendering helpers ----------
function setSeg(attr, val) { $$(`[${attr}]`).forEach(b => b.setAttribute('aria-checked', String(b.getAttribute(attr) === val))); }
function toggleClosed(panel, closed) { $$(`#${panel} .closed-only`).forEach(e => e.classList.toggle('hide', !closed)); }
function markBadNumbers(panel) { $$(`#${panel} input.num`).forEach(i => i.classList.toggle('bad', !isBlank(i.value) && Number.isNaN(num(i.value)))); }
function statusBox(kind, icon, title, sub, extra = '') { return `<div class="status ${kind}"><div class="ic" aria-hidden="true">${icon}</div><div><h3>${esc(title)}</h3>${sub ? `<p>${sub}</p>` : ''}${extra}</div></div>`; }
function stat(label, value, unit = '', hl = false) { return `<div class="stat${hl ? ' hl' : ''}"><span>${esc(label)}</span><b>${esc(value)}${unit ? ` <small>${esc(unit)}</small>` : ''}</b></div>`; }
function exampleNote(on) { return on ? `<p class="hint example-note">Example data is loaded. Type over it, or press <b>New</b> to start your own job.</p>` : ''; }

// ================= TRAVERSE =================
function renderTGrid() {
  const t = S.trav, tb = $('#t-grid tbody');
  const fixed = (cls, n, name, a, b, tag) => `<tr class="fixed ${cls}"><td class="n">${n}</td><td><span class="nm">${esc(name)}</span></td><td>${a}</td><td>${b}</td><td><span class="tag">${tag}</span></td><td class="x"></td></tr>`;
  let h = fixed('', 'S', t.station.name || 'Station', `<span class="val" data-fix="station.E">${esc(t.station.E)}</span>`, `<span class="val" data-fix="station.N">${esc(t.station.N)}</span>`, 'Station (known)');
  t.points.forEach((p, i) => {
    h += `<tr><td class="n">${i + 1}</td>` + T_COLS.map(k => `<td><input data-grid="t" data-row="${i}" data-col="${k}" id="t-${i}-${k}" class="${k === 'E' || k === 'N' ? 'num' : ''}" ${k === 'E' || k === 'N' ? 'inputmode="decimal"' : ''} value="${esc(p[k])}" placeholder="${k === 'name' ? 'TP-' + String(i + 1).padStart(2, '0') : ''}" autocomplete="off" aria-label="Row ${i + 1} ${k}"></td>`).join('') +
      `<td class="x"><button class="del" data-del="t" data-row="${i}" title="Delete row ${i + 1}" aria-label="Delete row ${i + 1}">×</button></td></tr>`;
  });
  if (t.type === 'closed') h += `<tr class="fixed closing"><td class="n">C</td><td><span class="nm">${esc(t.closing.name || 'Closing point')}</span></td>
      <td><input data-t="closing.measE" id="t-cl-mE" class="num" inputmode="decimal" value="${esc(t.closing.measE)}" placeholder="measured E" aria-label="Closing point measured Easting"></td>
      <td><input data-t="closing.measN" id="t-cl-mN" class="num" inputmode="decimal" value="${esc(t.closing.measN)}" placeholder="measured N" aria-label="Closing point measured Northing"></td>
      <td><span class="tag">Closing point, as measured</span></td><td class="x"></td></tr>`;
  tb.innerHTML = h;
}
function refreshFixed() {
  const t = S.trav, st = $('#t-grid tr.fixed:not(.closing)');
  if (st) { st.querySelector('.nm').textContent = t.station.name || 'Station'; st.querySelector('[data-fix="station.E"]').textContent = t.station.E; st.querySelector('[data-fix="station.N"]').textContent = t.station.N; }
  const cl = $('#t-grid tr.closing .nm'); if (cl) cl.textContent = t.closing.name || 'Closing point';
}
function fillTraverse() {
  const t = S.trav;
  $$('[data-t]').forEach(i => { if (!i.closest('#t-grid')) i.value = getPath(t, i.dataset.t) ?? ''; });
  setSeg('data-ttype', t.type);
  $$('input[name="t-method"]').forEach(r => (r.checked = r.value === t.method));
  toggleClosed('panel-traverse', t.type === 'closed');
  $('#t-jobname').value = t.jobName || '';
  renderTGrid(); jobStatus('t');
}
function sketchSVG(r) {
  const pts = r.points, all = pts.map(p => [p.E, p.N]).concat([[r.backsight.E, r.backsight.N]], pts.map(p => [p.measE, p.measN]));
  const minE = Math.min(...all.map(a => a[0])), maxE = Math.max(...all.map(a => a[0])), minN = Math.min(...all.map(a => a[1])), maxN = Math.max(...all.map(a => a[1]));
  const W = 640, H = 360, pad = 46;
  const s = Math.min((W - 2 * pad) / Math.max(maxE - minE, 1e-6), (H - 2 * pad) / Math.max(maxN - minN, 1e-6));
  const ox = (W - (maxE - minE) * s) / 2, oy = (H + (maxN - minN) * s) / 2;
  const X = e => (ox + (e - minE) * s).toFixed(1), Y = n => (oy - (n - minN) * s).toFixed(1);
  const path = (arr, kE, kN) => arr.map((p, i) => `${i ? 'L' : 'M'}${X(p[kE])} ${Y(p[kN])}`).join(' ');
  let g = `<path class="ref" d="M${X(r.station.E)} ${Y(r.station.N)} L${X(r.backsight.E)} ${Y(r.backsight.N)}"/>`;
  if (r.type === 'closed') g += `<path class="raw" d="${path(pts, 'measE', 'measN')}"/>`;
  g += `<path class="leg" d="${path(pts, 'E', 'N')}"/>`;
  const tri = (x, y) => `<path class="kn" d="M${x} ${y - 7} L${x - 6} ${+y + 5} L${+x + 6} ${+y + 5} Z"/>`;
  g += tri(X(r.backsight.E), Y(r.backsight.N)) + `<text x="${+X(r.backsight.E) + 9}" y="${+Y(r.backsight.N) - 8}">${esc(r.backsight.name)} (BS)</text>`;
  pts.forEach(p => { const x = X(p.E), y = Y(p.N); g += p.kind === 'point' ? `<circle class="pt" cx="${x}" cy="${y}" r="5"/>` : tri(x, y); g += `<text x="${+x + 9}" y="${+y - 8}">${esc(p.name)}</text>`; });
  g += `<path class="na" d="M${W - 24} 46 L${W - 24} 18 M${W - 24} 18 L${W - 29} 28 M${W - 24} 18 L${W - 19} 28"/><text class="nt" x="${W - 28}" y="62">N</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Traverse sketch">${g}</svg>`;
}
function computeT() {
  const t = S.trav, r = computeTraverse(t); lastT = r;
  markBadNumbers('panel-traverse');
  $$('#t-grid input').forEach(i => { if (i.dataset.row != null && r.errors.some(e => e.row === +i.dataset.row && e.col === i.dataset.col)) i.classList.add('bad'); });
  const box = $('#t-result');
  if (!r.ok) { box.innerHTML = exampleNote(t.example) + statusBox('wait', '…', 'Waiting for complete data', 'Fix the items below to see the result.', `<ul class="errs">${r.errors.map(e => `<li>${esc(e.msg)}</li>`).join('')}</ul>`); return; }
  const closed = r.type === 'closed';
  let h = exampleNote(t.example);
  if (closed) h += r.pass
    ? statusBox('pass', '✓', 'Accepted', `Precision ${esc(ratioText(r.ratio))} is better than the required 1 : ${Math.round(r.precision).toLocaleString('en-US')}. Adjusted by ${esc(METHODS[r.method])}.`)
    : statusBox('fail', '!', 'Rejected', `Precision ${esc(ratioText(r.ratio))} is worse than the required 1 : ${Math.round(r.precision).toLocaleString('en-US')}. Check the site coordinates and the closing point before using these results.`);
  else h += statusBox('open', '–', 'Open traverse: not checked', 'There is no closing point, so errors cannot be found. Coordinates are shown as measured.');
  if (closed) h += `<div class="stats">${stat('Misclosure E', fmt(r.misE * 1000, 1), 'mm')}${stat('Misclosure N', fmt(r.misN * 1000, 1), 'mm')}${stat('Linear', fmt(r.linear * 1000, 1), 'mm')}${stat('Precision', ratioText(r.ratio).replace(' (no misclosure)', ''), '', true)}${stat('Length', fmt(r.totalL, 2), 'm')}</div>`;
  else h += `<div class="stats">${stat('Points', String(r.points.length - 1))}${stat('Length', fmt(r.totalL, 2), 'm')}${stat('Start bearing', dms(r.refBearing))}</div>`;
  if (r.warnings.length) h += `<ul class="warns">${r.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>`;
  h += `<div class="out"><h3>Coordinates <small>input (measured) and output (${closed ? 'adjusted' : 'unchanged'}) · metres</small></h3><div class="tw"><table class="res"><thead><tr>
    <th>Point</th><th>Measured E</th><th>Measured N</th>${closed ? '<th>Corr E mm</th><th>Corr N mm</th>' : ''}<th>Output E</th><th>Output N</th></tr></thead><tbody>` +
    r.points.map(p => `<tr class="${p.kind === 'point' ? '' : 'k'}"><td>${esc(p.name)}</td><td>${fmt(p.measE)}</td><td>${fmt(p.measN)}</td>${closed ? `<td>${fmt(p.cE * 1000, 1)}</td><td>${fmt(p.cN * 1000, 1)}</td>` : ''}<td class="strong">${fmt(p.E)}</td><td class="strong">${fmt(p.N)}</td></tr>`).join('') + `</tbody></table></div></div>`;
  h += `<div class="out"><h3>Plan <small>dashed line to backsight · red triangles are known points</small></h3><div class="sketch">${sketchSVG(r)}</div>
    <div class="legend"><span><i></i>${closed ? 'Adjusted' : 'Measured'}</span>${closed ? '<span><i class="r"></i>As measured</span>' : ''}</div></div>`;
  h += `<div class="out"><h3>Bearings and distances <small>from output coordinates</small></h3><div class="tw"><table class="res"><thead><tr><th>From</th><th style="text-align:left">To</th><th>Bearing</th><th>Distance m</th></tr></thead><tbody>` +
    r.legs.map(l => `<tr><td>${esc(l.from)}</td><td class="txt" style="color:inherit;font-weight:600">${esc(l.to)}</td><td>${dms(l.bearing)}</td><td>${fmt(l.dist)}</td></tr>`).join('') + `</tbody></table></div></div>`;
  h += `<div class="exports"><button class="btn big" id="t-pdf">PDF report</button><button class="btn ghost big" id="t-csv">Coordinates CSV</button></div>`;
  box.innerHTML = h;
}

// ================= LEVELLING =================
function renderLGrid() {
  $('#l-grid tbody').innerHTML = S.level.rows.map((p, i) => `<tr><td class="n">${i + 1}</td>` + L_COLS.map(k => {
    const n = ['bs', 'is', 'fs'].includes(k);
    return `<td><input data-grid="l" data-row="${i}" data-col="${k}" id="l-${i}-${k}" class="${n ? 'num' : ''}" ${n ? 'inputmode="decimal"' : ''} value="${esc(p[k])}" autocomplete="off" aria-label="Row ${i + 1} ${k}"></td>`;
  }).join('') + `<td class="x"><button class="del" data-del="l" data-row="${i}" title="Delete row ${i + 1}" aria-label="Delete row ${i + 1}">×</button></td></tr>`).join('');
}
function fillLevel() {
  const l = S.level;
  $$('[data-l]').forEach(i => (i.value = l[i.dataset.l] ?? ''));
  setSeg('data-ltype', l.type);
  $$('input[name="l-method"]').forEach(r => (r.checked = r.value === l.method));
  toggleClosed('panel-level', l.type === 'closed');
  $('#l-jobname').value = l.jobName || '';
  renderLGrid(); jobStatus('l');
}
function computeL() {
  const l = S.level, r = computeLevel(l); lastL = r;
  markBadNumbers('panel-level');
  $$('#l-grid input').forEach(i => { if (r.errors.some(e => e.row === +i.dataset.row && (e.col === i.dataset.col || (!e.col && i.dataset.col !== 'station' && i.dataset.col !== 'remark')))) i.classList.add('bad'); });
  const box = $('#l-result');
  if (!r.ok) { box.innerHTML = exampleNote(l.example) + statusBox('wait', '…', 'Waiting for complete data', 'Fix the items below to see the result.', `<ul class="errs">${r.errors.map(e => `<li>${esc(e.msg)}</li>`).join('')}</ul>`); return; }
  const closed = r.type === 'closed', rise = r.method === 'rise';
  let h = exampleNote(l.example);
  if (closed) h += r.pass
    ? statusBox('pass', '✓', 'Accepted', `Misclosure ${fmt(r.mis * 1000, 1)} mm is within the allowable ${esc(r.allowRule)}. Corrected equally per set-up.`)
    : statusBox('fail', '!', 'Rejected', `Misclosure ${fmt(r.mis * 1000, 1)} mm is more than the allowable ${esc(r.allowRule)}. Re-check the readings or re-level.`);
  else h += statusBox('open', '–', 'Open run: not checked', 'The run does not close on a known benchmark, so errors cannot be found. Reduced levels are shown as computed.');
  h += `<div class="stats">${closed ? stat('Misclosure', fmt(r.mis * 1000, 1), 'mm', true) + stat('Allowable ±', fmt(r.allow, 1), 'mm') : ''}${stat('Set-ups', String(r.n))}${stat('ΣBS', fmt(r.sumBS))}${stat('ΣFS', fmt(r.sumFS))}</div>`;
  if (r.warnings.length) h += `<ul class="warns">${r.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>`;
  h += `<div class="out"><h3>Reduced levels <small>${esc(LEVEL_METHODS[r.method])} · metres</small></h3><div class="tw"><table class="res"><thead><tr>
    <th>Station</th><th>BS</th><th>IS</th><th>FS</th>${rise ? '<th>Rise</th><th>Fall</th>' : '<th>HI</th>'}<th>RL</th>${closed ? '<th>Corr mm</th><th>Adjusted RL</th>' : ''}</tr></thead><tbody>` +
    r.rows.map((x, i) => `<tr class="${i === 0 || (closed && i === r.rows.length - 1) ? 'k' : ''}"><td>${esc(x.station)}</td><td>${fmt(x.bs)}</td><td>${fmt(x.is)}</td><td>${fmt(x.fs)}</td>${rise ? `<td>${fmt(x.rise)}</td><td>${fmt(x.fall)}</td>` : `<td>${i === 0 ? fmt(x.hi) : x.hiNext != null ? fmt(x.hiNext) : ''}</td>`}<td>${fmt(x.rl)}</td>${closed ? `<td>${fmt(x.corr * 1000, 1)}</td><td class="strong">${fmt(x.adjRL)}</td>` : ''}</tr>`).join('') +
    `<tr class="sum"><td>Sum</td><td>${fmt(r.sumBS)}</td><td></td><td>${fmt(r.sumFS)}</td>${rise ? `<td>${fmt(r.sumRise)}</td><td>${fmt(r.sumFall)}</td>` : '<td></td>'}<td></td>${closed ? '<td></td><td></td>' : ''}</tr></tbody></table></div></div>`;
  h += `<div class="out"><h3>Arithmetic checks</h3><div class="tw"><table class="res"><thead><tr><th>Check</th><th>Left</th><th>Right</th><th>Result</th></tr></thead><tbody>` +
    r.checks.map(c => `<tr><td>${esc(c.name)}</td><td>${fmt(c.left, 4)}</td><td>${c.isDiff ? '' : fmt(c.right, 4)}</td><td class="${c.ok ? 'ok' : 'no'}">${c.ok ? 'OK' : 'FAIL'}</td></tr>`).join('') + `</tbody></table></div></div>`;
  h += `<div class="exports"><button class="btn big" id="l-pdf">PDF report</button><button class="btn ghost big" id="l-csv">Levels CSV</button></div>`;
  box.innerHTML = h;
}

// ================= jobs =================
function jobStatus(which) {
  const o = which === 't' ? S.trav : S.level, el = $(`#${which}-jobstate`);
  if (!el) return;
  if (!o.jobId) { el.textContent = 'Not saved yet'; el.className = 'jobstate'; return; }
  const j = ctx.store().get(o.jobId);
  if (!j) { el.textContent = 'Not saved yet'; el.className = 'jobstate'; return; }
  el.textContent = o.dirty ? 'Unsaved changes' : j.dirty ? `Saved on this device ${relTime(j.updated_at)} · will upload when online` : `Saved ${relTime(j.updated_at)}`;
  el.className = 'jobstate ' + (o.dirty ? 'warn' : 'ok');
}
function saveJob(which, asNew = false) {
  const o = which === 't' ? S.trav : S.level, kind = which === 't' ? 'traverse' : 'level';
  const nameEl = $(`#${which}-jobname`);
  let name = (nameEl.value || '').trim();
  if (!name) { name = (S.info.project ? S.info.project + ' – ' : '') + (kind === 'traverse' ? 'Traverse' : 'Level run') + ' ' + today(); nameEl.value = name; }
  if (asNew && o.jobId && name === o.jobName) { name += ' (copy)'; nameEl.value = name; }
  const payload = { info: clone(S.info), [which === 't' ? 'trav' : 'level']: (() => { const c = clone(o); delete c.jobId; delete c.jobName; delete c.dirty; delete c.example; return c; })() };
  const j = ctx.store().save({ id: asNew ? null : o.jobId, kind, name, data: payload, summary: summarize(kind, payload) });
  o.jobId = j.id; o.jobName = name; o.dirty = false; o.example = false; persist(); jobStatus(which);
  toast(asNew ? `Saved as a new job: ${name}` : `Saved: ${name}`);
  ctx.onSaved && ctx.onSaved();
}
/** Open a saved or shared job in the right tool. copy = true opens a copy (shared jobs). */
export function openJob(job, copy = false) {
  const which = job.kind === 'traverse' ? 't' : 'l';
  const d = clone(job.data || {});
  S.info = { ...blankInfo(), ...(d.info || {}) };
  if (which === 't') { S.trav = { ...blankTrav(), ...(d.trav || {}), jobId: copy ? null : job.id, jobName: copy ? `${job.name} (copy)` : job.name, example: false, dirty: copy }; }
  else { S.level = { ...blankLevel(), ...(d.level || {}), jobId: copy ? null : job.id, jobName: copy ? `${job.name} (copy)` : job.name, example: false, dirty: copy }; }
  persist(); fillInfo(); which === 't' ? (fillTraverse(), computeT()) : (fillLevel(), computeL());
  return which === 't' ? 'traverse' : 'level';
}
/** Load simulator output into the Traverse tool as a new unsaved job. */
export function loadTraverseData(trav, name) {
  S.trav = { ...blankTrav(), ...clone(trav), jobId: null, jobName: name, example: false, dirty: true };
  persist(); fillTraverse(); computeT();
}
export function newJob(kind) {
  if (kind === 'traverse') { S.trav = blankTrav(); fillTraverse(); computeT(); } else { S.level = blankLevel(); fillLevel(); computeL(); }
  persist();
}

// ================= events =================
function touched(which) { const o = which === 't' ? S.trav : S.level; o.example = false; if (o.jobId) o.dirty = true; persist(); jobStatus(which); }
function fillInfo() { $$('[data-info]').forEach(i => (i.value = S.info[i.dataset.info] ?? '')); infoSummary(); }
function infoSummary() { const i = S.info; const el = $('#details-summary'); if (el) el.textContent = [i.project, i.location, i.surveyor, i.date].filter(Boolean).join(' · ') || 'Project, surveyor, instrument and date for the report'; }
function onGridInput(inp) {
  const which = inp.dataset.grid, arr = which === 't' ? S.trav.points : S.level.rows;
  arr[+inp.dataset.row][inp.dataset.col] = inp.value; touched(which); inp.classList.remove('bad');
  which === 't' ? computeT() : computeL();
}
function pasteInto(inp, text) {
  const which = inp.dataset.grid, cols = which === 't' ? T_COLS : L_COLS, numeric = which === 't' ? ['E', 'N'] : ['bs', 'is', 'fs'];
  const cells = splitTable(text); if (!cells.length) return false;
  const startCol = cols.indexOf(inp.dataset.col);
  const rows = startCol === 0 ? tableToRows(cells, cols, numeric) : cells.map(r => { const o = {}; r.forEach((v, i) => { if (cols[startCol + i]) o[cols[startCol + i]] = v; }); return o; });
  const arr = which === 't' ? S.trav.points : S.level.rows;
  const blank = which === 't' ? () => ({ name: '', E: '', N: '', remark: '' }) : () => ({ station: '', bs: '', is: '', fs: '', remark: '' });
  const r0 = +inp.dataset.row;
  rows.forEach((o, k) => { const i = r0 + k; while (arr.length <= i) arr.push(blank()); Object.keys(o).forEach(key => { if (key in arr[i]) arr[i][key] = o[key]; }); });
  touched(which);
  which === 't' ? (renderTGrid(), computeT()) : (renderLGrid(), computeL());
  toast(`Pasted ${rows.length} row${rows.length === 1 ? '' : 's'}.`); return true;
}
async function importCSV(which) {
  const f = await pickFile('.csv,.txt,text/csv,text/plain'); if (!f) return;
  const cols = which === 't' ? T_COLS : L_COLS, numeric = which === 't' ? ['E', 'N'] : ['bs', 'is', 'fs'];
  const rows = tableToRows(splitTable(f.text), cols, numeric).filter(o => cols.some(k => !isBlank(o[k])));
  if (!rows.length) { toast('No rows found in that file.'); return; }
  if (which === 't') { S.trav.points = rows; touched('t'); renderTGrid(); computeT(); } else { S.level.rows = rows; touched('l'); renderLGrid(); computeL(); }
  toast(`Imported ${rows.length} rows from ${f.name}.`);
  log({ action: 'file_upload', title: `Imported ${f.name} into ${which === 't' ? 'a traverse' : 'a level book'}`, fileName: f.name, pointsCount: rows.length, details: jobLabel(which) });
}
// ---------- activity: what the user did, for the website's activity log ----------
const log = e => { try { ctx && ctx.log && ctx.log(e); } catch (err) { /* never in the way */ } };
const jobLabel = which => { const o = which === 't' ? S.trav : S.level; return o.jobName || S.info.project || (which === 't' ? 'unsaved traverse' : 'unsaved level run'); };
const kb = n => (n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(2) + ' MB');
const resultLine = (which, r) => which === 't'
  ? (r.type === 'open' ? 'Open traverse' : `${r.pass ? 'Accepted' : 'Rejected'} · ${ratioText(r.ratio)} · ${METHODS[r.method] || r.method}`)
  : (r.type === 'open' ? 'Open run' : `${r.pass ? 'Accepted' : 'Rejected'} · misclosure ${fmt(r.mis * 1000, 1)} mm`);
const fileBase = (kind, o) => [kind, slug(o.jobName || S.info.project), S.info.date || today()].filter(Boolean).join('-');
async function exportPDF(which) {
  if (!window.jspdf || !window.jspdf.jsPDF) { toast('The PDF component is still loading. Try again in a moment.'); return; }
  try {
    const r = which === 't' ? lastT : lastL; if (!r || !r.ok) { toast('Complete the data first.'); return; }
    const doc = which === 't' ? traverseReport(window.jspdf.jsPDF, r, S.info) : levelReport(window.jspdf.jsPDF, r, S.info);
    const name = fileBase(which === 't' ? 'traverse-report' : 'level-report', which === 't' ? S.trav : S.level) + '.pdf', blob = doc.output('blob');
    await saveFile(name, blob);
    log({ action: 'export', title: `${which === 't' ? 'Traverse' : 'Levelling'} PDF report: ${jobLabel(which)}`, fileName: name, fileSize: kb(blob.size), exportFormat: 'PDF', pointsCount: which === 't' ? r.points.length : r.rows.length, details: resultLine(which, r) });
  } catch (e) { console.error(e); toast('Could not make the PDF: ' + e.message); }
}
async function exportCSV(which) {
  const r = which === 't' ? lastT : lastL; if (!r || !r.ok) { toast('Complete the data first.'); return; }
  const rows = which === 't'
    ? [['Point', 'Measured E', 'Measured N', 'Corr dE (mm)', 'Corr dN (mm)', 'Output E', 'Output N', 'Remark'], ...r.points.map(p => [p.name, fmt(p.measE), fmt(p.measN), fmt(p.cE * 1000, 1), fmt(p.cN * 1000, 1), fmt(p.E), fmt(p.N), p.remark])]
    : [['Station', 'BS', 'IS', 'FS', 'Rise', 'Fall', 'RL', 'Corr (mm)', 'Adjusted RL', 'Remark'], ...r.rows.map(x => [x.station, fmt(x.bs), fmt(x.is), fmt(x.fs), fmt(x.rise), fmt(x.fall), fmt(x.rl), fmt(x.corr * 1000, 1), fmt(x.adjRL), x.remark])];
  const name = fileBase(which === 't' ? 'traverse-coordinates' : 'level-book', which === 't' ? S.trav : S.level) + '.csv';
  await saveFile(name, toCSV(rows));
  log({ action: 'export', title: `${which === 't' ? 'Coordinates' : 'Levels'} CSV: ${jobLabel(which)}`, fileName: name, exportFormat: 'CSV', pointsCount: rows.length - 1, details: resultLine(which, r) });
}
function addRow(which, silent) {
  if (which === 't') { S.trav.points.push({ name: '', E: '', N: '', remark: '' }); if (!silent) { renderTGrid(); computeT(); } }
  else { S.level.rows.push({ station: '', bs: '', is: '', fs: '', remark: '' }); if (!silent) { renderLGrid(); computeL(); } }
  persist();
}
let confirmFor = null;
function askNew(which) { confirmFor = which; $(`#${which}-confirm`).hidden = false; $(`#${which}-confirm-no`).focus(); }

function bind() {
  $$('[data-info]').forEach(i => i.addEventListener('input', () => { S.info[i.dataset.info] = i.value; infoSummary(); if (S.trav.jobId) touched('t'); if (S.level.jobId) touched('l'); persist(); }));
  ['t', 'l'].forEach(w => $(`#${w}-jobname`).addEventListener('input', e => { (w === 't' ? S.trav : S.level).jobName = e.target.value; touched(w); }));
  document.addEventListener('input', e => {
    const i = e.target; if (!i.closest || !i.closest('.panel')) return;
    if (i.dataset.grid) return onGridInput(i);
    if (i.dataset.t) { setPath(S.trav, i.dataset.t, i.value); touched('t'); if (/^(station|closing\.name)/.test(i.dataset.t)) refreshFixed(); computeT(); return; }
    if (i.dataset.l) { S.level[i.dataset.l] = i.value; touched('l'); computeL(); }
  });
  document.addEventListener('change', e => {
    const i = e.target;
    if (i.name === 't-method') { S.trav.method = i.value; touched('t'); computeT(); }
    if (i.name === 'l-method') { S.level.method = i.value; touched('l'); computeL(); }
  });
  document.addEventListener('paste', e => {
    const i = e.target; if (!i.dataset || !i.dataset.grid) return;
    const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
    if (/[\t\n]/.test(text.replace(/\r?\n$/, '')) && pasteInto(i, text)) e.preventDefault();
  });
  document.addEventListener('keydown', e => {
    const i = e.target; if (!i.dataset || !i.dataset.grid || e.key !== 'Enter') return;
    e.preventDefault();
    const which = i.dataset.grid, row = +i.dataset.row, arr = which === 't' ? S.trav.points : S.level.rows;
    if (row === arr.length - 1) addRow(which);
    document.getElementById(`${which}-${row + 1}-${i.dataset.col}`)?.focus();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !b.closest('.panel')) return;
    if (b.dataset.del) {
      const which = b.dataset.del, arr = which === 't' ? S.trav.points : S.level.rows;
      arr.splice(+b.dataset.row, 1); if (!arr.length) addRow(which, true);
      touched(which); which === 't' ? (renderTGrid(), computeT()) : (renderLGrid(), computeL()); return;
    }
    if (b.dataset.ttype) { S.trav.type = b.dataset.ttype; touched('t'); fillTraverse(); computeT(); return; }
    if (b.dataset.ltype) { S.level.type = b.dataset.ltype; touched('l'); fillLevel(); computeL(); return; }
    switch (b.id) {
      case 't-add': addRow('t'); document.getElementById(`t-${S.trav.points.length - 1}-name`)?.focus(); break;
      case 'l-add': addRow('l'); document.getElementById(`l-${S.level.rows.length - 1}-station`)?.focus(); break;
      case 't-import': importCSV('t'); break;
      case 'l-import': importCSV('l'); break;
      case 't-same': Object.assign(S.trav.closing, { name: S.trav.station.name, E: S.trav.station.E, N: S.trav.station.N }); touched('t'); fillTraverse(); computeT(); toast('Closing point set to the station point.'); break;
      case 'l-same': Object.assign(S.level, { closeName: S.level.startName, closeRL: S.level.startRL }); touched('l'); fillLevel(); computeL(); toast('Closing BM set to the start BM.'); break;
      case 't-pdf': exportPDF('t'); break;
      case 'l-pdf': exportPDF('l'); break;
      case 't-csv': exportCSV('t'); break;
      case 'l-csv': exportCSV('l'); break;
      case 't-save': saveJob('t'); break;
      case 'l-save': saveJob('l'); break;
      case 't-saveas': saveJob('t', true); break;
      case 'l-saveas': saveJob('l', true); break;
      case 't-example': S.trav = { ...blankTrav(), ...clone(EXAMPLE_TRAVERSE), example: true, jobName: 'Example traverse' }; fillTraverse(); computeT(); persist(); toast('Example loaded.'); break;
      case 'l-example': S.level = { ...blankLevel(), ...clone(EXAMPLE_LEVEL), example: true, jobName: 'Example level run' }; fillLevel(); computeL(); persist(); toast('Example loaded.'); break;
      case 't-new': askNew('t'); break;
      case 'l-new': askNew('l'); break;
      case 't-confirm-no': case 'l-confirm-no': $(`#${confirmFor}-confirm`).hidden = true; break;
      case 't-confirm-yes': case 'l-confirm-yes': $(`#${confirmFor}-confirm`).hidden = true; newJob(confirmFor === 't' ? 'traverse' : 'level'); toast('New job started.'); break;
    }
  });
}

let bound = false;
/** Called after login. Loads this user's working state. c = { store: () => JobStore, onSaved } */
export function initTools(user, c) {
  ctx = c; workKey = `sx.work.${user.id}`;
  const saved = storage.get(workKey);
  S = saved && saved.trav && saved.level ? saved : { info: blankInfo(), trav: { ...blankTrav(), ...clone(EXAMPLE_TRAVERSE), example: true, jobName: 'Example traverse' }, level: { ...blankLevel(), ...clone(EXAMPLE_LEVEL), example: true, jobName: 'Example level run' } };
  S.info = { ...blankInfo(), ...S.info };
  if (!S.info.surveyor && user.name) S.info.surveyor = user.name;
  if (!bound) { bind(); bound = true; }
  fillInfo(); fillTraverse(); fillLevel(); computeT(); computeL();
}
export function refreshJobStates() { if (S) { jobStatus('t'); jobStatus('l'); } }
export function recompute(tab) { if (!S) return; tab === 'level' ? computeL() : computeT(); }
