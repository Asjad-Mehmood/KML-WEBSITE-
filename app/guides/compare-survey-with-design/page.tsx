import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "compare-survey-with-design";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What it does</h2>
      <p>
        You have the design coordinates of the pegs, piles or bolts, and the as-built survey of what was actually built. The comparison
        matches them <strong>station by station</strong> and gives the difference in easting, northing, plan and level for each,
        flagging anything outside your tolerance.
      </p>

      <h2>Prepare the two sheets</h2>
      <ul>
        <li>
          <strong>The survey:</strong> your as-built points, loaded as usual.
        </li>
        <li>
          <strong>The design sheet:</strong> a CSV or text file with <strong>STATION</strong>, <strong>EASTING</strong> and{" "}
          <strong>NORTHING</strong> columns, and <strong>ELEVATION</strong> if levels should be checked too. It must be on the same
          grid as the survey.
        </li>
        <li>
          <strong>The same station names</strong> in both. Matching ignores upper and lower case and spaces at either end, but
          &ldquo;P-01&rdquo; and &ldquo;P1&rdquo; are different stations.
        </li>
      </ul>

      <h2>Step by step</h2>
      <ol>
        <li>
          Load the survey in the <WebAppLink>web app</WebAppLink> or the Windows app.
        </li>
        <li>
          Open <strong>Against design</strong> in the section list and press <strong>Load design sheet</strong>.
        </li>
        <li>
          Set the <strong>Plan tolerance</strong> and <strong>Level tolerance</strong> in metres (0.050 and 0.030 to start with).
        </li>
        <li>
          Read the cards: how many are <strong>within tolerance</strong>, how many are <strong>outside</strong>, and how many survey
          points are <strong>not in the design</strong>. Points outside tolerance are listed worst first, with the plan difference and
          the shift in easting, northing and level.
        </li>
        <li>
          Press <strong>Save comparison sheet</strong> for a CSV with STATION, dE, dN, PLAN, dZ and OK or OUT for every matched
          point.
        </li>
      </ol>

      <h2>In Google Earth and the report</h2>
      <p>
        In the saved Google Earth file, points within tolerance get a green marker and points outside it a caution marker, and each
        point&apos;s balloon shows its differences. The comparison is also carried into the <strong>survey report (PDF)</strong>.
      </p>

      <h2>Reading the differences</h2>
      <ul>
        <li>
          <strong>Every point off by about the same amount in the same direction</strong> usually means a setup or grid problem, not
          the construction: check the control, or whether both sheets are really on the same grid.
        </li>
        <li>
          <strong>A few points far out</strong> are usually a wrong station name, a typing mistake in the design sheet, or genuinely
          misplaced work.
        </li>
        <li>
          <strong>Many &ldquo;not in the design&rdquo;</strong> means the names don&apos;t match. Line up the naming first.
        </li>
      </ul>
      <p>
        Run the <Link href="/guides/survey-quality-checks">quality checks</Link> too, to catch duplicates and level busts in the survey
        itself.
      </p>
    </GuideLayout>
  );
}
