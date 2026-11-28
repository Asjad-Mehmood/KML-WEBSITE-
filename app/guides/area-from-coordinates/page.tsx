import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/content/guideMeta";

const SLUG = "area-from-coordinates";
export const metadata = guideMetadata(SLUG);

const EXAMPLE: [string, number, number][] = [
  ["A", 1000.0, 2000.0],
  ["B", 1040.0, 2000.0],
  ["C", 1040.0, 2025.0],
  ["D", 1000.0, 2025.0],
];

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>The shoelace formula</h2>
      <p>
        For a plot with corners 1, 2, … n in order around the boundary, with eastings E and northings N in metres:
      </p>
      <p>
        <strong>Area = ½ × | Σ (E<sub>i</sub> × N<sub>i+1</sub> − E<sub>i+1</sub> × N<sub>i</sub>) |</strong>
      </p>
      <p>
        After the last corner you go back to the first one, which closes the shape. The result is in square metres. It works for any
        simple polygon, whatever its shape, as long as the sides don&apos;t cross.
      </p>

      <h2>A worked example</h2>
      <table>
        <thead>
          <tr>
            <th>Corner</th>
            <th>Easting (m)</th>
            <th>Northing (m)</th>
          </tr>
        </thead>
        <tbody>
          {EXAMPLE.map(([p, e, n]) => (
            <tr key={p}>
              <td>{p}</td>
              <td>{e.toFixed(3)}</td>
              <td>{n.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        A 40 m by 25 m rectangle: the formula gives ½ × |(1000×2000 − 1040×2000) + (1040×2025 − 1040×2000) + (1040×2025 − 1000×2025) +
        (1000×2000 − 1000×2025)| = ½ × |−80,000 + 26,000 + 81,000 − 25,000| = ½ × 2,000 = <strong>1,000 m²</strong>, the same as 40 × 25.
      </p>

      <h2>In Excel, in one formula</h2>
      <p>
        Put the eastings in column B and the northings in column C, from row 2 down, and <strong>repeat the first corner at the end</strong>{" "}
        (for four corners: rows 2 to 5, and the first corner again in row 6). Then:
      </p>
      <p>
        <code>=ABS(SUMPRODUCT(B2:B5,C3:C6)-SUMPRODUCT(B3:B6,C2:C5))/2</code>
      </p>
      <p>For more corners, stretch the ranges: the first range in each SUMPRODUCT stops one row before the repeated corner.</p>

      <h2>Units</h2>
      <ul>
        <li>Hectares: square metres ÷ 10,000</li>
        <li>Acres: square metres ÷ 4,046.856</li>
        <li>Square feet: square metres × 10.7639</li>
        <li>Coordinates in feet give square feet: convert the coordinates or the result, not both.</li>
      </ul>

      <h2>Mistakes that give the wrong area</h2>
      <ul>
        <li>
          <strong>Latitude and longitude.</strong> The formula needs grid coordinates in metres or feet. Degrees give a meaningless number.
          Convert to UTM or the national grid first (<Link href="/guides/latitude-longitude-to-utm">latitude/longitude to UTM</Link>).
        </li>
        <li>
          <strong>Corners out of order.</strong> They must follow the boundary round, clockwise or anticlockwise. Jumping across the plot
          makes the sides cross and the area comes out too small.
        </li>
        <li>
          <strong>Grid area and ground area.</strong> On a projected grid the area is slightly larger or smaller than on the ground, by the
          square of the scale factor. Near the edge of a UTM zone that can be several parts in ten thousand: say so if the area is for a
          legal document.
        </li>
      </ul>

      <h2>Without a spreadsheet</h2>
      <p>
        The free <Link href="/tools/plot-area">plot area calculator</Link> takes pasted corners and gives square metres, hectares, acres, kanal and marla.
        In the Excel to KML app, a closed boundary drawn from your points shows its area in square metres and hectares: see{" "}
        <Link href="/guides/boundaries-and-land-area-in-google-earth">boundaries and land area</Link>.
      </p>
    </GuideLayout>
  );
}
