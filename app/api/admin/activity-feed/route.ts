import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { activityFacets, activityFeed, type FeedFilter } from "@/lib/activityFeed";

// Admin → Activity: everything across the apps and tools (lib/activityFeed.ts)
// GET ?app=&action=&user=&q=&errors=1&from=YYYY-MM-DD&to=YYYY-MM-DD&before=<cursor>&limit=
//     &facets=1 (also how many per app and per action)
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const q = req.nextUrl.searchParams;
  const day = (v: string | null, plus = 0) => {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    const d = new Date(`${v}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? undefined : new Date(d.getTime() + plus * 864e5);
  };
  const f: FeedFilter = {
    app: q.get("app")?.slice(0, 40) || undefined,
    action: q.get("action")?.slice(0, 60) || undefined,
    userId: q.get("user")?.slice(0, 100) || undefined,
    q: q.get("q")?.trim().slice(0, 100) || undefined,
    errorsOnly: q.get("errors") === "1",
    from: day(q.get("from")),
    to: day(q.get("to"), 1),
    before: q.get("before")?.slice(0, 120) || undefined,
    limit: Number(q.get("limit")) || 100,
  };
  try {
    const [page, facets] = await Promise.all([activityFeed(f), q.get("facets") === "1" ? activityFacets(f) : Promise.resolve(null)]);
    return NextResponse.json({ success: true, ...page, facets }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[activity feed]", e);
    return NextResponse.json({ error: "Couldn't read the activity." }, { status: 500 });
  }
}
