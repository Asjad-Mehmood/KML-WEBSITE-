import { NextRequest, NextResponse } from "next/server";
import { logAdmin } from "@/lib/admin/adminLog";
import { getAdminSession } from "@/lib/auth/adminAuth";
import { adminReviews, deleteReviews, setReviewsStatus } from "@/lib/content/reviews";

// Admin → Reviews
// GET ?status=&product=&q=&stars=1-5&comment=1&sort=newest|oldest|lowest|highest
//        → reviews, and per program: counts and averages by status, each star's count, the last 30 days
// PATCH { id or ids[], status }  → publish, hide or send back to pending (up to 200 at once)
// DELETE ?id= or ?ids=a,b,c      → delete
const idsOf = (one: unknown, many: unknown): string[] =>
  [...new Set([...(typeof one === "string" ? [one] : []), ...(Array.isArray(many) ? many.filter((x): x is string => typeof x === "string") : [])])]
    .filter((x) => x.length > 0 && x.length < 80)
    .slice(0, 200);

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const q = req.nextUrl.searchParams;
  try {
    return NextResponse.json({
      success: true,
      ...(await adminReviews({
        status: q.get("status") || undefined,
        product: q.get("product") || undefined,
        q: (q.get("q") || "").trim().slice(0, 100) || undefined,
        stars: Number(q.get("stars")) || undefined,
        withComment: q.get("comment") === "1",
        sort: q.get("sort") || undefined,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Reviews could not be read" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const ids = idsOf(body.id, body.ids);
  if (!ids.length || !["pending", "published", "hidden"].includes(body.status)) {
    return NextResponse.json({ error: "Which reviews, and publish, hide or pending?" }, { status: 400 });
  }
  const n = await setReviewsStatus(ids, body.status);
  if (!n) return NextResponse.json({ error: "Unknown review." }, { status: 404 });
  await logAdmin(admin.user, "review.moderate", ids.length === 1 ? `Review ${ids[0]}` : `${n} reviews`, `Set to ${body.status}`, req);
  return NextResponse.json({ success: true, changed: n });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const ids = idsOf(sp.get("id") || undefined, (sp.get("ids") || "").split(",").filter(Boolean));
  if (!ids.length) return NextResponse.json({ error: "Which reviews?" }, { status: 400 });
  const n = await deleteReviews(ids);
  if (!n) return NextResponse.json({ error: "Unknown review." }, { status: 404 });
  await logAdmin(admin.user, "review.moderate", ids.length === 1 ? `Review ${ids[0]}` : `${n} reviews`, "Deleted", req);
  return NextResponse.json({ success: true, deleted: n });
}
