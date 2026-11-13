import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { logAdmin } from "@/lib/adminLog";
import { DATA_KINDS, DATA_SORTS, type DataFilter, type DataSort, dataByPerson, dataSummary, deleteData, downloadUrl, jobFile, listData } from "@/lib/adminData";

// Admin → Files: everything people keep in their accounts, per app (lib/adminData.ts).
// GET  ?app= &kind=opened|saved|job|calculation &platform=windows_app|web_app &ext= &user= &q= &from= &to=
//        &view=list (default) &sort=newest|oldest|largest|smallest|name &offset= &limit= (≤ 200)
//        &view=summary   the numbers and the breakdowns
//        &view=people &sort=recent|most|largest   one row per person
//        &format=csv     the list as a spreadsheet (up to 20,000 rows)
//        ?download=<key> a kept job or calculation as a file
// POST { action: "delete", keys: [...] }  up to 200 at a time

function filterOf(sp: URLSearchParams): DataFilter {
  const date = (v: string | null) => {
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const kind = sp.get("kind") || "";
  return {
    app: (sp.get("app") || "").slice(0, 40) || undefined,
    kind: (DATA_KINDS as readonly string[]).includes(kind) ? kind : undefined,
    platform: ["windows_app", "web_app"].includes(sp.get("platform") || "") ? (sp.get("platform") as string) : undefined,
    ext: (sp.get("ext") || "").replace(/[^a-z0-9]/gi, "").slice(0, 10) || undefined,
    userId: (sp.get("user") || "").slice(0, 100) || undefined,
    q: (sp.get("q") || "").trim().slice(0, 200) || undefined,
    from: date(sp.get("from")),
    to: date(sp.get("to")),
  };
}

const csvCell = (v: unknown) => {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  // a leading = + - @ would run as a formula in Excel
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const KIND_LABEL: Record<string, string> = { opened: "Opened file", saved: "Saved file", job: "Kept job", calculation: "Kept calculation" };
const APP_LABEL: Record<string, string> = { "excel-to-kml": "Excel to KML", traverse: "Traverse & Level", slope: "Slope Calculator" };

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const sp = req.nextUrl.searchParams;

  try {
    const download = sp.get("download");
    if (download) {
      const f = await jobFile(download);
      if (!f) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return new NextResponse(f.body, {
        headers: {
          "Content-Type": f.type,
          "Content-Disposition": `attachment; filename="${f.name.replace(/"/g, "")}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const f = filterOf(sp);
    const view = sp.get("view") || "list";
    if (view === "summary") return NextResponse.json({ success: true, ...(await dataSummary(f)) });
    if (view === "people") {
      const s = sp.get("sort");
      return NextResponse.json({ success: true, people: await dataByPerson(f, s === "most" || s === "largest" ? s : "recent") });
    }

    const sortParam = sp.get("sort") || "newest";
    const sort: DataSort = (DATA_SORTS as readonly string[]).includes(sortParam) ? (sortParam as DataSort) : "newest";

    if (sp.get("format") === "csv") {
      const { rows } = await listData(f, sort, 0, 20000);
      const head = ["App", "Kind", "Name", "Type", "Windows or web", "Size (bytes)", "Points", "Grid", "Details", "Email", "Person", "Copy kept", "When (UTC)"];
      const lines = rows.map((r) =>
        [
          APP_LABEL[r.app] ?? r.app,
          KIND_LABEL[r.kind] ?? r.kind,
          r.title,
          r.ext,
          r.platform === "web_app" ? "Web" : r.platform === "windows_app" ? "Windows" : "",
          r.size,
          r.points,
          r.grid,
          r.detail,
          r.email,
          r.name,
          r.hasContent ? "yes" : "no",
          r.at,
        ]
          .map(csvCell)
          .join(",")
      );
      await logAdmin(admin.user, "data.export", `${rows.length} kept items`, f.app ? APP_LABEL[f.app] ?? f.app : "every app", req);
      return new NextResponse("﻿" + [head.join(","), ...lines].join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="files-${f.app || "all"}-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const limit = Math.max(1, Math.min(200, parseInt(sp.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0);
    const { rows, total } = await listData(f, sort, offset, limit);
    return NextResponse.json({ success: true, total, offset, rows: rows.map((r) => ({ ...r, url: downloadUrl(r) })) });
  } catch (err) {
    console.error("[admin data]", err);
    return NextResponse.json({ error: "Couldn't read the kept files" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const keys: string[] = Array.isArray(body?.keys) ? body.keys.filter((k: unknown): k is string => typeof k === "string" && k.length < 120) : [];
  if (body?.action !== "delete" || !keys.length) return NextResponse.json({ error: "Say what to delete" }, { status: 400 });
  if (keys.length > 200) return NextResponse.json({ error: "200 at a time at most" }, { status: 400 });
  const { deleted, names } = await deleteData([...new Set(keys)]);
  if (deleted.length) {
    const shown = names.slice(0, 10).join(", ") + (names.length > 10 ? ` and ${names.length - 10} more` : "");
    await logAdmin(admin.user, deleted.length === 1 ? "data.delete" : "data.clear", deleted.length === 1 ? names[0] : `${deleted.length} kept items`, shown, req);
  }
  return NextResponse.json({ success: true, deleted, failed: keys.length - deleted.length });
}
