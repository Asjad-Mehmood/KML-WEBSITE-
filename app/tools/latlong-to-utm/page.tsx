import Link from "next/link";
import ToolLayout from "../../../components/tools/ToolLayout";
import { toolMetadata } from "@/lib/toolMeta";
import UtmClient from "./UtmClient";

const SLUG = "latlong-to-utm";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLayout
      slug={SLUG}
      lead="Convert latitude and longitude to UTM easting, northing and zone on WGS 84 — or UTM back to latitude and longitude. The zone is worked out from the point; you can also convert into a neighbouring zone."
      notes={
        <>
          <h2>About UTM</h2>
          <p>
            UTM (Universal Transverse Mercator) splits the world into 60 zones, each 6° of longitude wide, numbered eastwards from 180°W.
            In every zone the central meridian has an easting of 500,000 m. Northings count up from 0 at the equator in the northern
            hemisphere, and down from 10,000,000 m in the southern hemisphere, so the same numbers can appear in both — always give the
            hemisphere with the zone.
          </p>
          <ul>
            <li>
              <strong>Zone letter:</strong> the letter after the zone number (for example 40<strong>R</strong>) is the MGRS latitude band. N
              and later letters are north of the equator; M and earlier are south.
            </li>
            <li>
              <strong>Exceptions:</strong> southwest Norway uses zone 32V and Svalbard uses 31X, 33X, 35X and 37X; the tool applies them.
            </li>
            <li>
              <strong>Datum:</strong> this tool is on WGS 84 (EPSG:326xx north, 327xx south). Older national UTM grids on other datums
              (ED50, Nahrwan, Clarke 1880) differ by up to a few hundred metres — use the{" "}
              <Link href="/convert">grid pages</Link> for those.
            </li>
          </ul>
          <p>
            To find the zone for any spot by clicking a map, use <Link href="/tools/coordinates-on-map">coordinates on a map</Link>. The guide{" "}
            <Link href="/guides/find-your-utm-zone">how to find your UTM zone</Link> lists the zones for common regions.
          </p>
        </>
      }
    >
      <UtmClient />
    </ToolLayout>
  );
}
