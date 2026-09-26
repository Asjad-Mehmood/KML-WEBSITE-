import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "latitude-longitude-to-utm";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What you need</h2>
      <ul>
        <li>
          A sheet with <strong>LATITUDE</strong> and <strong>LONGITUDE</strong> columns in decimal degrees (25.2048, not 25°12&apos;17&quot;
          — see <Link href="/guides/dms-to-decimal-degrees">DMS to decimal degrees</Link> if yours are in degrees, minutes and seconds).
          Southern latitudes and western longitudes are negative.
        </li>
        <li>
          The grid you want the eastings and northings on. For UTM, that&apos;s the zone the site is in — see{" "}
          <Link href="/guides/find-your-utm-zone">how to find your UTM zone</Link>.
        </li>
      </ul>

      <h2>Step by step</h2>
      <ol>
        <li>
          Open the sheet in the <WebAppLink>web app</WebAppLink> or the Windows app, or paste the rows with their heading row.
        </li>
        <li>
          Under <strong>Coordinate system</strong>, choose <strong>Latitude and longitude already — no conversion</strong>. The points
          should land in the right place on the map straight away.
        </li>
        <li>
          Open <strong>Quality checks</strong> and find the box <strong>Grid for exported coordinates</strong>. Type the grid there: an
          EPSG code such as <strong>32640</strong> for UTM zone 40 North, or part of its name. The line under the box names the grid it
          found, so you can check it&apos;s the right one.
        </li>
        <li>
          Save <strong>Excel</strong> or <strong>CSV</strong>. The sheet carries two new columns — the grid&apos;s easting and northing —
          beside your latitude and longitude, to three decimal places (millimetres). <strong>DXF</strong> is drawn on that grid too.
        </li>
      </ol>

      <h2>UTM EPSG codes</h2>
      <p>
        On WGS 84, UTM zones north of the equator are <strong>326</strong> followed by the zone number, and south of it{" "}
        <strong>327</strong>: zone 40 North is EPSG:32640, zone 43 North is EPSG:32643, zone 55 South is EPSG:32755. The{" "}
        <Link href="/convert">grid pages</Link> list the code for every national grid too.
      </p>

      <h2>Check the result</h2>
      <ul>
        <li>UTM eastings are between about 160,000 and 840,000 m. A value outside that means the zone is wrong for the site.</li>
        <li>
          Northings north of the equator count up from 0 at the equator; south of it they count down from 10,000,000 m.
        </li>
        <li>
          If you have one point with known grid coordinates — a benchmark or control station — compare it. They should agree to
          millimetres when the datums match.
        </li>
      </ul>

      <h2>The other way round</h2>
      <p>
        Going from eastings and northings to latitude and longitude is what the program does every time it makes a Google Earth file —
        see <Link href="/guides/easting-northing-to-latitude-longitude">easting and northing to latitude and longitude</Link>. Saved
        Excel and CSV files always include the latitude and longitude columns.
      </p>
    </GuideLayout>
  );
}
