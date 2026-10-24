import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import GuideTable from "../../../components/GuideTable";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "level-book-rise-and-fall-height-of-instrument";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>The readings</h2>
      <p>
        A level run starts on benchmark <strong>BM-01</strong> (reduced level, RL, 10.000 m), takes a level on a kerb at{" "}
        <strong>A</strong> and closes back on BM-01, with two change points (TP-1 and TP-2), so there are three set-ups of the level:
      </p>
      <ul>
        <li><strong>BS (backsight):</strong> the first reading after setting up, on a point of known or just-found level.</li>
        <li><strong>IS (intermediate sight):</strong> any reading in between, here the kerb at A.</li>
        <li><strong>FS (foresight):</strong> the last reading before the level moves, on a change point or the closing benchmark.</li>
      </ul>

      <h2>Method 1: rise and fall</h2>
      <p>
        Compare each reading with the one before it from the same set-up. A smaller reading means the ground is higher: a{" "}
        <strong>rise</strong>. A bigger one is a <strong>fall</strong>. Each RL is the previous RL plus the rise or minus the fall.
      </p>
      <GuideTable
        head={["Station", "BS", "IS", "FS", "Rise", "Fall", "RL", "Remark"]}
        rows={[
          ["BM-01", "1.425", "", "", "", "", "10.000", "Benchmark"],
          ["TP-1", "0.982", "", "1.836", "", "0.411", "9.589", "Change point"],
          ["A", "", "2.104", "", "", "1.122", "8.467", "Kerb top"],
          ["TP-2", "1.640", "", "1.211", "0.893", "", "9.360", "Change point"],
          ["BM-01", "", "", "1.010", "0.630", "", "9.990", "Close on benchmark"],
        ]}
        foot={["Sum", "4.047", "", "4.057", "1.523", "1.533", "", ""]}
      />
      <p>For example, 1.425 at BM-01 then 1.836 at TP-1 is a fall of 0.411, so TP-1 is 10.000 − 0.411 = 9.589.</p>
      <p><strong>The arithmetic check:</strong> all three of these must be the same number.</p>
      <ul>
        <li>ΣBS − ΣFS = 4.047 − 4.057 = <strong>−0.010</strong></li>
        <li>ΣRise − ΣFall = 1.523 − 1.533 = <strong>−0.010</strong></li>
        <li>Last RL − first RL = 9.990 − 10.000 = <strong>−0.010</strong></li>
      </ul>
      <p>
        If they don&apos;t agree, there is a slip in the sums or the reduction, not in the field. Rise and fall checks every
        intermediate sight too, which is why it is preferred for work that will be checked.
      </p>

      <h2>Method 2: height of instrument (HI)</h2>
      <p>
        The height of the instrument&apos;s line of sight is the RL plus the backsight. Every other reading from that set-up is the HI
        minus the reading.
      </p>
      <GuideTable
        head={["Station", "BS", "IS", "FS", "HI", "RL"]}
        rows={[
          ["BM-01", "1.425", "", "", "11.425", "10.000"],
          ["TP-1", "0.982", "", "1.836", "10.571", "9.589"],
          ["A", "", "2.104", "", "", "8.467"],
          ["TP-2", "1.640", "", "1.211", "11.000", "9.360"],
          ["BM-01", "", "", "1.010", "", "9.990"],
        ]}
      />
      <p>
        The same levels come out, with less writing, so HI is quick for setting out many levels from one set-up. Its simple check
        (ΣBS − ΣFS = last RL − first RL) does not test the intermediate sights. The full check does:{" "}
        <strong>Σ(each HI × the number of IS and FS taken from it) − ΣIS − ΣFS = the sum of every RL except the first</strong>.
        Here: 11.425 + 2 × 10.571 + 11.000 − 2.104 − 4.057 = 37.406, and 9.589 + 8.467 + 9.360 + 9.990 = 37.406.
      </p>

      <h2>Is the misclosure acceptable?</h2>
      <p>
        The run should have closed on 10.000 but came back at 9.990: a <strong>misclosure of −10 mm</strong>. The allowable is set by
        the specification, usually <strong>±C√n mm</strong> for n set-ups or <strong>±C√K mm</strong> for K kilometres of levelling.
        With C = 10 mm and three set-ups, the allowable is ±10√3 = <strong>±17.3 mm</strong>, so the run is accepted.
      </p>

      <h2>Spreading the correction</h2>
      <p>
        The correction is +10 mm, shared equally between the three set-ups and added up as you go: +3.3 mm on everything from the
        first set-up&apos;s foresight, +6.7 mm on the second set-up&apos;s readings, +10.0 mm on the closing benchmark.
      </p>
      <GuideTable
        head={["Station", "RL", "Correction (mm)", "Adjusted RL"]}
        rows={[
          ["BM-01", "10.000", "0.0", "10.000"],
          ["TP-1", "9.589", "+3.3", "9.592"],
          ["A", "8.467", "+6.7", "8.474"],
          ["TP-2", "9.360", "+6.7", "9.367"],
          ["BM-01", "9.990", "+10.0", "10.000"],
        ]}
        caption="The adjusted run closes on the benchmark's known level."
      />

      <h2>Doing it without the arithmetic</h2>
      <p>
        In <Link href="/traverse">Traverse &amp; Level</Link>, type the start and closing benchmarks, then BS, IS and FS on one row per
        point (or paste them from Excel, or import a CSV). Choose Rise &amp; Fall or HI and the app runs the arithmetic checks,
        compares the misclosure with your allowable, and shows the corrections and adjusted RLs with Accepted or Rejected. The
        levelling report prints with boxes for Surveyed, Checked and Approved by. The free{" "}
        <Link href="/tools/traverse-adjustment">traverse and level calculator</Link> does the same in the browser for a quick check.
      </p>
    </GuideLayout>
  );
}
