import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "point-codes-and-symbols-in-google-earth";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>Why bother</h2>
      <p>
        A thousand identical yellow pins tell the client nothing. With a marker for each kind of point — a tree for trees, a target for
        benchmarks, a circle for manholes — the plan reads at a glance, and each kind becomes its own folder in Google Earth that can be
        switched on and off.
      </p>

      <h2>Step by step</h2>
      <ol>
        <li>
          Load a sheet with a column that says what each point is: a <strong>CODE</strong> column (TREE, MH, TBM, FENCE), or a
          description or remarks column.
        </li>
        <li>
          In the <WebAppLink>web app</WebAppLink> or the Windows app, open <strong>Symbols and labels</strong> and set{" "}
          <strong>Which column tells them apart</strong> to that column.
        </li>
        <li>
          Every kind gets a marker guessed from its wording — a row saying tree gets a tree, a benchmark gets a target. Change any you
          don&apos;t like.
        </li>
        <li>
          Choose the <strong>label</strong> beside each point (station name, code, level or none), its size, and from what height it
          appears, so a big job isn&apos;t a wall of text when zoomed out.
        </li>
        <li>Save KMZ. Each kind is a folder with its own marker.</li>
      </ol>

      <h2>Keep them for every job: the symbol library</h2>
      <p>
        Open <strong>Symbol library</strong> to set the marker and colour for each code once. Every job after that uses them.
      </p>
      <ul>
        <li>
          Codes in the current sheet are listed first, with how many points use them. Press <strong>Change</strong> to pick a marker
          and colour.
        </li>
        <li>
          A code that isn&apos;t in the library yet shows <strong>Keep</strong>; press it to add it. You can also type a new code, such
          as HYDRANT, and press <strong>Add</strong>.
        </li>
        <li>
          Standard codes come with the program; <strong>Reset</strong> puts one back to its standard look.
        </li>
        <li>
          <strong>Export library</strong> saves the whole library as a file, and <strong>Import library</strong> loads it — the way to
          give the whole team the same symbols.
        </li>
      </ul>

      <h2>Your own marker images</h2>
      <p>
        You can use your own images as markers too. They travel inside the file, so save as <strong>KMZ</strong>, not KML — see{" "}
        <Link href="/guides/kml-vs-kmz">KML vs KMZ</Link>.
      </p>

      <h2>Codes do more than markers</h2>
      <p>
        The same codes join points into lines and plots — see{" "}
        <Link href="/guides/boundaries-and-land-area-in-google-earth">boundaries and land area</Link> — and become layers in a DXF — see{" "}
        <Link href="/guides/survey-points-to-dxf-autocad">survey points to DXF</Link>.
      </p>
    </GuideLayout>
  );
}
