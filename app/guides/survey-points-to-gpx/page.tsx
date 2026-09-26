import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "survey-points-to-gpx";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>When a GPX helps</h2>
      <p>
        Finding old control in the bush, walking a boundary before the survey, or sending a site team to trial pit locations: a
        handheld GPS or a phone app gets you within a few metres, which is enough to find the mark and start searching. GPX is the file
        almost every one of them reads.
      </p>

      <h2>Step by step</h2>
      <ol>
        <li>
          Load your points in the <WebAppLink>web app</WebAppLink> or the Windows app and choose the grid.
        </li>
        <li>
          Use <strong>Filter what is saved</strong> to send only what the team needs — just the benchmarks, say, or a range of point
          numbers.
        </li>
        <li>
          Open the Save menu, press <strong>More formats</strong>, and choose <strong>GPX</strong>.
        </li>
        <li>Copy the file to the GPS or open it in the phone app.</li>
      </ol>

      <h2>What&apos;s in the file</h2>
      <ul>
        <li>
          <strong>A waypoint for every point</strong>, named after the station (or the point number), with its level as the
          elevation and its code as the description and type.
        </li>
        <li>
          <strong>A route for every line or area</strong> from <strong>Lines and areas</strong>, with its length — and the area for
          closed plots — in the description.
        </li>
        <li>
          Coordinates in WGS 84 latitude and longitude, which is what GPS units use. No settings needed on the device.
        </li>
      </ul>

      <h2>Tips</h2>
      <ul>
        <li>
          <strong>Short station names</strong> read better on a small screen; some older units cut names at 10–14 characters.
        </li>
        <li>
          <strong>Older Garmin units</strong> hold a limited number of waypoints (often 500–1000). Filter large jobs down first.
        </li>
        <li>
          A handheld GPS is good to a few metres. To set out to the centimetre, use the instrument — see{" "}
          <Link href="/guides/points-to-total-station-leica-trimble">Leica GSI and Trimble files</Link>.
        </li>
      </ul>
    </GuideLayout>
  );
}
