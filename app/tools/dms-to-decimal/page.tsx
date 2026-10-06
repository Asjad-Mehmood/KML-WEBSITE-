import Link from "next/link";
import ToolLanding from "../../../components/tools/ToolLanding";
import { toolMetadata } from "@/lib/toolMeta";

const SLUG = "dms-to-decimal";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLanding
      slug={SLUG}
      notes={
        <>
          <h2>How the conversion works</h2>
          <p>
            Decimal degrees = degrees + minutes ÷ 60 + seconds ÷ 3600. South latitudes and west longitudes are negative. For example,
            25°17&apos;06.1&quot;N is 25 + 17/60 + 6.1/3600 = 25.285028.
          </p>
          <h2>What you can type</h2>
          <ul>
            <li>Decimal degrees: <code>25.285028</code>, <code>-33.8688</code></li>
            <li>Degrees, minutes, seconds: <code>25°17&apos;06.1&quot;N</code>, <code>25 17 06.1 N</code>, <code>N 25°17&apos;06.1&quot;</code>, <code>25d17m06.1s</code></li>
            <li>Degrees and decimal minutes (GPS style): <code>25°11.585&apos;N</code></li>
          </ul>
          <p>
            In a list, put one point per line: latitude then longitude, separated by a tab (straight from Excel), a comma and space, a
            semicolon, or just the N/S and E/W letters.
          </p>
          <h2>How many decimals?</h2>
          <p>
            Six decimal places of a degree is about 0.1 m on the ground; eight is about a millimetre. Keep at least six for survey work. The
            guide <Link href="/guides/dms-to-decimal-degrees">DMS to decimal degrees in Excel</Link> has formulas for doing it inside a
            spreadsheet.
          </p>
        </>
      }
    />
  );
}
