import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "chainage-offset-and-level-profile";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What you get</h2>
      <ul>
        <li>
          <strong>Chainage and offset:</strong> for every point, how far along a centreline it is and how far to the left or right of
          it. The usual way to describe a road, pipeline or channel survey.
        </li>
        <li>
          <strong>Level profile:</strong> the levels along one line, with the chainage and the grade between each pair of points.
        </li>
      </ul>

      <h2>Chainage and offset</h2>
      <ol>
        <li>
          Give the centreline points their own code — CL, a kerb, a pipe — and keep them in order along the line in the sheet.
        </li>
        <li>
          Load the sheet in the <WebAppLink>web app</WebAppLink> or the Windows app and open <strong>Lines and areas</strong>.
        </li>
        <li>
          Under <strong>Chainage and offset against a centreline</strong>, choose the centreline code. Every other point is dropped
          square onto the nearest leg of the line.
        </li>
        <li>
          Press <strong>Save chainage sheet</strong>.
        </li>
      </ol>
      <p>
        The sheet lists every point in chainage order with its code, chainage in the usual <strong>0+125.40</strong> form and in metres,
        offset in metres, and which side it lies — <strong>right positive, left negative</strong>, looking along the line from its start.
        Points before the start or past the end of the line are noted, so they aren&apos;t mistaken for points beside it.
      </p>

      <h2>Level profile</h2>
      <ol>
        <li>
          Set up the line under <strong>Lines and areas</strong> — see{" "}
          <Link href="/guides/boundaries-and-land-area-in-google-earth">boundaries and land area</Link> for joining points by code.
        </li>
        <li>
          Under <strong>Level profile</strong>, pick the line. The profile is drawn with its levels and grades.
        </li>
        <li>
          Press <strong>Save profile sheet</strong> for a CSV with station, chainage, level and grade in percent between each point
          and the one before.
        </li>
      </ol>

      <h2>Good to know</h2>
      <ul>
        <li>
          Chainage is worked on the grid when the sheet has eastings and northings, and on the ground from latitude and longitude when it
          doesn&apos;t.
        </li>
        <li>
          The centreline needs at least two points with the chosen code. More points follow the bends more closely.
        </li>
        <li>A point with no level is left blank in the profile, and the grade on either side of it is skipped.</li>
      </ul>
    </GuideLayout>
  );
}
