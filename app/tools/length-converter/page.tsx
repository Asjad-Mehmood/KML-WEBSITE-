import Link from "next/link";
import ToolLanding from "../../../components/tools/ToolLanding";
import { toolMetadata } from "@/lib/toolMeta";

const SLUG = "length-converter";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLanding
      slug={SLUG}
      notes={
        <>
          <h2>International foot or US survey foot?</h2>
          <p>
            The international foot is exactly 0.3048 m. The US survey foot is 1200/3937 m, about 2 parts per million longer — 2 mm in a
            kilometre, but about 1 m on a state plane northing of 10 million feet. Many older US state plane coordinates are in survey
            feet; since 2023 new US work uses the international foot. Check the grid&apos;s unit on its{" "}
            <Link href="/convert">grid page</Link>.
          </p>
          <h2>Old survey units</h2>
          <ul>
            <li><strong>Chain</strong> (Gunter&apos;s): 66 ft = 100 links = 4 rods; 80 chains make a mile, 10 square chains an acre.</li>
            <li><strong>Karam</strong>: 5.5 ft, used in land records in Pakistan and Indian Punjab.</li>
            <li><strong>Gaz</strong>: a yard (0.9144 m) as used in South Asia today.</li>
          </ul>
        </>
      }
    />
  );
}
