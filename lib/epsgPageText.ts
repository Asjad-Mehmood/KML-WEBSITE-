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
