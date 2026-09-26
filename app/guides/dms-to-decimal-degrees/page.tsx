import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "dms-to-decimal-degrees";
export const metadata = guideMetadata(SLUG);

const SPLIT = "=A2+B2/60+C2/3600";
const TEXT =
  '=(LEFT(A2,FIND("°",A2)-1)+MID(A2,FIND("°",A2)+1,FIND("\'",A2)-FIND("°",A2)-1)/60+MID(A2,FIND("\'",A2)+1,FIND("""",A2)-FIND("\'",A2)-1)/3600)*IF(OR(RIGHT(A2)="S",RIGHT(A2)="W"),-1,1)';
const DDM = '=(LEFT(A2,FIND("°",A2)-1)+MID(A2,FIND("°",A2)+1,FIND("\'",A2)-FIND("°",A2)-1)/60)*IF(OR(RIGHT(A2)="S",RIGHT(A2)="W"),-1,1)';

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>Why it matters</h2>
      <p>
        Mapping programs, Excel to KML included, read latitude and longitude as plain decimal numbers: <strong>25.208472</strong>, not{" "}
        <strong>25°12&apos;30.5&quot;N</strong>. A column of degrees, minutes and seconds has to be converted first, or points land in the
        wrong place.
      </p>

      <h2>The arithmetic</h2>
      <p>
        Decimal degrees = degrees + minutes ÷ 60 + seconds ÷ 3600. South and west are negative.
      </p>
      <p>
        25°12&apos;30.5&quot;N → 25 + 12/60 + 30.5/3600 = <strong>25.208472</strong>
        <br />
        55°16&apos;45&quot;E → 55 + 16/60 + 45/3600 = <strong>55.279167</strong>
        <br />
        33°52&apos;10&quot;S → −(33 + 52/60 + 10/3600) = <strong>−33.869444</strong>
      </p>

      <h2>In Excel: degrees, minutes and seconds in separate columns</h2>
      <p>With degrees in A, minutes in B and seconds in C, put this in D2 and fill it down:</p>
      <pre className="whitespace-pre-wrap break-all">
        <code>{SPLIT}</code>
      </pre>
      <p>For southern latitudes or western longitudes, put a minus sign in front of the result.</p>

      <h2>In Excel: one text value like 25°12&apos;30.5&quot;N</h2>
      <p>With the value in A2, this formula reads the degrees, minutes, seconds and the N, S, E or W at the end:</p>
      <pre className="whitespace-pre-wrap break-all">
        <code>{TEXT}</code>
      </pre>
      <p>
        It expects the symbols °, &apos; and &quot;. If your sheet uses other marks — two single quotes for seconds, or spaces — use
        Find and Replace to change them first.
      </p>

      <h2>Degrees and decimal minutes (GPS style)</h2>
      <p>Handheld GPS units often show 25°12.508&apos;N. That&apos;s degrees + minutes ÷ 60, with no seconds:</p>
      <pre className="whitespace-pre-wrap break-all">
        <code>{DDM}</code>
      </pre>

      <h2>How many decimal places</h2>
      <p>
        Six decimal places of a degree is about 0.1 m; eight is about a millimetre. Keep at least six for survey work, and don&apos;t
        round the column before converting.
      </p>

      <h2>Then map it</h2>
      <p>
        Head the columns <strong>LATITUDE</strong> and <strong>LONGITUDE</strong>, open the sheet, and choose{" "}
        <strong>Latitude and longitude already — no conversion</strong> under Coordinate system. To get eastings and northings from
        them, see <Link href="/guides/latitude-longitude-to-utm">latitude and longitude to UTM</Link>.
      </p>
    </GuideLayout>
  );
}
