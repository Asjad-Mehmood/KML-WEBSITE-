import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import GuideTable from "../../../components/GuideTable";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "road-junction-and-turning-lane-autocad";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <p>
        These commands work on a road already drawn with <Link href="/roadpro">RoadPro</Link> (see{" "}
        <Link href="/guides/draw-a-road-in-autocad">how to draw a complete road from a centre line</Link>). Chainages can be typed as
        100 or 0+100.
      </p>

      <h2>A junction: RDJ</h2>
      <p>
        <strong>RDJ</strong> joins a new road to an existing RoadPro road. Start the branch&apos;s centre line on the main road&apos;s
        centre line, away from any widened or tapered edge, and RoadPro forms the junction:
      </p>
      <ul>
        <li>kerb returns with the radius you choose, and the main road&apos;s edge opened between them;</li>
        <li>the corner surface, and the corner treatment: barricades, traffic cones or kerb stone, or the same as the main road;</li>
        <li>STOP or GIVE WAY and the turning-area markings;</li>
        <li>optionally an <strong>auxiliary (turning) lane</strong>: a long approach taper, a storage length and a short departure taper;</li>
        <li>optionally a kerbed or painted <strong>splitter island</strong>.</li>
      </ul>
      <p>
        RoadPro warns if a lane beside the island would be narrower than 2.75 m: make the island narrower or the branch road wider.
        The report lists the kerb returns&apos; TC, IP and CT with their coordinates.
      </p>

      <h2>An extra lane between two chainages: RDW</h2>
      <p>
        <strong>RDW</strong> widens the road for a stretch and brings it back, with straight or curved tapers at each end. Each side
        can have its own chainages and radius, and the barricades, cones or kerb stone move out to the new edge. The start must be at
        least the taper-in length along the road, and the end plus the taper-out must stay within the road.
      </p>

      <h2>A permanent change of width: RDT</h2>
      <p>
        <strong>RDT</strong> makes the road wider (+) or narrower (−) between two chainages, and the new width carries on to the road
        end. As with RDW, each side can differ and the edge treatment follows the new edge.
      </p>

      <h2>The defaults</h2>
      <GuideTable
        head={["Item", "Default"]}
        rows={[
          ["Widening / taper", "3.65 m / 30 m"],
          ["Auxiliary lane", "3.65 m, tapers 60 m / 30 m, storage 30 m"],
          ["Junction corners", "Same as the main road edge"],
        ]}
        caption="Change them in the dialog to suit the design and the standard you work to."
      />

      <h2>Markings and a single line of barricades</h2>
      <ul>
        <li>
          <strong>RDM</strong> redraws the markings after a junction or widening: gaps at junctions and a broken line beside auxiliary
          lanes. Run it again to refresh, or to remove them.
        </li>
        <li>
          <strong>RDL</strong> places one run of barricades, traffic cones or kerb stone along any line, polyline, arc or circle, on
          the line or to either side, between two distances, with a quantity label. It needs no road, so it suits a site boundary or
          a work zone. If it places nothing, the From / To distances are outside the line or the spacing is longer than it.
        </li>
      </ul>

      <h2>Quantities</h2>
      <p>
        Junctions, widenings and tapers are in the report with their new edge offsets and areas, so the quantities stay right. See{" "}
        <Link href="/guides/road-quantities-and-setting-out-report">road quantities and setting-out data from AutoCAD to Excel</Link>.
      </p>
    </GuideLayout>
  );
}
