import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const users = db.getAllUsers(query);

  return NextResponse.json({ success: true, users });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, organization, role } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const newUser = db.createUser({
      name,
      email,
      password: password || "surveyor2026!",
      organization: organization || "Independent Surveyor",
      role: role || "Surveyor",
    });

    return NextResponse.json({
      success: true,
      user: db.sanitizeUser(newUser),
      message: "User created successfully",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
