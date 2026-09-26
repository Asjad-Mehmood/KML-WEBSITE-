import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "setting-out-bearing-and-distance";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What you get</h2>
      <p>
        Pick the point you&apos;re set up on, and every other point is listed by <strong>bearing</strong>,{" "}
        <strong>horizontal distance</strong> and <strong>level difference</strong> from it. It&apos;s the table you&apos;d work out by
        hand to set out with a tape and compass, check a total station setup, or plan the order to visit points.
      </p>

      <h2>Step by step</h2>
      <ol>
        <li>
          Load your points in the <WebAppLink>web app</WebAppLink> or the Windows app and choose the grid.
        </li>
        <li>
          Open <strong>Radar simulator</strong> in the section list.
        </li>
        <li>
          Under <strong>Set up on</strong>, choose the station you&apos;re at. The scope draws every point around it, and{" "}
          <strong>All points</strong> lists them with station, code, bearing, distance and ΔZ. Click a column heading to sort by it.
        </li>
        <li>
          Choose a <strong>Point to set out</strong> to see its bearing, distance and level difference on their own.
        </li>
        <li>
          Press <strong>Save setting-out sheet</strong> for a CSV, or <strong>Copy the list</strong> to paste it into Excel or a
          message.
        </li>
      </ol>

      <h2>The setting-out sheet</h2>
      <p>
        The sheet starts with the setup station and its coordinates, then one row per point in the order shown: bearing in degrees,
        minutes and seconds and in decimal degrees, distance, ΔE, ΔN, ΔZ and the point&apos;s own easting, northing and level.
      </p>

      <h2>Bearings from a backsight</h2>
      <p>
        Bearings are from grid north when the sheet has eastings and northings, and from true north when it has only latitude and
        longitude. To work from a backsight instead, open <strong>More options</strong> and set <strong>Top of the scope</strong> to the
        backsight station. The scope turns to face it, and the setting-out sheet adds an <strong>angle from backsight</strong> column
        for every point.
      </p>

      <h2>Try the route first</h2>
      <p>
        <strong>Walk there</strong> sends a simulated rover to the chosen point, and <strong>Visit every point</strong> walks them all
        in turn — a quick way to see the order and the distances before going on site.
      </p>

      <h2>Send points to the instrument</h2>
      <p>
        To set out with a total station instead, save the points in its own format — see{" "}
        <Link href="/guides/points-to-total-station-leica-trimble">Leica GSI and Trimble files</Link>.
      </p>
    </GuideLayout>
  );
}
