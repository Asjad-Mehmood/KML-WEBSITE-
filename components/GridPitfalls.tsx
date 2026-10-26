import { AlertTriangle } from "lucide-react";
import type { EpsgSystem } from "@/lib/epsgCatalog";
import { examplePoints, fmtGrid } from "@/lib/epsgExample";
import { hasWestSouthAxes } from "@/lib/epsgPageText";
import { datumTie, unitLabel } from "@/lib/gridParams";

/**
 * Mistakes people make with this particular grid, worked out from its definition: where its
 * eastings and northings fall (so swapped columns stand out), its units, how its datum reaches
 * WGS 84 and which way its axes count. Every grid page gets its own.
 */
export default function GridPitfalls({ s, name }: { s: EpsgSystem; name: string }) {
  const mid = examplePoints(s)[0];
  const units = unitLabel(s.def);
  const tie = datumTie(s.def);
  const items: { title: string; text: string }[] = [];
  if (mid) {
    const swapped = Math.abs(Math.abs(mid.e) - Math.abs(mid.n)) > 1000;
    items.push({
      title: swapped ? "Easting and northing swapped" : "Which column is which",
      text: swapped
        ? `In ${name} the middle of the grid is near easting ${fmtGrid(mid.e)} and northing ${fmtGrid(mid.n)}. If your easting column holds numbers like ${fmtGrid(mid.n)}, the columns are the wrong way round and every point lands far away: swap them before converting.`
        : `In ${name} eastings and northings near the middle of the grid are of similar size (about ${fmtGrid(mid.e)} and ${fmtGrid(mid.n)}), so a swap won't be obvious from the numbers. Check that the first point lands where you expect it before converting the rest.`,
    });
  }
  items.push(
    units === "metres"
      ? { title: "Feet entered as metres", text: `${name} is in metres. Coordinates copied from a drawing in feet must be converted first, or every point moves outwards from the grid's origin.` }
      : { title: "Metres entered as feet", text: `${name} is in ${units}. Enter the values as they are; converting them to metres first puts every point in the wrong place.` }
  );
  items.push(
    tie.startsWith("Defined on WGS 84")
      ? { title: "Looking for a datum shift that isn't there", text: `${name} is defined on WGS 84, the datum Google Earth uses, so no shift is applied. If points are off by tens or hundreds of metres, the data is probably on another grid.` }
      : { title: "Forgetting the datum", text: `${name} is not on WGS 84: ${tie.charAt(0).toLowerCase() + tie.slice(1)}. Picking a WGS 84 grid with the same projection instead leaves the points off by that amount.` }
  );
  if (hasWestSouthAxes(s)) {
    items.push({ title: "Signs of the coordinates", text: `${name} counts its axes west and south. Keep the signs exactly as the survey gives them; flipping them moves points across the origin.` });
  }
  items.push({
    title: "Points outside the grid's area",
    text: s.area
      ? `${name} is meant for ${s.area}. Points well outside that area convert with growing error; the converter flags them so you can choose the right grid.`
      : `Points far outside ${name}'s area of use convert with growing error; the converter flags them so you can choose the right grid.`,
  });
  items.push({ title: "A local site grid", text: "If every point is off by the same distance and direction, the drawing may be on a local site grid. Calibrate on three or more known control points instead." });

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-10 mb-3">Common mistakes with {name}</h2>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.title} className="flex gap-2.5 rounded-xl bg-white border border-slate-200 px-4 py-3 text-[14px]">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" aria-hidden />
            <span>
              <strong className="text-slate-900">{i.title}.</strong> {i.text}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
