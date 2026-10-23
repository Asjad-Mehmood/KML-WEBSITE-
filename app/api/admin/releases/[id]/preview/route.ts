import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { previewRelease } from "@/lib/releases";

type Ctx = { params: Promise<{ id: string }> };

// The announcement as it will look, addressed to the admin who asks
export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getAdminSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const p = await previewRelease(id, { name: session.user.name, email: session.user.email });
  if (!p) return NextResponse.json({ error: "Release not found" }, { status: 404 });
  return NextResponse.json(p);
}
