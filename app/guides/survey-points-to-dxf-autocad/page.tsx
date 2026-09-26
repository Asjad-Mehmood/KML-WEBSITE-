import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "survey-points-to-dxf-autocad";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What goes into the DXF</h2>
      <ul>
        <li>Every point as a 3D point at its easting, northing and level.</li>
        <li>The point name as a text label beside it.</li>
        <li>
          A layer for each code in your sheet — TREE, BM, FENCE — so they can be switched on and off. Points without a code go on a
          layer called POINTS.
        </li>
      </ul>

      <h2>Step by step</h2>
      <ol>
        <li>
          Open your sheet in the <Link href="/app">web app</Link> or the Windows app and choose the coordinate system.
        </li>
        <li>
          Check <strong>Grid for exported coordinates</strong>. A drawing needs grid coordinates, so points that came in as latitude
          and longitude (from a KML, for example) are put onto the grid named there. The same setting is used by Save CSV and Save
          Excel.
        </li>
        <li>
          Press <strong>Save DXF</strong>.
        </li>
      </ol>

      <h2>Opening it in AutoCAD</h2>
      <ul>
        <li>Use File → Open and choose the DXF file type, or drag the file into AutoCAD.</li>
        <li>
          Points show as tiny dots by default. Type <strong>PTYPE</strong> to pick a bigger point style.
        </li>
        <li>
          Coordinates are in the grid&apos;s units (usually metres), so the drawing lines up with other data on the same grid. Zoom
          Extents to find the points.
        </li>
      </ul>

      <h2>Other formats</h2>
      <p>
        For Civil 3D point import or a spreadsheet, <strong>Save CSV</strong> or <strong>Save Excel</strong> gives the same points with
        latitude and longitude added. For stake-out, the instrument formats (Leica GSI-16 and Trimble) are available too.
      </p>
    </GuideLayout>
  );
}
