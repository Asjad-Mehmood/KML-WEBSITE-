// PDF reports (jsPDF + jspdf-autotable). Text is kept to the PDF standard character set.
import { fmt, ratioText, dms, METHODS, LEVEL_METHODS } from './core.js';

const C = { ink: [23, 35, 31], muted: [92, 107, 101], line: [208, 218, 213], accent: [14, 107, 99], band: [232, 241, 238], pass: [36, 120, 72], fail: [179, 38, 30], amber: [183, 121, 31] };

// Helvetica in PDFs has no Σ, √, −, →, ∞, Δ — map them to plain equivalents
export function pdfText(s) {
  return String(s ?? '')
    .replace(/Σ/g, 'Sum ').replace(/[−–]/g, '-').replace(/√/g, 'sqrt').replace(/→/g, '->').replace(/∞/g, 'infinity')
    .replace(/Δ/g, 'd').replace(/×/g, 'x').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

function frame(doc, title, info) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.accent); doc.rect(0, 0, W, 24, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(pdfText(title), 15, 15.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('SurveyX Digital', W - 15, 11, { align: 'right' });
  doc.text(pdfText(info.date ? `Date: ${info.date}` : ''), W - 15, 16.5, { align: 'right' });
  // details block
  const rows = [['Project', info.project], ['Location', info.location], ['Surveyor', info.surveyor], ['Checked by', info.checker], ['Instrument', info.instrument], ['Date', info.date]];
  doc.setTextColor(...C.ink);
  let y = 32; const colW = (W - 30) / 2;
  rows.forEach(([k, v], i) => {
    const x = 15 + (i % 2) * colW, yy = y + Math.floor(i / 2) * 6.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.muted); doc.text(k.toUpperCase(), x, yy);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.ink); doc.text(pdfText(v || '-'), x + 24, yy);
  });
  doc.setDrawColor(...C.line); doc.setLineWidth(0.3); doc.line(15, y + 17, W - 15, y + 17);
  return y + 24;
}

function section(doc, y, text) {
  y = room(doc, y, 18);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...C.accent);
  doc.text(pdfText(text), 15, y);
  return y + 3;
}
function room(doc, y, need) {
  const H = doc.internal.pageSize.getHeight();
  if (y + need > H - 18) { doc.addPage(); return 20; }
  return y;
}
function kv(doc, y, pairs, cols = 2) {
  const W = doc.internal.pageSize.getWidth(), colW = (W - 30) / cols;
  pairs.forEach(([k, v], i) => {
    const x = 15 + (i % cols) * colW, yy = y + 5 + Math.floor(i / cols) * 6.2;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.muted); doc.text(pdfText(k), x, yy);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.ink); doc.text(pdfText(v), x + 40, yy);
  });
  return y + 5 + Math.ceil(pairs.length / cols) * 6.2 + 2;
}
function verdict(doc, y, pass, title, lines) {
  const W = doc.internal.pageSize.getWidth();
  y = room(doc, y, 22);
  const col = pass == null ? C.amber : pass ? C.pass : C.fail;
  const h = 10 + lines.length * 5;
  doc.setFillColor(...C.band); doc.setDrawColor(...col); doc.setLineWidth(0.6);
  doc.roundedRect(15, y, W - 30, h, 2, 2, 'FD');
  doc.setFillColor(...col); doc.roundedRect(15, y, 3, h, 1, 1, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...col); doc.text(pdfText(title), 22, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...C.ink);
  lines.forEach((l, i) => doc.text(pdfText(l), 22, y + 12.5 + i * 5));
  return y + h + 6;
}
function table(doc, y, head, body, opts = {}) {
  doc.autoTable({
    startY: y, head: [head.map(pdfText)], body: body.map(r => r.map(pdfText)), margin: { left: 15, right: 15, bottom: 18 },
    theme: 'grid', styles: { font: 'helvetica', fontSize: 8.6, cellPadding: 1.6, lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
    headStyles: { fillColor: C.accent, textColor: 255, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [246, 249, 248] },
    columnStyles: opts.columnStyles || {}, didParseCell: opts.didParseCell,
  });
  return doc.lastAutoTable.finalY + 7;
}
function signatures(doc, y, info) {
  const W = doc.internal.pageSize.getWidth();
  y = room(doc, y, 30);
  const w = (W - 30 - 10) / 3;
  [['Surveyed by', info.surveyor], ['Checked by', info.checker], ['Approved by', '']].forEach(([k, v], i) => {
    const x = 15 + i * (w + 5);
    doc.setDrawColor(...C.line); doc.setLineWidth(0.3); doc.roundedRect(x, y, w, 24, 1.5, 1.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.muted); doc.text(k.toUpperCase(), x + 3, y + 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...C.ink); doc.text(pdfText(v || ''), x + 3, y + 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.muted); doc.text('Signature / Date', x + 3, y + 21);
  });
  return y + 30;
}
function footers(doc, label) {
  const n = doc.getNumberOfPages(), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.line); doc.setLineWidth(0.3); doc.line(15, H - 12, W - 15, H - 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.muted);
    doc.text(pdfText(label), 15, H - 7.5);
    doc.text(`Page ${i} of ${n}`, W - 15, H - 7.5, { align: 'right' });
  }
}

