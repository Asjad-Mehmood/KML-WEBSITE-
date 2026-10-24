import proj4 from "proj4";
import fs from "fs";
const d = JSON.parse(fs.readFileSync("public/data/epsg-projected.json"));
const out = [];
for (const [code, name, def, bbox] of d) {
  const [n, w, s, e] = bbox; const E = e < w ? e + 360 : e;
  const pts = [[0.5,0.5],[0.8,0.2],[0.8,0.8],[0.2,0.2],[0.2,0.8]].map(([a,b]) => { let lo = w + (E - w) * b; if (lo > 180) lo -= 360; return [s + (n - s) * a, lo]; });
  let f; try { f = proj4("EPSG:4326", def); } catch { out.push({ code, err: 1 }); continue; }
  out.push({ code, p: pts.map(([la, lo]) => { try { const [x, y] = f.forward([lo, la]); return [la, lo, x, y]; } catch { return [la, lo, null, null]; } }) });
}
fs.writeFileSync(process.argv[2], JSON.stringify(out));
