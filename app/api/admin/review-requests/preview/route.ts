import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { previewReviewRequest } from "@/lib/releases";

// GET ?app=: the review request as it will look, addressed to the admin who asks
export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = await previewReviewRequest(req.nextUrl.searchParams.get("app") || "", { name: session.user.name, email: session.user.email });
  if (!p) return NextResponse.json({ error: "Unknown program." }, { status: 404 });
  return NextResponse.json(p);
}
