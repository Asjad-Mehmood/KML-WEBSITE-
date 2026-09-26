// Builds lib/data/epsg-catalog.json for the /convert/epsg/<code> and
// /convert/country/<country> pages: the area-of-use text and a country for
// every system in public/data/epsg-projected.json (the converter's list).
// Run after build:epsg with: npm run build:epsg-catalog
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const all = require("epsg-index/all.json");
const projected = JSON.parse(fs.readFileSync(path.join("public", "data", "epsg-projected.json"), "utf8"));

// Country names that contain " and " and must not be split
const KEEP_AND = new Set([
  "Trinidad and Tobago", "Bosnia and Herzegovina", "Antigua and Barbuda", "St Kitts and Nevis",
  "Wallis and Futuna", "South Georgia and the South Sandwich Islands", "St Pierre and Miquelon",
]);
const SYNONYMS = {
  USA: "United States", US: "United States", UK: "United Kingdom", Turkey: "Türkiye",
  "Brunei Darussalam": "Brunei", "Idaho": "United States", "Illinois": "United States",
  "Navajo Nation": "United States", "ARC System": "Africa", "Antigua island": "Antigua and Barbuda",
  "GOES-16 East Full disk": "World", "Moon": "World", "Arctic": "Arctic", "Latin America": "Latin America",
};

// "Pakistan - onshore." → "Pakistan"; "Canada between 102°W and 96°W" → "Canada";
// world-wide zone descriptions → "World"
function countryOf(area) {
  const a = (area || "").trim();
  if (!a || /^(Between|World|Northern hemisphere|Southern hemisphere)/i.test(a)) return "World";
  let c = a.split(/ - |\.|;|,|:|\(/)[0].trim();
  c = c.replace(/\s+(between|east of|west of|north of|south of|onshore|offshore|including|mainland|region \d+|excluding)\b.*$/i, "").trim();
  if (!KEEP_AND.has(c) && / and /.test(c)) c = c.split(" and ")[0].trim();
  c = SYNONYMS[c] || c;
  return c || "World";
}

const out = projected.map(([code]) => {
  const c = all[String(code)] || {};
  const area = (c.area || "").trim().replace(/\.$/, "");
  return [code, area, countryOf(area)];
});
fs.writeFileSync(path.join("lib", "data", "epsg-catalog.json"), JSON.stringify(out));
const countries = new Map();
for (const [, , k] of out) countries.set(k, (countries.get(k) || 0) + 1);
console.log(`${out.length} systems, ${countries.size} countries`);
console.log([...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => `${k}: ${n}`).join(" | "));
