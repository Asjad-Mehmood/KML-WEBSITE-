import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { appOverview, excelToKmlExtras, programExtras, slopeExtras, traverseExtras } from "@/lib/appOverview";

// Admin → an app's own tab: GET ?app=excel-to-kml|traverse|slope|roadpro|folder-manager|toolkit &days=7|30|90|365
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const days = [7, 30, 90, 365].includes(Number(sp.get("days"))) ? Number(sp.get("days")) : 30;
  const app = sp.get("app") || "";
  try {
    const [overview, extras] = await Promise.all([appOverview(app, days), app === "excel-to-kml" ? excelToKmlExtras(days) : app === "traverse" ? traverseExtras(days) : app === "slope" ? slopeExtras(days) : app === "roadpro" || app === "folder-manager" || app === "toolkit" ? programExtras(app, days) : Promise.resolve(null)]);
    if (!overview) return NextResponse.json({ error: "Unknown app" }, { status: 404 });
    return NextResponse.json({ success: true, ...overview, extras });
  } catch (err) {
    console.error("[app overview]", err);
    return NextResponse.json({ error: "Couldn't read this app's numbers" }, { status: 500 });
  }
}
