import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "convert-many-sheets-at-once";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>When to use it</h2>
      <p>
        A week of daily downloads, one sheet per plot, or a survey split by area: when every sheet is on the same grid and should look
        the same in Google Earth, convert them together instead of one at a time.
      </p>

      <h2>Set up once</h2>
      <p>Batch uses whatever is set when you start it, for every sheet. So first:</p>
      <ol>
        <li>
          Open one of the sheets in the <WebAppLink>web app</WebAppLink> or the Windows app.
        </li>
        <li>
          Choose the <strong>Coordinate system</strong> and check a known point on the map.
        </li>
        <li>
          Set up <strong>Symbols and labels</strong>, <strong>Lines and areas</strong> and <strong>Balloon contents</strong> the way you
          want every file to look.
        </li>
      </ol>

      <h2>Run the batch</h2>
      <ol>
        <li>
          Under <strong>Points in</strong>, press <strong>Batch</strong>.
        </li>
        <li>Select all the sheets at once — CSV, TXT, TSV, .xlsx or .xlsm. For a workbook, its first sheet with data is used.</li>
        <li>
          Each sheet is read and saved in turn, and the whole lot comes back as <strong>one zip</strong>: a Google Earth file per
          sheet, named after the sheet, plus <strong>batch summary.csv</strong>. Each file is a KML, or a KMZ when your logo or your own
          marker images have to travel inside it.
        </li>
      </ol>
      <p>
        Your own rows are put back when the batch finishes, so nothing you were working on is lost.
      </p>

      <h2>Read the summary</h2>
      <p>
        The summary lists every sheet with the points converted, the rows left out and the file it was saved as. A sheet that
        couldn&apos;t be read, or had no usable points, says so instead of being skipped silently. Rows left out are usually missing a
        coordinate or have text in a number column — open that sheet on its own to see which.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>Sheets on different grids need separate batches, one per grid.</li>
        <li>For Excel, DXF or GIS files, open each sheet and use the Save menu; batch writes Google Earth files.</li>
        <li>
          If the sheets have no heading row, set the column order on the first one before starting — see{" "}
          <Link href="/guides/prepare-survey-spreadsheet">laying out a survey spreadsheet</Link>.
        </li>
        <li>
          Batch files don&apos;t carry site photos. For a KMZ with photos, convert that sheet on its own — see{" "}
          <Link href="/guides/total-station-csv-to-kmz-with-photos">CSV to KMZ with site photos</Link>.
        </li>
      </ul>
    </GuideLayout>
  );
}
