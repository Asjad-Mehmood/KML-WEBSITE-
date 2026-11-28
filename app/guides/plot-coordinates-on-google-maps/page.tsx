import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/content/guideMeta";

const SLUG = "plot-coordinates-on-google-maps";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What Google Maps needs</h2>
      <p>
        Google Maps only understands <strong>latitude and longitude on WGS 84</strong>, in decimal degrees (for example 25.2854, 51.5310).
        Survey sheets are usually in eastings and northings on a national grid or UTM, so those numbers have to be converted first. Pasting
        an easting into a latitude column puts the point nowhere, or somewhere in the ocean.
      </p>

      <h2>1. Convert the points</h2>
      <ol>
        <li>Open your sheet in the <strong>Excel to KML</strong> web app and pick the grid the coordinates are on (the Qatar National Grid, UTM 40N, and so on).</li>
        <li>Check one point you know, such as a benchmark, against its known position.</li>
        <li>
          Save as <strong>KML</strong> (keeps names, codes and descriptions) or as <strong>CSV with latitude and longitude</strong>.
        </li>
      </ol>
      <p>
        For one or two points, the free <Link href="/tools/coordinates-on-map">coordinates on a map</Link> tool shows them on a map without
        any file.
      </p>

      <h2>2. Import into Google My Maps</h2>
      <ol>
        <li>Go to Google My Maps (google.com/mymaps) and press <strong>Create a new map</strong>.</li>
        <li>Under the first layer, press <strong>Import</strong> and choose the KML, KMZ or CSV file.</li>
        <li>For a CSV, tell it which columns hold the latitude and longitude, and which column to use as the point&apos;s title.</li>
      </ol>
      <p>
        Big jobs import more reliably as several layers (for example one per survey day or per code) than as one very large file. Very
        large point counts are better viewed in Google Earth, which has no such limits.
      </p>

      <h2>3. Style and share</h2>
      <ul>
        <li>Group the points by a column (such as the point code) to give each group its own colour and icon.</li>
        <li>
          Press <strong>Share</strong> to send a link. Anyone with it can open the map in Google Maps on a phone, which suits clients who
          won&apos;t install Google Earth.
        </li>
        <li>Lines and boundaries come through from a KML too, so plot outlines show as shapes rather than loose corners.</li>
      </ul>

      <h2>Google Maps or Google Earth?</h2>
      <p>
        Google Maps (My Maps) is the easiest to share and opens in any browser. Google Earth shows heights, 3D buildings, historical imagery
        and photos inside balloons, and copes with thousands of points. Many surveyors send a KMZ for the engineer and a My Maps link for
        everyone else. See <Link href="/guides/kml-vs-kmz">KML vs KMZ</Link> and{" "}
        <Link href="/guides/open-kmz-on-phone">opening a KMZ on a phone</Link>.
      </p>

      <h2>Points in the wrong place?</h2>
      <p>
        If the pins land kilometres away, the grid, zone or datum chosen in step 1 is probably wrong. The{" "}
        <Link href="/guides/points-in-wrong-place-google-earth">wrong place checklist</Link> goes through the usual causes.
      </p>
    </GuideLayout>
  );
}
