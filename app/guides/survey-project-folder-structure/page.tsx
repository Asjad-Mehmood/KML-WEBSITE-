import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "survey-project-folder-structure";
export const metadata = guideMetadata(SLUG);

const FOLDERS: [string, string][] = [
  ["00 Admin", "Appointment, contacts, meeting notes, timesheets"],
  ["01 Contract", "Scope, specification, variations, correspondence with the client"],
  ["02 Control", "Control station sheets, benchmark descriptions, calibration and transformation details"],
  ["03 Raw data", "Untouched instrument downloads, GNSS logs, field books and sketches, by date"],
  ["04 Processing", "Working files: adjustments, edited point files, cleaned sheets"],
  ["05 Drawings", "CAD files, with a folder for issued drawings kept separate from working ones"],
  ["06 Reports", "Survey reports, quantity and setting-out reports, checks"],
  ["07 Deliverables", "Exactly what was sent, each issue in its own dated folder"],
  ["08 Photos", "Site photos by date or by area"],
  ["99 Archive", "Superseded versions moved out of the way, never deleted"],
];

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>Why a fixed structure</h2>
      <p>
        When every project has the same folders, anyone in the office can find the control sheet or the last issued drawing without
        asking. It also protects the one thing that can never be recreated: the raw field data.
      </p>

      <h2>A layout that works</h2>
      <p>One master folder per project, named with its code and a short name, for example <code>2026-014 North Gas Field</code>. Inside:</p>
      <ul>
        {FOLDERS.map(([f, what]) => (
          <li key={f}>
            <strong>{f}</strong>: {what}
          </li>
        ))}
      </ul>
      <p>The numbers keep the folders in the same order on every computer, whatever the language or sorting.</p>

      <h2>Rules that keep it tidy</h2>
      <ul>
        <li>
          <strong>Raw data is read-only.</strong> Copy it into Processing and work on the copy. If a result is ever questioned, the
          original is still there.
        </li>
        <li>
          <strong>Dates written year first:</strong> <code>2026-11-28</code>, so files sort by date.
        </li>
        <li>
          <strong>Revisions in the name:</strong> <code>2026-014_Topo_Rev02.dwg</code>, not <code>final_final2.dwg</code>.
        </li>
        <li>
          <strong>Issued means frozen.</strong> Anything sent goes into Deliverables in a dated folder and isn&apos;t edited again.
        </li>
        <li>
          <strong>Old versions go to Archive,</strong> not the recycle bin.
        </li>
        <li>No spaces or special characters at the start of names, and keep paths short: some CAD and survey programs fail on long paths.</li>
      </ul>

      <h2>Starting a new project</h2>
      <p>
        Keep an empty copy of the structure as a template, and copy it for each new job. Project Folder Manager does this for you: it
        creates the whole set of modules from Admin to Archive in one go, then lets you search, copy, move and rename across the project
        from one screen.
      </p>
    </GuideLayout>
  );
}
