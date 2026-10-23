import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { checkRelease, deleteRelease, updateRelease } from "@/lib/releases";

type Ctx = { params: Promise<{ id: string }> };

// Edit a release
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const c = checkRelease(await req.json().catch(() => ({})));
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 400 });
  try {
    return NextResponse.json({ release: await updateRelease(id, c.data) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Couldn't save the release." }, { status: 400 });
  }
}

// Remove a release (and its broadcast history)
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteRelease(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Release not found" }, { status: 404 });
  }
}
