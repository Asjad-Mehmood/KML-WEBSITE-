import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "kml-to-excel";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>When you need it</h2>
      <ul>
        <li>Someone marked points in Google Earth and you need their coordinates in a table.</li>
        <li>A client sent a KMZ of proposed locations to set out.</li>
        <li>You want an old KML back in Excel on your own grid.</li>
      </ul>

      <h2>Step by step</h2>
      <ol>
        <li>
          In the <WebAppLink>web app</WebAppLink> or the Windows app, press <strong>Open</strong> and choose the .kml or .kmz file, or
          drag it onto the window.
        </li>
        <li>
          Every placemark point becomes a row: <strong>STATION</strong> (the placemark&apos;s name), <strong>LATITUDE</strong>,{" "}
          <strong>LONGITUDE</strong> and <strong>ELEVATION</strong> when the file has heights. The coordinate system is set to latitude
          and longitude for you.
        </li>
        <li>
          Save <strong>Excel</strong> or <strong>CSV</strong>.
        </li>
      </ol>

      <h2>On your own grid</h2>
      <p>
        To get eastings and northings as well, type the grid in <strong>Grid for exported coordinates</strong> under{" "}
        <strong>Quality checks</strong> — an EPSG code such as 32640, or part of its name — before saving. If you had already chosen a
        grid before opening the file, it is filled in for you. The saved sheet then has the grid&apos;s easting and northing beside the
        latitude and longitude, and a DXF is drawn on that grid. See{" "}
        <Link href="/guides/latitude-longitude-to-utm">latitude and longitude to UTM</Link> for more.
      </p>

      <h2>What comes across</h2>
      <ul>
        <li>
          <strong>Points only.</strong> Lines and shapes (paths and polygons) are skipped; only placemark points become rows.
        </li>
        <li>
          <strong>Names and coordinates.</strong> Descriptions, balloon text and styles are not read.
        </li>
        <li>
          <strong>Heights</strong> are whatever the file holds. Placemarks drawn in Google Earth are usually &ldquo;clamped to
          ground&rdquo; with a height of 0, which is not a surveyed level.
        </li>
        <li>
          <strong>KMZ files</strong> are unzipped and the KML inside is read. If one can&apos;t be read, rename it to .zip, take out{" "}
          doc.kml and open that.
        </li>
      </ul>

      <h2>And back again</h2>
      <p>
        Once the points are in the table, every save works as usual — back to KML or KMZ with your own markers, or to DXF, Shapefile or
        GPX. See <Link href="/guides/kml-vs-kmz">KML vs KMZ</Link>.
      </p>
    </GuideLayout>
  );
}
