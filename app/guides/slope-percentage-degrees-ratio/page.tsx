import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/content/guideMeta";

const SLUG = "slope-percentage-degrees-ratio";
export const metadata = guideMetadata(SLUG);

// percent → degrees and 1 in N, worked out here so the table is always right
const ROWS: [number, string][] = [
  [0.5, "Minimum fall for many drains and pipes"],
  [1, "Flat-looking ground, car parks"],
  [2, "Road crossfall (camber), footpaths"],
  [2.5, "Typical road crossfall"],
  [5, "A noticeable road gradient"],
  [8.33, "Steepest usual ramp for wheelchairs (1 in 12)"],
  [10, "A steep road"],
  [33.3, "A 1V:3H embankment"],
  [50, "A 1V:2H cutting or embankment"],
  [100, "45°: 1V:1H"],
];

const deg = (pct: number) => (Math.atan(pct / 100) * 180) / Math.PI;

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>From two levels</h2>
      <p>
        Slope compares the rise (the difference in level) with the run (the horizontal distance between the two points):
      </p>
      <ul>
        <li>
          <strong>Percent</strong> = rise ÷ run × 100
        </li>
        <li>
          <strong>1 in N</strong>: N = run ÷ rise
        </li>
        <li>
          <strong>Degrees</strong> = arctan(rise ÷ run)
        </li>
        <li>
          <strong>V:H</strong> (as on embankment drawings): 1 : run ÷ rise
        </li>
      </ul>
      <p>
        Example: a road rises from 12.350 m at chainage 0+100 to 13.150 m at 0+140. Rise 0.800 m, run 40 m: 0.8 ÷ 40 = 0.02, so{" "}
        <strong>2%</strong>, <strong>1 in 50</strong>, <strong>1.15°</strong>.
      </p>
      <p>
        Use the horizontal distance, not the distance measured along the slope. For gentle slopes the difference is tiny; for embankments
        it matters.
      </p>

      <h2>Common slopes</h2>
      <table>
        <thead>
          <tr>
            <th>Percent</th>
            <th>1 in N</th>
            <th>Degrees</th>
            <th>Where you see it</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([pct, where]) => (
            <tr key={pct}>
              <td>{pct}%</td>
              <td>1 in {+(100 / pct).toFixed(1)}</td>
              <td>{deg(pct).toFixed(2)}°</td>
              <td>{where}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Check the limits in your own specification: they differ between countries and clients.</p>

      <h2>In Excel</h2>
      <ul>
        <li>
          Percent from levels in B2 and B3, chainages in A2 and A3: <code>=(B3-B2)/(A3-A2)*100</code>
        </li>
        <li>
          Degrees from percent in C2: <code>=DEGREES(ATAN(C2/100))</code>
        </li>
        <li>
          Percent from degrees in D2: <code>=TAN(RADIANS(D2))*100</code>
        </li>
        <li>
          1 in N from percent in C2: <code>=100/C2</code>
        </li>
      </ul>

      <h2>The level at any chainage</h2>
      <p>
        Level = start level + slope × distance from the start. At 2% from 12.350 m, the level 25 m along is 12.350 + 0.02 × 25 ={" "}
        <strong>12.850 m</strong>. Slope Calculator does this for every chainage at once and draws the profile; the{" "}
        <Link href="/guides/chainage-offset-and-level-profile">chainage and level profile guide</Link> shows the Excel to KML side.
      </p>
    </GuideLayout>
  );
}
