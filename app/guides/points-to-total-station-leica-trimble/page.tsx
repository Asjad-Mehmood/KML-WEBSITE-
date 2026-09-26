import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "points-to-total-station-leica-trimble";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>The three formats</h2>
      <ul>
        <li>
          <strong>Leica GSI-16</strong> (.gsi): point number, easting, northing, level and code in Leica&apos;s fixed-width format, in
          millimetres. For Leica total stations and the older Leica controllers.
        </li>
        <li>
          <strong>Trimble P,E,N,Z,Code</strong>: a comma file with no heading row — point, easting, northing, level, code. For Trimble
          Access, Survey Controller and most other controllers that import a CSV.
        </li>
        <li>
          <strong>Trimble P,N,E,Z,Code</strong>: the same with northing before easting, for instruments set up that way.
        </li>
      </ul>

      <h2>Step by step</h2>
      <ol>
        <li>
          Load the points in the <WebAppLink>web app</WebAppLink> or the Windows app — design coordinates, control, or last
          week&apos;s survey.
        </li>
        <li>
          Use <strong>Filter what is saved</strong> if the instrument only needs some of them.
        </li>
        <li>
          Open the Save menu, press <strong>More formats</strong>, and under <strong>For the instrument</strong> choose the format.
        </li>
        <li>Copy the file to the instrument&apos;s card or USB stick, or import it in the office software, and load it into the job.</li>
      </ol>

      <h2>From latitude and longitude</h2>
      <p>
        An instrument works in eastings and northings. If your sheet only has latitude and longitude — from a KML, say — type the grid
        in <strong>Grid for exported coordinates</strong> under <strong>Quality checks</strong> first; the program says so if you
        forget. See <Link href="/guides/latitude-longitude-to-utm">latitude and longitude to UTM</Link>.
      </p>

      <h2>Things to know</h2>
      <ul>
        <li>
          <strong>GSI point numbers</strong> hold up to 16 letters, digits, dots, dashes and underscores. Other characters are dropped,
          and a longer name keeps its last 16 characters.
        </li>
        <li>
          <strong>Points with no level</strong> are written with level 0 in a GSI file, and with an empty level in the Trimble files.
        </li>
        <li>
          <strong>Commas in codes</strong> are turned into spaces in the Trimble files, so they don&apos;t split the columns.
        </li>
        <li>
          <strong>Try a small file first.</strong> Instruments and firmware differ; load a few points and check one before relying on
          the file for a whole job.
        </li>
      </ul>

      <h2>No instrument on hand?</h2>
      <p>
        A setting-out sheet with bearings and distances from a setup point works with a tape and compass — see{" "}
        <Link href="/guides/setting-out-bearing-and-distance">bearing and distance from a setup point</Link>.
      </p>
    </GuideLayout>
  );
}
