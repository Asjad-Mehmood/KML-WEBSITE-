import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import GuideTable from "../../../components/GuideTable";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "draw-a-road-in-autocad";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What you need</h2>
      <ul>
        <li>Full <strong>AutoCAD, Civil 3D or Map 3D 2014 or newer</strong>. AutoCAD LT is not supported.</li>
        <li>
          <Link href="/roadpro">RoadPro</Link>, a free plugin: one zip with RoadPro.lsp, the RP_PAVER hatch pattern and install notes.
        </li>
        <li>A drawing in metres (millimetre drawings work too: choose Millimeters under Drawing units in the dialog).</li>
        <li>The drawing saved first, because the Excel report is saved in the drawing&apos;s folder.</li>
      </ul>

      <h2>Load RoadPro once</h2>
      <ol>
        <li>Type <strong>APPLOAD</strong> in the AutoCAD command line.</li>
        <li>Select <strong>RoadPro.lsp</strong> and click <strong>Load</strong>.</li>
        <li>Under <strong>Contents</strong>, add it to the <strong>Startup Suite</strong> so it loads in every session.</li>
        <li>Type <strong>RDP</strong> to open the RoadPro dialog.</li>
      </ol>

      <h2>Draw the road</h2>
      <ol>
        <li>
          <strong>Set the options.</strong> RDP opens the dialog with the defaults ready (below). Change what your job needs, such as
          the road width or the edge treatment, and press OK.
        </li>
        <li>
          <strong>Give the centre line.</strong> Pick points (arcs are allowed, Enter to finish) or select an existing line or
          polyline. In Civil 3D you can select an alignment.
        </li>
        <li>
          <strong>RoadPro builds it.</strong> The turning radius at every bend, both edges, the centre line, the road surface,
          barricades, cones or kerb stone along the edges, and chainage ticks and labels.
        </li>
        <li><strong>Signs and ends:</strong> signs with their IDs, a tie-in or road-closed end, and lane arrows.</li>
        <li><strong>The report:</strong> a summary on screen, the Excel file saved, and you place the report tables.</li>
        <li><strong>The cross section:</strong> pick a point to place the typical section.</li>
      </ol>
      <p>
        Press <strong>U</strong> once to undo the whole road, and <strong>F2</strong> to see the summary and where the Excel file was
        saved.
      </p>

      <h2>The defaults worth checking</h2>
      <GuideTable
        head={["Setting", "Default"]}
        rows={[
          ["Road width", "7.30 m"],
          ["Turning radius", "Match existing, or 10 m at the centre line"],
          ["Edge / centre", "Barricades / centre lines"],
          ["Barricade unit", "2.0 × 0.5 m, 0.5 m from the edge"],
          ["Paved shoulder", "0.50 m"],
          ["Chainage", "Every 20 m"],
          ["Speed limit", "30 km/h"],
          ["Crossfall", "2.5%"],
          ["Lane / median width", "3.65 m / 3.00 m"],
        ]}
        caption="Sign sizes, warning distances and markings follow the Oman Highway Design Standards 2017 (GCC Manual based). For Qatar, check them against QTCM and QHDM. Every value can be changed in the dialogs."
      />
      <p>
        At the centre line the turning radius must be more than half the road width, or the edges can&apos;t be offset round the bend.
      </p>

      <h2>After the road is built</h2>
      <ul>
        <li><strong>RDC</strong> adds lanes, a median, sidewalks, walkways with a paver hatch, drains and utility strips; <strong>RDU</strong> redraws them after edits.</li>
        <li><strong>RDM</strong> draws the road markings: edge lines, the lane and centre line with its pattern set by speed, and lines at bends.</li>
        <li><strong>RDER</strong> changes a curve&apos;s radius and rebuilds the road; <strong>RDB</strong> rebuilds it after you edit the centre line by hand.</li>
        <li><strong>RDRAD</strong> and <strong>RDSEC</strong> label the curve data (TC, CT, C1 …) and the straights (S1 …) on the plan.</li>
        <li><strong>RDX</strong> draws cross sections: the typical one, at a chainage, or at every interval.</li>
        <li><strong>RDLX</strong> exports the centre line as a LandXML alignment for Civil 3D.</li>
      </ul>
      <p>
        Joining roads and adding lanes are in{" "}
        <Link href="/guides/road-junction-and-turning-lane-autocad">road junctions, widening and turning lanes</Link>, and what the
        Excel report lists is in <Link href="/guides/road-quantities-and-setting-out-report">road quantities and setting-out data</Link>.
      </p>

      <h2>Before you rely on it</h2>
      <p>
        RoadPro draws to the values you give it; the design engineer confirms the road. Try a new version on a copy of a drawing
        first, and check the lane counts, drains and utility strips, which are geometric provisions rather than a design. The{" "}
        <Link href="/roadpro#demo">three-minute demo</Link> shows a full road built in Civil 3D.
      </p>
    </GuideLayout>
  );
}
