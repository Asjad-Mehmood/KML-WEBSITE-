import Link from "next/link";
import ToolLanding from "../../../components/tools/ToolLanding";
import { toolMetadata } from "@/lib/toolMeta";

const SLUG = "traverse-adjustment";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLanding
      slug={SLUG}
      notes={
        <>
          <h2>Entering a traverse</h2>
          <ul>
            <li>
              <strong>Control first:</strong> the start station needs known coordinates, and so does the reference object you sight
              from it (or type its bearing instead). A link traverse also needs the closing station and its reference.
            </li>
            <li>
              <strong>One row per station:</strong> the angle observed there and the distance to the next station. A loop ends with the
              closing angle back at the start; a link ends with the angle at the closing station.
            </li>
            <li>
              <strong>Angles</strong> are in d.mmss by default (124.3129 is 124°31&apos;29&quot;); decimal degrees and gon are under the
              angle format. Distances are horizontal, in metres.
            </li>
            <li>
              <strong>From Excel:</strong> copy the columns and paste into the first cell, or use Paste rows. Enter moves to the next
              cell and adds a row at the end.
            </li>
          </ul>
          <h2>Primary and secondary traverses</h2>
          <p>
            Work out the primary traverse first. Its adjusted stations become known points, so a secondary traverse can start on one
            and close on another, and a level run can start or close on them. Every station ends up in one list you can download.
          </p>
          <p>
            For many points at once, or to see the stations on Google Earth, the same Traverse adjust is in the{" "}
            <Link href="/download">Excel to KML app</Link>.
          </p>
        </>
      }
    />
  );
}
