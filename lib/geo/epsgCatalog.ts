// Every projected coordinate system the converter supports, with its area of use
// and a country, for the /convert/epsg/<code> and /convert/country/<slug> pages.
// Data: public/data/epsg-projected.json (npm run build:epsg) and
// lib/data/epsg-catalog.json (npm run build:epsg-catalog).
import projected from "@/public/data/epsg-projected.json";
import catalog from "@/lib/data/epsg-catalog.json";

export type Bbox = [number, number, number, number]; // north, west, south, east
export type EpsgRow = [number, string, string, Bbox, string];

export interface EpsgSystem {
  code: number;
  name: string;
  def: string;
  bbox: Bbox;
  unit: string;
  area: string;
  country: string;
  countrySlug: string;
}

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

let byCode: Map<number, EpsgSystem> | null = null;
let byCountry: Map<string, { name: string; systems: EpsgSystem[] }> | null = null;

function load() {
  if (byCode) return;
  const extra = new Map((catalog as unknown as [number, string, string][]).map(([code, area, country]) => [code, { area, country }]));
  byCode = new Map();
  byCountry = new Map();
  for (const [code, name, def, bbox, unit] of projected as unknown as EpsgRow[]) {
    const { area = "", country = "World" } = extra.get(code) ?? {};
    const sys: EpsgSystem = { code, name, def, bbox, unit, area, country, countrySlug: slugify(country) };
    byCode.set(code, sys);
    const group = byCountry.get(sys.countrySlug) ?? { name: country, systems: [] };
    group.systems.push(sys);
    byCountry.set(sys.countrySlug, group);
  }
}

export function systemByCode(code: number): EpsgSystem | undefined {
  load();
  return byCode!.get(code);
}

export function allSystems(): EpsgSystem[] {
  load();
  return [...byCode!.values()];
}

export function countries(): { slug: string; name: string; count: number }[] {
  load();
  return [...byCountry!.entries()]
    .map(([slug, g]) => ({ slug, name: g.name, count: g.systems.length }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function countryBySlug(slug: string): { name: string; systems: EpsgSystem[] } | undefined {
  load();
  return byCountry!.get(slug);
}

/** Codes of 100000 and up in the list are Esri codes (e.g. ESRI:102001), the rest EPSG */
export const authority = (code: number) => (code >= 100000 && code !== 900913 ? "ESRI" : "EPSG");
export const codeLabel = (code: number) => `${authority(code)}:${code}`;

/** The row the converter component takes (same shape as public/data/epsg-projected.json) */
export const toRow = (s: EpsgSystem): EpsgRow => [s.code, s.name, s.def, s.bbox, s.unit];

/** Countries with more systems than this list regions first, one page per region */
export const BIG_COUNTRY = 150;

/**
 * Sub-group used on big country pages: the state or region from the area of
 * use ("United States (USA) - Texas - …" → "Texas"); world-wide systems are
 * grouped by datum instead ("WGS 84 / UTM zone 40N" → "WGS 84").
 */
export function regionOf(s: EpsgSystem): string {
  if (s.country === "World") return s.name.split(" / ")[0];
  return s.area.split(" - ")[1]?.split(/[.;,(]/)[0].trim() || "Nationwide and other";
}

export function countryRegions(slug: string): { name: string; slug: string; systems: EpsgSystem[] }[] {
  const c = countryBySlug(slug);
  if (!c) return [];
  const groups = new Map<string, EpsgSystem[]>();
  for (const s of c.systems) {
    const r = regionOf(s);
    groups.set(r, [...(groups.get(r) ?? []), s]);
  }
  const used = new Set<string>();
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, systems]) => {
      // Two region names can slugify alike; keep every address unique
      const base = slugify(name) || "other";
      let slug = base;
      for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
      used.add(slug);
      return { name, slug, systems: systems.sort((x, y) => x.name.localeCompare(y.name)) };
    });
}
