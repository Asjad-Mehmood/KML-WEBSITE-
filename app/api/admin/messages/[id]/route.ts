import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { deleteMessage, setStatus, STATUSES, type Status } from "@/lib/contactMessages";

type Ctx = { params: Promise<{ id: string }> };

// Mark a message new / open / done
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!(STATUSES as readonly string[]).includes(status)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  try {
    const m = await setStatus(id, status as Status);
    return NextResponse.json({ ok: true, message: m });
  } catch {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteMessage(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
}
