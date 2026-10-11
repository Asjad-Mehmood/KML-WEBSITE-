import { num, isBlank } from './core.js';

export const $ = s => document.querySelector(s);
export const $$ = s => Array.from(document.querySelectorAll(s));
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const clone = o => JSON.parse(JSON.stringify(o));
export const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

let toastTimer = 0;
export function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3400); }

export function relTime(iso) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export async function saveFile(filename, data) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  toast(`Saved ${filename}`);
}
export function pickFile(accept) {
  return new Promise(res => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.hidden = true;
    inp.onchange = async () => { const f = inp.files[0]; inp.remove(); res(f ? { name: f.name, text: await f.text() } : null); };
    document.body.appendChild(inp); inp.click();
  });
}

export function splitTable(text) {
  const lines = String(text).replace(/\r/g, '').split('\n').filter(l => l.trim() && !/^\s*(#|\/\/)/.test(l));
  if (!lines.length) return [];
  const delim = lines.some(l => l.includes('\t')) ? '\t' : (lines[0].split(';').length > lines[0].split(',').length ? ';' : ',');
  return lines.map(l => {
    if (delim !== ',') return l.split(delim).map(c => c.trim());
    const out = []; let cur = '', q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    out.push(cur.trim()); return out;
  });
}
const ALIASES = {
  name: ['point', 'pt', 'p', 'name', 'id', 'station', 'stn', 'point no', 'pointno'],
  E: ['e', 'easting', 'east', 'x'], N: ['n', 'northing', 'north', 'y'],
  remark: ['remark', 'remarks', 'description', 'desc', 'code', 'note'],
  station: ['station', 'stn', 'point', 'pt', 'name'], bs: ['bs', 'backsight', 'back sight'], is: ['is', 'intermediate', 'inter sight', 'intermediate sight'], fs: ['fs', 'foresight', 'fore sight'],
};
export function tableToRows(cells, cols, numeric) {
  if (!cells.length) return [];
  let order = cols, start = 0;
  const head = cells[0].map(h => h.toLowerCase().replace(/[^a-z ]/g, '').trim());
  const looksHeader = cells[0].some((c, i) => numeric.includes(cols[i]) && !isBlank(c) && Number.isNaN(num(c)));
  if (looksHeader) { start = 1; order = head.map(h => cols.find(k => (ALIASES[k] || [k]).includes(h)) || null); if (!order.some(Boolean)) order = cols; }
  return cells.slice(start).map(r => { const o = {}; cols.forEach(k => (o[k] = '')); order.forEach((k, i) => { if (k && r[i] != null) o[k] = r[i]; }); return o; });
}
const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
