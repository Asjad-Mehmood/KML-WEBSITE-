import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "kml-vs-kmz";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>The difference</h2>
      <p>
        A <strong>KML</strong> file is plain text that describes your points, lines, labels and balloons for Google Earth. A{" "}
        <strong>KMZ</strong> is the same KML zipped together with the files it uses — site photos, a logo or your own marker images — so
        everything travels in one file.
      </p>

      <h2>When to send a KML</h2>
      <ul>
        <li>The job is points and lines only, with no photos or custom markers.</li>
        <li>Someone wants to open the file in another GIS program or a text editor to check it.</li>
      </ul>

      <h2>When to send a KMZ</h2>
      <ul>
        <li>
          You attached <strong>site photos</strong>. They appear in the point balloons only when they&apos;re packed inside a KMZ; a KML
          would point to pictures on your own computer that the client doesn&apos;t have.
        </li>
        <li>You used your own marker images or a company logo.</li>
        <li>You&apos;re emailing the file: a KMZ is compressed and usually smaller.</li>
      </ul>

      <h2>How to save each one</h2>
      <p>
        In the <WebAppLink>web app</WebAppLink> and the Windows app, <strong>Save KML</strong> writes a KML, and <strong>Save KMZ</strong>{" "}
        writes a KMZ with any photos packed inside. Photos are shrunk as they&apos;re packed to keep the file small. See{" "}
        <Link href="/guides/total-station-csv-to-kmz-with-photos">Total station CSV to KMZ with site photos</Link> for attaching them.
      </p>

      <h2>Opening them</h2>
      <p>
        Google Earth Pro, Google Earth on the web and Google Earth on phones open both. A KMZ can also be renamed to .zip to see the
        doc.kml and pictures inside it.
      </p>
    </GuideLayout>
  );
}
