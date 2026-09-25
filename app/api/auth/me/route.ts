import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Check cookie or Authorization header
    const token =
      req.cookies.get("surveyor_auth_token")?.value ||
      req.cookies.get("surveyor_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const sessionData = db.validateSession(token);
    if (!sessionData) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: db.sanitizeUser(sessionData.user),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
