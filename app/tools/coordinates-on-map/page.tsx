import Link from "next/link";
import ToolLanding from "../../../components/tools/ToolLanding";
import { toolMetadata } from "@/lib/toolMeta";

const SLUG = "coordinates-on-map";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLanding
      slug={SLUG}
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
    />
  );
}
