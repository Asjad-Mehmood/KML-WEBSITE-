import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = db.updateUser(id, body);

    return NextResponse.json({
      success: true,
      user: db.sanitizeUser(updated),
      message: "User updated successfully",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    db.deleteUser(id);
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
