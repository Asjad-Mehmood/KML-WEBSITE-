import Link from "next/link";
import ToolLayout from "../../../components/tools/ToolLayout";
import { toolMetadata } from "@/lib/toolMeta";
import PlotClient from "./PlotClient";

const SLUG = "plot-area";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLayout
      slug={SLUG}
      lead="Paste the corners of a plot — eastings and northings from a survey, or latitude and longitude from a GPS or Google Maps — and get its area in square metres, hectares, acres, kanal and marla, with the perimeter and a sketch to check the shape."
      notes={
        <>
          <h2>Getting the right area</h2>
          <ul>
            <li>
              <strong>Corners in order:</strong> go round the plot, clockwise or anticlockwise. If two sides cross, the corners are out of
              order and the area is wrong; the tool warns you and the sketch shows where.
            </li>
            <li>
              <strong>Don&apos;t repeat the first corner</strong> at the end; the shape is closed for you (a repeated last corner is ignored).
            </li>
            <li>
              <strong>Eastings and northings</strong> give the area on that grid, the way a drawing or CAD program measures it. A point name
              before the coordinates is fine, and a level after them is ignored. Leave out thousands separators.
            </li>
            <li>
              <strong>Latitude and longitude</strong> are measured on the ground: the corners are put on the plot&apos;s UTM zone and the
              zone&apos;s scale is taken out, so the answer matches a ground survey to within a few parts per million.
            </li>
          </ul>
          <h2>Kanal and marla</h2>
          <p>
            The kanal and marla here use the standard 272.25 ft² marla (1 kanal = 20 marla = 5,445 ft²). Many housing societies use a
            225 ft² marla instead; the <Link href="/tools/area-converter">land area converter</Link> has both.
          </p>
          <p>
            For boundaries drawn in Google Earth with their areas, see{" "}
            <Link href="/guides/boundaries-and-land-area-in-google-earth">boundaries and land area</Link>.
          </p>
        </>
      }
    >
      <PlotClient />
    </ToolLayout>
  );
}
