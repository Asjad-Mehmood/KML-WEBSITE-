import Link from "next/link";
import ToolLayout from "../../../components/tools/ToolLayout";
import { toolMetadata } from "@/lib/toolMeta";
import DistanceClient from "./DistanceClient";

const SLUG = "distance-bearing";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLayout
      slug={SLUG}
      lead="Measure the distance and bearing between two points — from latitude and longitude on the Earth's curved surface, or from eastings and northings on a flat grid. Or go the other way: the point at a given bearing and distance."
      notes={
        <>
          <h2>Which one to use</h2>
          <ul>
            <li>
              <strong>Latitude and longitude</strong> measures along the WGS 84 ellipsoid with Vincenty&apos;s formulae, accurate to well under a
              millimetre at any distance. Bearings are true bearings, from true north. On a long line the bearing changes along the way, so
              both the starting and the arriving bearing are shown.
            </li>
            <li>
              <strong>Grid</strong> is plain geometry on eastings and northings: the distance on the grid and the grid bearing, from grid
              north. That&apos;s what a total station setup and a drawing use. Grid and ground distances differ by the grid&apos;s scale factor
              — up to about 0.04% on UTM.
            </li>
          </ul>
          <h2>Typing bearings</h2>
          <p>
            Bearings go clockwise from north, 0 to 360. Type them as decimal degrees (<code>306.868</code>) or degrees, minutes and seconds
            (<code>306 52 05.4</code> or <code>306°52&apos;05.4&quot;</code>).
          </p>
          <p>
            For bearings and distances from one setup to many points at once, see{" "}
            <Link href="/guides/setting-out-bearing-and-distance">making a setting-out sheet</Link> in the app.
          </p>
        </>
      }
    >
      <DistanceClient />
    </ToolLayout>
  );
}
