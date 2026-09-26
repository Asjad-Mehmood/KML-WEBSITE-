import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "easting-northing-to-latitude-longitude";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>Grid coordinates and geographic coordinates</h2>
      <p>
        An easting and northing are distances, in metres or feet, on a flat map grid. Latitude and longitude are angles on the curved
        Earth, and they are what Google Earth and GPS use. Converting between the two needs the exact definition of the grid: its
        projection, origin, scale and datum. The same pair of numbers means a different place on every grid.
      </p>

      <h2>Step 1: identify the coordinate system</h2>
      <p>
        Survey drawings and reports state the grid, often with an EPSG code — a number that identifies one coordinate system exactly,
        such as EPSG:3997 for Dubai DLTM or EPSG:32642 for UTM zone 42N. Our <Link href="/convert">grid pages</Link> cover the common
        ones, and the web and Windows apps search all 5,800+ EPSG systems.
      </p>

      <h2>UTM zones</h2>
      <p>
        UTM divides the world into 60 zones, each 6° of longitude wide, numbered eastwards from 180°W. The zone number is{" "}
        <strong>floor((longitude + 180) ÷ 6) + 1</strong> — Dubai, at about 55.3°E, is in zone 40. Add N or S for the hemisphere:
        northings in the south start from 10,000,000 m at the equator. Using the neighbouring zone moves points by hundreds of
        kilometres.
      </p>

      <h2>Datums</h2>
      <p>
        A datum ties the grid to the Earth. Grids on WGS 84, or on datums aligned with it (ETRS89, GDA2020, NAD83 and similar), convert
        directly. Older national datums need a published shift, usually good to a metre or two. The converter applies it for you.
      </p>

      <h2>Step 2: convert</h2>
      <ul>
        <li>
          <strong>One point:</strong> use the quick converter on the <Link href="/">home page</Link> or on your grid&apos;s page, and copy the
          latitude and longitude.
        </li>
        <li>
          <strong>A whole sheet:</strong> paste it into the <WebAppLink>web app</WebAppLink>, pick the grid, and save a CSV with latitude
          and longitude added, or a KML/KMZ for Google Earth.
        </li>
      </ul>
      <p>
        Excel formulas for this are long and easy to get wrong, especially the datum shift, so a converter that uses the published EPSG
        definitions is the safer route.
      </p>

      <h2>Common mistakes</h2>
      <ul>
        <li><strong>Easting and northing swapped:</strong> points land far away, often in the sea.</li>
        <li><strong>Wrong UTM zone or hemisphere:</strong> points shifted by hundreds of kilometres, or thousands north–south.</li>
        <li><strong>Feet and metres mixed up:</strong> US State Plane grids are often in US survey feet.</li>
        <li><strong>A local site grid:</strong> a project grid starting at, say, 1000/1000 isn&apos;t a map grid. Tie it to known control with site calibration.</li>
      </ul>
      <p>Whatever the method, check one known point on the map before using the results.</p>
    </GuideLayout>
  );
}
