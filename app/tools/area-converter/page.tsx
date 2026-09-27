import Link from "next/link";
import ToolLanding from "../../../components/tools/ToolLanding";
import { toolMetadata } from "@/lib/toolMeta";

const SLUG = "area-converter";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLanding
      slug={SLUG}
      notes={
        <>
          <h2>Local land units</h2>
          <ul>
            <li>
              <strong>Kanal and marla</strong> (Pakistan, Indian Punjab): 1 kanal = 20 marla. The standard (revenue) marla is 272.25 ft², so
              a kanal is 5,445 ft² (about 505.9 m²) and 8 kanal make an acre. Many housing societies use a 225 ft² marla and a 4,500 ft²
              kanal instead — both are listed; check which one a document uses.
            </li>
            <li><strong>Feddan</strong> (Egypt, Sudan): 4,200.83 m², a little over an acre.</li>
            <li><strong>Dunam or dönüm</strong> (Levant, Iraq, Turkey): the metric dunam is 1,000 m².</li>
            <li><strong>Guntha</strong> (India): 1,089 ft²; 40 guntha make an acre.</li>
            <li><strong>Cent</strong> (South India): 1/100 acre, 435.6 ft².</li>
          </ul>
          <p>
            Units like the bigha and jarib vary from one region to another, so they are left out rather than given a value that may be
            wrong where you are.
          </p>
          <p>
            To get an area from corner coordinates, use <Link href="/tools/plot-area">plot area from coordinates</Link>.
          </p>
        </>
      }
    />
  );
}
