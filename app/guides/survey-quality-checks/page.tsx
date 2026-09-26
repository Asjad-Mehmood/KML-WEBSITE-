import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "survey-quality-checks";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>Why check</h2>
      <p>
        Most survey mistakes look fine on a map: a point stored twice under two names, a shot taken with the wrong target height, a
        row pasted twice. They show up later, as a wrong volume or a level that doesn&apos;t make sense on the drawing. A minute of
        checking before you send the file is cheaper.
      </p>

      <h2>Run the checks</h2>
      <ol>
        <li>
          Load your points in the <WebAppLink>web app</WebAppLink> or the Windows app and choose the grid.
        </li>
        <li>
          Open <strong>Quality checks</strong> in the section list. The checks run on their own and update as you edit. Four cards
          show how many they found: same point twice, almost touching, odd levels and no level.
        </li>
        <li>Everything found is listed under the cards with the station names, so you can fix the rows or accept them.</li>
      </ol>

      <h2>What it looks for</h2>
      <ul>
        <li>
          <strong>Duplicates:</strong> two rows with the same coordinates to the millimetre — usually the same point stored twice, or a
          row pasted twice. Both names are listed.
        </li>
        <li>
          <strong>Points too close:</strong> points nearer to each other than the distance you set (0.10 m to start with) but not
          identical. On a detail survey this is often a re-shot point, or a point stored before the prism settled.
        </li>
        <li>
          <strong>Level jumps:</strong> a level that differs from the ground around it — the middle value of the points within 25 m —
          by more than the limit you set (1.5 m to start with). It compares with the neighbours, not with the whole job, so a sloping
          site doesn&apos;t fill the list. It needs at least four neighbours to judge. A wrong target height or a shot on top of a wall
          shows up here.
        </li>
        <li>
          <strong>Rows with no level.</strong> A sheet shot with no levels at all is reported once, not once per row.
        </li>
      </ul>

      <h2>Setting the limits</h2>
      <ul>
        <li>
          <strong>Points closer than:</strong> raise it for a topographic survey at 5 m spacing; lower it for setting-out checks where
          two pegs can be 50 mm apart.
        </li>
        <li>
          <strong>Level differs from neighbours by:</strong> 0.3–0.5 m suits a flat site or a road; keep it higher on rough ground,
          embankments and walls, where real changes of level are large.
        </li>
      </ul>

      <h2>Where the results go</h2>
      <p>
        The <strong>survey report (PDF)</strong> includes the checks with their counts, so the client can see what was checked. Use{" "}
        <Link href="/guides/compare-survey-with-design">design comparison</Link> as well when you have design coordinates to check
        against.
      </p>
    </GuideLayout>
  );
}
