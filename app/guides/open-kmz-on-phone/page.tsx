import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "open-kmz-on-phone";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>On Android and iPhone</h2>
      <ol>
        <li>Install <strong>Google Earth</strong> from the Play Store or the App Store (it&apos;s free).</li>
        <li>
          Open the file from wherever it arrived (email, WhatsApp, Google Drive or Files) and choose <strong>Open with Google Earth</strong>.
          On an iPhone, use the share button and pick Google Earth.
        </li>
        <li>
          If the file doesn&apos;t offer Google Earth, save it to the phone first, then in Google Earth open <strong>Projects</strong> and
          import the KML or KMZ from there.
        </li>
      </ol>
      <p>Tap a point to see its balloon with its name, codes, level and photos.</p>

      <h2>Send a KMZ rather than a KML</h2>
      <p>
        A KMZ is one file with the points <em>and</em> their photos and icons inside. A KML on its own loses the photos, which stay on your
        computer. More in <Link href="/guides/kml-vs-kmz">KML vs KMZ</Link>.
      </p>

      <h2>Sending it</h2>
      <ul>
        <li>
          <strong>WhatsApp:</strong> send it as a <em>document</em>, not as a photo or media, so it arrives as the original file.
        </li>
        <li>
          <strong>Email:</strong> most email services take attachments up to about 20–25 MB. For bigger files with many photos, use a link
          instead.
        </li>
        <li>
          <strong>Google Drive, OneDrive or Dropbox:</strong> share a link. The client downloads the file, then opens it with Google Earth.
        </li>
      </ul>

      <h2>Keep it small enough</h2>
      <p>
        Site photos straight from a phone are several megabytes each. The Excel to KML app shrinks them as it builds the KMZ, so a job with
        a hundred photos still sends easily. See{" "}
        <Link href="/guides/total-station-csv-to-kmz-with-photos">KMZ with site photos</Link>.
      </p>

      <h2>A client without Google Earth</h2>
      <p>
        Import the KML into Google My Maps and send the map&apos;s link: it opens in Google Maps on any phone. See{" "}
        <Link href="/guides/plot-coordinates-on-google-maps">plotting coordinates on Google Maps</Link>.
      </p>

      <h2>Nothing shows, or it&apos;s in the wrong place</h2>
      <ul>
        <li>Nothing at all: the file may have arrived renamed or as a .zip. Make sure it ends in .kml or .kmz.</li>
        <li>
          Points far away: the conversion used the wrong grid. Go through{" "}
          <Link href="/guides/points-in-wrong-place-google-earth">why points are in the wrong place</Link>.
        </li>
      </ul>
    </GuideLayout>
  );
}
