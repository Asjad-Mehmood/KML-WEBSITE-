import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { REVIEW_PRODUCTS, isReviewProduct, publishedReviews, saveReview } from "@/lib/reviews";

// GET ?product=: the published reviews of a program and their average (public).
export async function GET(req: NextRequest) {
  const product = req.nextUrl.searchParams.get("product");
  if (!isReviewProduct(product)) return NextResponse.json({ error: "Unknown program." }, { status: 400 });
  try {
    return NextResponse.json({ success: true, ...(await publishedReviews(product, 12)) }, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch {
    return NextResponse.json({ success: true, count: 0, average: 0, reviews: [] });
  }
}

// POST { product, rating 1-5, comment, version }: write or change your review of a program.
export async function POST(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to write a review." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const product = body.product;
  const rating = Number(body.rating);
  if (!isReviewProduct(product)) return NextResponse.json({ error: "Unknown program." }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Choose 1 to 5 stars." }, { status: 400 });
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : "";
  const version = typeof body.version === "string" ? body.version.trim().slice(0, 30) : "";
  try {
    await saveReview(s.user.id, product, rating, comment, version);
    db.recordActivity({
      userId: s.user.id,
      userEmail: s.user.email,
      userName: s.user.name,
      action: "review" as Parameters<typeof db.recordActivity>[0]["action"],
      title: `Reviewed ${REVIEW_PRODUCTS[product].name}: ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`,
      details: comment || undefined,
    }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[reviews] save", e);
    return NextResponse.json({ error: "Your review couldn't be saved. Please try again." }, { status: 500 });
  }
}
