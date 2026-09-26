import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileInput, FileOutput } from "lucide-react";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import NextSteps from "../../components/NextSteps";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import { openGraphFor } from "@/lib/site";

const TITLE = "File Formats";
const DESCRIPTION =
  "The files Excel to KML opens — Excel, CSV, KML, KMZ, DXF — and the files it saves: Google Earth KML and KMZ, Excel, CSV, AutoCAD DXF, Shapefile, GeoJSON, GPX, Leica GSI-16, Trimble and a PDF report.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/formats" },
  openGraph: openGraphFor("/formats", `${TITLE} | Excel to KML`, DESCRIPTION),
};

type Row = { name: string; ext: string; use: string };

// What the program opens and saves (app 4.2). Keep this in step with the program.
const OPENS: Row[] = [
  { name: "Excel workbook", ext: ".xlsx, .xlsm", use: "Open or drag in. The first sheet with data is read, with links to switch to any other sheet. Old .xls files: save them as .xlsx or CSV first." },
  { name: "Copied cells", ext: "Paste", use: "Copy rows in Excel and paste them straight in." },
  { name: "CSV and text", ext: ".csv, .tsv, .txt", use: "Comma, tab, semicolon or space separated, with or without a heading row. Raw total station dumps from Leica, Trimble, Topcon and Sokkia work too." },
  { name: "Google Earth", ext: ".kml, .kmz", use: "Re-use or re-convert an existing Google Earth file: its placemarks become rows." },
  { name: "AutoCAD drawing exchange", ext: ".dxf", use: "Points and their labels are read from the drawing. DWG files can't be opened: save them as DXF first." },
  { name: "Typed by hand", ext: "—", use: "Add points one at a time." },
  { name: "Many files at once", ext: "Batch", use: "Convert a folder of CSV, text or Excel files in one go." },
];

const SAVES: Row[] = [
  { name: "Google Earth KMZ", ext: ".kmz", use: "Points, markers, labels, lines and areas, site photos and your logo, packed in one file." },
  { name: "Google Earth KML", ext: ".kml", use: "One plain file for Google Earth, Google My Maps and most GIS programs; photos are written inside it." },
  { name: "Excel workbook", ext: ".xlsx", use: "Your grid coordinates beside latitude and longitude, numbers kept as numbers." },
  { name: "CSV sheet", ext: ".csv", use: "The table as it stands, for any other program." },
  { name: "AutoCAD DXF", ext: ".dxf", use: "Plain R12 that every AutoCAD and Civil 3D reads: layers by code, station names as text." },
  { name: "Shapefile", ext: ".zip", use: "For QGIS and ArcGIS: the points with every column, and lines or areas in their own layers." },
  { name: "GeoJSON", ext: ".geojson", use: "For web maps and GIS programs, every column kept." },
  { name: "GPX", ext: ".gpx", use: "For handheld GPS units: every point a waypoint with its level, lines as routes." },
  { name: "Leica GSI-16", ext: ".gsi", use: "Point, easting, northing, level and code, ready to upload to a Leica instrument." },
  { name: "Trimble", ext: ".csv", use: "P,E,N,Z,Code or P,N,E,Z,Code, for Trimble controllers." },
  { name: "Survey report", ext: ".pdf", use: "Site plan, the grid and its checks, every point, and a photo record." },
  { name: "Setting-out sheet", ext: ".csv", use: "Bearing and distance from a station to every point, from the radar simulator." },
];

function Table({ rows, label }: { rows: Row[]; label: string }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200/80">
      <table className="w-full text-left text-[14px]">
        <caption className="sr-only">{label}</caption>
        <thead className="bg-slate-50 text-[12px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Format</th>
            <th scope="col" className="px-4 py-3 whitespace-nowrap">File</th>
            <th scope="col" className="px-4 py-3">What it&apos;s for</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.name} className="align-top">
              <th scope="row" className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{r.name}</th>
              <td className="px-4 py-3 font-mono text-[12.5px] text-slate-700 whitespace-nowrap">{r.ext}</td>
              <td className="px-4 py-3 text-slate-600 leading-relaxed min-w-[260px]">{r.use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FormatsPage() {
  return (
    <PageShell>
      <BreadcrumbStructuredData name="File formats" path="/formats" />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro eyebrow="File formats" title="What it opens, and what it saves" lead={DESCRIPTION} />

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight text-slate-900">
            <FileInput className="w-5 h-5 text-[#0071e3]" aria-hidden /> Opens
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] text-slate-600 leading-relaxed">
            Columns are found for you. A heading row helps (<code>Point, Easting, Northing, Level, Code</code> or{" "}
            <code>Name, Latitude, Longitude</code>) but isn&apos;t needed. Rows that can&apos;t be read are listed with the reason, so
            nothing disappears silently.
          </p>
          <Table rows={OPENS} label="Files the program opens" />
        </section>

        <section className="mt-14">
          <h2 className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight text-slate-900">
            <FileOutput className="w-5 h-5 text-[#0071e3]" aria-hidden /> Saves
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] text-slate-600 leading-relaxed">
            The Save menu shows each file&apos;s size before you save it. Shapefile, GeoJSON and GPX use WGS 84 latitude and
            longitude; your grid coordinates stay in the table.
          </p>
          <Table rows={SAVES} label="Files the program saves" />
        </section>

        <p className="mt-8 text-[14px] text-slate-600">
          Not sure which grid your points are on?{" "}
          <Link href="/convert" className="font-semibold text-[#0071e3] hover:underline inline-flex items-center gap-1">
            Find your grid <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </p>

        <NextSteps />
      </div>
    </PageShell>
  );
}
