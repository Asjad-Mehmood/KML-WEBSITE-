import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "prepare-survey-spreadsheet";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>The short version</h2>
      <p>
        One heading row, then one row per point. Give each column a plain heading such as <strong>STATION</strong>,{" "}
        <strong>EASTING</strong>, <strong>NORTHING</strong> and <strong>ELEVATION</strong>, and keep the numbers as numbers. Excel to KML
        finds the columns by their headings, so their order doesn&apos;t matter and extra columns are carried along.
      </p>

      <h2>Headings it recognises</h2>
      <p>Case, spaces and full stops are ignored, so &ldquo;Pt. No&rdquo; and &ldquo;PTNO&rdquo; are the same heading.</p>
      <ul>
        <li>
          <strong>Point number:</strong> Point Number, Point No, Pt No, Point, Sr No, S No
        </li>
        <li>
          <strong>Station name:</strong> Station, Stn, Name, BM, TBM
        </li>
        <li>
          <strong>Easting:</strong> Easting, East, E, X
        </li>
        <li>
          <strong>Northing:</strong> Northing, North, N, Y
        </li>
        <li>
          <strong>Level:</strong> Elevation, Elev, Level, RL, Z, Height
        </li>
        <li>
          <strong>Latitude and longitude:</strong> Latitude, Lat; Longitude, Long, Lon, Lng
        </li>
        <li>
          <strong>Code:</strong> Code, Feature Code, Feature, Type, Layer, Symbol, Class
        </li>
        <li>
          <strong>Notes:</strong> Remarks, Description, Source; Location, Area
        </li>
        <li>
          <strong>Photo file name:</strong> Photo, Picture, Image, Photo Name
        </li>
      </ul>
      <p>Any other column — contractor, date, chainage — goes into the point&apos;s balloon in Google Earth and into the saved sheets.</p>

      <h2>A sheet with no heading row</h2>
      <p>
        Raw instrument downloads often start straight with numbers. When the first row has no headings, the program says so and lets
        you pick the column order: <strong>Point · Easting · Northing · Elevation</strong>, <strong>Point · Northing · Easting ·
        Elevation</strong>, or the same without a point number or level. Pick the one that matches and check a point on the map.
      </p>

      <h2>Habits that avoid missing points</h2>
      <ul>
        <li>
          <strong>Keep it to one table per sheet.</strong> Titles, logos and totals above or below the table get in the way of the
          heading row. Start the table in the first row.
        </li>
        <li>
          <strong>Numbers, not text.</strong> Thousands separators are fine, but units (&ldquo;232379.158 m&rdquo;) and notes typed into
          a coordinate cell are not. A row without a usable easting and northing is left out and counted in the status bar.
        </li>
        <li>
          <strong>Latitude and longitude in decimal degrees.</strong> A value like 25°12&apos;30&quot; must be converted first — see{" "}
          <Link href="/guides/dms-to-decimal-degrees">DMS to decimal degrees</Link>.
        </li>
        <li>
          <strong>Unique station names.</strong> Lines, photos and design comparisons match rows by station name, so two points both
          called &ldquo;CP1&rdquo; will confuse them.
        </li>
        <li>
          <strong>Use a code column</strong> if you want lines, areas or different markers — TREE, MH, BDY. See{" "}
          <Link href="/guides/point-codes-and-symbols-in-google-earth">markers by point code</Link>.
        </li>
      </ul>

      <h2>Getting it in</h2>
      <p>
        In the <WebAppLink>web app</WebAppLink> or the Windows app, press <strong>Open</strong> (Ctrl+O) and choose the .xlsx, .xlsm or
        .csv file, drag it onto the window, or copy the rows in Excel — heading row included — and press <strong>Paste</strong>. In a
        workbook with several sheets, the first sheet with data is read and the activity log links to the others.
      </p>
      <p>
        Old <strong>.xls</strong> files (Excel 97–2003) are not read directly: open them in Excel and save as .xlsx or CSV first.
      </p>
    </GuideLayout>
  );
}
