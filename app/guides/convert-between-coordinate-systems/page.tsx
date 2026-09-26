import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "convert-between-coordinate-systems";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>When it comes up</h2>
      <ul>
        <li>Old drawings are on a legacy grid and new work is on UTM, or the other way round.</li>
        <li>A client wants the same points on the national grid and on the project&apos;s UTM zone.</li>
        <li>A consultant sent coordinates on a grid your instrument isn&apos;t set to.</li>
      </ul>
      <p>
        Converting from one grid to another goes through latitude and longitude: the points are taken off the first grid, including its
        datum, and put onto the second. Excel to KML does both steps, and keeps your original coordinates beside the new ones.
      </p>

      <h2>Step by step</h2>
      <ol>
        <li>
          Open the sheet in the <WebAppLink>web app</WebAppLink> or the Windows app.
        </li>
        <li>
          Under <strong>Coordinate system</strong>, choose the grid the sheet is on <em>now</em> — search the world grid list by name,
          country or EPSG code, or pick a UTM zone.
        </li>
        <li>
          Check one known point on the map. If the points aren&apos;t where they should be, the source grid is wrong, and the converted
          values would be wrong too.
        </li>
        <li>
          Open <strong>Quality checks</strong> and type the grid you want in <strong>Grid for exported coordinates</strong> — an EPSG
          code such as <strong>32640</strong>, or part of its name. The line under the box names the grid it matched.
        </li>
        <li>
          Save <strong>Excel</strong> or <strong>CSV</strong>. Your original easting and northing stay as they were, and two new
          columns hold the easting and northing on the second grid, to the millimetre, next to latitude and longitude.
        </li>
      </ol>

      <h2>Things to watch</h2>
      <ul>
        <li>
          <strong>Datums.</strong> Two grids on different datums can differ by tens or hundreds of metres. The program applies the
          published datum shift for each grid, which is usually good to a metre or better; for survey-grade agreement with local control,
          use <Link href="/guides/site-calibration-local-grid">site calibration</Link> as well.
        </li>
        <li>
          <strong>Levels</strong> are copied across unchanged. Only easting and northing are converted.
        </li>
        <li>
          <strong>Units.</strong> A grid in feet gives feet. The grid pages say which unit each grid uses.
        </li>
        <li>
          <strong>Check a known point</strong> on the second grid before you pass the file on.
        </li>
      </ul>

      <h2>Find the codes</h2>
      <p>
        Every grid has an EPSG code. The <Link href="/convert">grid pages</Link> list them with their parameters, and{" "}
        <Link href="/guides/find-your-utm-zone">how to find your UTM zone</Link> covers UTM.
      </p>
    </GuideLayout>
  );
}