function sketch(doc, y, r) {
  const W = doc.internal.pageSize.getWidth();
  const h = 82, w = W - 30;
  y = room(doc, y, h + 8);
  doc.setDrawColor(...C.line); doc.setLineWidth(0.3); doc.roundedRect(15, y, w, h, 2, 2);
  const all = r.points.map(p => [p.E, p.N]).concat([[r.backsight.E, r.backsight.N]], (r.sides || []).map(q => [q.E, q.N]));
  const minE = Math.min(...all.map(p => p[0])), maxE = Math.max(...all.map(p => p[0]));
  const minN = Math.min(...all.map(p => p[1])), maxN = Math.max(...all.map(p => p[1]));
  const pad = 14, s = Math.min((w - 2 * pad) / Math.max(maxE - minE, 1e-6), (h - 2 * pad) / Math.max(maxN - minN, 1e-6));
  const ox = 15 + (w - (maxE - minE) * s) / 2, oy = y + (h + (maxN - minN) * s) / 2;
  const X = e => ox + (e - minE) * s, Y = n => oy - (n - minN) * s;
  // reference line to backsight
  doc.setDrawColor(...C.muted); doc.setLineWidth(0.3); doc.setLineDashPattern([1.2, 1.2], 0);
  doc.line(X(r.station.E), Y(r.station.N), X(r.backsight.E), Y(r.backsight.N)); doc.setLineDashPattern([], 0);
  doc.setDrawColor(...C.accent); doc.setLineWidth(0.7);
  for (let i = 1; i < r.points.length; i++) doc.line(X(r.points[i - 1].E), Y(r.points[i - 1].N), X(r.points[i].E), Y(r.points[i].N));
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  const mark = (p, known) => {
    const x = X(p.E), yy = Y(p.N);
    if (known) { doc.setFillColor(...C.fail); doc.triangle(x, yy - 2, x - 1.8, yy + 1.3, x + 1.8, yy + 1.3, 'F'); }
    else { doc.setFillColor(255, 255, 255); doc.setDrawColor(...C.accent); doc.setLineWidth(0.5); doc.circle(x, yy, 1.2, 'FD'); }
    doc.setTextColor(...C.ink); doc.text(pdfText(p.name), x + 2.2, yy - 1.6);
  };
  (r.sides || []).forEach(q => {
    const f = r.points.find(p => p.name === q.from) || r.points[0];
    doc.setDrawColor(...C.amber); doc.setLineWidth(0.2); doc.setLineDashPattern([0.8, 0.8], 0); doc.line(X(f.E), Y(f.N), X(q.E), Y(q.N)); doc.setLineDashPattern([], 0);
    doc.setFillColor(...C.amber); doc.circle(X(q.E), Y(q.N), 0.8, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...C.muted); doc.text(pdfText(q.name), X(q.E) + 1.6, Y(q.N) - 1.2);
  });
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  mark({ name: r.backsight.name + ' (BS)', E: r.backsight.E, N: r.backsight.N }, true);
  r.points.forEach(p => mark(p, p.kind !== 'point'));
  // north arrow
  const nx = 15 + w - 9, ny = y + 8;
  doc.setDrawColor(...C.ink); doc.setLineWidth(0.4); doc.line(nx, ny + 9, nx, ny); doc.line(nx, ny, nx - 1.5, ny + 3); doc.line(nx, ny, nx + 1.5, ny + 3);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('N', nx, ny + 13, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.muted);
  doc.text('Sketch, not to a printed scale. Red triangles: known points. Circles: traverse points (adjusted).', 18, y + h - 3);
  return y + h + 7;
}

