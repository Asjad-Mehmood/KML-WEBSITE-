// Facts for a country's (or region's) coordinate-system page, worked out from the EPSG catalog:
// datums, projections, units, UTM zones and the hand-written grid pages that belong to it.
// Every page gets its own numbers and names, and a short Q&A (also given to search engines).
import { GRID_PAGES } from "@/lib/gridPages";
import { systemByCode, type EpsgSystem } from "@/lib/epsgCatalog";

const METHOD: Record<string, string> = {
  tmerc: "Transverse Mercator", utm: "UTM (Transverse Mercator)", lcc: "Lambert Conformal Conic", cass: "Cassini-Soldner",
  aea: "Albers Equal Area", stere: "Stereographic", sterea: "Oblique Stereographic", omerc: "Oblique Mercator",
  merc: "Mercator", eqc: "Equidistant Cylindrical", laea: "Lambert Azimuthal Equal Area", aeqd: "Azimuthal Equidistant",
  krovak: "Krovak", poly: "Polyconic", eqdc: "Equidistant Conic", nzmg: "New Zealand Map Grid", somerc: "Swiss Oblique Mercator",
};
export const UNIT: Record<string, string> = { m: "metres", "US ft": "US survey feet", ft: "international feet", ch: "chains", link: "links", "ind-yd": "Indian yards", units: "other units" };

const count = <T,>(xs: T[]) => {
  const m = new Map<T, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export type Facts = {
  total: number;
  datums: [string, number][];
  methods: [string, number][];
  units: [string, number][];
  utmZones: string[];
  popular: { slug: string; name: string }[];
  extent: string | null;
};

export function factsOf(systems: EpsgSystem[], countrySlug?: string): Facts {
  const datums = count(systems.map((s) => s.name.split(" / ")[0].trim())).slice(0, 8);
  const methods = count(systems.map((s) => METHOD[/\+proj=(\w+)/.exec(s.def)?.[1] ?? ""] ?? "Other projections"));
  const units = count(systems.map((s) => UNIT[s.unit] ?? s.unit));
  const zones = new Set<string>();
  for (const s of systems) {
    const z = /UTM zone (\d{1,2}[NS])/i.exec(s.name)?.[1];
    if (z) zones.add(z.toUpperCase());
  }
  const utmZones = [...zones].sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b));
  const popular = countrySlug
    ? GRID_PAGES.filter((g) => systemByCode(g.code)?.countrySlug === countrySlug && !g.slug.startsWith("utm-zone-")).map((g) => ({ slug: g.slug, name: g.name }))
    : [];
  let n = -90, s = 90, w = 180, e = -180;
  for (const x of systems) {
    const [bn, bw, bs, be] = x.bbox;
    if (![bn, bw, bs, be].every(Number.isFinite)) continue;
    n = Math.max(n, bn); s = Math.min(s, bs); w = Math.min(w, bw); e = Math.max(e, be);
  }
  const la = (v: number) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? "N" : "S"}`;
  const lo = (v: number) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? "E" : "W"}`;
  const extent = n >= s && e - w < 300 ? `${la(s)} to ${la(n)}, ${lo(w)} to ${lo(e)}` : null;
  return { total: systems.length, datums, methods, units, utmZones, popular, extent };
}

/** One paragraph that describes the systems of a place in plain words. */
export function factsSummary(place: string, f: Facts): string {
  const parts: string[] = [];
  const topDatums = f.datums.slice(0, 4).map(([d]) => d);
  parts.push(
    `The ${f.total.toLocaleString("en-US")} EPSG coordinate ${f.total === 1 ? "system" : "systems"} for ${place} ${f.total === 1 ? "is" : "are"} based on ${f.datums.length === 1 ? "the " : ""}${list(topDatums)}${f.datums.length > 4 ? " and other datums" : ""}.`
  );
  const methods = f.methods.slice(0, 3).map(([m, c]) => `${m} (${c})`);
  parts.push(`${f.methods.length === 1 ? "The projection is" : "Projections used:"} ${list(methods)}.`);
  const units = f.units.map(([u, c]) => (f.units.length === 1 ? u : `${u} (${c})`));
  parts.push(`Coordinates are in ${list(units)}.`);
  if (f.utmZones.length) parts.push(`UTM zones: ${list(f.utmZones)}.`);
  if (f.extent) parts.push(`Together they cover ${f.extent}.`);
  return parts.join(" ");
}

/** A short Q&A for the page and its FAQPage structured data */
export function factsFaq(place: string, f: Facts): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  const main = f.popular[0]?.name;
  out.push({
    q: `Which coordinate system is used in ${place}?`,
    a: main
      ? `The grid most surveyors use in ${place} is ${main}. In all, ${f.total} EPSG systems are defined for ${place}, on datums such as ${list(f.datums.slice(0, 3).map(([d]) => d))}. Use the one named in your survey report or drawing.`
      : `${f.total} EPSG systems are defined for ${place}, on datums such as ${list(f.datums.slice(0, 3).map(([d]) => d))}. Use the one named in your survey report or drawing; the EPSG code is the safest way to identify it.`,
  });
  if (f.utmZones.length) {
    out.push({
      q: `Which UTM zone is ${place} in?`,
      a: `${place} is covered by UTM ${f.utmZones.length === 1 ? "zone" : "zones"} ${list(f.utmZones)}. Pick the zone by the longitude of your site: each zone is 6° wide.`,
    });
  }
  out.push({
    q: `How do I convert ${place} coordinates to latitude and longitude or Google Earth?`,
    a: `Open the system's page below and type an easting and northing into the converter, or paste a whole spreadsheet into the free web app and choose the system by name or EPSG code. Save the result as KML or KMZ and open it in Google Earth.`,
  });
  out.push({
    q: `Are ${place} coordinates in metres or feet?`,
    a: `${f.units.length === 1 ? `${f.total === 1 ? "It is" : `All ${f.total} are`} in ${f.units[0][0]}` : `${list(f.units.map(([u, c]) => `${c} in ${u}`))}`}. Enter the numbers in the unit of the system you choose; each system's page shows its unit.`,
  });
  return out;
}
