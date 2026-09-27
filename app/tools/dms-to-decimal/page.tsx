import ToolLayout from "../../../components/tools/ToolLayout";
import { toolMetadata } from "@/lib/toolMeta";
import DmsClient from "./DmsClient";

const SLUG = "dms-to-decimal";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLayout
      slug={SLUG}
      lead="Type a latitude and longitude in either form — decimal degrees like 25.193080, or degrees, minutes and seconds like 25°11'35.1&quot;N — and get the other. Or paste a whole column from Excel."
      notes={
        <>
          <h2>How the conversion works</h2>
          <p>
            Decimal degrees = degrees + minutes ÷ 60 + seconds ÷ 3600. South latitudes and west longitudes are negative. For example,
            25°11&apos;35.1&quot;N is 25 + 11/60 + 35.1/3600 = 25.193083.
          </p>
          <h2>What you can type</h2>
          <ul>
            <li>Decimal degrees: <code>25.193080</code>, <code>-33.8688</code></li>
            <li>Degrees, minutes, seconds: <code>25°11&apos;35.1&quot;N</code>, <code>25 11 35.1 N</code>, <code>N 25°11&apos;35.1&quot;</code>, <code>25d11m35.1s</code></li>
            <li>Degrees and decimal minutes (GPS style): <code>25°11.585&apos;N</code></li>
          </ul>
          <p>
            In a list, put one point per line: latitude then longitude, separated by a tab (straight from Excel), a comma and space, a
            semicolon, or just the N/S and E/W letters.
          </p>
          <h2>How many decimals?</h2>
          <p>
            Six decimal places of a degree is about 0.1 m on the ground; eight is about a millimetre. Keep at least six for survey work. The
            guide <a href="/guides/dms-to-decimal-degrees">DMS to decimal degrees in Excel</a> has formulas for doing it inside a
            spreadsheet.
          </p>
        </>
      }
    >
      <DmsClient />
    </ToolLayout>
  );
}
