"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, FileWarning, Loader2, X } from "lucide-react";

/**
 * Shows a stored file on the admin page, without downloading it.
 *
 * The file is fetched and drawn here: PDFs in the browser's PDF viewer, pictures as
 * pictures, CSV and Excel sheets as tables, KML, KMZ, GPX and GeoJSON as their points
 * and as text, anything else that is text as text. Nothing in the file is run: text is
 * shown as text, and a PDF or picture is given its type here, not by the file, so an
 * uploaded web page can never act as the admin.
 */

export interface ViewerFile {
  fileName: string;
  url: string;
  size?: string;
}

type Table = { head: string[]; rows: string[][]; total: number };
type View =
  | { kind: "pdf"; src: string }
  | { kind: "image"; src: string }
  | { kind: "data"; table: Table | null; text: string | null; note?: string }
  | { kind: "none"; why: string };

const MAX_ROWS = 2000;
const MAX_TEXT = 600_000;

const ext = (name: string) => (name.match(/\.([a-z0-9]+)$/i)?.[1] || "").toLowerCase();

const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
};

const TEXT_KINDS = new Set(["csv", "tsv", "txt", "gsi", "kml", "gpx", "geojson", "json", "dxf", "xml", "prj", "log", "pts", "xyz"]);

/* ---------------- zip (KMZ, XLSX) ---------------- */

type ZipEntry = { name: string; method: number; size: number; offset: number };