const sec1 = v => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(1) + '"';
/** degrees as 123d45'06.7" for the PDF's character set */
const dmsP = (deg, dp = 1) => {
  const t = Math.round(((deg % 360) + 360) % 360 * 3600 * 10 ** dp) / 10 ** dp, d = Math.floor(t / 3600), m = Math.floor((t - d * 3600) / 60), s = t - d * 3600 - m * 60;
  return `${String(d).padStart(3, '0')}°${String(m).padStart(2, '0')}'${s.toFixed(dp).padStart(3 + dp, '0')}"`;
};
function gridRows(r) {
  const sys = r.grid?.sys === 'qng' ? 'Qatar National Grid (QND95), WGS84 latitude and longitude' : 'Local grid (plane coordinates)';
  if (r.input !== 'fieldbook') return [['Coordinate system', sys]];
  const sc = r.fb.scale;
  const how = !sc.auto ? `${fmt(sc.scale, 8)} (typed)` : sc.outside || sc.none ? '1 (the traverse is not in Qatar)'
    : `${fmt(sc.scale, 8)} = point ${fmt(sc.k, 8)} x height ${fmt(sc.ef, 8)} (${fmt(sc.h, 1)} m)`;
  return [['Coordinate system', sys], ['Scale factor', how]];
}

