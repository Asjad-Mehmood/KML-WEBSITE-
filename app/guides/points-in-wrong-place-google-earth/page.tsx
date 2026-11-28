import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "points-in-wrong-place-google-earth";
export const metadata = guideMetadata(SLUG);

const CAUSES: { how: string; cause: string; fix: React.ReactNode }[] = [
  {
    how: "In the ocean, or near 0°, 0° off the coast of Africa",
    cause: "Eastings and northings were read as latitude and longitude (no grid chosen)",
    fix: "Choose the grid the sheet is on before converting.",
  },
  {
    how: "Hundreds of kilometres east or west, in the right latitude",
    cause: "The wrong UTM zone",
    fix: (
      <>
        Work out the zone from the site&apos;s longitude: <Link href="/guides/find-your-utm-zone">find your UTM zone</Link>.
      </>
    ),
  },
  {
    how: "Thousands of kilometres north or south, often the other side of the equator",
    cause: "North and south hemisphere mixed up (40N vs 40S)",
    fix: "Use the N zone for sites north of the equator.",
  },
  {
    how: "A mirror image, or far away in a strange direction",
    cause: "The easting and northing columns are swapped",
    fix: "Eastings are usually 6 digits (e.g. 234 567), UTM northings 7 (e.g. 2 789 012). Check which column is which.",
  },
  {
    how: "Tens to a few hundred metres off, the same shift for every point",
    cause: "The right grid on the wrong datum (an older local datum read as WGS 84, or the other way)",
    fix: (
      <>
        Pick the exact system on the drawing or control sheet, datum included. See{" "}
        <Link href="/guides/convert-between-coordinate-systems">converting between coordinate systems</Link>.
      </>
    ),
  },
  {
    how: "About three times too far from a starting point, or squashed",
    cause: "Feet read as metres, or metres as feet (US survey feet included)",
    fix: "Set the units the coordinates are in.",
  },
  {
    how: "Near a round number like 1000 / 1000 in a field, nowhere near the site",
    cause: "A local site grid, not a national one",
    fix: (
      <>
        Tie it to real coordinates with two or more known points: <Link href="/guides/site-calibration-local-grid">site calibration</Link>.
      </>
    ),
  },
  {
    how: "A metre or two off the image, in different directions in different places",
    cause: "Google Earth's imagery itself, which isn't survey accurate",
    fix: "Nothing to fix: check against a surveyed mark, not the picture.",
  },
];

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <p>
        Almost every misplaced point comes down to one of a few causes. How far off the points are, and in which direction, tells you which
        one. Look at your points against this list, starting from the top.
      </p>

      <h2>How far off, and why</h2>
      <ul>
        {CAUSES.map((c) => (
          <li key={c.cause}>
            <strong>{c.how}</strong>: {c.cause}. {c.fix}
          </li>
        ))}
      </ul>

      <h2>The one check that catches it</h2>
      <p>
        Before sending anything, find one point whose position you know independently, such as a benchmark, a control station or a
        corner on a registered plan, and compare it. In the Excel to KML app, <strong>Prove the grid</strong> does this: type a known
        mark&apos;s easting and northing and its latitude and longitude, and it shows how far off the conversion is, in metres east and north.
      </p>

      <h2>Only some points are off</h2>
      <ul>
        <li>A typing error in one row: a missing digit moves a point by a factor of ten.</li>
        <li>Rows from another sheet or another job on a different grid, mixed into the same file.</li>
        <li>Blank or text cells read as zero.</li>
      </ul>
      <p>
        The app lists rows it couldn&apos;t read and points that fall outside the grid&apos;s area of use. The{" "}
        <Link href="/guides/survey-quality-checks">quality checks guide</Link> covers the rest.
      </p>
    </GuideLayout>
  );
}
