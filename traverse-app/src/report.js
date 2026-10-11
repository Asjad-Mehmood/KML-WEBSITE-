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
  const all = r.points.map(p => [p.E, p.N]).concat([[r.backsight.E, r.backsight.N]]);
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

export function traverseReport(jsPDF, r, info) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = frame(doc, 'TRAVERSE ADJUSTMENT REPORT', info);
  const closed = r.type === 'closed';
  y = section(doc, y, '1. Traverse details');
  y = kv(doc, y, [
    ['Traverse type', closed ? 'Closed (checked on a known point)' : 'Open (no closing check)'],
    ['Adjustment method', closed ? METHODS[r.method] : 'None (open traverse)'],
    ['Station point', `${r.station.name}   E ${fmt(r.station.E)}   N ${fmt(r.station.N)}`],
    ['Backsight point', `${r.backsight.name}   E ${fmt(r.backsight.E)}   N ${fmt(r.backsight.N)}`],
    ['Reference bearing', `${r.station.name} -> ${r.backsight.name}   ${dms(r.refBearing)}   (${fmt(r.refDist)} m)`],
    ...(closed ? [['Closing point', `${r.closing.name}   E ${fmt(r.closing.E)}   N ${fmt(r.closing.N)}`]] : []),
    ['Traverse legs', `${r.nLegs}   (total length ${fmt(r.totalL)} m)`],
  ], 1);
  y = section(doc, y + 2, '2. Closure check');
  if (closed) {
    y = verdict(doc, y + 2, r.pass, r.pass ? 'ACCEPTED - within the required precision' : 'REJECTED - outside the required precision', [
      `Misclosure  dE = ${fmt(r.misE * 1000, 1)} mm    dN = ${fmt(r.misN * 1000, 1)} mm    Linear = ${fmt(r.linear * 1000, 1)} mm`,
      `Precision achieved ${ratioText(r.ratio)}    Required 1 : ${Math.round(r.precision).toLocaleString('en-US')}    Total length ${fmt(r.totalL)} m`,
      `Misclosure = measured closing coordinates - known closing coordinates. Corrections are the opposite sign.`,
    ]);
  } else {
    y = verdict(doc, y + 2, null, 'OPEN TRAVERSE - NOT CHECKED', [
      'An open traverse does not close on a known point, so errors cannot be detected or adjusted.',
      'Coordinates below are exactly as measured on site.',
    ]);
  }
  y = section(doc, y, '3. Input coordinates (as measured on site)');
  y = table(doc, y + 1, ['Point', 'Easting (m)', 'Northing (m)', 'Remark'],
    r.points.map(p => [p.name, fmt(p.measE), fmt(p.measN), p.kind === 'station' ? 'Station (known)' : p.kind === 'closing' ? 'Closing point as measured' : p.remark]),
    { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } } });
  y = section(doc, y, closed ? '4. Output coordinates (adjusted)' : '4. Output coordinates');
  y = table(doc, y + 1, ['Point', 'Corr. dE (mm)', 'Corr. dN (mm)', 'Adjusted Easting (m)', 'Adjusted Northing (m)'],
    r.points.map(p => [p.name, fmt(p.cE * 1000, 1), fmt(p.cN * 1000, 1), fmt(p.E), fmt(p.N)]),
    { columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' }, 4: { halign: 'right', fontStyle: 'bold' } } });
  y = section(doc, y, '5. Bearings and distances (from output coordinates)');
  y = table(doc, y + 1, ['From', 'To', 'Bearing (WCB)', 'Distance (m)'],
    r.legs.map(l => [l.from, l.to, dms(l.bearing), fmt(l.dist)]), { columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } } });
  y = section(doc, y, '6. Sketch');
  y = sketch(doc, y + 2, r);
  if (r.warnings.length) { y = section(doc, y, 'Notes'); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.ink); r.warnings.forEach(w => { y = room(doc, y, 6); doc.text(pdfText('- ' + w), 15, y + 4); y += 5; }); y += 4; }
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
