import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { logAdmin } from "@/lib/adminLog";
import { DOWNLOAD_APPS, csvCell, deleteDownloads, downloadSummary, listDownloads, type DownloadFilter } from "@/lib/adminPeople";

// Admin → Downloads (lib/adminPeople.ts)
// GET ?app= &q= &who=in|out &version= &country= &from= &to= &user= &sort=newest|oldest &offset= &limit= (≤ 200)
//     &view=summary   per program, the last 30 days, versions, countries, people
//     &format=csv     the list as a spreadsheet
// POST { action: "delete", ids: [...] }   up to 500 at a time
function filterOf(sp: URLSearchParams): DownloadFilter {
  const date = (v: string | null) => {
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  return {
    app: sp.get("app") || undefined,
    q: (sp.get("q") || "").trim().slice(0, 120) || undefined,
    who: sp.get("who") || undefined,
    version: (sp.get("version") || "").slice(0, 30) || undefined,
    country: (sp.get("country") || "").slice(0, 60) || undefined,
    from: date(sp.get("from")),
    to: date(sp.get("to")),
    userId: (sp.get("user") || "").slice(0, 100) || undefined,
  };
}

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  try {
    const f = filterOf(sp);
    if (sp.get("view") === "summary") return NextResponse.json({ success: true, ...(await downloadSummary(f)) });
    const sort = sp.get("sort") === "oldest" ? "oldest" : "newest";
    if (sp.get("format") === "csv") {
      const { rows } = await listDownloads(f, sort, 0, 20000);
      const name = (id: string) => DOWNLOAD_APPS.find((a) => a.id === id)?.name ?? id;
      const head = ["When (UTC)", "Program", "File", "Version", "Email", "Name", "Signed in", "IP address", "Location", "Browser"];
      const lines = rows.map((r) =>
        [r.timestamp, name(r.app), r.fileName, r.version, r.userEmail, r.userName, r.userId ? "yes" : "no", r.ipAddress, r.location, r.userAgent]
          .map(csvCell)
          .join(",")
      );
      await logAdmin(admin.user, "data.export", `${rows.length} downloads`, "Downloads as CSV", req);
      return new NextResponse("﻿" + [head.join(","), ...lines].join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="downloads-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }
    const limit = Math.max(1, Math.min(200, parseInt(sp.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0);
    return NextResponse.json({ success: true, ...(await listDownloads(f, sort, offset, limit)) });
  } catch (err) {
    console.error("[admin downloads]", err);
    return NextResponse.json({ error: "Couldn't read the downloads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown): x is string => typeof x === "string" && x.length < 80) : [];
  if (body.action !== "delete" || !ids.length || ids.length > 500)
    return NextResponse.json({ error: "Which downloads? (500 at a time at most)" }, { status: 400 });
  const n = await deleteDownloads([...new Set(ids)]);
  await logAdmin(admin.user, n === 1 ? "data.delete" : "data.clear", `${n} download records`, "", req);
  return NextResponse.json({ success: true, deleted: n });
}
