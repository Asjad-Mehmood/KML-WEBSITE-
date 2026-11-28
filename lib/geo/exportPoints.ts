// Reads the converted points out of a file the user exported (KML, KMZ or
// CSV) so each one can be kept in the conversions table.
import zlib from "zlib";

export interface ExportPoint {
  station: string;
  featureCode: string;
  easting: number;
  northing: number;
  elevation: number;
  lat: string;
  lon: string;
}

const MAX_POINTS = 5000;

/** doc.kml (or the first .kml) from a KMZ, via the zip central directory */
function kmlFromKmz(buf: Buffer): string | null {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count && p + 46 <= buf.length; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (/\.kml$/i.test(name)) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + size);
      try {
        return (method === 8 ? zlib.inflateRawSync(data) : data).toString("utf8");
      } catch {
        return null;
      }
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

const tag = (xml: string, name: string) => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(xml);
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim() : "";
};

function fromKml(kml: string): ExportPoint[] {
  const out: ExportPoint[] = [];
  const seen = new Set<string>(); // pin and label placemarks repeat a point
  const re = /<Placemark[\s\S]*?<\/Placemark>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(kml)) && out.length < MAX_POINTS) {
    const pm = m[0];
    const point = /<Point[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i.exec(pm);
    if (!point) continue; // lines and boundaries aren't survey points
    const [lon, lat, h] = point[1].trim().split(/[\s,]+/).map(Number);
    if (!isFinite(lat) || !isFinite(lon)) continue;
    const data = (field: string) => {
      const d = new RegExp(`<Data name="${field}"[^>]*>\\s*<value>([\\s\\S]*?)</value>`, "i").exec(pm);
      return d ? d[1].trim() : "";
    };
    const station = tag(pm, "name").slice(0, 100) || `P${out.length + 1}`;
    const key = `${station}|${lat.toFixed(7)}|${lon.toFixed(7)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      station,
      featureCode: (data("CODE") || data("Code")).slice(0, 50),
      easting: Number(data("EASTING") || data("Easting")) || 0,
      northing: Number(data("NORTHING") || data("Northing")) || 0,
      elevation: isFinite(h) ? h : Number(data("ELEVATION")) || 0,
      lat: lat.toFixed(7),
      lon: lon.toFixed(7),
    });
  }
  return out;
}

function fromCsv(text: string): ExportPoint[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const cells = (l: string) => l.split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
  const head = cells(lines[0]).map((h) => h.toUpperCase());
  const col = (...names: string[]) => head.findIndex((h) => names.some((n) => h === n || h.startsWith(n)));
  const iLat = col("LATITUDE", "LAT"), iLon = col("LONGITUDE", "LON", "LNG");
  if (iLat < 0 || iLon < 0) return [];
  const iSt = col("STATION", "NAME", "POINT"), iCode = col("CODE"), iE = col("EASTING"), iN = col("NORTHING"), iH = col("ELEVATION", "HEIGHT", "RL");
  const out: ExportPoint[] = [];
  for (const l of lines.slice(1, MAX_POINTS + 1)) {
    const c = cells(l);
    const lat = Number(c[iLat]), lon = Number(c[iLon]);
    if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    out.push({
      station: (iSt >= 0 ? c[iSt] : "").slice(0, 100) || `P${out.length + 1}`,
      featureCode: (iCode >= 0 ? c[iCode] : "").slice(0, 50),
      easting: iE >= 0 ? Number(c[iE]) || 0 : 0,
      northing: iN >= 0 ? Number(c[iN]) || 0 : 0,
      elevation: iH >= 0 ? Number(c[iH]) || 0 : 0,
      lat: lat.toFixed(7),
      lon: lon.toFixed(7),
    });
  }
  return out;
}

export function pointsFromExport(fileName: string, buf: Buffer): ExportPoint[] {
  const ext = fileName.toLowerCase().split(".").pop();
  try {
    if (ext === "kmz") {
      const kml = kmlFromKmz(buf);
      return kml ? fromKml(kml) : [];
    }
    if (ext === "kml") return fromKml(buf.toString("utf8"));
    if (ext === "csv" || ext === "txt") return fromCsv(buf.toString("utf8"));
  } catch {
    // unreadable file: keep the file, skip the points
  }
  return [];
}
