import Link from "next/link";
import ToolLayout from "../../../components/tools/ToolLayout";
import { toolMetadata } from "@/lib/toolMeta";
import MapClient from "./MapClient";

const SLUG = "coordinates-on-map";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLayout
      slug={SLUG}
      lead="Click anywhere on the map, search for a place, type coordinates or use your own location — and get its latitude and longitude in every common form, its UTM zone, easting and northing, and a link to share it."
      notes={
        <>
          <h2>Getting a precise point</h2>
          <ul>
            <li>Zoom right in on the satellite view before clicking: at street level a click is within a metre or two.</li>
            <li>
              <strong>My location</strong> uses your phone or computer&apos;s location. The blue circle shows how accurate it is — a phone
              outdoors with GPS is usually within 5–10 m; a computer on Wi-Fi can be off by hundreds of metres. It is not survey grade.
            </li>
            <li>The satellite picture itself can be a few metres off in some places, so check against a known mark when it matters.</li>
          </ul>
          <h2>What the numbers mean</h2>
          <p>
            All values are on WGS 84, the datum GPS and Google Maps use. The light blue band on the map is the point&apos;s UTM zone. To
            convert a whole list, use <Link href="/tools/latlong-to-utm">lat/long ↔ UTM</Link> or open the web app.
          </p>
        </>
      }
    >
      <MapClient />
    </ToolLayout>
  );
}
