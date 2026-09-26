import fs from "fs";
import path from "path";

// Server-side read of public/data/epsg-projected.json (the converter's EPSG list):
// [code, name, proj4, [north, west, south, east] area of use, unit]
export type EpsgRow = [number, string, string, [number, number, number, number], string];

let byCode: Map<number, EpsgRow> | null = null;

export function epsgRow(code: number): EpsgRow | undefined {
  if (!byCode) {
    const rows: EpsgRow[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public", "data", "epsg-projected.json"), "utf8")
    );
    byCode = new Map(rows.map((r) => [r[0], r]));
  }
  return byCode.get(code);
}
