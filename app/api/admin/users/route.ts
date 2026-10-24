import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { getClientIp, getIpGeoLocation } from "@/lib/geo";
import { emailStatuses, markVerified, type EmailStatus } from "@/lib/emailVerify";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const users = await db.getAllUsers(query);
  // confirmed, waiting (signed up, never confirmed) or older (made before confirmation started)
  const statuses = await emailStatuses(users.map((u) => u.id)).catch(() => new Map<string, EmailStatus>());
  const withEmail = users.map((u) => {
    const s = statuses.get(u.id);
    return { ...u, emailState: s?.verifiedAt ? "confirmed" : s?.required ? "waiting" : "older" };
  });

  return NextResponse.json({ success: true, users: withEmail });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, organization, role, hasFullAccess, customMaxPoints } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Set a password of at least 8 characters for the new user" }, { status: 400 });
    }

    const clientIp = getClientIp(req);
    const geo = await getIpGeoLocation(clientIp, req);

    const newUser = await db.createUser({
      name,
      email,
      password,
      organization: organization || "Independent Surveyor",
      role: role || "Surveyor",
      ipAddress: geo.ip,
      location: geo.location,
      hasFullAccess: typeof hasFullAccess === "boolean" ? hasFullAccess : (role === "ADMIN"),
      customMaxPoints: customMaxPoints ? Number(customMaxPoints) : undefined,
    });

    // an account an admin makes doesn't wait for a confirmation code
    await markVerified(newUser.id, "admin").catch(() => {});

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