export function traverseReport(jsPDF, r, info) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = frame(doc, 'TRAVERSE ADJUSTMENT REPORT', info);
  const closed = r.checked, isFB = r.input === 'fieldbook', qng = r.grid?.sys === 'qng';
  const hasH = isFB && r.points.some(p => Number.isFinite(p.H));
  let no = 0; const head = t => section(doc, y, `${++no}. ${t}`);
  y = head('Traverse details');
  y = kv(doc, y, [
    ['Traverse type', closed ? (r.type === 'open' ? 'Open (checked on a known closing point)' : 'Closed (checked on a known point)') : 'Open (no closing check)'],
    ['Observations', isFB ? (r.fb.bearings ? `Field book: bearings and distances (${r.fb.fmt === 'dms' ? 'DDD.MMSS' : r.fb.fmt === 'gon' ? 'gons' : 'decimal degrees'})` : `Field book: angles turned ${r.fb.dir === 'ccw' ? 'anticlockwise' : 'clockwise'} from the backsight, and distances`) : 'Site coordinates as measured'],
    ['Adjustment method', closed ? (METHODS[r.method] || (r.method === 'lsq' ? 'Least squares' : r.method)) : 'None (open traverse)'],
    ...gridRows(r),
    ['Station point', `${r.station.name}   E ${fmt(r.station.E)}   N ${fmt(r.station.N)}`],
    ['Backsight point', `${r.backsight.name}   E ${fmt(r.backsight.E)}   N ${fmt(r.backsight.N)}`],
    ['Reference bearing', `${r.station.name} -> ${r.backsight.name}   ${dms(r.refBearing)}   (${fmt(r.refDist)} m)`],
    ...(closed ? [['Closing point', `${r.closing.name}   E ${fmt(r.closing.E)}   N ${fmt(r.closing.N)}`]] : []),
    ...(isFB && r.fb.hasCloseAngle ? [['Closing angle', `${r.fb.closeAngleRaw} at ${r.closing.name}, onto ${r.fb.isLoop ? r.backsight.name : r.fb.ref?.name || 'the closing reference'}`]] : []),
    ['Traverse legs', `${r.nLegs}   (total length ${fmt(r.totalL)} m)`],
  ], 1);
  y = section(doc, y + 2, `${++no}. Closure check`);
  if (closed) {
    const lines = [
      `Misclosure  dE = ${fmt(r.misE * 1000, 1)} mm    dN = ${fmt(r.misN * 1000, 1)} mm    Linear = ${fmt(r.linear * 1000, 1)} mm`,
      `Precision achieved ${ratioText(r.ratio)}    Required 1 : ${Math.round(r.precision).toLocaleString('en-US')}    Total length ${fmt(r.totalL)} m`,
    ];
    if (isFB && r.fb.hasCloseAngle) lines.push(`Angular misclosure ${sec1(r.fb.angMis)} on ${r.fb.nAng} angles    Allowed +/-${r.fb.angAllow.toFixed(1)}" (${r.fb.angK}" x sqrt n)    Correction ${sec1(r.fb.angCorr)} per angle`);
    if (isFB && r.fb.fH != null) lines.push(`Level misclosure ${fmt(r.fb.fH * 1000, 1)} mm    Allowed +/-${fmt(r.fb.hAllow * 1000, 1)} mm`);
    if (isFB && r.fb.lsq && r.fb.lsq.chi) lines.push(`Least squares: s0 ${r.fb.lsq.s0.toFixed(3)}, chi-square ${r.fb.lsq.chi.value.toFixed(2)} (95%: ${r.fb.lsq.chi.lo.toFixed(2)} to ${r.fb.lsq.chi.hi.toFixed(2)})`);
    lines.push(isFB ? 'Misclosure = where the observations arrive - known closing coordinates. Corrections are the opposite sign.' : 'Misclosure = measured closing coordinates - known closing coordinates. Corrections are the opposite sign.');
    const title = r.pass ? (isFB ? 'ACCEPTED - within every tolerance' : 'ACCEPTED - within the required precision') : (isFB ? 'REJECTED - ' + (r.why[0] || 'outside tolerance') : 'REJECTED - outside the required precision');
    y = verdict(doc, y + 2, r.pass, title, lines);
  } else {
    y = verdict(doc, y + 2, null, 'OPEN TRAVERSE - NOT CHECKED', [
      'An open traverse does not close on a known point, so errors cannot be detected or adjusted.',
      isFB ? 'Coordinates below are worked out from the field book as observed.' : 'Coordinates below are exactly as measured on site.',
    ]);
  }
  if (isFB) {
    y = head('Field book (as observed)');
    const ang = r.fb.bearings ? 'Bearing' : 'Angle';
    y = table(doc, y + 1, ['#', 'Kind', ang, 'Distance (m)', ...(hasH ? ['Ht diff (m)'] : []), 'Point', 'Remark'],
      r.fb.obs.map((o, i) => [o.closing ? 'C' : String(i + 1), o.closing ? 'Closing leg' : o.side ? 'Side shot' : 'Point', o.raw.angle, o.raw.dist, ...(hasH ? [o.raw.dh] : []), o.name, o.remark]),
      { columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } } });
  }
  y = head(isFB ? 'Computed coordinates (angles balanced, before the linear adjustment)' : 'Input coordinates (as measured on site)');
  y = table(doc, y + 1, ['Point', 'Easting (m)', 'Northing (m)', 'Remark'],
    r.points.map(p => [p.name, fmt(p.measE), fmt(p.measN), p.kind === 'station' ? 'Station (known)' : p.kind === 'closing' ? (isFB ? 'Closing point as observed' : 'Closing point as measured') : p.remark]),
    { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } } });
  y = head(closed ? 'Output coordinates (adjusted)' : 'Output coordinates');
  y = table(doc, y + 1, ['Point', 'Corr. dE (mm)', 'Corr. dN (mm)', 'Adjusted Easting (m)', 'Adjusted Northing (m)', ...(hasH ? ['Level (m)'] : [])],
    r.points.map(p => [p.name, fmt(p.cE * 1000, 1), fmt(p.cN * 1000, 1), fmt(p.E), fmt(p.N), ...(hasH ? [fmt(p.H)] : [])]),
    { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' }, 4: { halign: 'right', fontStyle: 'bold' }, 5: { halign: 'right' } } });
  y = head('Bearings and distances (from output coordinates)');
  y = table(doc, y + 1, ['From', 'To', 'Bearing (WCB)', 'Distance (m)', ...(isFB ? ['Observed (m)'] : [])],
    r.legs.map(l => [l.from, l.to, dms(l.bearing), fmt(l.dist), ...(isFB ? [fmt(l.obsDist)] : [])]), { columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } } });
  if (isFB && r.fb.angles.length && !r.fb.bearings) {
    y = head('Angles (clockwise from the backsight)');
    y = table(doc, y + 1, ['At', 'Backsight', 'Foresight', 'Observed', 'Correction', 'Adjusted'],
      r.fb.angles.map(a => [a.at, a.bs, a.fs, dmsP(a.obs), sec1(a.corr).replace('.0"', '.0"'), dmsP(a.adj)]), { columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } } });
  }
  if (isFB && r.sides.length) {
    y = head('Side shots (from the adjusted stations)');
    y = table(doc, y + 1, ['Point', 'From', 'Bearing', 'Distance (m)', 'Easting (m)', 'Northing (m)', ...(hasH ? ['Level (m)'] : []), 'Remark'],
      r.sides.map(q => [q.name, q.from, dms(q.bearing), fmt(q.dist), fmt(q.E), fmt(q.N), ...(hasH ? [fmt(q.H)] : []), q.remark]),
      { columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' }, 5: { halign: 'right', fontStyle: 'bold' } } });
  }
  if (isFB && r.fb.lsq) {
    const q = r.fb.lsq;
    y = head(`Least squares (${q.m} observations, ${q.u} unknowns, redundancy ${q.r})`);
    y = table(doc, y + 1, ['Observation', 'At', 'To', 'Residual', 'Standardised'],
      q.obs.map(o => [o.label, o.at, o.to, o.unit === 'm' ? fmt(o.v * 1000, 1) + ' mm' : sec1(o.v), o.std == null ? '-' : o.std.toFixed(2) + (o.flag ? ' check' : '')]),
      { columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } } });
    y = table(doc, y, ['Station', 'sE (mm)', 'sN (mm)', '95% error ellipse'],
      r.points.map((p, i) => (q.stat[i] ? [p.name, fmt(q.stat[i].sE * 1000, 1), fmt(q.stat[i].sN * 1000, 1), `${fmt(q.stat[i].ellA * 1000, 1)} x ${fmt(q.stat[i].ellB * 1000, 1)} mm @ ${q.stat[i].ellAz.toFixed(0)} deg`] : null)).filter(Boolean),
      { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } } });
  }
  if (qng) {
    y = head('Latitude and longitude (WGS84, from the Qatar National Grid)');
    const all = r.points.filter((p, i) => !(i && p.kind === 'closing' && p.name === r.points[0].name)).concat(r.sides || []);
    y = table(doc, y + 1, ['Point', 'Easting (m)', 'Northing (m)', 'Latitude', 'Longitude'],
      all.map(p => [p.name, fmt(p.E), fmt(p.N), fmt(p.lat, 8), fmt(p.lon, 8)]), { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } } });
  }
  y = head('Sketch');
  y = sketch(doc, y + 2, r);
  const notes = (r.gridWarn ? [r.gridWarn] : []).concat(r.warnings);
  if (notes.length) { y = section(doc, y, 'Notes'); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.ink); notes.forEach(w => { y = room(doc, y, 6); doc.text(pdfText('- ' + w), 15, y + 4); y += 5; }); y += 4; }
  signatures(doc, y, info);
  footers(doc, `Traverse adjustment - ${info.project || 'SurveyX Digital'}`);
  return doc;
}

