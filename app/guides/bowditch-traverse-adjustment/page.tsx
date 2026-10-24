import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import GuideTable from "../../../components/GuideTable";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "bowditch-traverse-adjustment";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What the Bowditch rule does</h2>
      <p>
        A closed traverse should end exactly where it started, but small errors in every angle and distance mean it never quite does.
        The <strong>Bowditch rule</strong> (also called the <strong>compass rule</strong>) spreads the leftover gap, the misclosure, over
        the legs <strong>in proportion to their length</strong>: a long leg takes a bigger share of the correction than a short one. It
        suits traverses where the angles and distances are of similar quality, which is most total station work.
      </p>

      <h2>The example: a four-station loop</h2>
      <p>
        Station <strong>A</strong> is known at E 1000.000, N 2000.000 and the bearing A → B is fixed at 060°00&apos;00&quot; from
        control. The loop runs clockwise A → B → C → D → A. The interior angle was observed at each station and every leg measured
        (horizontal distances, in metres):
      </p>
      <GuideTable
        head={["Station", "Observed interior angle", "Leg", "Distance (m)"]}
        rows={[
          ["B", `092°45'18"`, "A → B", "120.454"],
          ["C", `088°30'37"`, "B → C", "98.314"],
          ["D", `091°45'32"`, "C → D", "119.875"],
          ["A", `086°58'13"`, "D → A", "101.000"],
        ]}
        foot={["Sum", `359°59'40"`, "Perimeter", "439.643"]}
      />

      <h2>Step 1: check and balance the angles</h2>
      <p>
        The interior angles of a closed figure with n sides add up to (n − 2) × 180°. Four sides make 360°, and the observed angles
        add up to 359°59&apos;40&quot;: an <strong>angular misclosure of −20&quot;</strong>.
      </p>
      <p>
        Compare it with what your specification allows before going on. A common limit is <strong>±C√n seconds</strong>, with C
        set by the order of the work (for example 15&quot;, giving ±30&quot; for four angles). This one passes, so the 20&quot; is
        shared equally: <strong>+5&quot; on each angle</strong>. The balanced angles are 092°45&apos;23&quot;, 088°30&apos;42&quot;,
        091°45&apos;37&quot; and 086°58&apos;18&quot;, which add up to exactly 360°.
      </p>

      <h2>Step 2: work out the bearings</h2>
      <p>
        Walking round clockwise, each new bearing is the previous bearing <strong>+ 180° − the interior angle</strong> at the station
        you are on (take off 360° if the answer is more than 360°). From A → B = 060°00&apos;00&quot;:
      </p>
      <ul>
        <li>B → C = 060°00&apos;00&quot; + 180° − 092°45&apos;23&quot; = <strong>147°14&apos;37&quot;</strong></li>
        <li>C → D = 147°14&apos;37&quot; + 180° − 088°30&apos;42&quot; = <strong>238°43&apos;55&quot;</strong></li>
        <li>D → A = 238°43&apos;55&quot; + 180° − 091°45&apos;37&quot; = <strong>326°58&apos;18&quot;</strong></li>
        <li>and back at A: 326°58&apos;18&quot; + 180° − 086°58&apos;18&quot; = 420°00&apos;00&quot; − 360° = 060°00&apos;00&quot;, the bearing you started with.</li>
      </ul>
      <p>That last line is the check that the angles were balanced and the bearings carried correctly.</p>

      <h2>Step 3: the coordinate changes and the misclosure</h2>
      <p>
        For each leg, <strong>ΔE = distance × sin(bearing)</strong> and <strong>ΔN = distance × cos(bearing)</strong>. Round a closed
        loop they should add up to zero:
      </p>
      <GuideTable
        head={["Leg", "Bearing", "Distance", "ΔE", "ΔN"]}
        rows={[
          ["A → B", `060°00'00"`, "120.454", "+104.3162", "+60.2270"],
          ["B → C", `147°14'37"`, "98.314", "+53.1946", "−82.6800"],
          ["C → D", `238°43'55"`, "119.875", "−102.4630", "−62.2202"],
          ["D → A", `326°58'18"`, "101.000", "−55.0504", "+84.6785"],
        ]}
        foot={["Sum", "", "439.643", "−0.0026", "+0.0053"]}
      />
      <p>
        The traverse misses its start by <strong>−2.6 mm in eastings and +5.3 mm in northings</strong>. The linear misclosure is
        √(2.6² + 5.3²) = <strong>5.9 mm</strong>, and the precision is perimeter ÷ misclosure = 439.643 ÷ 0.0059, about{" "}
        <strong>1 : 74,600</strong>. If the job asks for 1 : 10,000 or better, it passes. (See{" "}
        <Link href="/guides/traverse-misclosure-and-precision">traverse misclosure and precision</Link> for what to do when it doesn&apos;t.)
      </p>

      <h2>Step 4: spread the misclosure by the Bowditch rule</h2>
      <p>The correction to each leg is the misclosure with its sign turned round, times that leg&apos;s share of the perimeter:</p>
      <ul>
        <li>correction to ΔE = −(misclosure in E) × leg length ÷ perimeter</li>
        <li>correction to ΔN = −(misclosure in N) × leg length ÷ perimeter</li>
      </ul>
      <p>
        For A → B: +2.6 mm × 120.454 ÷ 439.643 = <strong>+0.7 mm</strong> in E, and −5.3 mm × 120.454 ÷ 439.643 = <strong>−1.5 mm</strong>{" "}
        in N. Doing every leg and adding the corrected changes on from A gives:
      </p>
      <GuideTable
        head={["Leg", "Correction E (mm)", "Correction N (mm)", "To station", "Adjusted E", "Adjusted N"]}
        rows={[
          ["A → B", "+0.7", "−1.5", "B", "1104.317", "2060.226"],
          ["B → C", "+0.6", "−1.2", "C", "1157.512", "1977.544"],
          ["C → D", "+0.7", "−1.4", "D", "1055.050", "1915.323"],
          ["D → A", "+0.6", "−1.2", "A", "1000.000", "2000.000"],
        ]}
        foot={["Sum", "+2.6", "−5.3", "", "", ""]}
        caption="The corrections add up to the misclosure with the opposite sign, and the loop now closes on A exactly. Coordinates are carried with the unrounded values."
      />

      <h2>Bowditch, Transit or least squares?</h2>
      <ul>
        <li><strong>Bowditch</strong> spreads the error by leg length. Use it when angles and distances are about equally good.</li>
        <li><strong>Transit</strong> spreads it by the size of each ΔE and ΔN, so it changes bearings less. Use it when the angles are better than the distances.</li>
        <li><strong>Least squares</strong> weighs every angle and distance by its standard error and gives residuals and a statistical test: the most rigorous choice for control.</li>
      </ul>

      <h2>Doing it without the arithmetic</h2>
      <p>
        <Link href="/traverse">Traverse &amp; Level</Link> does every step above as you type: the angular check, the bearings, the
        misclosure, the precision against your requirement, and the adjusted coordinates by Bowditch, Transit, Equal or least squares,
        with <strong>Accepted</strong> or <strong>Rejected</strong> straight away. Save the job to your account, print the report with
        Surveyed, Checked and Approved boxes, and share it with your checker. For a quick one-off, the free{" "}
        <Link href="/tools/traverse-adjustment">traverse adjustment calculator</Link> works in the browser with nothing to sign in to.
      </p>
    </GuideLayout>
  );
}
