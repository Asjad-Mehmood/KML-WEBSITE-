// Text for the automatic /convert/epsg/<code> pages, built from each system's
// own definition and EPSG area of use.
import { codeLabel, type EpsgSystem } from "@/lib/epsgCatalog";
import { datumTie, gridParameterRows, unitLabel } from "@/lib/gridParams";

const clip = (s: string, max: number) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "") + "…";
};

export function epsgTitle(s: EpsgSystem) {
  return `${s.name} to KML (${codeLabel(s.code)})`;
}

const BRAND = " | Excel to KML";
/**
 * The search-result title of a grid page, with the words people type ("converter", "Excel",
 * "CSV") and the brand when they fit: the longest of these that stays within about 65 characters.
 *   "Qatar National Grid (QNG) to KML Converter (EPSG:2932) | Excel to KML"
 */
export function gridSearchTitle(name: string, code: string): { title: string | { absolute: string }; share: string } {
  const options = [
    `${name} to KML: Excel & CSV Converter (${code})`,
    `${name} to KML Converter (${code})`,
    `${name} to KML Converter`,
    `${name} to KML`,
  ];
  for (const t of options) if (t.length + BRAND.length <= 70) return { title: t, share: t };
  const t = options.find((o) => o.length <= 70) ?? options[options.length - 1];
  return { title: { absolute: t }, share: t };
}

/** The search-result description of a grid page */
export function gridSearchDescription(name: string, code: string, area?: string | null) {
  const base = `Convert ${name} (${code}) eastings and northings from Excel or CSV to latitude, longitude and Google Earth KML or KMZ. Free, with the grid's parameters.`;
  return clip(area ? `${base} Used in ${area}.` : base, 158);
}

export function epsgDescription(s: EpsgSystem) {
  const base = `Convert ${s.name} (${codeLabel(s.code)}) coordinates to latitude, longitude and Google Earth KML or KMZ.`;
  return clip(s.area ? `${base} Area of use: ${s.area}.` : base, 158);
}

/** Axes that count positive west/south (southern African Lo grids, Krovak) */
export const hasWestSouthAxes = (s: EpsgSystem) => /\+axis=(wsu|swu)/.test(s.def);

export function epsgLead(s: EpsgSystem) {
  const projection = gridParameterRows(s.def).find(([k]) => k === "Projection")?.[1] ?? "projected";
  const datum = s.name.split(" / ")[0];
  const units = unitLabel(s.def);
  return `${s.name} (${codeLabel(s.code)}) is a ${projection} coordinate system on the ${datum} datum, with coordinates in ${units}.${
    s.area ? ` Its official area of use is: ${s.area}.` : ""
  }`;
}

export function epsgNotes(s: EpsgSystem): string[] {
  const notes: string[] = [];
  const units = unitLabel(s.def);
  if (units !== "metres") notes.push(`Coordinates are in ${units}. Enter them in those units, not metres.`);
  if (hasWestSouthAxes(s))
    notes.push(
      "Coordinates in this system count positive to the west and south. Enter the westing (Y) in the easting field and the southing (X) in the northing field."
    );
  if (/\+south\b/.test(s.def)) notes.push("This is a southern-hemisphere grid: northings start at 10,000,000 m at the equator.");
  if (/\+proj=utm/.test(s.def))
    notes.push("Pick the UTM zone by longitude. Points outside the zone's area of use are flagged after conversion.");
  notes.push(`Datum: ${datumTie(s.def)}.`);
  return notes;
}
