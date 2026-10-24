import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "traverse-misclosure-and-precision";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>Two checks, in this order</h2>
      <p>
        A closed traverse is checked twice before anything is adjusted: first the <strong>angles</strong>, then the{" "}
        <strong>position</strong>. The order matters, because a bad angle swings every bearing after it and shows up as a big linear
        misclosure that no distance can explain.
      </p>

      <h2>Angular misclosure</h2>
      <p>
        For a closed loop of n stations, the interior angles should add up to <strong>(n − 2) × 180°</strong> (the exterior angles to
        (n + 2) × 180°). For a link traverse between two known lines, the bearing carried through the angles should arrive at the
        closing bearing. The difference is the angular misclosure.
      </p>
      <p>
        It is compared with an allowance that grows with the number of angles, usually written <strong>±C√n seconds</strong>. C
        depends on the instrument and the order of the work and comes from your specification; for example, C = 15&quot; allows
        ±30&quot; on a four-angle loop. Within the allowance, the misclosure is shared equally between the angles.
      </p>

      <h2>Linear misclosure</h2>
      <p>
        With the balanced angles, work out each leg&apos;s change in easting and northing. Round a loop they should add up to zero; on a
        link traverse they should add up to the difference between the known start and end points. What is left is the misclosure
        in eastings (eE) and northings (eN), and the <strong>linear misclosure</strong> is √(eE² + eN²).
      </p>

      <h2>Precision: what 1 : 10,000 means</h2>
      <p>
        The precision compares the misclosure with how far you went: <strong>1 : (total length ÷ linear misclosure)</strong>. A
        traverse 1,250 m long that misses by 0.050 m has a precision of 1 : 25,000. <strong>1 : 10,000</strong> means no more than
        1 mm of misclosure for every 10 m traversed, or 10 cm over a kilometre.
      </p>
      <p>
        The figure you need is in the job specification. It is often somewhere between 1 : 5,000 for minor site work and 1 : 20,000
        or better for control; a bigger second number is a better traverse.
      </p>

      <h2>When a traverse fails</h2>
      <p>
        Never lower the required precision to make a traverse pass. Find the cause first; most failures are a single blunder, not bad
        measuring.
      </p>
      <ul>
        <li>
          <strong>Check the known points:</strong> the start and closing coordinates, the backsight and the closing reference are typed
          correctly and on the same grid.
        </li>
        <li>
          <strong>Angles fail:</strong> look for a booking slip, an angle typed as decimal degrees instead of d.mmss (124.3129 is
          124°31&apos;29&quot;, not 124.3129°), a wrong backsight, or an angle measured anticlockwise. To find one bad angle, compute
          the traverse forwards from the start and backwards from the end: the station where both give nearly the same coordinates
          is where the error is.
        </li>
        <li>
          <strong>Angles pass but the position fails:</strong> suspect a distance. The bearing of the misclosure (from eE and eN) will
          be close to the bearing of the leg with the bad distance, and its size close to the error. Check the slope versus horizontal
          distance, the prism constant and the reflector height.
        </li>
        <li>
          <strong>Grid or ground:</strong> distances measured on the ground and coordinates on a map grid differ by the scale factor.
          Over a long traverse that alone can fail a tight precision.
        </li>
      </ul>

      <h2>Checking it as you type</h2>
      <p>
        <Link href="/traverse">Traverse &amp; Level</Link> shows the angular check, the misclosure in E and N, the linear misclosure
        and the precision against your requirement while you enter the field book, with <strong>Accepted</strong> or{" "}
        <strong>Rejected</strong> at once. On the Qatar National Grid it works out the scale factor where the traverse is. When it
        passes, adjust by Bowditch, Transit, Equal or least squares; the worked example in{" "}
        <Link href="/guides/bowditch-traverse-adjustment">adjusting a closed traverse by the Bowditch rule</Link> shows every step.
        Its traverse simulator lets you watch a total station observe a traverse with realistic errors, which is good practice for
        spotting blunders.
      </p>
    </GuideLayout>
  );
}