export function levelReport(jsPDF, r, info) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = frame(doc, 'LEVELLING REPORT', info);
  const closed = r.type === 'closed';
  y = section(doc, y, '1. Level run details');
  y = kv(doc, y, [
    ['Run type', closed ? 'Closed (checked on a known benchmark)' : 'Open (no closing check)'],
    ['Reduction method', LEVEL_METHODS[r.method]],
    ['Starting benchmark', `${r.startName}   RL ${fmt(r.startRL)} m`],
    ...(closed ? [['Closing benchmark', `${r.closeName}   RL ${fmt(r.closeRL)} m`]] : []),
    ['Instrument set-ups', String(r.n)],
  ], 1);
  y = section(doc, y + 2, '2. Closure check');
  if (closed) {
    y = verdict(doc, y + 2, r.pass, r.pass ? 'ACCEPTED - within the allowable misclosure' : 'REJECTED - outside the allowable misclosure', [
      `Misclosure = computed RL ${fmt(r.lastRL)} - known RL ${fmt(r.closeRL)} = ${fmt(r.mis * 1000, 1)} mm`,
      `Allowable ${r.allowRule}`,
      `Correction applied equally per set-up: ${fmt(-r.mis * 1000 / r.n, 2)} mm per set-up (cumulative).`,
    ]);
  } else {
    y = verdict(doc, y + 2, null, 'OPEN LEVEL RUN - NOT CHECKED', ['An open run does not close on a known benchmark, so errors cannot be detected or adjusted.', 'Reduced levels below are as computed from the readings.']);
  }
  y = section(doc, y, '3. Arithmetic checks');
  y = table(doc, y + 1, ['Check', 'Left side (m)', 'Right side (m)', 'Result'],
    r.checks.map(c => [c.name, c.isDiff ? 'max diff ' + fmt(c.left, 4) : fmt(c.left, 4), c.isDiff ? '' : fmt(c.right, 4), c.ok ? 'OK' : 'FAIL']),
    { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center', fontStyle: 'bold' } } });
  y = section(doc, y, '4. Level book');
  const rise = r.method === 'rise';
  const head = ['Station', 'BS', 'IS', 'FS', ...(rise ? ['Rise', 'Fall'] : ['HI']), 'RL', ...(closed ? ['Corr. (mm)', 'Adjusted RL'] : []), 'Remark'];
  const body = r.rows.map((x, i) => [x.station, fmt(x.bs), fmt(x.is), fmt(x.fs),
    ...(rise ? [fmt(x.rise), fmt(x.fall)] : [i === 0 ? fmt(x.hi) : x.hiNext != null ? fmt(x.hiNext) : '']),
    fmt(x.rl), ...(closed ? [fmt(x.corr * 1000, 1), fmt(x.adjRL)] : []), x.remark]);
  body.push(['Sum', fmt(r.sumBS), '', fmt(r.sumFS), ...(rise ? [fmt(r.sumRise), fmt(r.sumFall)] : ['']), '', ...(closed ? ['', ''] : []), '']);
  const right = {}; for (let k = 1; k < head.length - 1; k++) right[k] = { halign: 'right' };
  if (closed) right[head.length - 2] = { halign: 'right', fontStyle: 'bold' };
  y = table(doc, y + 1, head, body, { columnStyles: right, didParseCell: d => { if (d.section === 'body' && d.row.index === body.length - 1) d.cell.styles.fontStyle = 'bold'; } });
  if (r.warnings.length) { y = section(doc, y, 'Notes'); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.ink); r.warnings.forEach(w => { y = room(doc, y, 6); doc.text(pdfText('- ' + w), 15, y + 4); y += 5; }); y += 4; }
  signatures(doc, y, info);
  footers(doc, `Levelling - ${info.project || 'SurveyX Digital'}`);
  return doc;
}
