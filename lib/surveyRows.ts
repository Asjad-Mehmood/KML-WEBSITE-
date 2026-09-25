// Parsing pasted survey rows (from Excel, CSV or instrument exports) and
// building a KML document from converted points. Pure functions — no DOM.

export type ColumnOrder = "ENZ" | "NEZ";

export interface SurveyRow {
  line: number; // 1-based line in the pasted text
  id: string;
  easting: number;
  northing: number;
  elevation: number;
  description: string;
}

export interface RowIssue {
  line: number;
  message: string;
}

export const MAX_ROWS = 5000;

const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

function splitFields(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((f) => f.trim());
  if (line.includes(";")) {
    // Semicolon CSVs (common in Europe) often use decimal commas
    return line.split(";").map((f) => f.trim().replace(/^([-+]?\d+),(\d+)$/, "$1.$2"));
  }
  if (line.includes(",")) return line.split(",").map((f) => f.trim());
  return line.trim().split(/\s+/);
}

/**
 * Accepts, per line:
 *   ID, E, N[, Z][, description…]   (ID may be text like "TBM-01" or a number)
 *   E, N[, Z]                         (IDs are generated)
 * A first line without coordinates is treated as a header and skipped.
 */
export function parseSurveyRows(
  text: string,
  order: ColumnOrder = "ENZ"
): { rows: SurveyRow[]; issues: RowIssue[]; truncated: boolean } {
  const rows: SurveyRow[] = [];
  const issues: RowIssue[] = [];
  const lines = text.split(/\r?\n/);
  let truncated = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    if (rows.length >= MAX_ROWS) {
      truncated = true;
      break;
    }

    const f = splitFields(raw).filter((x, idx, arr) => x !== "" || idx < arr.length - 1);
    const isNum = f.map((x) => NUMBER.test(x));
    let leading = 0;
    while (leading < f.length && isNum[leading]) leading++;

    let id: string | null = null;
    let coords: string[];
    let rest: string[];

    if (!isNum[0]) {
      // Text ID followed by coordinates
      let run = 0;
      while (1 + run < f.length && isNum[1 + run]) run++;
      if (run < 2) {
        if (rows.length === 0 && issues.length === 0) continue; // header row
        issues.push({ line: i + 1, message: "needs at least an easting and a northing" });
        continue;
      }
      id = f[0];
      coords = f.slice(1, 1 + Math.min(run, 3));
      rest = f.slice(1 + Math.min(run, 3));
    } else if (leading >= 4) {
      // Numeric point number first: P, E, N, Z
      id = f[0];
      coords = f.slice(1, 4);
      rest = f.slice(4);
    } else if (leading >= 2) {
      coords = f.slice(0, Math.min(leading, 3));
      rest = f.slice(Math.min(leading, 3));
    } else {
      issues.push({ line: i + 1, message: "needs at least an easting and a northing" });
      continue;
    }

    const a = Number(coords[0]);
    const b = Number(coords[1]);
    const z = coords.length > 2 ? Number(coords[2]) : 0;
    rows.push({
      line: i + 1,
      id: id ?? `PT-${String(rows.length + 1).padStart(3, "0")}`,
      easting: order === "ENZ" ? a : b,
      northing: order === "ENZ" ? b : a,
      elevation: z,
      description: rest.filter(Boolean).join(" · "),
    });
  }
  return { rows, issues, truncated };
}

export interface ConvertedPoint extends SurveyRow {
  lat: number;
  lon: number;
}

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildKml(
  points: ConvertedPoint[],
  meta: { title: string; gridLabel: string; unit: string }
): string {
  const unit = escapeXml(meta.unit);
  const placemarks = points
    .map((p) => {
      const rowsHtml = [
        [`Easting (${unit})`, p.easting.toFixed(3)],
        [`Northing (${unit})`, p.northing.toFixed(3)],
        ["Elevation (m)", p.elevation.toFixed(3)],
        ["WGS84 latitude", `${Math.abs(p.lat).toFixed(8)}° ${p.lat >= 0 ? "N" : "S"}`],
        ["WGS84 longitude", `${Math.abs(p.lon).toFixed(8)}° ${p.lon >= 0 ? "E" : "W"}`],
        ...(p.description ? [["Description", escapeXml(p.description)]] : []),
      ]
        .map(([k, v]) => `<tr><td style="padding:3px 8px;font-weight:600">${k}</td><td style="padding:3px 8px;font-family:monospace">${v}</td></tr>`)
        .join("");
      return `    <Placemark>
      <name>${escapeXml(p.id)}</name>
      <description><![CDATA[<p style="margin:0 0 6px;color:#64748b;font-size:11px">${escapeXml(meta.gridLabel)}</p><table style="border-collapse:collapse;font-size:12px">${rowsHtml}</table>]]></description>
      <styleUrl>#surveyPoint</styleUrl>
      <Point>
        <extrude>1</extrude>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${p.lon.toFixed(8)},${p.lat.toFixed(8)},${p.elevation}</coordinates>
      </Point>
    </Placemark>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(meta.title)}</name>
    <description>${points.length} survey points converted from ${escapeXml(meta.gridLabel)} with Excel to KML Pro</description>
    <Style id="surveyPoint">
      <IconStyle>
        <color>ff00e6ff</color>
        <scale>1.1</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
      </IconStyle>
      <LabelStyle><scale>0.85</scale></LabelStyle>
    </Style>
${placemarks}
  </Document>
</kml>`;
}
