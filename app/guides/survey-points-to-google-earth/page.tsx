import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "survey-points-to-google-earth";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What you need</h2>
      <ul>
        <li>A spreadsheet (Excel or CSV) with one row per point: a point name, easting, northing and, if you have it, the level.</li>
        <li>The name or EPSG code of the coordinate system the numbers are in.</li>
        <li>Google Earth Pro on a computer, or Google Earth in a web browser or on a phone.</li>
      </ul>

      <h2>1. Tidy the sheet</h2>
      <p>
        Put a heading row at the top. Headings such as <strong>Station</strong>, <strong>Easting</strong>, <strong>Northing</strong> and{" "}
        <strong>Elevation</strong> (or E, N, RL, Level, Z) are recognised automatically. Other columns — code, remarks, date — are kept
        and can be shown when a point is clicked in Google Earth. A sheet without headings works too; you then pick the column order.
      </p>

      <h2>2. Find out which grid the numbers are on</h2>
      <p>
        Easting and northing only mean something on a particular grid. Look at the drawing&apos;s title block, the survey report or the
        control sheet for the grid name or EPSG code — for example Dubai DLTM (EPSG:3997), Qatar National Grid (EPSG:2932) or a UTM
        zone. Our <Link href="/convert">grid pages</Link> list the common ones with their parameters. If you only know roughly where the
        site is, the app can list the grids used at that latitude and longitude.
      </p>

      <h2>3. Load the points</h2>
      <p>
        Open the <Link href="/app">web app</Link> (or the Windows app) and paste the rows copied from Excel, or open the CSV file. The
        table on the right shows exactly what was read, so you can compare it with your sheet.
      </p>

      <h2>4. Choose the coordinate system</h2>
      <p>
        Under <strong>Coordinate system</strong>, search for the grid name or its EPSG code and pick it. The shift from the grid&apos;s datum
        to WGS 84, which Google Earth uses, is applied for you. The map then shows where the points land.
      </p>

      <h2>5. Check one point you know</h2>
      <p>
        Before saving, look at a point whose position you know — a benchmark, a building corner — on the map. If it&apos;s in the right
        place, the rest will be too. <strong>Quality checks</strong> also flag points shot twice, levels that jump and rows with no level.
      </p>

      <h2>6. Save and open in Google Earth</h2>
      <ul>
        <li>
          Press <strong>Save KML</strong>, or <strong>Save KMZ</strong> if you&apos;ve attached photos or custom markers.
        </li>
        <li>In Google Earth Pro, double-click the file or use File → Open.</li>
        <li>In Google Earth on the web, open Projects → New project → Import KML file from computer.</li>
      </ul>
      <p>Click any pin to see its details: name, coordinates, level and whichever columns you chose to show.</p>

      <h2>If the points land in the wrong place</h2>
      <ul>
        <li><strong>In the sea or another country:</strong> the wrong zone, or easting and northing columns swapped.</li>
        <li><strong>A few hundred metres out:</strong> an older or local grid rather than the national one — check the drawing.</li>
        <li><strong>Hundreds of kilometres out:</strong> feet read as metres, or metres as feet.</li>
        <li><strong>A few metres out, consistently:</strong> a datum difference or a site grid; calibrate on known control points.</li>
      </ul>
      <p>
        The free web app converts up to 50 points per file; the <Link href="/#download">Windows app</Link> has no limit.
      </p>
    </GuideLayout>
  );
}
