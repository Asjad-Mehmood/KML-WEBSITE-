import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import GuideTable from "../../../components/GuideTable";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "road-quantities-and-setting-out-report";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>Where the report comes from</h2>
      <p>
        Every road drawn with <Link href="/roadpro">RoadPro</Link> carries its own settings, so the quantities are counted from what is
        actually in the drawing. The report is made when the road is built, and <strong>RDR</strong> makes it again for any RoadPro
        road after changes. It comes two ways:
      </p>
      <ul>
        <li><strong>Tables in the drawing</strong>, which you place, for the drawing sheet.</li>
        <li>
          <strong>A CSV file for Excel</strong>, saved next to the DWG and named like <strong>ROAD-01_RoadPro_Report.csv</strong>. Save
          the drawing before you build the road, so it has a folder to go in. Press F2 to see the full path.
        </li>
      </ul>

      <h2>What it lists</h2>
      <GuideTable
        head={["Section", "What is in it"]}
        rows={[
          ["Summary", "General details, geometry, barricades, signs, road ends, chainage"],
          ["Curve data", "TC / CT chainage, radius, arc, deflection, E / N"],
          ["Road sections", "Every straight and curve with length, edges and area"],
          ["Setting-out", "E / N of the centre line and both edges at every chainage"],
          ["Sign schedule", "ID, sign, chainage, side, facing and post E / N"],
          ["Widening, junction, corridor", "New edge offsets, kerb returns TC / IP / CT with E / N, lanes, median, sidewalks, drains"],
          ["Quantities", "Barricades red / white, traffic cones (nos), kerb stone (m) per side, shoulder area"],
          ["Road markings", "Edge and lane line lengths, and paint area in m²"],
        ]}
      />

      <h2>Using it on site and in the office</h2>
      <ul>
        <li>
          <strong>Ordering:</strong> the quantities give red and white barricades separately, cones by number and kerb stone by length,
          for each side of the road.
        </li>
        <li>
          <strong>Setting out:</strong> the eastings and northings of the centre line and both edges at every chainage go straight
          into a total station job. To see them on a map or send them to a client, open the CSV in{" "}
          <Link href="/download">Excel to KML</Link> and save a KMZ for Google Earth on the project&apos;s grid.
        </li>
        <li>
          <strong>Signs:</strong> the sign schedule gives every sign&apos;s ID, chainage, side, which way it faces and the post&apos;s
          coordinates.
        </li>
        <li>
          <strong>Curves:</strong> the curve data matches the labels RDRAD puts on the plan. To check a curve&apos;s tangent length or
          set it out by deflection angles, use the free <Link href="/tools/horizontal-curve">horizontal curve calculator</Link>.
        </li>
        <li>
          <strong>Civil 3D:</strong> RDLX exports the centre line as a LandXML 1.2 alignment (Insert → LandXML in Civil 3D).
        </li>
      </ul>

      <h2>If the file isn&apos;t saved</h2>
      <p>
        Excel locks a CSV while it is open. Close the old report in Excel, then run <strong>RDR</strong> again.
      </p>
    </GuideLayout>
  );
}
