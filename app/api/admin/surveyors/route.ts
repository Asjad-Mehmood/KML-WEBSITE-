import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/adminAuth";
import { logAdmin } from "@/lib/admin/adminLog";
import { DOWNLOAD_APPS, SURVEYOR_SORTS, csvCell, listSurveyors, surveyorSummary, type SurveyorFilter } from "@/lib/admin/adminPeople";

// Admin → Surveyors (lib/admin/adminPeople.ts)
// GET ?q= &email=confirmed|waiting|older &kind=admin|blocked|full &app= &downloaded=yes|no &joined=days &active=days (-days: not since) &country=
//     &sort=newest|oldest|active|inactive|downloads|name &offset= &limit= (≤ 200)
//     &view=summary   the numbers and the countries
//     &format=csv     the list as a spreadsheet
function filterOf(sp: URLSearchParams): SurveyorFilter {
  return {
    q: (sp.get("q") || "").trim().slice(0, 120) || undefined,
    email: sp.get("email") || undefined,
    kind: sp.get("kind") || undefined,
    app: sp.get("app") || undefined,
    downloaded: sp.get("downloaded") || undefined,
    joined: Number(sp.get("joined")) || undefined,
    active: Number(sp.get("active")) || undefined,
    country: (sp.get("country") || "").slice(0, 60) || undefined,
  };
}

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  try {
    if (sp.get("view") === "summary") return NextResponse.json({ success: true, ...(await surveyorSummary()) });
    const f = filterOf(sp);
    const sort = (SURVEYOR_SORTS as readonly string[]).includes(sp.get("sort") || "") ? (sp.get("sort") as string) : "newest";
    if (sp.get("format") === "csv") {
      const { rows } = await listSurveyors(f, sort, 0, 10000);
      const name = (id: string) => DOWNLOAD_APPS.find((a) => a.id === id)?.name ?? id;
      const head = [
        "Name",
        "Email",
        "Organization",
        "Role",
        "Email confirmed",
        "Blocked",
        "Full access",
        "Downloads",
        "Programs",
        "Last download",
        "Joined",
        "Last signed in",
        "Location",
        "IP address",
      ];
      const lines = rows.map((r) =>
        [
          r.name,
          r.email,
          r.organization,
          r.role,
          r.emailState,
          r.blocked ? "yes" : "",
          r.hasFullAccess ? "yes" : "",
          r.downloads,
          r.apps.map(name).join("; "),
          r.lastDownload,
          r.createdAt,
          r.lastLoginAt,
          r.location,
          r.ipAddress,
        ]
          .map(csvCell)
          .join(",")
      );
      await logAdmin(admin.user, "data.export", `${rows.length} surveyors`, "Surveyors as CSV", req);
      return new NextResponse("﻿" + [head.join(","), ...lines].join("\r\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="surveyors-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }
    const limit = Math.max(1, Math.min(200, parseInt(sp.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10) || 0);
    return NextResponse.json({ success: true, ...(await listSurveyors(f, sort, offset, limit)) });
  } catch (err) {
    console.error("[admin surveyors]", err);
    return NextResponse.json({ error: "Couldn't read the accounts" }, { status: 500 });
  }
}
