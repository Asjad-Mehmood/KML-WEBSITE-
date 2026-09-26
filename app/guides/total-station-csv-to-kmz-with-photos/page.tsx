import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "total-station-csv-to-kmz-with-photos";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>1. Export the points from the instrument</h2>
      <p>
        From your Leica, Trimble, Topcon or Sokkia controller or office software, export the job as a comma-separated file with the
        point number, easting, northing, elevation and code — often called P,E,N,Z,Code. Headings are optional: for a file without
        them, choose the column order when you open it (for example Point · Easting · Northing · Elevation).
      </p>

      <h2>2. Name the photos after the points</h2>
      <p>
        A photo is matched to a point when its file name matches the point name: <strong>TREE-01.jpg</strong> goes with point{" "}
        <strong>TREE-01</strong>. A mark photographed more than once can use <strong>TREE-01-1.jpg</strong>,{" "}
        <strong>TREE-01-2.jpg</strong> and so on. If renaming isn&apos;t practical, add a <strong>PHOTO</strong> column to the sheet with the
        file name for each point.
      </p>

      <h2>3. Open the file and set the grid</h2>
      <p>
        Open the CSV in the <WebAppLink>web app</WebAppLink> or the Windows app and choose the coordinate system under{" "}
        <strong>Coordinate system</strong>. Not sure which one? See the <Link href="/convert">grid pages</Link>.
      </p>

      <h2>4. Attach the photos</h2>
      <p>
        Under <strong>Site photos</strong>, add the pictures. Each one is marked as matched or not, so you can spot a misnamed file
        straight away. Phone photos carry their own GPS position: the tool warns when a photo was taken further from its point than a
        distance you set (30 m by default) — usually a sign it belongs to a different mark.
      </p>

      <h2>5. Make the plan readable</h2>
      <ul>
        <li>
          <strong>Point symbols</strong> give each kind of point its own marker, guessed from the code — trees, benchmarks, pegs — and
          put each kind in its own folder so it can be switched on and off in Google Earth.
        </li>
        <li>
          <strong>Lines and areas</strong> joins points into lines, one line for each code, so a BOUNDARY or FENCE code becomes a line
          with its length, and a closed boundary gets its area in square metres and hectares.
        </li>
        <li>
          <strong>Balloon contents</strong> chooses what a client sees when they click a point.
        </li>
      </ul>

      <h2>6. Save one KMZ</h2>
      <p>
        Press <strong>Save KMZ</strong>. A KMZ is a KML with the pictures packed inside it, so a single file carries the points, lines
        and photos and opens on any computer or phone with Google Earth — nothing gets lost when you email it. Photos are shrunk as
        they&apos;re packed to keep the file small.
      </p>
    </GuideLayout>
  );
}
