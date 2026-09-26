import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "save-survey-jobs";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>What a job keeps</h2>
      <p>
        A job is everything you set up for one survey, under a name: the points, the coordinate system and any site calibration,
        symbols and labels, lines and areas, site photos, balloon contents and the save settings. Open it again and the screen is
        exactly as you left it.
      </p>

      <h2>Keep a job</h2>
      <ol>
        <li>
          Load your points and set everything up in the <WebAppLink>web app</WebAppLink> or the Windows app.
        </li>
        <li>
          Open <strong>Jobs</strong> at the top of the section list on the left and press <strong>Keep as a job</strong>. Give it a
          name, such as the site or the date.
        </li>
        <li>
          From then on changes are kept as you work. Pick another job in the list to switch, and <strong>Search jobs</strong> finds one
          by name.
        </li>
      </ol>
      <p>
        <strong>New job</strong> starts an empty job for the next survey: it keeps the grid and symbols but starts with no points,
        photos or control.
      </p>

      <h2>On another computer</h2>
      <p>
        Jobs are kept in the browser or program on the computer you made them on. <strong>Signed in</strong>, every job is also saved to
        your account a few seconds after each change, and appears in the Jobs list on any computer where you sign in. When your account
        has a newer copy than the one on the computer, the list says so, and opening the job brings the newer copy over.
      </p>
      <ul>
        <li>A job over 4 MB goes to your account without its photos; they stay on the computer that has them.</li>
        <li>
          A job deleted on one computer isn&apos;t sent back by another: that computer keeps its copy and offers{" "}
          <strong>Put back in account</strong>.
        </li>
        <li>
          Your jobs are also listed in the <strong>Jobs</strong> tab of your <Link href="/dashboard">dashboard</Link>, where you can
          download them.
        </li>
      </ul>

      <h2>Send a job to a colleague</h2>
      <p>
        Press <strong>Export</strong> beside the job in the Jobs list to get a single job file, and send that. Your colleague presses{" "}
        <strong>Import a job file</strong> in their Jobs list and carries on with the same grid, symbols and settings.
      </p>

      <h2>Not the same as a setup profile</h2>
      <p>
        A <strong>setup profile</strong> keeps only the settings — grid, symbols, labels — with no points, for the kind of job you do
        again and again. A job keeps one survey. Use a profile to start a new job quickly, and the job to come back to it.
      </p>
    </GuideLayout>
  );
}