function zipEntries(u8: Uint8Array): ZipEntry[] {
  const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let end = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("This is not a zip file.");
  const count = v.getUint16(end + 10, true);
  let p = v.getUint32(end + 16, true);
  const out: ZipEntry[] = [];
  const dec = new TextDecoder();
  for (let k = 0; k < count && v.getUint32(p, true) === 0x02014b50; k++) {
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    out.push({
      name: dec.decode(u8.subarray(p + 46, p + 46 + nameLen)),
      method: v.getUint16(p + 10, true),
      size: v.getUint32(p + 20, true),
      offset: v.getUint32(p + 42, true),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function zipRead(u8: Uint8Array, e: ZipEntry): Promise<string> {
  const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const start = e.offset + 30 + v.getUint16(e.offset + 26, true) + v.getUint16(e.offset + 28, true);
  const body = u8.slice(start, start + e.size);
  if (e.method === 0) return new TextDecoder().decode(body);
  if (e.method !== 8) throw new Error("This zip is packed in a way the viewer cannot read.");
  const stream = new Blob([body]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

/* ---------------- tables ---------------- */

function splitDelimited(text: string): Table {
  const first = text.slice(0, 5000).split(/\r?\n/)[0] || "";
  const counts = [",", "\t", ";", "|"].map((d) => [d, first.split(d).length] as const);
  const sep = counts.sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) {
        total++;
        if (rows.length <= MAX_ROWS) rows.push(row);
      }
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) {
    total++;
    if (rows.length <= MAX_ROWS) rows.push(row);
  }
  const head = (rows.shift() || []).map((h) => h.replace(/^﻿/, ""));
  return { head, rows, total: Math.max(0, total - 1) };
}

const xmlDoc = (text: string) => new DOMParser().parseFromString(text, "application/xml");
const tags = (d: Document | Element, name: string) => Array.from(d.getElementsByTagNameNS("*", name));
const firstText = (el: Element, name: string) => tags(el, name)[0]?.textContent?.trim() || "";

function kmlTable(text: string): Table | null {
  const d = xmlDoc(text);
  const marks = tags(d, "Placemark");
  if (!marks.length) return null;
  const rows = marks.map((m) => {
    const co = firstText(m, "coordinates").split(/\s+/).filter(Boolean);
    const [lon, lat, alt] = (co[0] || "").split(",");
    const kind = tags(m, "Polygon").length ? "Area" : tags(m, "LineString").length ? "Line" : "Point";
    return [firstText(m, "name"), kind, lat || "", lon || "", alt || "", kind === "Point" ? "" : String(co.length)];
  });
  return { head: ["Name", "Kind", "Latitude", "Longitude", "Height", "Vertices"], rows: rows.slice(0, MAX_ROWS), total: rows.length };
}

function gpxTable(text: string): Table | null {
  const d = xmlDoc(text);
  const pts = [...tags(d, "wpt"), ...tags(d, "rtept"), ...tags(d, "trkpt")];
  if (!pts.length) return null;
  const rows = pts.map((p) => [firstText(p, "name"), p.localName, p.getAttribute("lat") || "", p.getAttribute("lon") || "", firstText(p, "ele"), firstText(p, "desc")]);
  return { head: ["Name", "Kind", "Latitude", "Longitude", "Height", "Description"], rows: rows.slice(0, MAX_ROWS), total: rows.length };
}

function geojsonTable(text: string): Table | null {
  const g = JSON.parse(text);
  const feats: { geometry?: { type?: string; coordinates?: unknown }; properties?: Record<string, unknown> }[] =
    g?.type === "FeatureCollection" ? g.features || [] : g?.type === "Feature" ? [g] : [];
  if (!feats.length) return null;
  const keys = Array.from(new Set(feats.slice(0, 200).flatMap((f) => Object.keys(f.properties || {})))).slice(0, 12);
  const rows = feats.map((f) => {
    const c = f.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates) ? (f.geometry.coordinates as number[]) : null;
    return [f.geometry?.type || "", c ? String(c[1]) : "", c ? String(c[0]) : "", ...keys.map((k) => String(f.properties?.[k] ?? ""))];
  });
  return { head: ["Geometry", "Latitude", "Longitude", ...keys], rows: rows.slice(0, MAX_ROWS), total: rows.length };
}

async function xlsxTable(u8: Uint8Array): Promise<{ table: Table; note: string }> {
  const list = zipEntries(u8);
  const get = (n: string) => list.find((e) => e.name === n);
  const read = async (n: string) => {
    const e = get(n);
    return e ? zipRead(u8, e) : "";
  };
  const book = xmlDoc(await read("xl/workbook.xml"));
  const rels = xmlDoc(await read("xl/_rels/workbook.xml.rels"));
  const sheets = tags(book, "sheet").filter((s) => s.getAttribute("state") !== "hidden");
  const target = (s: Element) => {
    const rid = s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || s.getAttribute("r:id");
    const rel = tags(rels, "Relationship").find((r) => r.getAttribute("Id") === rid);
    const t = (rel?.getAttribute("Target") || "").replace(/^\//, "");
    return t.startsWith("xl/") ? t : "xl/" + t;
  };
  const shared = tags(xmlDoc(await read("xl/sharedStrings.xml")), "si").map((si) => tags(si, "t").map((t) => t.textContent || "").join(""));
  const col = (ref: string) => {
    let n = 0;
    for (const ch of ref.replace(/[0-9]/g, "")) n = n * 26 + ch.charCodeAt(0) - 64;
    return n - 1;
  };
  for (const s of sheets.length ? sheets : tags(book, "sheet")) {
    const rows: string[][] = [];
    let total = 0;
    for (const r of tags(xmlDoc(await read(target(s))), "row")) {
      const row: string[] = [];
      for (const c of tags(r, "c")) {
        const t = c.getAttribute("t");
        const v = firstText(c, "v");
        const val = t === "s" ? shared[parseInt(v, 10)] ?? "" : t === "inlineStr" ? firstText(c, "t") : t === "b" ? (v === "1" ? "TRUE" : "FALSE") : v;
        row[col(c.getAttribute("r") || "A")] = val;
      }
      const full = Array.from(row, (x) => x ?? "");
      if (full.some((x) => x !== "")) {
        total++;
        if (rows.length <= MAX_ROWS) rows.push(full);
      }
    }
    if (rows.length > 1 || s === sheets[sheets.length - 1]) {
      const head = rows.shift() || [];
      const note = `Sheet “${s.getAttribute("name")}”${sheets.length > 1 ? ` of ${sheets.length}` : ""}. Dates show as Excel day numbers.`;
      return { table: { head, rows, total: Math.max(0, total - 1) }, note };
    }
  }
  throw new Error("The workbook has no rows.");
}

/* ---------------- the viewer ---------------- */

async function buildView(file: ViewerFile, buf: ArrayBuffer): Promise<View> {
  const e = ext(file.fileName);
  const u8 = new Uint8Array(buf);
  if (e === "pdf") return { kind: "pdf", src: URL.createObjectURL(new Blob([buf], { type: "application/pdf" })) };
  if (IMAGE_TYPES[e]) return { kind: "image", src: URL.createObjectURL(new Blob([buf], { type: IMAGE_TYPES[e] })) };
  if (e === "xlsx" || e === "xlsm") {
    const { table, note } = await xlsxTable(u8);
    return { kind: "data", table, text: null, note };
  }
  if (e === "kmz") {
    const kml = zipEntries(u8).find((x) => /\.kml$/i.test(x.name));
    if (!kml) return { kind: "none", why: "This KMZ has no KML inside." };
    const text = await zipRead(u8, kml);
    return { kind: "data", table: kmlTable(text), text: text.slice(0, MAX_TEXT), note: `${kml.name} inside the KMZ.` };
  }
  if (TEXT_KINDS.has(e) || !e) {
    let text = new TextDecoder("utf-8").decode(u8);
    if (/\u0000/.test(text.slice(0, 2000))) return { kind: "none", why: "This file is not text." };
    let table: Table | null = null;
    try {
      if (e === "kml") table = kmlTable(text);
      else if (e === "gpx") table = gpxTable(text);
      else if (e === "geojson" || e === "json") {
        table = geojsonTable(text);
        text = JSON.stringify(JSON.parse(text), null, 2);
      } else if (e === "csv" || e === "tsv" || e === "txt") {
        const t = splitDelimited(text);
        if (t.head.length > 1) table = t;
      }
    } catch {
      table = null;
    }
    const cut = text.length > MAX_TEXT;
    return { kind: "data", table, text: text.slice(0, MAX_TEXT), note: cut ? "Only the start of the file is shown." : undefined };
  }
  return { kind: "none", why: `There is no preview for .${e} files.` };
}

/** The admin's own session: the cookie, and the token the admin page keeps. */
function adminGet(url: string) {
  const token = typeof window === "undefined" ? "" : localStorage.getItem("surveyor_session") || localStorage.getItem("surveyor_auth_token") || "";
  return fetch(url, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
}

export default function FileViewer({ file, onClose }: { file: ViewerFile | null; onClose: () => void }) {
  /* a fresh viewer for each file, so nothing from the last one lingers */
  return file ? <ViewerBody key={file.url} file={file} onClose={onClose} /> : null;
}

function ViewerBody({ file, onClose }: { file: ViewerFile; onClose: () => void }) {
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"table" | "text">("table");

  useEffect(() => {
    let alive = true;
    let made: string | null = null;
    adminGet(file.url)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "No copy of this file is stored: it was too big, so only its name and size were kept." : `The file could not be fetched (${r.status}).`);
        const v = await buildView(file, await r.arrayBuffer());
        if (v.kind === "pdf" || v.kind === "image") made = v.src;
        if (alive) setView(v);
        else if (made) URL.revokeObjectURL(made);
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "The file could not be shown."));
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [file]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        /* only the viewer closes, not the window it was opened from */
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [file, onClose]);

  const shown = useMemo(() => {
    if (!view || view.kind !== "data") return null;
    if (mode === "table" && view.table) return "table";
    return view.text != null ? "text" : view.table ? "table" : null;
  }, [view, mode]);

  const hasBoth = view?.kind === "data" && !!view.table && view.text != null;
  const btn = "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer";

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`View ${file.fileName}`}
    >
      <div
        className="w-full max-w-6xl h-[92vh] sm:h-[86vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate" title={file.fileName}>
              {file.fileName}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {[file.size, view?.kind === "data" && view.table ? `${view.table.total.toLocaleString()} rows` : null, view?.kind === "data" ? view.note : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {hasBoth && (
            <div role="group" aria-label="Show as" className="hidden sm:flex gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {(["table", "text"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`${btn} ${mode === m ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {m === "table" ? "Table" : "Text"}
                </button>
              ))}
            </div>
          )}
          {view?.kind === "pdf" && (
            <a
              href={view.src}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white whitespace-nowrap"
              title="Phones often cannot show a PDF inside the page"
            >
              Open in new tab
            </a>
          )}
          <a
            href={file.url}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
          >
            <Download className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden sm:inline">Download</span>
          </a>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasBoth && (
          <div className="sm:hidden flex gap-1 px-4 py-2 border-b border-slate-800">
            {(["table", "text"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`${btn} ${mode === m ? "bg-slate-700 text-white" : "text-slate-400"}`}
              >
                {m === "table" ? "Table" : "Text"}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto bg-slate-900/40">
          {error ? (
            <Message text={error} />
          ) : !view ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Opening…
            </div>
          ) : view.kind === "pdf" ? (
            <iframe src={view.src} title={file.fileName} className="w-full h-full bg-white" />
          ) : view.kind === "image" ? (
            <div className="h-full flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={view.src} alt={file.fileName} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          ) : view.kind === "none" ? (
            <Message text={`${view.why} Download it to open it on your computer.`} />
          ) : shown === "table" && view.table ? (
            <DataTable table={view.table} />
          ) : shown === "text" ? (
            <pre className="p-4 text-[12px] leading-relaxed text-slate-200 font-mono whitespace-pre-wrap break-all">{view.text}</pre>
          ) : (
            <Message text="The file is empty." />
          )}
        </div>
      </div>
    </div>
  );
}

function Message({ text }: { text: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center text-sm text-slate-400">
      <FileWarning className="w-8 h-8 text-slate-500" />
      {text}
    </div>
  );
}

function DataTable({ table }: { table: Table }) {
  const cols = Math.max(table.head.length, ...table.rows.slice(0, 200).map((r) => r.length));
  const head = Array.from({ length: cols }, (_, i) => table.head[i] || `Column ${i + 1}`);
  return (
    <>
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-slate-800 text-[11px] font-bold text-slate-300">
          <tr>
            <th className="px-3 py-2 text-slate-500 font-mono">#</th>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70 font-mono text-slate-200">
          {table.rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-800/40">
              <td className="px-3 py-1.5 text-slate-500">{i + 1}</td>
              {head.map((_, j) => (
                <td key={j} className="px-3 py-1.5 whitespace-nowrap max-w-[320px] truncate" title={r[j] || ""}>
                  {r[j] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.total > table.rows.length && (
        <p className="px-4 py-3 text-[11px] text-slate-500 border-t border-slate-800">
          Showing the first {table.rows.length.toLocaleString()} of {table.total.toLocaleString()} rows. Download the file to see them all.
        </p>
      )}
    </>
  );
}
