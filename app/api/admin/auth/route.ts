import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ authenticated: false, isAdmin: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    isAdmin: true,
    user: db.sanitizeUser(admin.user),
  });
}

// There is no separate admin sign-in: admins use the regular login page, and
// this route only reports (GET) or ends (DELETE) an admin session.

export async function DELETE(req: NextRequest) {
  try {
    const token =
      req.cookies.get("surveyor_session")?.value ||
      req.cookies.get("surveyor_auth_token")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (token) {
      await db.destroySession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin session cleared",
    });

    response.cookies.delete("surveyor_session");
    response.cookies.delete("surveyor_auth_token");

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Logout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
