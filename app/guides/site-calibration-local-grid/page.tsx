import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "site-calibration-local-grid";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>When you need it</h2>
      <ul>
        <li>
          The job was set out on a <strong>project grid</strong> — a total station started at 1000, 1000 or 5000, 5000 — that isn&apos;t a
          map grid at all.
        </li>
        <li>
          The points are on a national grid, but you need them to match local control more closely than the published datum shift
          allows.
        </li>
      </ul>
      <p>
        In both cases you need a few points whose true coordinates you know: control or benchmark stations that appear in your sheet
        and have known coordinates on a map grid, or known latitude and longitude.
      </p>

      <h2>What the calibration does</h2>
      <p>
        It works out the best <strong>shift</strong>, <strong>rotation</strong> and <strong>one scale factor</strong> that move your
        sheet&apos;s coordinates onto the control, by least squares (a two-dimensional similarity transformation, sometimes called a
        Helmert fit). With two control points the fit is exact. With three or more, what is left over on each point shows which
        control agrees with the rest and which doesn&apos;t.
      </p>

      <h2>Step by step</h2>
      <ol>
        <li>
          Open your sheet in the <WebAppLink>web app</WebAppLink> or the Windows app.
        </li>
        <li>
          Under <strong>Coordinate system</strong>, choose the map grid the control coordinates are on (for example Dubai DLTM or a UTM
          zone).
        </li>
        <li>
          Open <strong>Site calibration</strong> and enter the control points, one per line:{" "}
          <strong>STATION, EASTING, NORTHING</strong> on the chosen grid, or <strong>STATION, LATITUDE, LONGITUDE</strong>. The station
          names must match rows in your sheet.
        </li>
        <li>
          Press <strong>Calculate</strong>. Each control point shows what is left over after the fit, and the worst one is
          highlighted.
        </li>
        <li>
          If they agree, press <strong>Apply to every point</strong>, check one point on the map, and save.
        </li>
      </ol>

      <h2>Getting a good fit</h2>
      <ul>
        <li>Use at least three control points, so there is something left over to check.</li>
        <li>Spread them around the site. Points bunched together or in a straight line give a poor rotation and scale.</li>
        <li>
          One point far worse than the others is usually a typing mistake or a disturbed mark. Take it out and calculate again rather
          than accepting the fit.
        </li>
        <li>
          The result is only as good as the control. A clean fit with small leftovers means the control and your sheet agree with each
          other.
        </li>
      </ul>
    </GuideLayout>
  );
}
