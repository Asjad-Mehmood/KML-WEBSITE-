import Link from "next/link";
import ToolLanding from "../../../components/tools/ToolLanding";
import { toolMetadata } from "@/lib/toolMeta";

const SLUG = "horizontal-curve";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLanding
      slug={SLUG}
      notes={
        <>
          <h2>The curve elements</h2>
          <ul>
            <li><strong>Tangent length T = R·tan(Δ/2):</strong> from the intersection point (IP) back to the start of the curve (TC) and on to its end (CT).</li>
            <li><strong>Curve length L = π·R·Δ/180:</strong> the length along the arc, so CT = TC + L (not IP + T).</li>
            <li><strong>Long chord C = 2R·sin(Δ/2):</strong> straight from TC to CT.</li>
            <li><strong>External E = R·(sec(Δ/2) − 1)</strong> and <strong>mid-ordinate M = R·(1 − cos(Δ/2))</strong>: from IP and from the long chord to the middle of the curve.</li>
          </ul>
          <h2>Setting out by deflection angles</h2>
          <p>
            Each peg&apos;s deflection from the tangent is half the angle the arc to it makes at the centre: δ = arc ÷ 2R, in radians. Set up
            on TC, sight IP, turn δ for each peg and measure the chord from the previous peg. The first and last chords are shorter
            because the pegs sit on whole chainages. If a peg is hidden, the offsets from the tangent let you set it from the tangent line
            instead.
          </p>
          <p>
            For a whole road with its curves, edges, signs and markings, <Link href="/roadpro">RoadPro</Link> draws it in AutoCAD from
            the centre line, with the TC / CT chainages and curve data labelled on the plan.
          </p>
        </>
      }
    />
  );
}
