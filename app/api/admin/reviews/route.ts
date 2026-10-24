import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { adminReviews, deleteReview, setReviewStatus } from "@/lib/reviews";

// Admin → Reviews
// GET ?status=&product=  → reviews, newest first, and counts and averages per program and status
// PATCH { id, status }    → publish, hide or send back to pending
// DELETE ?id=             → delete a review
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const q = req.nextUrl.searchParams;
  try {
    return NextResponse.json({ success: true, ...(await adminReviews(q.get("status") || undefined, q.get("product") || undefined)) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Reviews could not be read" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== "string" || !["pending", "published", "hidden"].includes(body.status)) {
    return NextResponse.json({ error: "Which review, and publish, hide or pending?" }, { status: 400 });
  }
  if (!(await setReviewStatus(body.id, body.status))) return NextResponse.json({ error: "Unknown review." }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!(await deleteReview(id))) return NextResponse.json({ error: "Unknown review." }, { status: 404 });
  return NextResponse.json({ success: true });
}
