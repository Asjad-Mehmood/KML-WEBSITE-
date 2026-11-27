// Builds the website into dist/ (upload this folder to any static host: Netlify, Vercel, GitHub Pages, cPanel).
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const out = '../public/traverse/app';   // served by the website at /traverse/app
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync('public', out, { recursive: true });
// the app's version comes from the website's lib/traverse.ts, so the two never disagree
const version = (fs.readFileSync('../lib/traverse.ts', 'utf8').match(/TRAVERSE_VERSION = "([^"]+)"/) || [])[1] || '';
await build({ entryPoints: ['src/app.js'], bundle: true, format: 'iife', target: 'es2020', minify: true, outfile: path.join(out, 'app.js'), legalComments: 'none', define: { __TL_VERSION__: JSON.stringify(version) } });
fs.mkdirSync(path.join(out, 'vendor'), { recursive: true });
// the open-source licences of what the app is built with (Help → Open-source licences)
const lic = (name, url, file) => `${'-'.repeat(72)}\n${name}\n${url}\n${'-'.repeat(72)}\n\n${fs.readFileSync(file, 'utf8').trim()}\n\n`;
fs.writeFileSync(path.join(out, 'vendor/LICENSES.txt'), 'Open-source software in Traverse & Level\n\nThe app is built with the free software below. Each part keeps its own licence, copied here in full.\n\n'
  + lic('jsPDF', 'https://github.com/parallax/jsPDF (MIT)', 'node_modules/jspdf/LICENSE')
  + lic('jsPDF-AutoTable', 'https://github.com/simonbengtsson/jsPDF-AutoTable (MIT)', 'node_modules/jspdf-autotable/LICENSE.txt')
  + lic('fflate (inside jsPDF)', 'https://github.com/101arrowz/fflate (MIT)', 'node_modules/fflate/LICENSE')
  + `${'-'.repeat(72)}\nIBM Plex Sans, IBM Plex Mono, Libre Caslon Text (the fonts)\nSIL Open Font License 1.1: https://openfontlicense.org\n`);
fs.writeFileSync(path.join(out, 'vendor/pdf.js'), fs.readFileSync('node_modules/jspdf/dist/jspdf.umd.min.js', 'utf8') + '\n;\n' + fs.readFileSync('node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.min.js', 'utf8'));
// cache-busting version for the service worker
const v = Date.now().toString(36);
fs.writeFileSync(path.join(out, 'sw.js'), fs.readFileSync(path.join(out, 'sw.js'), 'utf8').replace("'tl-app-v1'", `'tl-app-${v}'`));
const size = f => (fs.statSync(path.join(out, f)).size / 1024).toFixed(0) + ' kB';
console.log('dist/app.js', size('app.js'), '· vendor/pdf.js', size('vendor/pdf.js'));
