import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "boundaries-and-land-area-in-google-earth";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>1. Give the boundary points a code</h2>
      <p>
        Put a <strong>CODE</strong> column in your sheet and give every corner of a boundary the same code — BOUNDARY, FENCE, KERB,
        PLOT-12 — in the order they run round the site. The order of the rows is the order the line is drawn in.
      </p>

      <h2>2. Join the points</h2>
      <p>
        Open the sheet in the <Link href="/app">web app</Link> or the Windows app, choose the coordinate system, then open{" "}
        <strong>Lines and areas</strong>. Under <strong>Join the points</strong>, pick:
      </p>
      <ul>
        <li>
          <strong>One line for each code</strong> — the usual choice: all BOUNDARY points make one line, all FENCE points another.
        </li>
        <li>
          <strong>One line through all of them, in order</strong> — for a sheet that is a single traverse or run.
        </li>
      </ul>

      <h2>3. Close the shape for an area</h2>
      <p>
        Tick <strong>Close the shape and give the area</strong>, which closes each line back to its first point. A closed boundary
        gets its <strong>area</strong> in square metres and hectares, as well as its perimeter. Open lines, such as a kerb or a pipe run, get their length.
      </p>

      <h2>4. Check and save</h2>
      <p>
        The tool lists every line with its number of points, length and, when closed, its area. Lengths are measured on the ground,
        point to point. Save KML or KMZ: the lines go into their own folder in Google Earth, and clicking a line shows its length and
        area.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>If the outline crosses itself, the rows are out of order. Sort them round the boundary and try again.</li>
        <li>
          For a road or pipe centreline, <strong>Level profile</strong> gives chainage and grade along the line, and every other point
          can get its chainage and offset from it.
        </li>
      </ul>
    </GuideLayout>
  );
}
